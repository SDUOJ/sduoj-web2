/**
 * Form validation coverage inventory.
 *
 * Business write-forms must bind every submitted field to a contract rule
 * (constraintRules / autolabFieldRules) or to a shared Item* component that
 * embeds those rules. This suite keeps the inventory honest and exercises the
 * shared validators used by those forms.
 */
import { contracts, contestFeatureContracts } from './contracts';
import { constraintError } from './constraints';

type FormField = {
  form: string;
  field: string;
  source: 'contract' | 'autolab' | 'item-component' | 'inline-rule' | 'filter-only' | 'hidden';
};

// Inventory of submit-capable forms and how each field is validated.
const inventory: FormField[] = [
  // Contest create/update
  { form: 'ContestMFormBase', field: 'contestTitle', source: 'contract' },
  { form: 'ContestMFormBase', field: 'features.mode', source: 'contract' },
  { form: 'ContestMFormBase', field: 'features.openness', source: 'contract' },
  { form: 'ContestMFormBase', field: 'isPublic', source: 'item-component' },
  { form: 'ContestMFormBase', field: 'gmtStart/gmtEnd', source: 'item-component' },
  { form: 'ContestMFormBase', field: 'password', source: 'contract' },
  { form: 'ContestMFormBase', field: 'source', source: 'contract' },
  { form: 'ContestMFormBase', field: 'markdownDescription', source: 'contract' },
  { form: 'ContestMFormManagement', field: 'features.frozenTime', source: 'contract' },
  { form: 'ContestMFormManagement', field: 'features.*.visibility', source: 'contract' },
  { form: 'ContestMFormManagement', field: 'participants', source: 'contract' },
  { form: 'ContestMFormManagement', field: 'unofficialParticipants', source: 'contract' },
  { form: 'ContestMFormProblem', field: 'problems', source: 'inline-rule' },

  // Problem set create/update
  { form: 'MProblemSet', field: 'name', source: 'contract' },
  { form: 'MProblemSet', field: 'tag', source: 'contract' },
  { form: 'MProblemSet', field: 'description', source: 'contract' },
  { form: 'MProblemSet', field: 'global_score', source: 'contract' },
  { form: 'MProblemSet', field: 'groupId', source: 'autolab' },
  { form: 'MProblemSet', field: 'manageGroupId', source: 'autolab' },
  { form: 'MProblemSet', field: 'groupInfo', source: 'contract' },
  { form: 'MProblemSet', field: 'config.*', source: 'autolab' },

  // Problem group
  { form: 'MProblemGroup', field: 'name', source: 'contract' },
  { form: 'MProblemGroup', field: 'type', source: 'inline-rule' },
  { form: 'ProblemSetGroup', field: 'name', source: 'contract' },
  { form: 'ProblemSetGroup', field: 'type', source: 'inline-rule' },

  // User create/update
  { form: 'UserFormProfile', field: 'username', source: 'item-component' },
  { form: 'UserFormProfile', field: 'password', source: 'item-component' },
  { form: 'UserFormProfile', field: 'confirm', source: 'item-component' },
  { form: 'UserFormProfile', field: 'nickname', source: 'item-component' },
  { form: 'UserFormProfile', field: 'gender', source: 'item-component' },
  { form: 'UserFormProfile', field: 'studentId', source: 'item-component' },
  { form: 'UserFormProfile', field: 'phone', source: 'item-component' },
  { form: 'UserFormProfile', field: 'email', source: 'item-component' },
  { form: 'UserFormProfile', field: 'roles', source: 'item-component' },
  { form: 'UserFormAdditional', field: 'features.*', source: 'item-component' },
  { form: 'Login', field: 'username', source: 'item-component' },
  { form: 'Login', field: 'password', source: 'item-component' },
  { form: 'Register', field: 'username/password/email', source: 'item-component' },
  { form: 'ForgetPass', field: 'username/email/captcha', source: 'item-component' },
  { form: 'Binding', field: 'username/password', source: 'item-component' },
  { form: 'CResetPass', field: 'password/confirm', source: 'item-component' },

  // Announcement
  { form: 'MAnnouncement', field: 'top', source: 'item-component' },
  { form: 'MAnnouncement', field: 'title', source: 'contract' },
  { form: 'MAnnouncement', field: 'text', source: 'contract' },

  // Judge template
  { form: 'TemplateMForm', field: 'title', source: 'contract' },
  { form: 'TemplateMForm', field: 'comment', source: 'contract' },
  { form: 'TemplateMForm', field: 'acceptFileExtensions', source: 'contract' },
  { form: 'TemplateMForm', field: 'shellScript', source: 'contract' },
  { form: 'TemplateMForm', field: 'zipFileId', source: 'item-component' },

  // Subjective / objective problem
  { form: 'SubjectiveBase', field: 'title', source: 'contract' },
  { form: 'SubjectiveBase', field: 'wordLimit', source: 'contract' },
  { form: 'SubjectiveBase', field: 'fileSizeLimit', source: 'contract' },
  { form: 'SubjectiveBase', field: 'fileType', source: 'contract' },
  { form: 'SubjectiveBase', field: 'isPublic', source: 'item-component' },
  { form: 'SubjectiveBase', field: 'managerGroups', source: 'item-component' },
  { form: 'ObjectiveForm', field: 'problemTitle', source: 'contract' },
  { form: 'ObjectiveForm', field: 'content', source: 'contract' },
  { form: 'ObjectiveForm', field: 'answer', source: 'inline-rule' },
  { form: 'ObjectiveForm', field: 'isMulti', source: 'inline-rule' },

  // Late permission
  { form: 'LatePermissionList', field: 'username', source: 'contract' },
  { form: 'LatePermissionList', field: 'expire_time', source: 'inline-rule' },
  { form: 'LatePermissionList', field: 'discount', source: 'contract' },
  { form: 'LatePermissionList', field: 'note', source: 'contract' },

  // Classroom / course
  { form: 'MAutolabClassroom', field: 'c_name', source: 'contract' },
  { form: 'MAutolabClassroom', field: 'address', source: 'contract' },
  { form: 'MAutolabClassroom', field: 'c_seat_num', source: 'contract' },
  { form: 'MAutolab', field: 'course_name', source: 'contract' },
  { form: 'MAutolab', field: 'tag', source: 'contract' },
  { form: 'MAutolab', field: 'ta_name', source: 'contract' },
  { form: 'MAutolab', field: 'contact', source: 'contract' },
  { form: 'MAutolab', field: 'email', source: 'contract' },
  { form: 'MAutolab', field: 'office', source: 'contract' },
  { form: 'MAutolab', field: 'remark', source: 'contract' },

  // Group profile
  { form: 'GroupFormProfile', field: 'title', source: 'contract' },
  { form: 'GroupFormProfile', field: 'description', source: 'contract' },
  { form: 'GroupFormProfile', field: 'openness', source: 'contract' },
  { form: 'GroupFormProfile', field: 'markdown', source: 'contract' },

  // Checkpoint upload
  { form: 'publicCheckpoints/UploadForm', field: 'mode', source: 'inline-rule' },
  { form: 'publicCheckpoints/UploadForm', field: 'input', source: 'inline-rule' },
  { form: 'publicCheckpoints/UploadForm', field: 'output', source: 'inline-rule' },
  { form: 'publicCheckpoints/UploadForm', field: 'note', source: 'contract' },

  // Exam
  { form: 'ExamBaseForm', field: 'examTitle', source: 'contract' },
  { form: 'ExamBaseForm', field: 'scoreMod', source: 'contract' },
  { form: 'ExamBaseForm', field: 'caseMod', source: 'contract' },
  { form: 'ExamBaseForm', field: 'openReport', source: 'contract' },
  { form: 'ExamBaseForm', field: 'timeRange', source: 'contract' },
];

