import { convertObjectiveRecords } from './AutoImportObjective';

describe('convertObjectiveRecords', () => {
  it('keeps the first data row and guards empty answer/choice cells', () => {
    const result = convertObjectiveRecords(
      [
        {
          problemTitle: '首题',
          isMulti: '0',
          content: '2 + 2 = ?',
          answer: null,
          'choice-A': '4',
          'choice-B': null,
        },
        {
          problemTitle: '第二题',
          isMulti: 1,
          content: null,
          answer: ' A, B ',
          'choice-A': 'A',
          'choice-B': 'B',
        },
      ],
      (key) => key,
    );

    expect(result.submitProData).toHaveLength(2);
    expect(result.submitProData[0]).toMatchObject({
      problemTitle: '首题',
      answer: [],
      description: { content: '2 + 2 = ?', choice: { A: '4' } },
    });
    expect(result.submitProData[1]).toMatchObject({
      problemTitle: '第二题',
      answer: ['A', 'B'],
      description: { content: '', choice: { A: 'A', B: 'B' } },
    });
    expect(result.proData[0].isMulti).toBe('SingleChoice');
    expect(result.proData[0].description).toBe('2 + 2 = ?\nA. 4');
  });
});
