import { buildSubjectiveFileUrl } from './SubjectivePreview';

it('encodes every file download path segment', () => {
  const url = buildSubjectiveFileUrl('file/id?with#reserved', 'answer / ?.txt');
  expect(url).toContain('/api/filesys/download/file%2Fid%3Fwith%23reserved/answer%20%2F%20%3F.txt');
});
