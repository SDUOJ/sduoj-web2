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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
  const priceLabels = [t('aiAdminInput'), t('aiAdminCachedInput'), t('aiAdminOutput')];
  const purposeLabels: Record<string, string> = {
    moderation: t('aiAdminModerationModel'),
    grading: t('aiAdminGradingModel'),
    authoring: t('aiAdminAuthoringModel'),
    tutor: t('aiAdminTutorModel'),
  };

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
        <Typography.Text>
          {t('aiAdminUserId')} {account?.subject_id}
        </Typography.Text>
        <Tag>{account?.status}</Tag>
        {account?.balance !== undefined && (
          <Typography.Text>{t('aiAdminBalance', { balance: account.balance })}</Typography.Text>
        )}
      </Space>
      <Table
        rowKey="id"
        dataSource={entries}
        scroll={{ x: 640 }}
        columns={[
          { title: t('aiAdminChangedPoints'), dataIndex: 'amount' },
          { title: t('aiAdminCostUsd'), dataIndex: 'cost_usd' },
          { title: t('aiAdminReason'), dataIndex: 'reason' },
          { title: t('aiAdminTask'), dataIndex: 'task_id', ellipsis: true },
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
            }, t('aiAdminAdjustmentRecorded'));
          }}
        >
          <Form.Item name="subject_id" label={t('aiAdminUserId')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="amount" label={t('aiAdminAdjustPoints')} rules={[{ required: true }]}>
            <InputNumber />
          </Form.Item>
          <Form.Item
            name="reason"
            label={t('aiAdminAdjustmentReason')}
            rules={[{ required: true }]}
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="operation_key" hidden>
            <Input />
          </Form.Item>
          <Button htmlType="submit" type="primary" icon={<SaveOutlined />} loading={busy}>
            {t('aiAdminRecordAdjustment')}
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
        }, t('aiAdminSettingsSaved'))
      }
    >
      <Form.Item name="provider" label={t('aiAdminProviderProtocol')} rules={[{ required: true }]}>
        <Select
          options={[
            { value: 'codex', label: 'Codex Responses' },
            { value: 'chat_completions', label: 'Chat Completions' },
          ]}
        />
      </Form.Item>
      <Form.Item
        name="base_url"
        label={t('aiAdminApiUrl')}
        rules={[{ required: true }, { type: 'url' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item name="model" label={t('aiAdminModel')} rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="reasoning_effort" label={t('aiAdminReasoningEffort')}>
        <Select
          options={['none', 'minimal', 'low', 'medium', 'high', 'xhigh'].map((value) => ({
            value,
            label: value,
          }))}
        />
      </Form.Item>
      <Form.Item
        name="api_key"
        label={settings?.has_api_key ? t('aiAdminApiKeyConfigured') : 'API Key'}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      {(['input', 'cached', 'output'] as const).map((name, i) => (
        <Form.Item
          key={name}
          name={name + '_usd_per_million'}
          label={t('aiAdminPricePerMillion', { type: priceLabels[i] })}
          rules={[{ required: true }]}
        >
          <InputNumber min={0} />
        </Form.Item>
      ))}
      <Form.Item name="max_task_cost_usd" label={t('aiAdminMaxTaskCost')}>
        <InputNumber min={0.001} max={100} />
      </Form.Item>
      <Form.Item name="max_concurrency" label={t('aiAdminGlobalConcurrency')}>
        <InputNumber min={1} max={64} />
      </Form.Item>
      <Form.Item name="per_user_concurrency" label={t('aiAdminUserConcurrency')}>
        <InputNumber min={1} max={8} />
      </Form.Item>
      <Form.Item name="max_storage_mb" label={t('aiAdminUploadQuota')}>
        <InputNumber min={1} max={102400} />
      </Form.Item>
      <Form.Item name="monthly_user_budget_usd" label={t('aiAdminUserMonthlyBudget')}>
        <InputNumber min={0} max={100000} />
      </Form.Item>
      <Form.Item name="monthly_course_budget_usd" label={t('aiAdminCourseMonthlyBudget')}>
        <InputNumber min={0} max={100000} />
      </Form.Item>
      <Form.Item name="max_output_tokens" label={t('aiAdminMaxOutputTokens')}>
        <InputNumber min={128} max={65536} />
      </Form.Item>
      <Form.Item name="max_prompt_bytes" label={t('aiAdminMaxPromptBytes')}>
        <InputNumber min={1024} max={2000000} />
      </Form.Item>
      {['moderation', 'grading', 'authoring', 'tutor'].map((purpose) => (
        <React.Fragment key={purpose}>
          <Typography.Title level={5}>{purposeLabels[purpose]}</Typography.Title>
          <Form.Item name={['model_overrides', purpose, 'model']} label={t('aiAdminModelOverride')}>
            <Input />
          </Form.Item>
          <Form.Item
            name={['model_overrides', purpose, 'reasoning_effort']}
            label={t('aiAdminReasoningEffort')}
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
              label={t('aiAdminRate', { type: priceLabels[index] })}
            >
              <InputNumber min={0} />
            </Form.Item>
          ))}
        </React.Fragment>
      ))}
      <Space>
        <Button htmlType="submit" type="primary" icon={<SaveOutlined />} loading={busy}>
          {t('aiAdminSave')}
        </Button>
        <Button
          icon={<CheckOutlined />}
          loading={busy}
          onClick={() =>
            void execute(async () => {
              const result = await aiPlatform.health();
              setHealth(result);
              if (!result.ready) throw new Error(result.reason || t('aiAdminProviderNotReady'));
            }, t('aiAdminConnectionOk'))
          }
        >
          {t('aiAdminCheckConnection')}
        </Button>
        {health && (
          <Tag color={health.ready ? 'green' : 'red'}>
            {health.ready
              ? t('aiAdminProviderReady')
              : t('aiAdminProviderUnavailable', {
                  reason: health.reason || t('aiAdminConnectionFailed'),
                })}
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
          <Typography.Title level={3}>{t('aiNavAccount')}</Typography.Title>
          <Button
            aria-label={t('aiAdminRefresh')}
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
          <Alert
            type="warning"
            message={t('aiAdminAccessSuspended')}
            description={account.reason}
          />
        ) : (
          <Tabs
            items={[
              { key: 'account', label: t('aiAdminAccountTab'), children: accountView },
              ...(admin
                ? [
                    {
                      key: 'provider',
                      label: t('aiAdminModelTab'),
                      children: providerView,
                      forceRender: true,
                    },
                    { key: 'access', label: t('aiAdminAccessTab'), children: <AIAdminAccess /> },
                    { key: 'tags', label: t('aiAdminTagsTab'), children: <AITagManagement /> },
                    {
                      key: 'reviews',
                      label: t('aiAdminReviewsTab'),
                      children: (
                        <Table
                          rowKey="id"
                          locale={{
                            emptyText: (
                              <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={t('aiAdminNoReviews')}
                              />
                            ),
                          }}
                          dataSource={reviews}
                          scroll={{ x: 600 }}
                          columns={[
                            { title: t('aiAdminUser'), dataIndex: 'subject_id' },
                            { title: t('aiAdminDecision'), dataIndex: 'decision' },
                            { title: t('aiAdminReason'), dataIndex: 'reason', ellipsis: true },
                            {
                              title: t('aiAdminAiStatus'),
                              render: (_, row: Review) => (
                                <Tag color={row.account_status === 'suspended' ? 'red' : 'green'}>
                                  {row.account_status === 'suspended'
                                    ? t('aiAdminSuspended')
                                    : t('aiAdminAvailable')}
                                </Tag>
                              ),
                            },
                            {
                              title: t('aiAdminActions'),
                              render: (_, row: Review) => (
                                <Button
                                  disabled={row.subject_id === account?.subject_id}
                                  onClick={() => {
                                    setSelectedReview(row);
                                    reviewForm.setFieldsValue(row);
                                  }}
                                >
                                  {t('aiAdminReview')}
                                </Button>
                              ),
                            },
                          ]}
                        />
                      ),
                    },
                    {
                      key: 'usage',
                      label: t('aiAdminUnsettledTab'),
                      children: (
                        <Table
                          rowKey="id"
                          locale={{
                            emptyText: (
                              <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={t('aiAdminNoUnsettled')}
                              />
                            ),
                          }}
                          dataSource={runs}
                          scroll={{ x: 600 }}
                          columns={[
                            { title: t('aiAdminCall'), dataIndex: 'id', ellipsis: true },
                            { title: t('aiAdminModel'), dataIndex: 'model' },
                            { title: t('aiAdminTask'), dataIndex: 'task_id', ellipsis: true },
                            {
                              title: t('aiAdminUsage'),
                              render: (_, row) =>
                                `${row.usage?.input_tokens ?? '?'} / ${row.usage?.cached_input_tokens ?? '?'} / ${row.usage?.output_tokens ?? '?'}`,
                            },
                            {
                              title: t('aiAdminActions'),
                              render: (_, row: { id: string }) => (
                                <Button
                                  onClick={() => {
                                    setSelectedRun(row.id);
                                    usageForm.resetFields();
                                  }}
                                >
                                  {t('aiAdminReconcile')}
                                </Button>
                              ),
                            },
                          ]}
                        />
                      ),
                    },
                    {
                      key: 'operations',
                      label: t('aiAdminOperationsTab'),
                      children: (
                        <div className="ai-admin-operations">
                          <Descriptions
                            bordered
                            size="small"
                            column={{ xs: 1, sm: 2, md: 3 }}
                            title={t('aiAdminTaskQueue')}
                          >
                            {Object.entries(queue?.counts || {}).map(([status, count]) => (
                              <Descriptions.Item key={status} label={status}>
                                {count}
                              </Descriptions.Item>
                            ))}
                            <Descriptions.Item label={t('aiAdminAccumulatedCost')}>
                              {queue?.cost_usd || '0'}
                            </Descriptions.Item>
                          </Descriptions>
                          <Descriptions
                            bordered
                            size="small"
                            column={{ xs: 1, sm: 2, md: 3 }}
                            title={t('aiAdminStorageAudit')}
                          >
                            <Descriptions.Item label={t('aiAdminScanTime')}>
                              {storage?.scanned_at || t('aiAdminNotScanned')}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('aiAdminOrphanFiles')}>
                              {t('aiAdminOrphanFilesValue', {
                                count: storage?.orphan_file_count ?? 0,
                                eligible: storage?.eligible_orphan_file_count ?? 0,
                              })}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('aiAdminOrphanBytes')}>
                              {storage?.orphan_bytes ?? 0} bytes
                            </Descriptions.Item>
                            <Descriptions.Item label={t('aiAdminMissingFiles')}>
                              {storage?.missing_file_count ?? 0}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('aiAdminMetadataMismatch')}>
                              {storage?.metadata_mismatch_count ?? 0}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('aiAdminInvalidPaths')}>
                              {storage?.invalid_database_path_count ?? 0}
                            </Descriptions.Item>
                          </Descriptions>
                          {storage?.results_truncated && (
                            <Alert
                              type="warning"
                              showIcon
                              message={t('aiAdminAuditTruncated')}
                              description={t('aiAdminAuditTruncatedDescription')}
                            />
                          )}
                          <Space wrap>
                            <Button
                              onClick={() =>
                                void execute(
                                  async () => setStorage(await aiPlatform.storageAudit()),
                                  t('aiAdminStorageAuditRefreshed'),
                                )
                              }
                              loading={busy}
                            >
                              {t('aiAdminRefreshAudit')}
                            </Button>
                            <Button
                              onClick={() =>
                                void execute(
                                  async () =>
                                    setCleanupPreview(
                                      await aiPlatform.cleanupOrphans({ apply: false }),
                                    ),
                                  t('aiAdminCleanupPreviewCreated'),
                                )
                              }
                              loading={busy}
                            >
                              {t('aiAdminGenerateCleanupPreview')}
                            </Button>
                            <Button
                              danger
                              disabled={!cleanupPreview?.planned_file_count}
                              onClick={() => {
                                setCleanupReason('');
                                setCleanupOpen(true);
                              }}
                            >
                              {t('aiAdminApplyCleanup')}
                            </Button>
                          </Space>
                          {cleanupPreview && (
                            <Alert
                              type="info"
                              showIcon
                              message={t('aiAdminDryRunSummary', {
                                count: cleanupPreview.planned_file_count,
                                bytes: cleanupPreview.planned_bytes,
                              })}
                              description={
                                cleanupPreview.planned_files.map((item) => item.path).join('、') ||
                                t('aiAdminNoEligibleOrphans')
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
          title={t('aiAdminReviewsTab')}
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
              }, t('aiAdminReviewRecorded'))
            }
          >
            <Form.Item name="decision" label={t('aiAdminDecision')} rules={[{ required: true }]}>
              <Select
                options={['normal', 'warning', 'violation'].map((value) => ({
                  value,
                  label: value,
                }))}
              />
            </Form.Item>
            <Form.Item name="reason" label={t('aiAdminEvidence')} rules={[{ required: true }]}>
              <Input.TextArea />
            </Form.Item>
          </Form>
        </Modal>
        <Modal
          title={t('aiAdminReconcileTitle')}
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
              }, t('aiAdminReconcileRecorded'))
            }
          >
            {['input_tokens', 'cached_input_tokens', 'output_tokens'].map((name, index) => (
              <Form.Item
                key={name}
                name={name}
                label={t('aiAdminTokenType', { type: priceLabels[index] })}
                rules={[{ required: true }]}
              >
                <InputNumber min={0} precision={0} />
              </Form.Item>
            ))}
            <Form.Item
              name="reason"
              label={t('aiAdminBillingEvidence')}
              rules={[{ required: true }]}
            >
              <Input.TextArea />
            </Form.Item>
          </Form>
        </Modal>
        <Modal
          title={t('aiAdminCleanupTitle')}
          open={cleanupOpen}
          onCancel={() => setCleanupOpen(false)}
          okText={t('aiAdminConfirmDelete')}
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
                setNotice(t('aiAdminCleanupApplied'));
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
            message={t('aiAdminCleanupWarning')}
            description={t('aiAdminCleanupWarningDescription')}
          />
          <Input.TextArea
            rows={3}
            value={cleanupReason}
            onChange={(event) => setCleanupReason(event.target.value)}
            placeholder={t('aiAdminCleanupReasonPlaceholder')}
          />
        </Modal>
      </div>
    </main>
  );
}
