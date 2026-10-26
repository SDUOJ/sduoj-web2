import { createPortal } from 'react-dom';
import { useAnswerToolbarHost } from './AnswerLayout';
import { ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Empty, Select, Space, Tabs, Dropdown, message } from 'antd';
import {
  PlayCircleOutlined,
  BugOutlined,
  SendOutlined,
  StopOutlined,
  ExperimentOutlined,
  HistoryOutlined,
  UpOutlined,
  DownOutlined,
  CodeOutlined,
  ConsoleSqlOutlined,
} from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import cApi from '../../Utils/API/c-api';
import { JudgeTemplateAllType, TestCase } from '../../Type/IProblem';
import CustomCaseList, { CustomCaseItem } from './CustomCaseList';
import AnswerEditor from './AnswerEditor';
import useIdeDebug from './useIdeDebug';
import useDebugInspection from './useDebugInspection';
import { DebugConsole, DebugSidebar, DebugToolbar } from './DebugPanel';
import RunResults from './RunResults';
import { useRunTask } from './useRunTask';
import SplitPane from './SplitPane';
import DebugLayout from './DebugLayout';
import { IdeContext } from './runTypes';
import { useCloudCode } from './useCloudCode';
import { SyncJudging } from '../submission/SyncJudging';

type Draft = {
  templateId: string;
  codes: Record<string, string>;
  cases: CustomCaseItem[];
  casesOpen: boolean;
};
function readDraft(key: string, templateId: string): Draft {
  const initial: Draft = {
    templateId,
    codes: {},
    cases: [{ key: 'initial', input: '' }],
    casesOpen: true,
  };
  try {
    const data = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (!data || typeof data !== 'object') return initial;
    return {
      templateId: typeof data.templateId === 'string' ? data.templateId : templateId,
      codes: Object.fromEntries(
        Object.entries(data.codes ?? {}).filter(([, value]) => typeof value === 'string'),
      ) as Record<string, string>,
      cases:
        Array.isArray(data.cases) && data.cases.length <= 10
          ? data.cases.filter(
              (item: CustomCaseItem) =>
                item &&
                typeof item.key === 'string' &&
                typeof item.input === 'string' &&
                (item.expectedOutput === undefined || typeof item.expectedOutput === 'string'),
            )
          : initial.cases,
      casesOpen: data.casesOpen !== false,
    };
  } catch {
    return initial;
  }
}
function language(
  template?: JudgeTemplateAllType,
): 'c' | 'cpp' | 'java' | 'python' | 'sql' | 'text' {
  const text =
    `${template?.title ?? ''} ${template?.acceptFileExtensions?.join(' ') ?? ''}`.toLowerCase();
  if (/java/.test(text)) return 'java';
  if (/python|\.py\b/.test(text)) return 'python';
  if (/c\+\+|cpp/.test(text)) return 'cpp';
  if (/\bc\b/.test(text)) return 'c';
  if (/sql/.test(text)) return 'sql';
  return 'text';
}
function AnswerWorkspace(props: {
  problemCode: string;
  username: string;
  title: string;
  templates: JudgeTemplateAllType[];
  samples?: TestCase[];
  querySubmission: (id: string) => Promise<unknown>;
  submissionHistory?: ReactNode;
  context?: IdeContext;
  scopeKey?: string;
  submissionListName?: string;
  remainingSubmissions?: number;
  submitCode?: (templateId: string, code: string) => Promise<string>;
}) {
  const { t } = useTranslation();
  const toolbarHost = useAnswerToolbarHost();
  const samples = (Array.isArray(props.samples) ? props.samples : [])
    .filter(
      (sample) => sample && typeof sample.input === 'string' && typeof sample.output === 'string',
    )
    .slice(0, 10);
  const submitInFlight = useRef(false);
  const templates = useMemo(
    () => props.templates.filter((item) => item.type === 0),
    [props.templates],
  );
  const context = useMemo<IdeContext>(
    () => props.context ?? { type: 0, problemCode: props.problemCode },
    [props.context, props.problemCode],
  );
  const identity = `${props.username}:${props.scopeKey ?? props.problemCode}`;
  const storageKey = `answerIde:draft:${identity}`;
  const [draft, setDraft] = useState(() => readDraft(storageKey, String(templates[0]?.id ?? '')));
  const latestDraft = useRef(draft);
  useLayoutEffect(() => {
    latestDraft.current = draft;
  }, [draft]);
  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(latestDraft.current));
      } catch {
        /* The debounced save reports storage errors. */
      }
    };
    window.addEventListener('beforeunload', save);
    return () => {
      window.removeEventListener('beforeunload', save);
      save();
    };
  }, [storageKey]);
  const splitStorageKey = `answerIde:editorSplit:${identity}`;
  const [editorRatio, setEditorRatio] = useState(() => {
    try {
      const saved = Number(localStorage.getItem(splitStorageKey));
      return saved > 0 && saved < 100 ? saved : 62;
    } catch {
      return 62;
    }
  });
  const consoleStorageKey = `${splitStorageKey}:collapsed`;
  const [consoleCollapsed, setConsoleCollapsed] = useState(() => {
    try {
      return localStorage.getItem(consoleStorageKey) === 'true';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(consoleStorageKey, String(consoleCollapsed));
    } catch {
      /* Optional layout preference. */
    }
  }, [consoleCollapsed, consoleStorageKey]);
  const [consoleTab, setConsoleTab] = useState(() => {
    try {
      return localStorage.getItem(`answerIde:active:${identity}`) ? 'results' : 'cases';
    } catch {
      return 'cases';
    }
  });
  const restoredRun = useRef(false);
  useEffect(() => {
    try {
      localStorage.setItem(splitStorageKey, String(editorRatio));
    } catch {
      /* Optional. */
    }
  }, [editorRatio, splitStorageKey]);
  const [savingError, setSavingError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const run = useRunTask(identity, context);
  useEffect(() => {
    if (run.id && !restoredRun.current) {
      setConsoleTab('results');
      restoredRun.current = true;
    }
  }, [run.id]);
  const watchList = useMemo(() => (run.id ? [run.id] : []), [run.id]);
  const templateId = templates.some((item) => String(item.id) === draft.templateId)
    ? draft.templateId
    : String(templates[0]?.id ?? '');
  const code = draft.codes[templateId] ?? '';
  const template = templates.find((item) => String(item.id) === templateId);
  const editorLanguage = language(template);
  const [actionMode, setActionMode] = useState<'run' | 'debug'>(() => {
    try {
      return localStorage.getItem(`answerIde:debugMode:${identity}`) === 'debug' ? 'debug' : 'run';
    } catch {
      return 'run';
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(`answerIde:debugMode:${identity}`, actionMode);
    } catch {
      /* Optional preference. */
    }
  }, [actionMode, identity]);
  const [debugInput, setDebugInput] = useState('');
  const cursorLine = useRef(1);
  const restarting = useRef(false);
  const debug = useIdeDebug({
    enabled: ['c', 'cpp', 'java', 'python'].includes(editorLanguage),
    language: (['c', 'cpp', 'java', 'python'].includes(editorLanguage) ? editorLanguage : 'cpp') as
      'c' | 'cpp' | 'java' | 'python',
    judgeTemplateId: templateId,
    problemCode: props.problemCode,
    context,
    code,
    storageKey: `answerIde:debug:${identity}`,
    restoreEnabled: actionMode === 'debug',
    restoreSource: (value, template) =>
      setDraft((old) => ({
        ...old,
        templateId: template,
        codes: { ...old.codes, [template]: value },
      })),
  });
  const inspection = useDebugInspection(debug);
  const showDebug = () => {
    setActionMode('debug');
    setConsoleTab('debugIO');
    setConsoleCollapsed(false);
  };
  const startDebug = () => {
    if (!debug.available || debug.active || run.busy || !code.trim()) return;
    showDebug();
    void debug.start(debugInput);
  };
  const restartDebug = async () => {
    if (restarting.current || !debug.active) return;
    restarting.current = true;
    try {
      if (await debug.control('stop')) await debug.start(debugInput);
    } finally {
      restarting.current = false;
    }
  };
  const cloud = useCloudCode({
    identity,
    context,
    username: props.username,
    templateId,
    code,
    templates,
    initialize: (language, value) =>
      setDraft((previous) =>
        previous.codes[language] === undefined
          ? { ...previous, codes: { ...previous.codes, [language]: value } }
          : previous,
      ),
    restore: (language, value) =>
      setDraft((previous) => ({
        ...previous,
        templateId: language,
        codes: { ...previous.codes, [language]: value },
      })),
  });
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(draft));
        setSavingError(false);
      } catch {
        setSavingError(true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [draft, storageKey]);
  const submit = async () => {
    if (
      submitInFlight.current ||
      !code.trim() ||
      !templateId ||
      (props.remainingSubmissions != null && props.remainingSubmissions <= 0)
    )
      return;
    submitInFlight.current = true;
    setSubmitting(true);
    try {
      const submissionId = props.submitCode
        ? await props.submitCode(templateId, code)
        : await cApi.submit({
            problemCode: props.problemCode,
            judgeTemplateId: templateId,
            code,
          });
      dispatch({
        type: 'setTopSubmission',
        submissionID: submissionId,
        submissionInfo: {
          title: props.title,
          scoreMod: 'show',
          testcaseMod: 'show',
          QuerySubmissionAPI: props.querySubmission,
        },
      });
      dispatch({ type: 'setSubmissionModalVis', data: true });
      dispatch({
        type: 'addTableVersion',
        name: props.submissionListName ?? 'Pro-SubmissionList-Recent-' + props.problemCode,
      });
      message.success(t('answerIde.submitted'));
    } finally {
      submitInFlight.current = false;
      setSubmitting(false);
    }
  };
  const start = () => {
    if (debug.active || run.blocked || !code.trim() || !draft.cases.length || !templateId) return;
    setActionMode('run');
    setConsoleTab('results');
    setConsoleCollapsed(false);
    void run.start({
      context,
      problemCode: props.problemCode,
      judgeTemplateId: templateId,
      code,
      cases: draft.cases.map(({ input, expectedOutput }) => ({ input, expectedOutput })),
    });
  };
  useEffect(() => {
    const runPublicCase = (event: Event) => {
      const item = (event as CustomEvent).detail;
      if (
        !item ||
        item.problemCode !== (props.scopeKey ?? props.problemCode) ||
        debug.active ||
        run.blocked ||
        !code.trim() ||
        !templateId
      )
        return;
      if (typeof item.input !== 'string' || typeof item.expectedOutput !== 'string') return;
      setConsoleTab('results');
      setConsoleCollapsed(false);
      void run.start({
        context,
        problemCode: props.problemCode,
        judgeTemplateId: templateId,
        code,
        cases: [{ input: item.input, expectedOutput: item.expectedOutput }],
      });
    };
    window.addEventListener('answerIde:publicCase', runPublicCase);
    return () => window.removeEventListener('answerIde:publicCase', runPublicCase);
  }, [props.problemCode, props.scopeKey, run, code, templateId, context, debug.active]);
  const toolbar = (
    <div className="ide-workspace-toolbar">
      <div className="ide-language-bar">
        <Select
          aria-label={t('answerIde.language')}
          value={templateId}
          disabled={debug.active}
          onChange={(value) => setDraft((previous) => ({ ...previous, templateId: value }))}
          options={templates.map((item) => ({ value: String(item.id), label: item.title }))}
          style={{ width: 140, maxWidth: '100%' }}
        />
        {cloud.controls}
      </div>
      <Space className="ide-actions">
        <Space.Compact>
          <Button
            icon={
              actionMode === 'debug' ? (
                <BugOutlined aria-hidden />
              ) : (
                <PlayCircleOutlined aria-hidden />
              )
            }
            loading={actionMode === 'debug' ? debug.sending : run.busy}
            disabled={
              actionMode === 'debug'
                ? !debug.available || debug.active || run.busy || !code.trim()
                : debug.active || run.blocked || !code.trim() || !draft.cases.length || !templateId
            }
            aria-label={actionMode === 'debug' ? t('answerIde.debug.start') : undefined}
            title={actionMode === 'debug' ? 'F5' : 'Ctrl+F5 / Ctrl/⌘+Enter'}
            onClick={actionMode === 'debug' ? startDebug : start}
          >
            {actionMode === 'debug'
              ? t('answerIde.debug.start')
              : run.recovering
                ? t('answerIde.restoringRun')
                : run.cooldown > 0
                  ? t('answerIde.runCooldown', { count: run.cooldown })
                  : t('answerIde.run')}
          </Button>
          <Dropdown
            trigger={['click']}
            menu={{
              selectedKeys: [actionMode],
              items: [
                {
                  key: 'run',
                  icon: <PlayCircleOutlined aria-hidden />,
                  label: t('answerIde.run'),
                },
                {
                  key: 'debug',
                  icon: <BugOutlined aria-hidden />,
                  label: t('answerIde.debug.start'),
                  disabled: !debug.available,
                },
              ],
              onClick: ({ key }) => {
                if (key === 'debug') showDebug();
                else
                  void (async () => {
                    if (
                      (debug.active || debug.session?.state === 'lost') &&
                      !(await debug.control('stop'))
                    )
                      return;
                    setActionMode('run');
                    setConsoleTab('cases');
                  })();
              },
            }}
          >
            <Button aria-label={t('answerIde.debug.mode')} icon={<DownOutlined />} />
          </Dropdown>
        </Space.Compact>
        {run.busy && (
          <Button
            icon={<StopOutlined aria-hidden />}
            disabled={!run.id}
            onClick={() => void run.cancel()}
          >
            {t('answerIde.cancel')}
          </Button>
        )}
        <Button
          loading={submitting}
          type="primary"
          icon={<SendOutlined aria-hidden />}
          disabled={
            submitting ||
            !code.trim() ||
            !templateId ||
            (props.remainingSubmissions != null && props.remainingSubmissions <= 0)
          }
          onClick={() => void submit().catch(() => undefined)}
        >
          {t('answerIde.submit')}
        </Button>
      </Space>
    </div>
  );
  return (
    <div
      className="ide-workspace"
      onKeyDownCapture={(event) => {
        if (!event.nativeEvent.isComposing && !event.altKey) {
          const modified = event.ctrlKey || event.metaKey;
          const show = modified && event.shiftKey && event.key.toLowerCase() === 'd';
          const debugKey =
            !modified &&
            (!event.shiftKey || ['F5', 'F11'].includes(event.key)) &&
            ['F5', 'F6', 'F9', 'F10', 'F11'].includes(event.key);
          const runKey = event.ctrlKey && !event.metaKey && !event.shiftKey && event.key === 'F5';
          const restart = modified && event.shiftKey && event.key === 'F5';
          if ((debug.available && (show || debugKey || restart)) || runKey) {
            event.preventDefault();
            event.stopPropagation();
            if (event.repeat) return;
            if (runKey) {
              start();
              return;
            }
            if (show) {
              showDebug();
              return;
            }
            if (restart) {
              void restartDebug();
              return;
            }
            if (event.key === 'F5') {
              if (event.shiftKey) {
                if (debug.active) void debug.control('stop');
              } else if (!debug.active) startDebug();
              else if (debug.canInspect && !inspection.busy)
                void debug.execute('continue', { threadId: debug.threadId });
            } else if (event.key === 'F6' && debug.active) void debug.control('pause');
            else if (event.key === 'F9' && (!debug.active || !inspection.busy))
              void debug.toggleBreakpoint(cursorLine.current);
            else if (debug.canInspect && !inspection.busy)
              void debug.execute(
                event.key === 'F10' ? 'next' : event.shiftKey ? 'stepOut' : 'stepIn',
                { threadId: debug.threadId },
              );
            return;
          }
        }
        if (!(event.ctrlKey || event.metaKey) || event.altKey || event.nativeEvent.isComposing)
          return;
        if (event.key !== 'Enter' && event.key.toLowerCase() !== 's') return;
        event.preventDefault();
        event.stopPropagation();
        if (event.repeat) return;
        if (event.key === 'Enter') start();
        else void cloud.save();
      }}
    >
      {toolbarHost ? createPortal(toolbar, toolbarHost) : toolbar}
      {cloud.error && <Alert type="warning" showIcon message={cloud.error} />}
      {savingError && <Alert type="warning" message={t('answerIde.saveFailed')} />}
      {run.error && <Alert type="warning" message={run.error} />}
      <SyncJudging
        queryList={watchList}
        open={Boolean(run.busy && run.id)}
        dataHandle={(frame) => {
          if (frame[2] === 3) run.refresh();
        }}
      />
      <DebugLayout
        enabled={actionMode === 'debug'}
        storageKey={`answerIde:debugLayout:${identity}`}
        sidebar={<DebugSidebar debug={debug} inspection={inspection} />}
      >
        <SplitPane
          vertical
          label={t('answerIde.editorHeight')}
          ratio={editorRatio}
          onChange={setEditorRatio}
          minFirstSize={160}
          secondCollapse={{
            collapsed: consoleCollapsed,
            onChange: setConsoleCollapsed,
            collapsedSize: 48,
            minSize: 160,
            dragThreshold: 64,
          }}
          first={
            <div className="ide-editor-panel ide-debug-editor">
              {actionMode === 'debug' && (
                <DebugToolbar
                  debug={debug}
                  busy={inspection.busy}
                  restart={() => void restartDebug()}
                />
              )}
              <AnswerEditor
                fill
                language={editorLanguage}
                debug={{
                  enabled: actionMode === 'debug' && debug.available,
                  active: debug.active,
                  stopKey: `${debug.session?.sessionId}:${debug.session?.stopId}`,
                  breakpoints: debug.breakpoints,
                  line: inspection.line,
                  hover: inspection.hover,
                  toggle: (line) => {
                    if (!inspection.busy) void debug.toggleBreakpoint(line);
                  },
                  cursor: (line) => {
                    cursorLine.current = line;
                  },
                }}
                value={code}
                problemCode={props.problemCode}
                judgeTemplateId={templateId}
                context={context}
                onChange={(value) =>
                  setDraft((previous) => ({
                    ...previous,
                    codes: { ...previous.codes, [templateId]: value },
                  }))
                }
              />
            </div>
          }
          second={
            <Tabs
              className={`ide-console-tabs${consoleCollapsed ? ' ide-console-collapsed' : ''}`}
              activeKey={
                actionMode === 'debug'
                  ? consoleTab === 'debugCommands'
                    ? consoleTab
                    : 'debugIO'
                  : consoleTab.startsWith('debug')
                    ? 'cases'
                    : consoleTab
              }
              onChange={setConsoleTab}
              onTabClick={(key) =>
                setConsoleCollapsed((previous) => (key === consoleTab ? !previous : false))
              }
              tabBarExtraContent={{
                right: (
                  <Button
                    type="text"
                    size="small"
                    className="ide-console-toggle"
                    icon={
                      consoleCollapsed ? <UpOutlined aria-hidden /> : <DownOutlined aria-hidden />
                    }
                    aria-label={t(
                      consoleCollapsed ? 'answerIde.expandConsole' : 'answerIde.collapseConsole',
                    )}
                    title={t(
                      consoleCollapsed ? 'answerIde.expandConsole' : 'answerIde.collapseConsole',
                    )}
                    aria-expanded={!consoleCollapsed}
                    onClick={() => setConsoleCollapsed((previous) => !previous)}
                  />
                ),
              }}
              items={[
                ...(actionMode === 'debug'
                  ? [
                      {
                        key: 'debugIO',
                        icon: <ConsoleSqlOutlined aria-hidden />,
                        label: t('answerIde.debug.programTerminal'),
                        children: (
                          <DebugConsole
                            debug={debug}
                            inspection={inspection}
                            kind="stdin"
                            input={debugInput}
                            setInput={setDebugInput}
                          />
                        ),
                      },
                      {
                        key: 'debugCommands',
                        icon: <CodeOutlined aria-hidden />,
                        label: t('answerIde.debug.commandTerminal'),
                        children: (
                          <DebugConsole
                            debug={debug}
                            inspection={inspection}
                            kind="commands"
                            input={debugInput}
                            setInput={setDebugInput}
                          />
                        ),
                      },
                    ]
                  : []),
                {
                  key: 'cases',
                  icon: <ExperimentOutlined aria-hidden />,
                  label: t('answerIde.cases'),
                  children: (
                    <div className="ide-console-content">
                      {samples.length > 0 && (
                        <Space wrap style={{ margin: '12px 0' }}>
                          <Button
                            disabled={run.busy}
                            onClick={() =>
                              setDraft((previous) => ({
                                ...previous,
                                cases: samples.map((sample, index) => ({
                                  key: `sample-${index}`,
                                  input: sample.input,
                                  expectedOutput: sample.output,
                                })),
                              }))
                            }
                          >
                            {t('answerIde.samples')}
                          </Button>
                        </Space>
                      )}
                      <CustomCaseList
                        cases={draft.cases}
                        onChange={(cases) => setDraft((previous) => ({ ...previous, cases }))}
                        open={draft.casesOpen}
                        onOpenChange={(casesOpen) =>
                          setDraft((previous) => ({ ...previous, casesOpen }))
                        }
                      />
                    </div>
                  ),
                },
                {
                  key: 'results',
                  icon: <PlayCircleOutlined aria-hidden />,
                  label: t('answerIde.results'),
                  children: (
                    <div className="ide-console-content">
                      {run.detail ? (
                        <RunResults detail={run.detail} />
                      ) : (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={t('answerIde.noResults')}
                        />
                      )}
                    </div>
                  ),
                },
                ...(props.submissionHistory
                  ? [
                      {
                        key: 'history',
                        icon: <HistoryOutlined aria-hidden />,
                        label: t('answerIde.history'),
                        children: (
                          <div className="ide-console-content ide-submission-history">
                            {props.submissionHistory}
                          </div>
                        ),
                      },
                    ]
                  : []),
                {
                  key: 'codeHistory',
                  icon: <HistoryOutlined aria-hidden />,
                  label: t('answerIde.codeHistory'),
                  children: cloud.history,
                },
              ].filter((item) =>
                actionMode === 'debug'
                  ? item.key.startsWith('debug')
                  : !item.key.startsWith('debug'),
              )}
            />
          }
        />
      </DebugLayout>
    </div>
  );
}

/** Account/context changes discard all in-memory scene handles before rendering. */
export default function ScopedAnswerWorkspace(props: Parameters<typeof AnswerWorkspace>[0]) {
  const key = JSON.stringify([props.username, props.scopeKey, props.problemCode, props.context]);
  return <AnswerWorkspace key={key} {...props} />;
}
