import groupGet from './groupGet';
import groupSubmit from './groupSubmit';
import objectiveGet from './objectiveGet';
import objectiveSubmit from './objectiveSubmit';
import problemSetGet from './problemSetGet';
import problemSetSubmit from './problemSetSubmit';
import subjectiveGet from './subjectiveGet';

describe('problem-set form adapters', () => {
  it('adds edit-only identifiers without changing API response objects', () => {
    const problemSet = { groupInfo: [{ name: 'Programming' }] };
    const group = { type: 2, problemInfo: [{ pid: 12, desId: 4 }] };
    const objective = { content: { choice: ['A', 'B'] } };
    const subjective = { config: { fileList: [{ name: 'a' }], judgeConfig: [{ score: 2 }] } };

    expect(problemSetGet(problemSet).groupInfo[0].id).toBe(0);
    expect(groupGet(group).problemInfo[0]).toMatchObject({ pid: 'SDUOJ-12', desId: '4', id: 0 });
    expect(objectiveGet(objective).content.choice[0]).toEqual({ id: 0, content: 'A' });
    expect(subjectiveGet(subjective).config.fileList[0].id).toBe(0);

    expect(problemSet).toEqual({ groupInfo: [{ name: 'Programming' }] });
    expect(group).toEqual({ type: 2, problemInfo: [{ pid: 12, desId: 4 }] });
    expect(objective).toEqual({ content: { choice: ['A', 'B'] } });
    expect(subjective).toEqual({
      config: { fileList: [{ name: 'a' }], judgeConfig: [{ score: 2 }] },
    });
  });

  it('builds submission payloads without changing reusable form drafts', () => {
    const problemSet = { config: { rank: null, practiceScoreCalculate: null } };
    const group = { type: 2, problemInfo: [{ pid: 'SDUOJ-12' }] };
    const objective = { type: 0, answer: [0], content: { choice: [{ content: 'A' }] } };

    expect(problemSetSubmit(problemSet).config).toEqual({ rank: 0, practiceScoreCalculate: null });
    expect(groupSubmit(group).problemInfo[0].pid).toBe(12);
    expect(objectiveSubmit(objective)?.content.choice).toEqual(['A']);

    expect(problemSet.config.rank).toBeNull();
    expect(group.problemInfo[0].pid).toBe('SDUOJ-12');
    expect(objective.content.choice).toEqual([{ content: 'A' }]);
  });
});
