import { interviewApi, MediaSegment, MediaTrack } from './interview-api';
import apiAddress from '../../../Utils/API/apiAddress';

export type PendingMedia = {
  key: string;
  ownerId: string;
  resourceId: string;
  turnSequence: number;
  track: MediaTrack;
  segmentIndex: number;
  segmentCount: number;
  startedMs: number;
  durationMs: number;
  filename: string;
  blob: Blob;
};

export const PENDING_MEDIA_TTL_MS = 24 * 60 * 60 * 1000;
export const PENDING_MEDIA_MAX_BYTES = 50 * 1024 * 1024;

type StoredPendingMedia = PendingMedia & {
  createdAt: number;
  sizeBytes: number;
};

const databaseName = 'sduoj-ai-interview-media';
const storeName = 'pending-segments';

function database(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is unavailable'));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) {
        request.result.createObjectStore(storeName, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

export function isPendingMediaFresh(item: Pick<StoredPendingMedia, 'createdAt'>, now = Date.now()) {
  return item.createdAt > 0 && now - item.createdAt <= PENDING_MEDIA_TTL_MS;
}

export function selectPendingMedia(
  items: Array<PendingMedia | StoredPendingMedia>,
  ownerId: string,
  now = Date.now(),
): PendingMedia[] {
  if (!ownerId) return [];
  return items
    .filter((item): item is StoredPendingMedia => {
      const stored = item as StoredPendingMedia;
      return (
        stored.ownerId === ownerId &&
        isPendingMediaFresh(stored, now) &&
        stored.blob instanceof Blob
      );
    })
    .sort((left, right) => left.segmentIndex - right.segmentIndex);
}

export function mediaFileUrl(fileId: string) {
  const encodedFileId = encodeURIComponent(String(fileId));
  return `${apiAddress().CLIENT_SERVER}/api/ps/auto-task/ai/files/${encodedFileId}`;
}

function transact<T>(
  mode: IDBTransactionMode,
  action: (
    store: IDBObjectStore,
    resolve: (value: T) => void,
    reject: (reason: unknown) => void,
  ) => void,
): Promise<T> {
  return database().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => reject(transaction.error);
        action(transaction.objectStore(storeName), resolve, reject);
      }),
  );
}

export function savePending(item: PendingMedia) {
  return transact<void>('readwrite', (store, resolve, reject) => {
    if (!item.ownerId) {
      reject(new Error('Cannot cache media without an authenticated owner'));
      return;
    }
    if (item.blob.size > PENDING_MEDIA_MAX_BYTES) {
      reject(new Error('Media segment exceeds the local cache limit'));
      return;
    }
    const list = store.getAll();
    list.onsuccess = () => {
      const now = Date.now();
      const current = list.result as StoredPendingMedia[];
      current
        .filter((entry) => entry.ownerId === item.ownerId && !isPendingMediaFresh(entry, now))
        .forEach((entry) => store.delete(entry.key));
      const retained = current
        .filter((entry) => entry.ownerId === item.ownerId && isPendingMediaFresh(entry, now))
        .sort((left, right) => left.createdAt - right.createdAt);
      let retainedBytes = retained.reduce((total, entry) => total + entry.sizeBytes, 0);
      while (retainedBytes + item.blob.size > PENDING_MEDIA_MAX_BYTES && retained.length) {
        const evicted = retained.shift();
        if (!evicted) break;
        retainedBytes -= evicted.sizeBytes;
        store.delete(evicted.key);
      }
      const request = store.put({
        ...item,
        createdAt: now,
        sizeBytes: item.blob.size,
      } satisfies StoredPendingMedia);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    };
    list.onerror = () => reject(list.error);
  });
}

export function removePending(key: string, ownerId?: string) {
  return transact<void>('readwrite', (store, resolve, reject) => {
    if (!ownerId) {
      resolve();
      return;
    }
    const lookup = store.get(key);
    lookup.onsuccess = () => {
      if ((lookup.result as StoredPendingMedia | undefined)?.ownerId !== ownerId) {
        resolve();
        return;
      }
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    };
    lookup.onerror = () => reject(lookup.error);
  });
}

export function pendingFor(
  ownerId: string,
  resourceId: string,
  turnSequence: number,
): Promise<PendingMedia[]> {
  return transact<PendingMedia[]>('readwrite', (store, resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as StoredPendingMedia[];
      const now = Date.now();
      all
        .filter((item) => !item.ownerId || !isPendingMediaFresh(item, now))
        .forEach((item) => store.delete(item.key));
      resolve(
        selectPendingMedia(all, ownerId, now).filter(
          (item) => item.resourceId === resourceId && item.turnSequence === turnSequence,
        ),
      );
    };
    request.onerror = () => reject(request.error);
  });
}

export function clearPendingMediaForOwner(ownerId: string): Promise<void> {
  if (!ownerId) return Promise.resolve();
  return transact<void>('readwrite', (store, resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      (request.result as StoredPendingMedia[])
        .filter((item) => item.ownerId === ownerId)
        .forEach((item) => store.delete(item.key));
      resolve();
    };
    request.onerror = () => reject(request.error);
  }).catch((error) => {
    if (error instanceof Error && error.message === 'IndexedDB is unavailable') return;
    throw error;
  });
}

export function clearAllPendingMedia(): Promise<void> {
  return transact<void>('readwrite', (store, resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  }).catch((error) => {
    if (error instanceof Error && error.message === 'IndexedDB is unavailable') return;
    throw error;
  });
}

export async function uploadPending(item: PendingMedia): Promise<MediaSegment> {
  const file = new File([item.blob], item.filename, { type: item.blob.type || 'video/webm' });
  const upload = await interviewApi.upload(item.resourceId, item.key, file);
  const segment = {
    file_id: upload.id,
    turn_sequence: item.turnSequence,
    track: item.track,
    segment_index: item.segmentIndex,
    segment_count: item.segmentCount,
    started_ms: item.startedMs,
    duration_ms: item.durationMs,
    sha256: upload.sha256,
  };
  await interviewApi.attach(item.resourceId, segment);
  await removePending(item.key, item.ownerId);
  return { ...segment, url: mediaFileUrl(upload.id) };
}
