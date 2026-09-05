import { Constraint, constraintError } from './constraints';
import { contracts as c, contestFeatureContracts } from './contracts';
import { autolabSchemaError } from './autolab';
import { column } from './constraints';
import database from './database.json';
import transport from './transport.json';
import i18n from '../i18n';

type Fields = Record<string, Constraint>;
interface RequestContract {
  match: RegExp;
  fields: Fields;
  requireMissing?: boolean;
}
const userFields = {
  username: c.user.username,
  nickname: c.user.nickname,
  phone: c.user.phone,
  studentId: c.user.studentId,
  email: c.user.email,
  gender: c.user.gender,
};
const passwordRegistration = {
  ...userFields,
  username: { ...c.user.username, required: true, notBlank: true },
  email: { ...c.user.email, required: true, notBlank: true },
  password: c.user.newPassword,
};
const userUpdate = {
  ...userFields,
  username: { ...c.user.username, required: true, notBlank: true },
  password: c.user.adminPassword,
};
export const batchUserFields = {
  ...userUpdate,
  username: { ...c.user.username, required: true, notBlank: true },
  password: { ...c.user.adminPassword, required: true, notBlank: true },
  email: { ...c.user.email, required: true, notBlank: true },
};
const checkpointFields = {
  'checkpoints.*.checkpointScore': c.checkpoint.legacyScore,
  'checkpoints.*.note': c.checkpoint.note,
};

export const requestContracts: RequestContract[] = [
  {
    match: /^\/manage\/group\/addUser$/,
    fields: {
      usernames: {
        kind: 'array',
        required: true,
        minItems: 1,
        items: c.user.loginUsername,
        source: 'GroupAddUserReqDTO; existing oj_user usernames',
      },
    },
    requireMissing: true,
  },
  {
    match: /^\/manage\/group\/updateUserStatus$/,
    fields: {
      status: {
        kind: 'integer',
        required: true,
        min: 1,
        max: 3,
        source: 'GroupUserStatusUpdateReqDTO @Range',
      },
      userIds: {
        kind: 'array',
        required: true,
        minItems: 1,
        source: 'GroupUserStatusUpdateReqDTO @Size(min=1)',
      },
    },
    requireMissing: true,
  },
  {
    match: /^\/manage\/user\/addUsers$/,
    fields: Object.fromEntries(
      Object.entries(batchUserFields).map(([key, rule]) => [`*.${key}`, rule]),
    ),
    requireMissing: true,
  },
  {
    match: /^\/user\/login$/,
    fields: { username: c.user.loginUsername, password: c.user.currentPassword },
    requireMissing: true,
  },
  {
    match: /^\/user\/(register|thirdPartyRegister)$/,
    fields: passwordRegistration,
    requireMissing: true,
  },
  {
    match: /^\/user\/updateProfile$/,
    fields: {
      phone: c.user.phone,
      studentId: c.user.studentId,
      gender: c.user.gender,
      nickname: { ...c.user.nickname, required: true, notBlank: true },
    },
    requireMissing: true,
  },
  {
    match: /^\/user\/updatePassword$/,
    fields: { newPassword: c.user.newPassword },
    requireMissing: true,
  },
  { match: /^\/user\/resetPassword$/, fields: { password: c.user.newPassword } },
  { match: /^\/user\/thirdPartyBinding$/, fields: { password: c.user.currentPassword } },
  {
    match: /^\/user\/(emailLogin|updateEmail|sendVerificationEmail|forgetPassword)$/,
    fields: { email: c.user.email },
  },
  { match: /^\/manage\/user\/update$/, fields: userUpdate },
  { match: /^\/manage\/group\/(create|update)$/, fields: c.group },
  { match: /^\/manage\/notice\/(create|update)$/, fields: c.notice },
  { match: /^\/manage\/problem\/(create|update)$/, fields: { ...c.problem, ...checkpointFields } },
  { match: /^\/manage\/problem\/(createDescription|updateDescription)$/, fields: c.description },
  { match: /^\/manage\/judgetemplate\/(create|update)$/, fields: c.judgeTemplate },
  {
    match: /^\/manage\/contest\/(create|update)$/,
    fields: {
      ...c.contest,
      'features.frozenTime': c.contest.frozenTime,
      'features.mode': contestFeatureContracts.mode,
      'features.openness': contestFeatureContracts.openness,
      ...Object.fromEntries(
        ['contestRunning', 'contestEnd'].flatMap((phase) =>
          [
            'displayPeerSubmission',
            'displayRank',
            'displayJudgeScore',
            'displayCheckpointResult',
            'allowToSubmit',
          ].map((field) => [`features.${phase}.${field}`, contestFeatureContracts.visibility]),
        ),
      ),
    },
  },
  { match: /^\/contest\/participate$/, fields: { password: c.contest.password } },
  {
    match: /^\/contest\/(createQuestion|reply)$/,
    fields: { title: c.contest.questionTitle, message: c.contest.questionMessage },
  },
  {
    match: /^\/(submit\/create|contest\/createSubmission|exam\/createSubmission)$/,
    fields: c.submission,
  },
  {
    match: /^\/manage\/exam\/(create|update)$/,
    fields: {
      examTitle: c.exam.examTitle,
      description: c.exam.examDescription,
      'features.scoreMod': c.exam.scoreMod,
      'features.caseMod': c.exam.caseMod,
      'features.openReport': c.exam.openReport,
    },
  },
  {
    match: /^\/manage\/exam\/choiceProblem\/(createChoiceProblem|updateChoiceProblem)$/,
    fields: c.choice,
  },
  {
    match:
      /^\/(manage\/problem\/(updateCheckpoints|rearrangeCheckpoints)|problem\/appendCheckpoints)$/,
    fields: {
      'checkpoints.*.score': c.checkpoint.checkpointScore,
      'checkpoints.*.note': c.checkpoint.note,
    },
  },
  { match: /^\/ps\/problem_set\/(add|edit)$/, fields: c.problemSet },
  { match: /^\/ps\/group\/(add|edit)$/, fields: c.problemGroup },
  { match: /^\/ps\/problem_set\/late\/(add|update|batch_add)$/, fields: c.late },
  { match: /^\/ps\/class\/(create|\d+\/update)$/, fields: c.classroom },
  { match: /^\/ps\/course\/(create|\d+\/update)$/, fields: c.course },
  { match: /^\/ps\/course\/\d+\/(add-ta|ta\/\d+\/update)$/, fields: { ta_name: c.course.ta_name } },
  {
    match: /^\/ps\/(schedule\/(add|\d+\/update)|course\/\d+\/times\/(add|\d+\/update))$/,
    fields: c.course,
  },
  {
    match: /^\/ps\/attendance\/\d+\/(leave|record)$/,
    fields: { ...c.attendance, 'records.*.seat_number': c.attendance.seat_number },
  },
  { match: /^\/ps\/seat\/\d+\/assign$/, fields: { seat_number: c.attendance.seat_number } },
];

