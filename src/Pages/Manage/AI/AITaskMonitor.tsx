import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Empty, Popconfirm, Space, Spin, Table, Tag, Typography } from 'antd';
import { ReloadOutlined, StopOutlined } from '@ant-design/icons';
import { aiPlatform, PlatformJob } from '../../../Utils/API/ai-platform';
import { service } from '../../../Utils/API/request';
import { operationKey } from './operation-key';
import './ai-task-monitor.css';

const terminal = new Set(['success', 'failed', 'cancelled']);
const labels: Record<string, string> = {
  pending: '排队中',
  blocked: '等待额度或对账',
  running: '执行中',
  success: '生成完成',
  failed: '失败',
  cancelled: '已取消',
};
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
              setError('任务事件无法解析');
            }
          };
          source.addEventListener('revoked', () => {
            finished = true;
            source?.close();
            setError('任务访问权限已失效');
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
  if (!taskId) return <Empty description="尚未选择任务" />;
  return (
    <section className="ai-task-monitor" aria-label="任务状态" aria-live="polite">
      <div className="ai-task-monitor-heading">
        <div>
          <Typography.Title level={5}>任务详情</Typography.Title>
          <Typography.Text type="secondary" copyable={{ text: taskId }}>
            {taskId}
          </Typography.Text>
        </div>
        <Button
          aria-label="刷新任务"
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
            尝试 {job?.attempt || 0}
            {job?.max_attempts ? ` / ${job.max_attempts}` : ''}
          </Typography.Text>
          {job && !terminal.has(job.status) && (
            <Tag color={stream === 'live' ? 'green' : 'default'}>
              {stream === 'live' ? '事件流已连接' : '定时同步'}
            </Tag>
          )}
          {job && !terminal.has(job.status) && (
            <Popconfirm
              title="确认取消该任务？"
              description="任务将在安全检查点停止。"
              okText="取消任务"
              cancelText="继续执行"
              onConfirm={() => void action(false)}
            >
              <Button danger icon={<StopOutlined />} loading={busy}>
                取消任务
              </Button>
            </Popconfirm>
          )}
          {job && ['failed', 'cancelled'].includes(job.status) && (
            <Button icon={<ReloadOutlined />} loading={busy} onClick={() => void action(true)}>
              重试
            </Button>
          )}
        </Space>
      )}
      {job?.status === 'blocked' && (
        <Alert
          type="warning"
          showIcon
          message="任务暂未执行"
          description="请检查账户余额或联系管理员完成未知用量对账。"
        />
      )}
      {job?.review_required && (
        <Alert
          type="info"
          showIcon
          message="结果待人工复核"
          description="AI 结果不会自动成为最终成绩或正式内容。"
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
            { title: '模型', dataIndex: 'model' },
            {
              title: '费用 USD',
              render: (_, row) => (row.status === 'unsettled' ? '未知，待对账' : row.cost_usd),
            },
            { title: '结算状态', dataIndex: 'status' },
          ]}
        />
      )}
      <div className="ai-task-events" aria-label="任务事件">
        <Typography.Title level={5}>执行事件</Typography.Title>
        {!events.length && (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无执行事件" />
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
