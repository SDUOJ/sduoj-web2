import { ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Empty, Select, Space, Tabs, message } from 'antd';
import {
  PlayCircleOutlined,
  SendOutlined,
  StopOutlined,
  ExperimentOutlined,
  HistoryOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import cApi from '../../Utils/API/c-api';
import { JudgeTemplateAllType, TestCase } from '../../Type/IProblem';
import CustomCaseList, { CustomCaseItem } from './CustomCaseList';
import AnswerEditor from './AnswerEditor';
import RunResults from './RunResults';
import { useRunTask } from './useRunTask';
import SplitPane from './SplitPane';
import { IdeContext } from './runTypes';
import { useCloudCode } from './useCloudCode';
import { SyncJudging } from '../submission/SyncJudging';
import { ideCapabilities } from './capabilities';

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
export default function AnswerWorkspace(props: {
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
  const { cloudCode: cloudEnabled, run: runEnabled } = ideCapabilities();
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
    if (!runEnabled) return props.submissionHistory ? 'history' : 'codeHistory';
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
  const run = useRunTask(identity, context, runEnabled);
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
  const cloud = useCloudCode({
    enabled: cloudEnabled,
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
    if (run.blocked || !code.trim() || !draft.cases.length || !templateId) return;
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
  }, [props.problemCode, props.scopeKey, run, code, templateId, context]);
  return (
    <div
      className="ide-workspace"
      onKeyDownCapture={(event) => {
        if (!(event.ctrlKey || event.metaKey) || event.altKey || event.nativeEvent.isComposing)
          return;
        if (event.key !== 'Enter' && event.key.toLowerCase() !== 's') return;
        event.preventDefault();
        event.stopPropagation();
        if (event.repeat) return;
        if (event.key === 'Enter') start();
        else if (cloudEnabled) void cloud.save();
        else {
          try {
            localStorage.setItem(storageKey, JSON.stringify(latestDraft.current));
            setSavingError(false);
          } catch {
            setSavingError(true);
          }
        }
      }}
    >
      <div className="ide-workspace-toolbar">
        <div className="ide-language-bar">
          <Select
            aria-label={t('answerIde.language')}
            value={templateId}
            onChange={(value) => setDraft((previous) => ({ ...previous, templateId: value }))}
            options={templates.map((item) => ({ value: String(item.id), label: item.title }))}
            style={{ minWidth: 150, maxWidth: '100%' }}
          />
        </div>
        <Space wrap className="ide-actions">
          {runEnabled && (
            <Button
              icon={<PlayCircleOutlined aria-hidden />}
              loading={run.busy}
              disabled={run.blocked || !code.trim() || !draft.cases.length || !templateId}
              onClick={start}
            >
              {run.recovering
                ? t('answerIde.restoringRun')
                : run.cooldown > 0
                  ? t('answerIde.runCooldown', { count: run.cooldown })
                  : t('answerIde.run')}
            </Button>
          )}
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
        {cloud.controls}
        {!cloudEnabled && <span>{t('answerIde.saved')}</span>}
        <span className="ide-shortcuts">
          {t(runEnabled ? 'answerIde.shortcuts' : 'answerIde.saveShortcut')}
        </span>
      </div>
      {savingError && <Alert type="warning" message={t('answerIde.saveFailed')} />}
      {run.error && <Alert type="warning" message={run.error} />}
      <SyncJudging
        queryList={watchList}
        open={Boolean(run.busy && run.id)}
        dataHandle={(frame) => {
          if (frame[2] === 3) run.refresh();
        }}
      />
      <SplitPane
        secondHidden={!runEnabled && !cloudEnabled && !props.submissionHistory}
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
          <div className="ide-editor-panel">
            <AnswerEditor
              fill
              language={language(template)}
              value={code}
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
            activeKey={consoleTab}
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
            ].filter(
              ({ key }) =>
                (runEnabled || !['cases', 'results'].includes(key)) &&
                (cloudEnabled || key !== 'codeHistory'),
            )}
          />
        }
      />
    </div>
  );
}
