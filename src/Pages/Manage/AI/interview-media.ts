import { interviewApi, MediaSegment, MediaTrack } from './interview-api';

export type PendingMedia = {
  key: string;
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

const databaseName = 'sduoj-ai-interview-media';
const storeName = 'pending-segments';

function database(): Promise<IDBDatabase> {
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
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function removePending(key: string) {
  return transact<void>('readwrite', (store, resolve, reject) => {
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function pendingFor(resourceId: string, turnSequence: number): Promise<PendingMedia[]> {
  return transact<PendingMedia[]>('readonly', (store, resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () =>
      resolve(
        (request.result as PendingMedia[])
          .filter((item) => item.resourceId === resourceId && item.turnSequence === turnSequence)
          .sort((left, right) => left.segmentIndex - right.segmentIndex),
      );
    request.onerror = () => reject(request.error);
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
  await removePending(item.key);
  return { ...segment, url: `/api/ps/auto-task/ai/files/${upload.id}` };
}
