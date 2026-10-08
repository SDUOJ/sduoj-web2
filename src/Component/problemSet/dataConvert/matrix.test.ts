import { message } from 'antd';
import groupGet from './groupGet';
import groupSubmit from './groupSubmit';
import objectiveGet from './objectiveGet';
import objectiveSubmit from './objectiveSubmit';
import problemSetGet from './problemSetGet';
import problemSetSubmit from './problemSetSubmit';
import subjectiveGet from './subjectiveGet';

jest.mock('antd', () => ({
  message: { error: jest.fn(), success: jest.fn() },
}));

beforeEach(() => {
  (message.error as jest.Mock).mockClear();
});

describe('problem-set adapters accept/reject matrix', () => {
  it.each([
    [2, 'SDUOJ-12', 12],
    [0, 'SDUOJ-7', 'SDUOJ-7'],
    [1, 'SDUOJ-999', 'SDUOJ-999'],
  ])('groupSubmit type=%s maps program pid %s', (type, pid, expected) => {
    const draft = { type, problemInfo: [{ pid }] };
    expect(groupSubmit(draft).problemInfo[0].pid).toBe(expected);
    expect(draft.problemInfo[0].pid).toBe(pid);
  });

  it('problemSetSubmit normalizes null ranks without mutating the form draft', () => {
    const draft = {
      config: { rank: null, practiceScoreCalculate: null, useSameSE: 1 },
      groupInfo: [{ name: 'A', gid: 1 }],
    };
    const submitted = problemSetSubmit(draft);
    expect(submitted.config.rank).toBe(0);
    expect(submitted.config.practiceScoreCalculate).toBeNull();
    expect(draft.config.rank).toBeNull();
  });

  it('objective adapters round-trip choice options and form answer indices', () => {
    const api = { content: { choice: ['A', 'B', 'C'] } };
    const form = objectiveGet(api);
    expect(form.content.choice).toEqual([
      { id: 0, content: 'A' },
      { id: 1, content: 'B' },
      { id: 2, content: 'C' },
    ]);

    const submitted = objectiveSubmit({ type: 0, answer: [0], content: form.content });
    expect(submitted?.content.choice).toEqual(['A', 'B', 'C']);
    expect(api.content.choice).toEqual(['A', 'B', 'C']);
    expect(form.content.choice[0]).toEqual({ id: 0, content: 'A' });
  });

  it.each([
    [0, [0, 1], '单选题只能有一个答案'],
    [1, [0], '多选题应该有两个及以上答案'],
  ])('objectiveSubmit rejects invalid answer config type=%s answers=%s', (type, answer) => {
    const result = objectiveSubmit({
      type,
      answer,
      content: { choice: [{ content: 'A' }, { content: 'B' }] },
    });
    expect(result).toBeNull();
    expect(message.error).toHaveBeenCalled();
  });

  it('objectiveSubmit rejects empty choice text', () => {
    const result = objectiveSubmit({
      type: 0,
      answer: [0],
      content: { choice: [{ content: 'A' }, { content: '' }] },
    });
    expect(result).toBeNull();
  });

  it('groupGet numbers desId and assigns stable form row ids', () => {
    const form = groupGet({
      type: 2,
      problemInfo: [
        { pid: 12, desId: 4 },
        { pid: 13, desId: 5 },
      ],
    });
    expect(form.problemInfo[0]).toMatchObject({ pid: 'SDUOJ-12', desId: '4', id: 0 });
    expect(form.problemInfo[1]).toMatchObject({ pid: 'SDUOJ-13', desId: '5', id: 1 });
  });

  it('subjectiveGet assigns form ids without mutating API payload', () => {
    const api = {
      config: {
        fileList: [{ name: 'a' }, { name: 'b' }],
        judgeConfig: [{ score: 2 }],
      },
    };
    const form = subjectiveGet(api);
    expect(form.config.fileList.map((item: any) => item.id)).toEqual([0, 1]);
    expect(api.config.fileList[0]).toEqual({ name: 'a' });
  });

  it('problemSetGet assigns groupInfo ids starting at zero', () => {
    const api = { groupInfo: [{ name: 'One' }, { name: 'Two' }] };
    const form = problemSetGet(api);
    expect(form.groupInfo.map((item: any) => item.id)).toEqual([0, 1]);
    expect(api.groupInfo[0]).toEqual({ name: 'One' });
  });
});