function valuesAt(value: unknown, path: string[], prefix = ''): Array<[string, unknown]> {
  if (!path.length) return [[prefix, value]];
  const [key, ...rest] = path;
  if (key === '*')
    return Array.isArray(value)
      ? value.flatMap((entry, index) => valuesAt(entry, rest, `${prefix}[${index}]`))
      : [];
  const next =
    value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined;
  return valuesAt(next, rest, prefix ? `${prefix}.${key}` : key);
}

export function requestConstraintError(
  url: string,
  data: unknown,
  method = 'POST',
): string | undefined {
  const path = new URL(url, 'http://localhost').pathname;
  if (method === 'GET') {
    const query =
      data && typeof data === 'object'
        ? Object.fromEntries(
            Object.entries(data).filter(([, value]) => value !== null && value !== undefined),
          )
        : {};
    return autolabSchemaError(path, query, 'GET');
  }
  const checked = new Set<string>();
  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    const limits = /^\/(manage\/)?checkpoint\/uploadFiles$/.test(path)
      ? transport.checkpointUpload
      : undefined;
    let totalBytes = 0;
    for (const value of Array.from(data.values())) {
      if (value instanceof File) {
        totalBytes += value.size;
        if (limits?.maxFileBytes && value.size > limits.maxFileBytes)
          return `${value.name}: ${i18n.t('ValidationFileBytes', { max: limits.maxFileBytes })}`;
        const error = constraintError(c.file.name, value.name);
        if (error) return `${value.name}: ${error}`;
        const extension = value.name.includes('.')
          ? value.name.slice(value.name.lastIndexOf('.') + 1)
          : '';
        const extensionError = constraintError(c.file.extension, extension);
        if (extensionError) return `${value.name}: ${extensionError}`;
      } else {
        totalBytes += new Blob([value]).size;
      }
    }
    if (limits?.maxRequestBytes && totalBytes > limits.maxRequestBytes)
      return String(i18n.t('ValidationFileBytes', { max: limits.maxRequestBytes }));
    return;
  }
  for (const contract of requestContracts) {
    if (!contract.match.test(path)) continue;
    for (const [field, rule] of Object.entries(contract.fields)) {
      for (const [label, value] of valuesAt(data, field.split('.'))) {
        if (
          value === undefined &&
          !contract.requireMissing &&
          !(field.includes('*') && rule.required)
        )
          continue;
        const error = constraintError(rule, value);
        if (error) return `${label}: ${error}`;
        checked.add(label);
      }
    }
  }
  if (
    /^\/ps\/problem_set\/late\/(add|update|batch_add)$/.test(path) &&
    data &&
    typeof data === 'object'
  ) {
    const expire = (data as { expire_time?: unknown }).expire_time;
    if (expire !== undefined && expire !== null && Number(expire) <= Date.now())
      return String(i18n.t('ValidationFuture'));
    const active = (data as { is_active?: unknown }).is_active;
    if (active !== undefined && active !== null && ![0, 1].includes(Number(active)))
      return String(i18n.t('ValidationEnum', { values: '0, 1' }));
  }
  const tables: Record<string, string> = {
    class: 'oj_class',
    course: 'oj_course',
    schedule: 'oj_course_schedule',
    group: 'problem_group',
    problem_set: 'problem_set',
    objective: 'problem_objective',
    subjective: 'problem_subjective',
  };
  if (/^\/ps\/problem_set\/(add|edit)$/.test(path) && data && typeof data === 'object') {
    const value = data as {
      config?: {
        useSameSE?: number;
        usePractice?: number;
        practiceTimeSetting?: unknown;
        practiceScoreCalculate?: unknown;
      };
      groupInfo?: Array<{ timeSetting?: unknown }>;
      tm_start?: unknown;
      tm_end?: unknown;
    };
    if (!value.config || !value.groupInfo?.length)
      return `config/groupInfo: ${i18n.t('ValidationRequired')}`;
    if (Number(value.config.useSameSE) === 1 && (value.tm_start == null || value.tm_end == null))
      return `tm_start/tm_end: ${i18n.t('ValidationRequired')}`;
    if (
      Number(value.config.useSameSE) !== 1 &&
      value.groupInfo.some((group) => group.timeSetting == null)
    )
      return `groupInfo.timeSetting: ${i18n.t('ValidationRequired')}`;
    if (
      Number(value.config.usePractice) === 1 &&
      (!value.config.practiceTimeSetting || !value.config.practiceScoreCalculate)
    )
      return `practiceTimeSetting/practiceScoreCalculate: ${i18n.t('ValidationRequired')}`;
  }
  if (/^\/ps\/schedule\/add$/.test(path) && data && typeof data === 'object') {
    const value = data as { start_time?: string; end_time?: string };
    const start = Date.parse(value.start_time ?? '');
    const end = Date.parse(value.end_time ?? '');
    if (
      Number.isFinite(start) &&
      Number.isFinite(end) &&
      (end <= start || end - start > 12 * 3600000)
    )
      return String(i18n.t('ValidationScheduleRange'));
  }
  const domain = path.split('/')[2];
  const table = tables[domain];
  if (
    path.startsWith('/ps/') &&
    table &&
    /\/(add|edit|create|update)$/.test(path) &&
    data &&
    typeof data === 'object'
  ) {
    const columns = database.autolab[table as keyof typeof database.autolab];
    for (const [key, value] of Object.entries(data)) {
      if (checked.has(key) || !(key in columns) || value === undefined || value === null) continue;
      const rule = column('autolab', table, key, typeof value === 'object' ? { kind: 'json' } : {});
      const error = constraintError(rule, value);
      if (error) return `${key}: ${error}`;
    }
  }
  return autolabSchemaError(path, data);
}
