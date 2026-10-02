import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { CheckOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import AIWorkspaceNav from './AIWorkspaceNav';
import { operationKey } from './operation-key';
import AIAdminAccess, { AITagManagement } from './AIAdminAccess';
import {
  Account,
  aiPlatform,
  ProviderHealth,
  ProviderSettings,
  Review,
  StorageAudit,
  OrphanCleanupResult,
} from '../../../Utils/API/ai-platform';
import './ai-admin.css';

export default function AIAdmin() {
  const [account, setAccount] = useState<Account>();
  const [admin, setAdmin] = useState(false);
  const [settings, setSettings] = useState<ProviderSettings>();
  const [entries, setEntries] = useState<Awaited<ReturnType<typeof aiPlatform.ledger>>>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [runs, setRuns] = useState<Awaited<ReturnType<typeof aiPlatform.unsettled>>['rows']>([]);
  const [queue, setQueue] = useState<Awaited<ReturnType<typeof aiPlatform.queue>>>();
  const [storage, setStorage] = useState<StorageAudit>();
  const [cleanupPreview, setCleanupPreview] = useState<OrphanCleanupResult>();
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleanupReason, setCleanupReason] = useState('');
  const [cleanupBusy, setCleanupBusy] = useState(false);
  const [health, setHealth] = useState<ProviderHealth>();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review>();
  const [selectedRun, setSelectedRun] = useState<string>();
  const [providerForm] = Form.useForm();
  const [pointsForm] = Form.useForm();
  const [reviewForm] = Form.useForm();
  const [usageForm] = Form.useForm();

  async function refresh() {
    setError('');
    try {
      const current = await aiPlatform.account();
      setAccount(current);
      if (current.status === 'suspended') return;
      const caps = await aiPlatform.capabilities();
      setAdmin(caps.admin);
      setEntries(await aiPlatform.ledger());
      if (caps.admin) {
        const [config, list, usage, metrics, audit] = await Promise.all([
          aiPlatform.settings(),
          aiPlatform.reviews(),
          aiPlatform.unsettled(),
          aiPlatform.queue(),
          aiPlatform.storageAudit(),
        ]);
        setSettings(config);
        setReviews(list);
        setRuns(usage.rows);
        setQueue(metrics);
        setStorage(audit);
      }
    } finally {
      setInitialLoading(false);
    }
  }
  useEffect(() => {
    void refresh().catch((reason) => setError(String(reason)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function execute(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      setNotice(message);
      await refresh();
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }
  const accountView = (
    <>
      <Space wrap>
        <Typography.Text>OJ 用户 {account?.subject_id}</Typography.Text>
        <Tag>{account?.status}</Tag>
        {account?.balance !== undefined && (
          <Typography.Text>余额 {account.balance} 积分</Typography.Text>
        )}
      </Space>
      <Table
        rowKey="id"
        dataSource={entries}
        scroll={{ x: 640 }}
        columns={[
          { title: '变动积分', dataIndex: 'amount' },
          { title: '费用 USD', dataIndex: 'cost_usd' },
          { title: '原因', dataIndex: 'reason' },
          { title: '任务', dataIndex: 'task_id', ellipsis: true },
        ]}
      />
      {admin && (
        <Form
          form={pointsForm}
          layout="vertical"
          onFinish={(values) => {
            const key = pointsForm.getFieldValue('operation_key') || operationKey();
            pointsForm.setFieldValue('operation_key', key);
            void execute(async () => {
              await aiPlatform.adjust({ ...values, operation_key: key });
              pointsForm.resetFields();
            }, '积分调整已记录');
          }}
        >
          <Form.Item name="subject_id" label="OJ 用户 ID" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="amount" label="调整积分" rules={[{ required: true }]}>
            <InputNumber />
          </Form.Item>
          <Form.Item name="reason" label="调整原因" rules={[{ required: true }]}>
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="operation_key" hidden>
            <Input />
          </Form.Item>
          <Button htmlType="submit" type="primary" icon={<SaveOutlined />} loading={busy}>
            记录调整
          </Button>
        </Form>
      )}
    </>
  );
  const providerView = (
    <Form
      form={providerForm}
      layout="vertical"
      initialValues={settings}
      onFinish={(values) =>
        void execute(async () => {
          const model_overrides = Object.fromEntries(
            Object.entries(values.model_overrides || {}).filter(([, policy]) =>
              Boolean((policy as { model?: string }).model?.trim()),
            ),
          );
          const next = await aiPlatform.saveSettings({
            ...settings,
            ...values,
            model_overrides,
          } as ProviderSettings);
          setSettings(next);
          providerForm.setFieldValue('api_key', '');
        }, '模型设置已保存')
      }
    >
      <Form.Item name="provider" label="提供者协议" rules={[{ required: true }]}>
        <Select
          options={[
            { value: 'codex', label: 'Codex Responses' },
            { value: 'chat_completions', label: 'Chat Completions' },
          ]}
        />
      </Form.Item>
      <Form.Item name="base_url" label="API 地址" rules={[{ required: true }, { type: 'url' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="model" label="模型" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="reasoning_effort" label="思考强度">
        <Select
          options={['none', 'minimal', 'low', 'medium', 'high', 'xhigh'].map((value) => ({
            value,
            label: value,
          }))}
        />
      </Form.Item>
      <Form.Item name="api_key" label={settings?.has_api_key ? 'API Key（已配置）' : 'API Key'}>
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      {(['input', 'cached', 'output'] as const).map((name, i) => (
        <Form.Item
          key={name}
          name={name + '_usd_per_million'}
          label={['输入', '缓存输入', '输出'][i] + '价格 USD / 百万 token'}
          rules={[{ required: true }]}
        >
          <InputNumber min={0} />
        </Form.Item>
      ))}
      <Form.Item name="max_task_cost_usd" label="任务费用限额 USD">
        <InputNumber min={0.001} max={100} />
      </Form.Item>
      <Form.Item name="max_concurrency" label="全局并发">
        <InputNumber min={1} max={64} />
      </Form.Item>
      <Form.Item name="per_user_concurrency" label="个人并发">
        <InputNumber min={1} max={8} />
      </Form.Item>
      <Form.Item name="max_storage_mb" label="个人上传配额 MiB">
        <InputNumber min={1} max={102400} />
      </Form.Item>
      <Form.Item name="monthly_user_budget_usd" label="个人月度预算 USD（0 为不限制）">
        <InputNumber min={0} max={100000} />
      </Form.Item>
      <Form.Item name="monthly_course_budget_usd" label="课程月度预算 USD（0 为不限制）">
        <InputNumber min={0} max={100000} />
      </Form.Item>
      <Form.Item name="max_output_tokens" label="单次最大输出 token">
        <InputNumber min={128} max={65536} />
      </Form.Item>
      <Form.Item name="max_prompt_bytes" label="最大输入字节">
        <InputNumber min={1024} max={2000000} />
      </Form.Item>
      {['moderation', 'grading', 'authoring', 'tutor'].map((purpose) => (
        <React.Fragment key={purpose}>
          <Typography.Title level={5}>
            {
              (
                {
                  moderation: '审核模型',
                  grading: '评分模型',
                  authoring: '命题模型',
                  tutor: '助教模型',
                } as Record<string, string>
              )[purpose]
            }
          </Typography.Title>
          <Form.Item name={['model_overrides', purpose, 'model']} label="模型覆盖">
            <Input />
          </Form.Item>
          <Form.Item
            name={['model_overrides', purpose, 'reasoning_effort']}
            label="思考强度"
            initialValue="medium"
          >
            <Select
              options={['none', 'minimal', 'low', 'medium', 'high', 'xhigh'].map((value) => ({
                value,
                label: value,
              }))}
            />
          </Form.Item>
          {['input', 'cached', 'output'].map((rate, index) => (
            <Form.Item
              key={rate}
              name={['model_overrides', purpose, rate + '_usd_per_million']}
              label={['输入', '缓存', '输出'][index] + '费率'}
            >
              <InputNumber min={0} />
            </Form.Item>
          ))}
        </React.Fragment>
      ))}
      <Space>
        <Button htmlType="submit" type="primary" icon={<SaveOutlined />} loading={busy}>
          保存
        </Button>
        <Button
          icon={<CheckOutlined />}
          loading={busy}
          onClick={() =>
            void execute(async () => {
              const result = await aiPlatform.health();
              setHealth(result);
              if (!result.ready) throw new Error(result.reason || '提供者未就绪');
            }, '提供者连接正常')
          }
        >
          检查连接
        </Button>
        {health && (
          <Tag color={health.ready ? 'green' : 'red'}>
            {health.ready ? '提供者就绪' : `未就绪：${health.reason || '连接失败'}`}
          </Tag>
        )}
      </Space>
    </Form>
  );
  return (
    <main className="ai-workspace">
      <div className="ai-workspace-body">
        <AIWorkspaceNav />
        <div className="ai-workspace-heading">
          <Typography.Title level={3}>账户与管理</Typography.Title>
          <Button
            aria-label="刷新"
            icon={<ReloadOutlined />}
            onClick={() => void execute(refresh, '')}
            loading={busy}
          />
        </div>
        {error && (
          <Alert type="error" message={error} showIcon closable onClose={() => setError('')} />
        )}
        {notice && <Alert type="success" message={notice} showIcon />}
        {initialLoading ? (
          <div className="ai-admin-loading">
            <Spin />
          </div>
        ) : account?.status === 'suspended' ? (
          <Alert type="warning" message="AI 使用资格已暂停" description={account.reason} />
        ) : (
          <Tabs
            items={[
              { key: 'account', label: '账户', children: accountView },
              ...(admin
                ? [
                    { key: 'provider', label: '模型', children: providerView, forceRender: true },
                    { key: 'access', label: '使用资格', children: <AIAdminAccess /> },
                    { key: 'tags', label: '标签治理', children: <AITagManagement /> },
                    {
                      key: 'reviews',
                      label: '内容复核',
                      children: (
                        <Table
                          rowKey="id"
                          locale={{
                            emptyText: (
                              <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="暂无复核记录"
                              />
                            ),
                          }}
                          dataSource={reviews}
                          scroll={{ x: 600 }}
                          columns={[
                            { title: '用户', dataIndex: 'subject_id' },
                            { title: '结论', dataIndex: 'decision' },
                            { title: '原因', dataIndex: 'reason', ellipsis: true },
                            {
                              title: 'AI 状态',
                              render: (_, row: Review) => (
                                <Tag color={row.account_status === 'suspended' ? 'red' : 'green'}>
                                  {row.account_status === 'suspended' ? '已停用' : '可用'}
                                </Tag>
                              ),
                            },
                            {
                              title: '操作',
                              render: (_, row: Review) => (
                                <Button
                                  disabled={row.subject_id === account?.subject_id}
                                  onClick={() => {
                                    setSelectedReview(row);
                                    reviewForm.setFieldsValue(row);
                                  }}
                                >
                                  复核
                                </Button>
                              ),
                            },
                          ]}
                        />
                      ),
                    },
                    {
                      key: 'usage',
                      label: '待对账',
                      children: (
                        <Table
                          rowKey="id"
                          locale={{
                            emptyText: (
                              <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="暂无未知用量"
                              />
                            ),
                          }}
                          dataSource={runs}
                          scroll={{ x: 600 }}
                          columns={[
                            { title: '调用', dataIndex: 'id', ellipsis: true },
                            { title: '模型', dataIndex: 'model' },
                            { title: '任务', dataIndex: 'task_id', ellipsis: true },
                            {
                              title: '用量',
                              render: (_, row) =>
                                `${row.usage?.input_tokens ?? '?'} / ${row.usage?.cached_input_tokens ?? '?'} / ${row.usage?.output_tokens ?? '?'}`,
                            },
                            {
                              title: '操作',
                              render: (_, row: { id: string }) => (
                                <Button
                                  onClick={() => {
                                    setSelectedRun(row.id);
                                    usageForm.resetFields();
                                  }}
                                >
                                  对账
                                </Button>
                              ),
                            },
                          ]}
                        />
                      ),
                    },
                    {
                      key: 'operations',
                      label: '队列与存储',
                      children: (
                        <div className="ai-admin-operations">
                          <Descriptions
                            bordered
                            size="small"
                            column={{ xs: 1, sm: 2, md: 3 }}
                            title="任务队列"
                          >
                            {Object.entries(queue?.counts || {}).map(([status, count]) => (
                              <Descriptions.Item key={status} label={status}>
                                {count}
                              </Descriptions.Item>
                            ))}
                            <Descriptions.Item label="累计费用 USD">
                              {queue?.cost_usd || '0'}
                            </Descriptions.Item>
                          </Descriptions>
                          <Descriptions
                            bordered
                            size="small"
                            column={{ xs: 1, sm: 2, md: 3 }}
                            title="文件一致性审计"
                          >
                            <Descriptions.Item label="扫描时间">
                              {storage?.scanned_at || '未扫描'}
                            </Descriptions.Item>
                            <Descriptions.Item label="孤儿文件">
                              {storage?.orphan_file_count ?? 0}（可清理{' '}
                              {storage?.eligible_orphan_file_count ?? 0}）
                            </Descriptions.Item>
                            <Descriptions.Item label="孤儿大小">
                              {storage?.orphan_bytes ?? 0} bytes
                            </Descriptions.Item>
                            <Descriptions.Item label="缺失文件">
                              {storage?.missing_file_count ?? 0}
                            </Descriptions.Item>
                            <Descriptions.Item label="元数据不一致">
                              {storage?.metadata_mismatch_count ?? 0}
                            </Descriptions.Item>
                            <Descriptions.Item label="非法路径">
                              {storage?.invalid_database_path_count ?? 0}
                            </Descriptions.Item>
                          </Descriptions>
                          {storage?.results_truncated && (
                            <Alert
                              type="warning"
                              showIcon
                              message="审计结果已截断"
                              description="仅展示有限条目，请分批处理。"
                            />
                          )}
                          <Space wrap>
                            <Button
                              onClick={() =>
                                void execute(
                                  async () => setStorage(await aiPlatform.storageAudit()),
                                  '存储审计已刷新',
                                )
                              }
                              loading={busy}
                            >
                              刷新审计
                            </Button>
                            <Button
                              onClick={() =>
                                void execute(
                                  async () =>
                                    setCleanupPreview(
                                      await aiPlatform.cleanupOrphans({ apply: false }),
                                    ),
                                  '已生成清理预览',
                                )
                              }
                              loading={busy}
                            >
                              生成 dry-run 预览
                            </Button>
                            <Button
                              danger
                              disabled={!cleanupPreview?.planned_file_count}
                              onClick={() => {
                                setCleanupReason('');
                                setCleanupOpen(true);
                              }}
                            >
                              执行计划清理
                            </Button>
                          </Space>
                          {cleanupPreview && (
                            <Alert
                              type="info"
                              showIcon
                              message={`dry-run：${cleanupPreview.planned_file_count} 个文件，${cleanupPreview.planned_bytes} bytes`}
                              description={
                                cleanupPreview.planned_files.map((item) => item.path).join('、') ||
                                '没有符合条件的孤儿文件'
                              }
                            />
                          )}
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        )}
        <Modal
          title="内容复核"
          forceRender
          open={!!selectedReview}
          onCancel={() => setSelectedReview(undefined)}
          onOk={() => reviewForm.submit()}
          confirmLoading={busy}
        >
          <Form
            form={reviewForm}
            layout="vertical"
            onFinish={(values) =>
              void execute(async () => {
                if (!selectedReview) return;
                await aiPlatform.review(selectedReview.id, values.decision, values.reason);
                setSelectedReview(undefined);
              }, '复核已记录')
            }
          >
            <Form.Item name="decision" label="结论" rules={[{ required: true }]}>
              <Select
                options={['normal', 'warning', 'violation'].map((value) => ({
                  value,
                  label: value,
                }))}
              />
            </Form.Item>
            <Form.Item name="reason" label="依据" rules={[{ required: true }]}>
              <Input.TextArea />
            </Form.Item>
          </Form>
        </Modal>
        <Modal
          title="供应商用量对账"
          forceRender
          open={!!selectedRun}
          onCancel={() => setSelectedRun(undefined)}
          onOk={() => usageForm.submit()}
          confirmLoading={busy}
        >
          <Form
            form={usageForm}
            layout="vertical"
            onFinish={(values) =>
              void execute(async () => {
                if (!selectedRun) return;
                await aiPlatform.reconcile(selectedRun, values);
                setSelectedRun(undefined);
              }, '对账已记录')
            }
          >
            {['input_tokens', 'cached_input_tokens', 'output_tokens'].map((name, index) => (
              <Form.Item
                key={name}
                name={name}
                label={['输入 token', '缓存输入 token', '输出 token'][index]}
                rules={[{ required: true }]}
              >
                <InputNumber min={0} precision={0} />
              </Form.Item>
            ))}
            <Form.Item name="reason" label="账单依据" rules={[{ required: true }]}>
              <Input.TextArea />
            </Form.Item>
          </Form>
        </Modal>
        <Modal
          title="执行有界孤儿清理"
          open={cleanupOpen}
          onCancel={() => setCleanupOpen(false)}
          okText="确认删除"
          okButtonProps={{ danger: true, disabled: !cleanupReason.trim() }}
          confirmLoading={cleanupBusy}
          onOk={() => {
            if (!cleanupPreview || !cleanupReason.trim()) return;
            setCleanupBusy(true);
            void aiPlatform
              .cleanupOrphans({
                apply: true,
                reason: cleanupReason,
                max_files: cleanupPreview.planned_file_count,
                max_bytes: cleanupPreview.planned_bytes,
              })
              .then((result) => {
                setCleanupPreview(result);
                setCleanupOpen(false);
                setNotice('孤儿文件清理已执行');
                return aiPlatform.storageAudit();
              })
              .then(setStorage)
              .catch((reason) => setError(String(reason)))
              .finally(() => setCleanupBusy(false));
          }}
        >
          <Alert
            type="warning"
            showIcon
            message="该操作会删除磁盘上的未登记文件"
            description="仅删除满足年龄阈值且 inode/大小未变化的文件。"
          />
          <Input.TextArea
            rows={3}
            value={cleanupReason}
            onChange={(event) => setCleanupReason(event.target.value)}
            placeholder="请输入本次清理原因"
          />
        </Modal>
      </div>
    </main>
  );
}
