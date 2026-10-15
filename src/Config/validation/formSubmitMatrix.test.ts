import { contracts, contestFeatureContracts } from './contracts';
import { constraintError } from './constraints';

type Case = {
  name: string;
  rule: Parameters<typeof constraintError>[0];
  value: unknown;
  ok: boolean;
};

const cases: Case[] = [
  // contest
  { name: 'contest title ok', rule: contracts.contest.contestTitle, value: 'Finals', ok: true },
  { name: 'contest title blank', rule: contracts.contest.contestTitle, value: '  ', ok: false },
  {
    name: 'contest title overlong',
    rule: contracts.contest.contestTitle,
    value: 'x'.repeat(61),
    ok: false,
  },
  {
    name: 'frozenTime overflow',
    rule: contracts.contest.frozenTime,
    value: 2147483648,
    ok: false,
  },
  { name: 'frozenTime zero', rule: contracts.contest.frozenTime, value: 0, ok: true },
  {
    name: 'participants over capacity',
    rule: contracts.contest.participants,
    value: Array.from({ length: 1025 }, (_, i) => `u${i}`),
    ok: false,
  },
  {
    name: 'participants within capacity',
    rule: contracts.contest.participants,
    value: ['alice', 'bob'],
    ok: true,
  },
  {
    name: 'openness enum',
    rule: contestFeatureContracts.openness,
    value: 'anonymous',
    ok: false,
  },
  {
    name: 'visibility float rejected',
    rule: contestFeatureContracts.visibility,
    value: 1.5,
    ok: false,
  },
  // problem
  {
    name: 'problem code ok',
    rule: contracts.problem.problemCode,
    value: 'SDUOJ-1000',
    ok: true,
  },
  {
    name: 'timeLimit overflow',
    rule: contracts.problem.timeLimit,
    value: 2147483648,
    ok: false,
  },
  {
    name: 'judgeTemplates over capacity',
    rule: contracts.problem.judgeTemplates,
    value: Array.from({ length: 21 }, (_, i) => String(i)),
    ok: false,
  },
  // judge template
  {
    name: 'title overlong',
    rule: contracts.judgeTemplate.title,
    value: 't'.repeat(33),
    ok: false,
  },
  {
    name: 'title ok',
    rule: contracts.judgeTemplate.title,
    value: 'Standard IO',
    ok: true,
  },
  {
    name: 'comment overlong',
    rule: contracts.judgeTemplate.comment,
    value: 'c'.repeat(256),
    ok: false,
  },
  // group
  { name: 'group title overlong', rule: contracts.group.title, value: 'g'.repeat(46), ok: false },
  {
    name: 'group openness out of range',
    rule: contracts.group.openness,
    value: 3,
    ok: false,
  },
  // classroom
  {
    name: 'classroom name blank',
    rule: contracts.classroom.c_name,
    value: '   ',
    ok: false,
  },
  {
    name: 'classroom seat zero',
    rule: contracts.classroom.c_seat_num,
    value: 0,
    ok: false,
  },
  {
    name: 'classroom seat one',
    rule: contracts.classroom.c_seat_num,
    value: 1,
    ok: true,
  },
  // course
  {
    name: 'course tag enum',
    rule: contracts.course.tag,
    value: '未知',
    ok: false,
  },
  {
    name: 'course tag ok',
    rule: contracts.course.tag,
    value: '实验',
    ok: true,
  },
  {
    name: 'sequence below one',
    rule: contracts.course.sequence,
    value: 0,
    ok: false,
  },
  // problem set
  {
    name: 'problemSet name required',
    rule: contracts.problemSet.name,
    value: '',
    ok: false,
  },
  {
    name: 'problemSet tag required',
    rule: contracts.problemSet.tag,
    value: '',
    ok: false,
  },
  {
    name: 'groupInfo needs one item',
    rule: contracts.problemSet.groupInfo,
    value: [],
    ok: false,
  },
  // late
  {
    name: 'discount exclusive zero',
    rule: contracts.late.discount,
    value: 0,
    ok: false,
  },
  {
    name: 'discount one accepted',
    rule: contracts.late.discount,
    value: 1,
    ok: true,
  },
  // exam
  {
    name: 'scoreMod enum',
    rule: contracts.exam.scoreMod,
    value: 'always',
    ok: false,
  },
  {
    name: 'timeRange arity',
    rule: contracts.exam.timeRange,
    value: [1],
    ok: false,
  },
];

describe('form submit accept/reject matrix', () => {
  it.each(cases)('$name', ({ rule, value, ok }) => {
    const error = constraintError(rule, value);
    if (ok) expect(error).toBeUndefined();
    else expect(error).toBeDefined();
  });
});
