import { column, Constraint } from './constraints';

const javaInt = { max: 2147483647 };
const passwordPattern =
  /^(?:(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z\d])|(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z\d])|(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])).{8,}$/;
const list = (maxItems: number, source: string): Constraint => ({
  kind: 'array',
  maxItems,
  source,
});

export const contestFeatureContracts = {
  mode: { kind: 'string', required: true, source: 'ContestFeatureDTO.mode @NotNull' },
  openness: { kind: 'string', required: true, source: 'ContestFeatureDTO.openness @NotNull' },
  visibility: {
    kind: 'integer',
    required: true,
    min: -2147483648,
    max: 2147483647,
    source: 'ContestFeatureDTO.InfoOpenness Integer @NotNull',
  },
} satisfies Record<string, Constraint>;

export const contracts = {
  user: {
    username: column('oj', 'oj_user', 'u_username', {
      pattern: /^[A-Za-z0-9_]{4,16}$/,
      source: 'UserDTO / UserManageUpdateReqDTO',
    }),
    loginUsername: column('oj', 'oj_user', 'u_username', {
      required: true,
      notBlank: true,
      source: 'UserPasswordLoginReqDTO',
    }),
    nickname: column('oj', 'oj_user', 'u_nickname', {
      maxUtf16: 30,
      source: 'UserInfoUpdateReqDTO / UserManageUpdateReqDTO',
    }),
    phone: column('oj', 'oj_user', 'u_phone', { maxUtf16: 16, source: 'UserInfoUpdateReqDTO' }),
    studentId: column('oj', 'oj_user', 'u_student_id', {
      maxUtf16: 20,
      source: 'UserInfoUpdateReqDTO',
    }),
    email: column('oj', 'oj_user', 'u_email'),
    gender: column('oj', 'oj_user', 'u_gender', {
      min: 0,
      max: 2,
      source: 'UserInfoUpdateReqDTO @Range',
    }),
    newPassword: {
      kind: 'string',
      required: true,
      notBlank: true,
      pattern: passwordPattern,
      source: 'RegexConstants.PASSWORD_REGEX; UserPasswordUpdateReqDTO',
    } as Constraint,
    currentPassword: {
      kind: 'string',
      required: true,
      notBlank: true,
      source: 'UserPasswordLoginReqDTO; plaintext is not constrained by the hash column',
    } as Constraint,
    adminPassword: {
      kind: 'string',
      minUtf16: 4,
      maxUtf16: 32,
      source: 'UserManageUpdateReqDTO @Length(min=4,max=32)',
    } as Constraint,
  },
  group: {
    title: column('oj', 'oj_group', 'g_title', {
      maxUtf16: 45,
      source: 'GroupCreateReqDTO / GroupManageDTO',
    }),
    description: column('oj', 'oj_group', 'g_description', {
      maxUtf16: 120,
      source: 'GroupCreateReqDTO / GroupManageDTO',
    }),
    markdown: column('oj', 'oj_group', 'g_markdown', {
      maxUtf16: 60000,
      source: 'GroupCreateReqDTO / GroupManageDTO',
    }),
    openness: column('oj', 'oj_group', 'g_openness', {
      min: 0,
      max: 2,
      source: 'GroupCreateReqDTO @Range',
    }),
  },
  notice: {
    title: column('oj', 'oj_notice', 'n_title', {
      maxUtf16: 45,
      required: true,
      notBlank: true,
      source: 'NoticeManageDTO',
    }),
    text: column('oj', 'oj_notice', 'n_text', {
      maxUtf16: 20000,
      required: true,
      notBlank: true,
      source: 'NoticeManageDTO',
    }),
  },
  problem: {
    problemCode: column('oj', 'oj_problem', 'p_code'),
    problemTitle: column('oj', 'oj_problem', 'p_title'),
    source: column('oj', 'oj_problem', 'p_source'),
    timeLimit: column('oj', 'oj_problem', 'p_time_limit', javaInt),
    memoryLimit: column('oj', 'oj_problem', 'p_memory_limit', javaInt),
    outputLimit: column('oj', 'oj_problem', 'p_output_limit', javaInt),
    managerGroups: list(20, 'ProblemManageDTO @Size(max=20)'),
    judgeTemplates: list(20, 'ProblemManageDTO @Size(max=20)'),
    checkpoints: list(1024, 'ProblemManageDTO @Size(max=1024)'),
    checkpointCases: list(20, 'ProblemManageDTO @Size(max=20)'),
    checkerConfig: column('oj', 'oj_problem', 'p_checker_config', { kind: 'json' }),
    functionTemplates: column('oj', 'oj_problem', 'p_function_templates', { kind: 'json' }),
  },
  description: {
    title: column('oj', 'oj_problem_description', 'pd_title'),
    markdownDescription: column('oj', 'oj_problem_description', 'pd_markdown_description'),
  },
  checkpoint: {
    legacyScore: {
      kind: 'integer',
      required: true,
      min: -2147483648,
      max: 2147483647,
      source:
        'ProblemCheckpointDTO @NotNull; ProblemConverterUtils.checkpointsFrom writes a signed 32-bit value into oj_problem.p_checkpoints BLOB',
    } as Constraint,
    checkpointScore: column('oj', 'oj_problem_checkpoint_rel', 'pcr_score'),
    note: column('oj', 'oj_problem_checkpoint_rel', 'pcr_note'),
  },
  judgeTemplate: {
    acceptFileExtensions: column('oj', 'oj_judge_template', 'jt_accept_file_extensions', {
      kind: 'array',
      serialize: 'comma',
      items: { kind: 'string', pattern: /^[^,]*$/, source: 'BaseConvertUtils.collectionToString' },
      source: 'BaseConvertUtils.collectionToString',
    }),
    title: column('oj', 'oj_judge_template', 'jt_title'),
    comment: column('oj', 'oj_judge_template', 'jt_comment'),
    shellScript: column('oj', 'oj_judge_template', 'jt_shell_script'),
    remoteOj: column('oj', 'oj_judge_template', 'jt_remote_oj'),
    remoteParameters: column('oj', 'oj_judge_template', 'jt_remote_parameters'),
  },
  contest: {
    frozenTime: {
      kind: 'integer',
      required: true,
      min: -2147483648,
      max: 2147483647,
      source: 'ContestFeatureDTO.frozenTime Integer @NotNull',
    } as Constraint,
    features: column('oj', 'oj_contest', 'ct_features', { kind: 'json' }),
    contestTitle: column('oj', 'oj_contest', 'ct_title', {
      maxUtf16: 60,
      required: true,
      notBlank: true,
      source: 'ContestManageDTO',
    }),
    password: column('oj', 'oj_contest', 'ct_password', {
      maxUtf16: 60,
      source: 'ContestManageDTO',
    }),
    source: column('oj', 'oj_contest', 'ct_source'),
    markdownDescription: column('oj', 'oj_contest', 'ct_markdown_description'),
    problems: list(96, 'ContestManageDTO @Size(max=96)'),
    participants: list(1024, 'ContestManageDTO @Size(max=1024)'),
    unofficialParticipants: list(1024, 'ContestManageDTO @Size(max=1024)'),
    participatingGroups: list(24, 'ContestManageDTO @Size(max=24)'),
    questionTitle: column('oj', 'oj_contest_clarification', 'cf_title', {
      maxUtf16: 45,
      notBlank: true,
      source: 'ContestQuestionCreateReqDTO',
    }),
    questionMessage: column('oj', 'oj_contest_clarification', 'cf_message', {
      maxUtf16: 4090,
      notBlank: true,
      source: 'ContestQuestionCreateReqDTO / ContestReplyDTO',
    }),
  },
  exam: {
    examTitle: column('oj', 'oj_exam', 'e_title'),
    examDescription: column('oj', 'oj_exam', 'e_markdown_description'),
    scoreMod: {
      kind: 'string',
      required: true,
      values: ['show', 'partial', 'disable'],
      source: 'examBasicType',
    } as Constraint,
    caseMod: {
      kind: 'string',
      required: true,
      values: ['show', 'partial', 'disable'],
      source: 'examBasicType',
    } as Constraint,
    openReport: {
      kind: 'integer',
      required: true,
      min: 0,
      max: 1,
      source: 'examBasicType',
    } as Constraint,
    timeRange: {
      kind: 'array',
      required: true,
      minItems: 2,
      maxItems: 2,
      source: 'examBasicType',
    } as Constraint,
  },
  choice: {
    problemTitle: column('oj', 'oj_choice_problem', 'cp_title'),
    description: column('oj', 'oj_choice_problem', 'cp_description', { kind: 'json' }),
    content: column('oj', 'oj_choice_problem', 'cp_description'),
  },
  submission: { code: column('oj', 'oj_submission', 's_code') },
  objective: {
    description: column('autolab', 'problem_objective', 'content', {
      required: true,
      source:
        'ser/objective.py objective_content.description; enclosing JSON is checked on submission',
    }),
  },
  subjective: {
    maxCount: {
      kind: 'integer',
      source:
        'ser/subjective.py subjective_config.maxCount; stored inside LONGTEXT JSON without an integer ceiling',
    } as Constraint,
    description: column('autolab', 'problem_subjective', 'description', {
      required: true,
      source: 'ser/subjective.py subjective_base.description',
    }),
  },
  problemSet: {
    name: column('autolab', 'problem_set', 'name', {
      required: true,
      source: 'ser/problem_set.py problem_set_base',
    }),
    tag: column('autolab', 'problem_set', 'tag', {
      required: true,
      source: 'ser/problem_set.py problem_set_base',
    }),
    description: column('autolab', 'problem_set', 'description'),
    global_score: column('autolab', 'problem_set', 'global_score'),
    groupId: column('autolab', 'problem_set', 'groupId'),
    groupInfo: {
      kind: 'array',
      minItems: 1,
      source: 'ser/problem_set.py check_value',
    } as Constraint,
  },
  problemGroup: {
    name: column('autolab', 'problem_group', 'name', {
      required: true,
      source: 'ser/problem_group.py problem_group',
    }),
  },
  classroom: {
    c_name: column('autolab', 'oj_class', 'c_name', {
      trim: true,
      notBlank: true,
      required: true,
      source: 'model/classroom.py create_classroom',
    }),
    address: column('autolab', 'oj_class', 'address', {
      trim: true,
      notBlank: true,
      required: true,
      source: 'model/classroom.py create_classroom',
    }),
    c_seat_num: column('autolab', 'oj_class', 'c_seat_num', {
      min: 1,
      required: true,
      source: 'model/classroom.py create_classroom',
    }),
    ext_config: column('autolab', 'oj_class', 'ext_config', { kind: 'json' }),
  },
  course: {
    course_name: column('autolab', 'oj_course', 'course_name', {
      required: true,
      notBlank: true,
      trim: true,
      source: 'model/course.py create_course',
    }),
    tag: column('autolab', 'oj_course', 'tag', {
      values: ['授课', '实验', '考试', '答疑'],
      required: true,
      source: 'model/course.py VALID_COURSE_TAGS',
    }),
    course_content: column('autolab', 'oj_course_schedule', 'course_content'),
    course_homework: column('autolab', 'oj_course_schedule', 'course_homework'),
    sequence: column('autolab', 'oj_course_schedule', 'sequence', {
      min: 1,
      source: 'model/course_schedule.py add_schedule',
    }),
    // TA names and contacts now live in oj_course.ext_config JSON, not the retired TA table.
    ta_name: {
      kind: 'string',
      required: true,
      notBlank: true,
      trim: true,
      source: 'model/course.py add_ta; oj_course.ext_config LONGTEXT',
    } as Constraint,
  },
  attendance: {
    seat_number: column('autolab', 'oj_sign_user', 'seat_number', { min: 1 }),
    leave_message: column('autolab', 'oj_sign_user', 'leave_message', {
      required: true,
      notBlank: true,
      source: 'model/sign_in_record.py submit_leave',
    }),
  },
  late: {
    username: column('autolab', 'problem_set_late_permission', 'username', {
      trim: true,
      required: true,
      notBlank: true,
      source: 'ser/late_permission.py',
    }),
    note: column('autolab', 'problem_set_late_permission', 'note', {
      trim: true,
      maxCharacters: 200,
      source: 'ser/late_permission.py limit_note_length',
    }),
    discount: column('autolab', 'problem_set_late_permission', 'discount', {
      exclusiveMin: 0,
      max: 1,
      source: 'ser/late_permission.py discount_range',
    }),
    duration_minute: column('autolab', 'problem_set_late_permission', 'duration_minute'),
  },
  file: {
    name: column('oj', 'oj_file', 'f_name'),
    extension: column('oj', 'oj_file', 'f_extension_name'),
  },
};
