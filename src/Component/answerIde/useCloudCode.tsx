import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Empty, List, Modal, Space, Tag } from 'antd';
import { CheckCircleOutlined, CloudUploadOutlined, HistoryOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import cApi from '../../Utils/API/c-api';
import { CodeSnapshot, IdeContext } from './runTypes';
import { JudgeTemplateAllType } from '../../Type/IProblem';

export function useCloudCode(options: {
  identity: string;
  context: IdeContext;
  username: string;
  templateId: string;
  code: string;
  templates: JudgeTemplateAllType[];
  initialize: (language: string, code: string) => void;
  restore: (language: string, code: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const latest = useRef(options);
  latest.current = options;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [saved, setSaved] = useState<Record<string, CodeSnapshot | null>>({});
  const loaded = useRef(new Set<string>());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const [error, setError] = useState<string>();
  const [version, setVersion] = useState(0);
  const [history, setHistory] = useState<CodeSnapshot[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const historyEpoch = useRef(0);
  const [pending, setPending] = useState<CodeSnapshot>();
  const [cooldownUntil, setCooldownUntil] = useState(() => {
    try {
      return Number(localStorage.getItem(`answerIde:saveCooldown:${options.username}`)) || 0;
    } catch {
      return 0;
    }
  });
  const [now, setNow] = useState(Date.now());
  const cooldown = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  const currentSaved = saved[options.templateId];
  const empty = !options.code.trim();
  const dirty = options.code !== (currentSaved?.code ?? '');
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [cooldownUntil]);

  useEffect(() => {
    const language = options.templateId;
    if (!language || loaded.current.has(language)) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    void cApi
      .getIdeHistory({ context: options.context, judgeTemplateId: language })
      .then(async (rows) => (rows.length ? cApi.getIdeCode(rows[0].submissionId) : null))
      .then((snapshot) => {
        if (!active) return;
        loaded.current.add(language);
        setSaved((previous) => ({ ...previous, [language]: snapshot }));
        setError(undefined);
        if (snapshot?.code !== undefined) latest.current.initialize(language, snapshot.code);
      })
      .catch(() => {
        if (active) setError(t('answerIde.cloudLoadError'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [options.templateId, options.identity, options.context, t]);

  const save = async (): Promise<boolean> => {
    if (inFlight.current || cooldownUntil > Date.now() || loading) return false;
    const source = latest.current;
    if (!source.code.trim()) return false;
    if (!dirtyRef.current) return true;
    inFlight.current = true;
    setSaving(true);
    setError(undefined);
    try {
      const snapshot = await cApi.saveIdeCode({
        context: source.context,
        judgeTemplateId: source.templateId,
        code: source.code,
      });
      if (!mounted.current) return false;
      setSaved((previous) => ({
        ...previous,
        [source.templateId]: { ...snapshot, code: source.code },
      }));
      loaded.current.add(source.templateId);
      const until = Date.now() + 30000;
      setNow(Date.now());
      setCooldownUntil(until);
      try {
        localStorage.setItem(`answerIde:saveCooldown:${source.username}`, String(until));
      } catch {
        /* Optional. */
      }
      setVersion((value) => value + 1);
      return latest.current.templateId === source.templateId && latest.current.code === source.code;
    } catch {
      if (mounted.current) setError(t('answerIde.cloudSaveError'));
      return false;
    } finally {
      inFlight.current = false;
      if (mounted.current) setSaving(false);
    }
  };
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const timer = setInterval(
      () => {
        void saveRef.current();
      },
      5 * 60 * 1000,
    );
    return () => clearInterval(timer);
  }, [options.identity]);

  useEffect(() => {
    const epoch = ++historyEpoch.current;
    setHistory([]);
    setHasMore(false);
    if (!options.templateId) {
      setHistoryLoading(false);
      return;
    }
    setHistoryLoading(true);
    void cApi
      .getIdeHistory({ context: options.context, judgeTemplateId: options.templateId })
      .then((rows) => {
        if (epoch !== historyEpoch.current || !mounted.current) return;
        setHistory(rows);
        setHasMore(rows.length === 20);
      })
      .catch(() => {
        if (epoch === historyEpoch.current && mounted.current)
          setError(t('answerIde.cloudLoadError'));
      })
      .finally(() => {
        if (epoch === historyEpoch.current && mounted.current) setHistoryLoading(false);
      });
    return () => {
      historyEpoch.current = epoch + 1;
    };
  }, [options.templateId, version, options.identity, options.context, t]);
  const date = (time: number) => new Date(time).toLocaleString(i18n.language, { hour12: false });
  const load = (snapshot: CodeSnapshot) => {
    loaded.current.add(snapshot.judgeTemplateId);
    setSaved((previous) => ({ ...previous, [snapshot.judgeTemplateId]: snapshot }));
    latest.current.restore(snapshot.judgeTemplateId, snapshot.code ?? '');
  };
  const choose = async (snapshot: CodeSnapshot) => {
    try {
      const full = await cApi.getIdeCode(snapshot.submissionId);
      if (!mounted.current) return;
      if (dirtyRef.current) setPending(full);
      else load(full);
    } catch {
      setError(t('answerIde.cloudLoadError'));
    }
  };
  return {
    save,
    controls: (
      <div className="ide-cloud-bar">
        <Tag color={dirty ? 'orange' : currentSaved ? 'green' : undefined}>
          {!dirty && currentSaved && <CheckCircleOutlined aria-hidden />}
          {saving
            ? t('answerIde.cloudSaving')
            : loading
              ? t('answerIde.cloudLoading')
              : dirty
                ? t('answerIde.cloudUnsaved')
                : currentSaved
                  ? t('answerIde.cloudSaved')
                  : t('answerIde.cloudNeverSaved')}
        </Tag>
        <span className="ide-save-time">
          {currentSaved
            ? t('answerIde.lastSaved', { time: date(currentSaved.savedAt) })
            : t('answerIde.autoSaveHint')}
        </span>
        <Button
          size="small"
          icon={<CloudUploadOutlined aria-hidden />}
          loading={saving}
          disabled={saving || loading || empty || !dirty || cooldown > 0}
          title={empty ? t('answerIde.emptyCodeNotSaved') : undefined}
          onClick={() => void save()}
        >
          {cooldown > 0
            ? t('answerIde.saveCooldown', { count: cooldown })
            : t('answerIde.saveCloud')}
        </Button>
        {error && <Alert type="warning" showIcon message={error} />}
      </div>
    ),
    history: (
      <div className="ide-console-content">
        <Space wrap style={{ marginBlock: 12 }}>
          <HistoryOutlined aria-hidden />
          <span>
            {options.templates.find((item) => String(item.id) === options.templateId)?.title}
          </span>
          <Button size="small" onClick={() => setVersion((value) => value + 1)}>
            {t('answerIde.refreshHistory')}
          </Button>
        </Space>
        <List
          loading={historyLoading}
          dataSource={history}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('answerIde.noCodeHistory')}
              />
            ),
          }}
          renderItem={(snapshot) => (
            <List.Item
              key={snapshot.submissionId}
              actions={[
                <Button key="load" size="small" onClick={() => void choose(snapshot)}>
                  {t('answerIde.loadCode')}
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={t('answerIde.codeSize', {
                  lines: snapshot.lineCount ?? snapshot.code?.split(/\r\n|\r|\n/).length ?? '—',
                  characters: snapshot.codeLength,
                })}
                description={date(snapshot.savedAt)}
              />
            </List.Item>
          )}
        />
        {hasMore && (
          <Button
            loading={historyLoading}
            onClick={() => {
              const epoch = historyEpoch.current;
              setHistoryLoading(true);
              void cApi
                .getIdeHistory({
                  context: options.context,
                  judgeTemplateId: options.templateId,
                  beforeId: history[history.length - 1]?.submissionId,
                })
                .then((rows) => {
                  if (epoch !== historyEpoch.current || !mounted.current) return;
                  setHistory((previous) => [...previous, ...rows]);
                  setHasMore(rows.length === 20);
                })
                .catch(() => {
                  if (epoch === historyEpoch.current && mounted.current)
                    setError(t('answerIde.cloudLoadError'));
                })
                .finally(() => {
                  if (epoch === historyEpoch.current && mounted.current) setHistoryLoading(false);
                });
            }}
          >
            {t('answerIde.moreHistory')}
          </Button>
        )}
        <Modal
          open={Boolean(pending)}
          title={t('answerIde.unsavedTitle')}
          onCancel={() => setPending(undefined)}
          footer={
            <Space wrap>
              <Button onClick={() => setPending(undefined)}>{t('answerIde.keepEditing')}</Button>
              <Button
                disabled={saving}
                onClick={() => {
                  if (pending) load(pending);
                  setPending(undefined);
                }}
              >
                {t('answerIde.discardAndLoad')}
              </Button>
              <Button
                type="primary"
                loading={saving}
                disabled={saving || cooldown > 0 || loading || empty}
                title={empty ? t('answerIde.emptyCodeNotSaved') : undefined}
                onClick={async () => {
                  if (pending && (await save())) {
                    load(pending);
                    setPending(undefined);
                  }
                }}
              >
                {t('answerIde.saveAndLoad')}
              </Button>
            </Space>
          }
        >
          {t('answerIde.unsavedPrompt')}
        </Modal>
      </div>
    ),
  };
}
