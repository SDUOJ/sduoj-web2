import {
  applyUploadStatus,
  convertObjectiveRecords,
  markAllPendingUploading,
} from './AutoImportObjective';

it('converts objective import rows into preview and submit payloads', () => {
  const { proData, submitProData } = convertObjectiveRecords([
    {
      problemTitle: 'Q1',
      isMulti: 0,
      content: '1+1=?',
      answer: 'A',
      'choice-A': '2',
      'choice-B': '3',
    },
  ]);

  expect(proData[0]).toMatchObject({ problemTitle: 'Q1', answer: 'A' });
  expect(submitProData[0]).toMatchObject({
    problemTitle: 'Q1',
    isPublic: 1,
    answer: ['A'],
    description: { content: '1+1=?', choice: { A: '2', B: '3' } },
  });
});

it('applyUploadStatus copies only the target index and keeps referential isolation', () => {
  const previous = [0, 1, 2];
  const next = applyUploadStatus(previous, 1, 2);

  expect(next).not.toBe(previous);
  expect(previous).toEqual([0, 1, 2]);
  expect(next).toEqual([0, 2, 2]);
});

it('markAllPendingUploading only promotes idle rows', () => {
  const previous = [0, 2, 0, 1];
  const next = markAllPendingUploading(previous);

  expect(next).not.toBe(previous);
  expect(previous).toEqual([0, 2, 0, 1]);
  expect(next).toEqual([1, 2, 1, 1]);
});
