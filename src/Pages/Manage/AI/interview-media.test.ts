import {
  canCachePendingMedia,
  isPendingMediaFresh,
  mediaFileUrl,
  PENDING_MEDIA_MAX_BYTES,
  PENDING_MEDIA_TTL_MS,
  selectPendingMedia,
} from './interview-media';

const media = (ownerId: string, createdAt: number, key: string) => ({
  key,
  ownerId,
  resourceId: 'resource-1',
  turnSequence: 0,
  track: 'video' as const,
  segmentIndex: Number(key.slice(-1)),
  segmentCount: 2,
  startedMs: 0,
  durationMs: 1000,
  filename: 'segment.webm',
  blob: new Blob(['segment']),
  createdAt,
  sizeBytes: 7,
});

it('encodes media file IDs as one URL path segment', () => {
  expect(mediaFileUrl('file/with?#unsafe')).toContain('/files/file%2Fwith%3F%23unsafe');
});

it('keeps only fresh media owned by the active account', () => {
  const now = PENDING_MEDIA_TTL_MS + 10_000;
  const items = [
    media('alice', now - 10, 'segment-0'),
    media('bob', now - 10, 'segment-1'),
    media('alice', now - PENDING_MEDIA_TTL_MS - 1, 'segment-2'),
  ];

  expect(selectPendingMedia(items, 'alice', now).map((item) => item.key)).toEqual(['segment-0']);
  expect(selectPendingMedia(items, 'bob', now).map((item) => item.key)).toEqual(['segment-1']);
});

it('treats the TTL boundary as fresh and older entries as expired', () => {
  const now = PENDING_MEDIA_TTL_MS + 10_000;
  expect(isPendingMediaFresh({ createdAt: now - PENDING_MEDIA_TTL_MS }, now)).toBe(true);
  expect(isPendingMediaFresh({ createdAt: now - PENDING_MEDIA_TTL_MS - 1 }, now)).toBe(false);
});

it('rejects a single media segment above the local cache limit', () => {
  expect(canCachePendingMedia(PENDING_MEDIA_MAX_BYTES)).toBe(true);
  expect(canCachePendingMedia(PENDING_MEDIA_MAX_BYTES + 1)).toBe(false);
});