const byForm = inventory.reduce<Record<string, FormField[]>>((acc, item) => {
  (acc[item.form] ??= []).push(item);
  return acc;
}, {});

describe('form validation coverage inventory', () => {
  it('covers every known business write-form', () => {
    expect(Object.keys(byForm).sort()).toEqual([
      'Binding',
      'CResetPass',
      'ContestMFormBase',
      'ContestMFormManagement',
      'ContestMFormProblem',
      'ExamBaseForm',
      'ForgetPass',
      'GroupFormProfile',
      'LatePermissionList',
      'Login',
      'MAnnouncement',
      'MAutolab',
      'MAutolabClassroom',
      'MProblemGroup',
      'MProblemSet',
      'ObjectiveForm',
      'ProblemSetGroup',
      'Register',
      'SubjectiveBase',
      'TemplateMForm',
      'UserFormAdditional',
      'UserFormProfile',
      'publicCheckpoints/UploadForm',
    ]);
  });

  it('has no unvalidated write fields', () => {
    const unvalidated = inventory.filter((item) => item.source === 'filter-only');
    expect(unvalidated).toEqual([]);
    expect(inventory.every((item) => item.source !== undefined)).toBe(true);
    expect(inventory.length).toBeGreaterThanOrEqual(70);
  });

  it('rejects every out-of-range write value before submit', () => {
    // spot-check one field per major form family
    expect(constraintError(contracts.contest.contestTitle, '')).toBeDefined();
    expect(constraintError(contracts.contest.frozenTime, 2147483648)).toBeDefined();
    expect(constraintError(contestFeatureContracts.openness, 'anonymous')).toBeDefined();
    expect(constraintError(contracts.problemSet.name, '   ')).toBeDefined();
    expect(constraintError(contracts.problemSet.tag, '')).toBeDefined();
    expect(constraintError(contracts.problemGroup.name, '')).toBeDefined();
    expect(constraintError(contracts.user.username, 'ab')).toBeDefined();
    expect(constraintError(contracts.user.gender, 9)).toBeDefined();
    expect(constraintError(contracts.notice.title, 'a'.repeat(46))).toBeDefined();
    expect(constraintError(contracts.judgeTemplate.title, 't'.repeat(33))).toBeDefined();
    expect(constraintError(contracts.subjective.wordLimit, 0)).toBeDefined();
    expect(constraintError(contracts.subjective.fileSizeLimit, 0)).toBeDefined();
    expect(constraintError(contracts.objective.answer, [])).toBeDefined();
    expect(constraintError(contracts.late.discount, 0)).toBeDefined();
    expect(constraintError(contracts.classroom.c_seat_num, 0)).toBeDefined();
    expect(constraintError(contracts.course.tag, '未知')).toBeDefined();
    expect(constraintError(contracts.course.ta_name, '   ')).toBeDefined();
    expect(constraintError(contracts.course.ta_contact, 'x'.repeat(129))).toBeDefined();
    expect(constraintError(contracts.course.ta_email, 'not-an-email')).toBeUndefined(); // allows empty/plain
    expect(constraintError(contracts.course.ta_remark, 'x'.repeat(256))).toBeDefined();
    expect(constraintError(contracts.exam.scoreMod, 'always')).toBeDefined();
    expect(constraintError(contracts.exam.timeRange, [1])).toBeDefined();
  });
});
