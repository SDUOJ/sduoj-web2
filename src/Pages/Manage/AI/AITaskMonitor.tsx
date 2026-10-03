import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Empty, Popconfirm, Space, Spin, Table, Tag, Typography } from 'antd';
import { ReloadOutlined, StopOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { aiPlatform, PlatformJob } from '../../../Utils/API/ai-platform';
import { service } from '../../../Utils/API/request';
import { operationKey } from './operation-key';
import './ai-task-monitor.css';

const terminal = new Set(['success', 'failed', 'cancelled']);
const colors: Record<string, string> = {
  pending: 'processing',
  blocked: 'warning',
  running: 'blue',
  success: 'success',
  failed: 'error',
  cancelled: 'default',
};
export default function AITaskMonitor({
  taskId,
  onComplete,
}: {
  taskId?: string;
  onComplete?: (job: PlatformJob) => void;
}) {
  const { t } = useTranslation();
  const labels: Record<string, string> = {
    pending: t('aiTaskStatusPending'),
    blocked: t('aiTaskStatusBlocked'),
    running: t('aiTaskStatusRunning'),
    success: t('aiTaskStatusSuccess'),
    failed: t('aiTaskStatusFailed'),
    cancelled: t('aiTaskStatusCancelled'),
  };
  const [job, setJob] = useState<PlatformJob>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stream, setStream] = useState<'live' | 'polling' | 'closed'>('closed');
  const [reloadKey, setReloadKey] = useState(0);
  const [events, setEvents] = useState<NonNullable<PlatformJob['events']>>([]);
  const completion = useRef(onComplete);
  completion.current = onComplete;
  useEffect(() => {
    if (!taskId) return;
    let active = true,
      refreshing = false,
      finished = false;
    let cursor = 0;
    let source: EventSource | undefined;
    setJob(undefined);
    setEvents([]);
    setError('');
    setLoading(true);
    setStream('polling');
    const merge = (incoming: NonNullable<PlatformJob['events']>) =>
      setEvents((previous) => {
        incoming.forEach((event) => {
          cursor = Math.max(cursor, event.id);
        });
        const byId = new Map(previous.map((event) => [event.id, event]));
        incoming.forEach((event) => byId.set(event.id, event));
        return Array.from(byId.values())
          .sort((a, b) => a.id - b.id)
          .slice(-300);
      });
    async function refresh() {
      if (refreshing || finished) return;
      refreshing = true;
      try {
        const current = await aiPlatform.job(taskId!, cursor);
        if (!active) return;
        setJob(current);
        merge(current.events || []);
        cursor = Math.max(cursor, current.next_cursor || 0);
        if (terminal.has(current.status)) {
          finished = true;
          source?.close();
          completion.current?.(current);
        } else if (!source && typeof EventSource !== 'undefined') {
          const cursor = current.events?.[current.events.length - 1]?.id || 0;
          source = new EventSource(
            `${service.defaults.baseURL}/ps/auto-task/ai/jobs/${encodeURIComponent(taskId!)}/events?after=${cursor}`,
            { withCredentials: true },
          );
          source.onopen = () => active && setStream('live');
          source.onmessage = (event) => {
            if (!active) return;
            try {
              merge([JSON.parse(event.data)]);
            } catch {
              setError(t('aiTaskEventParseError'));
            }
          };
          source.addEventListener('revoked', () => {
            finished = true;
            source?.close();
            setError(t('aiTaskAccessRevoked'));
          });
          source.onerror = () => {
            source?.close();
            if (active && !finished) setStream('polling');
          };
        }
      } catch (reason) {
        if (active) setError(String(reason));
      } finally {
        refreshing = false;
        if (active) setLoading(false);
      }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 3000);
    return () => {
      active = false;
      source?.close();
      window.clearInterval(timer);
    };
  }, [reloadKey, taskId]);
  async function action(retry: boolean) {
    if (!job) return;
    setBusy(true);
    setError('');
    try {
      if (retry) {
        const created = await aiPlatform.retry(job.id, 'retry:' + operationKey());
        completion.current?.({ ...job, id: created.taskId, status: 'pending' });
      } else {
        await aiPlatform.cancel(job.id);
        const updated = await aiPlatform.job(job.id);
        setJob(updated);
      }
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }
  if (!taskId) return <Empty description={t('aiTaskMonitorEmpty')} />;
  return (
    <section
      className="ai-task-monitor"
      aria-label={t('aiTaskMonitorAriaLabel')}
      aria-live="polite"
    >
      <div className="ai-task-monitor-heading">
        <div>
          <Typography.Title level={5}>{t('aiTaskDetails')}</Typography.Title>
          <Typography.Text type="secondary" copyable={{ text: taskId }}>
            {taskId}
          </Typography.Text>
        </div>
        <Button
          aria-label={t('aiTaskRefresh')}
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={() => setReloadKey((key) => key + 1)}
        />
      </div>
      {error && <Alert message={error} type="error" showIcon />}
      {loading && !job ? (
        <div className="ai-task-monitor-loading">
          <Spin />
        </div>
      ) : (
        <Space wrap>
          <Tag color={colors[job?.status || 'pending']}>
            {labels[job?.status || 'pending'] || job?.status}
          </Tag>
          <Typography.Text type="secondary">
            {t('aiTaskAttempts', {
              attempt: job?.attempt || 0,
              max: job?.max_attempts ? ` / ${job.max_attempts}` : '',
            })}
          </Typography.Text>
          {job && !terminal.has(job.status) && (
            <Tag color={stream === 'live' ? 'green' : 'default'}>
              {stream === 'live' ? t('aiTaskStreamLive') : t('aiTaskStreamPolling')}
            </Tag>
          )}
          {job && !terminal.has(job.status) && (
            <Popconfirm
              title={t('aiTaskCancelConfirm')}
              description={t('aiTaskCancelDescription')}
              okText={t('aiTaskCancel')}
              cancelText={t('aiTaskContinue')}
              onConfirm={() => void action(false)}
            >
              <Button danger icon={<StopOutlined />} loading={busy}>
                {t('aiTaskCancel')}
              </Button>
            </Popconfirm>
          )}
          {job && ['failed', 'cancelled'].includes(job.status) && (
            <Button icon={<ReloadOutlined />} loading={busy} onClick={() => void action(true)}>
              {t('aiTaskRetry')}
            </Button>
          )}
        </Space>
      )}
      {job?.status === 'blocked' && (
        <Alert
          type="warning"
          showIcon
          message={t('aiTaskBlockedMessage')}
          description={t('aiTaskBlockedDescription')}
        />
      )}
      {job?.review_required && (
        <Alert
          type="info"
          showIcon
          message={t('aiTaskReviewMessage')}
          description={t('aiTaskReviewDescription')}
        />
      )}
      {job?.error && <Alert type="warning" message={job.error} />}
      {!!job?.ai_runs?.length && (
        <Table
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={job.ai_runs}
          columns={[
            { title: t('aiTaskRunModel'), dataIndex: 'model' },
            {
              title: t('aiTaskRunCost'),
              render: (_, row) =>
                row.status === 'unsettled' ? t('aiTaskUnsettledUsage') : row.cost_usd,
            },
            { title: t('aiTaskRunStatus'), dataIndex: 'status' },
          ]}
        />
      )}
      <div className="ai-task-events" aria-label={t('aiTaskEventsAriaLabel')}>
        <Typography.Title level={5}>{t('aiTaskEventsTitle')}</Typography.Title>
        {!events.length && (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('aiTaskEventsEmpty')} />
        )}
        {events.map((event) => (
          <div className="ai-task-event" key={event.id}>
            <Tag>{event.tag}</Tag>
            {typeof event.content === 'string' ? event.content : JSON.stringify(event.content)}
          </div>
        ))}
      </div>
    </section>
  );
}
