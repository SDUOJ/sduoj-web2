import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Form, Input, Modal, Select, Space, Table, Tag } from 'antd';
import { HistoryOutlined, SaveOutlined, StopOutlined, UndoOutlined } from '@ant-design/icons';
import request from '../../../Utils/API/request';
import { operationKey } from './operation-key';

type ManagedAccount = {
  subject_id: string;
  username: string;
  balance: string;
  status: string;
  reason?: string;
};
const base = '/ps/auto-task/ai';
export default function AIAdminAccess() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<ManagedAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<ManagedAccount>();
  const [history, setHistory] = useState<Array<{
    id: string;
    actor_id: string;
    created_at: string;
    request: { reason: string; suspended: boolean };
  }> | null>(null);
  const [form] = Form.useForm();
  async function load() {
    const result = await request.get<{ rows: ManagedAccount[]; totalNum: number }>(
      base + '/admin/accounts',
      { page, subject_id: filter },
    );
    setAccounts(result.rows);
    setTotal(result.totalNum);
  }
  useEffect(() => {
    void load().catch((value) => setError(String(value)));
  }, [page, filter]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      {error && <Alert message={error} type="error" showIcon />}
      <Input.Search
        aria-label={t('aiAccessFilterSubject')}
        placeholder={t('aiAccessFilterSubject')}
        onSearch={(value) => {
          setFilter(value);
          setPage(1);
        }}
      />
      <Table
        rowKey="subject_id"
        dataSource={accounts}
        scroll={{ x: 660 }}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          showSizeChanger: false,
          onChange: setPage,
        }}
        columns={[
          {
            title: t('aiAccessUser'),
            render: (_, row: ManagedAccount) => `${row.username} (${row.subject_id})`,
          },
          {
            title: t('aiAccessStatus'),
            render: (_, row: ManagedAccount) => <Tag>{row.status}</Tag>,
          },
          { title: t('aiAccessReason'), dataIndex: 'reason' },
          {
            title: t('aiAccessActions'),
            render: (_, row: ManagedAccount) => (
              <Space wrap>
                <Button
                  icon={<StopOutlined />}
                  aria-label={t('aiAccessManage')}
                  onClick={() => {
                    setEditing(row);
                    form.setFieldsValue({
                      suspended: 'hold',
                      reason: '',
                      operation_key: operationKey(),
                    });
                  }}
                >
                  {t('aiAccessManage')}
                </Button>
                <Button
                  aria-label={t('aiAccessHistory')}
                  icon={<HistoryOutlined />}
                  onClick={() =>
                    void request
                      .get<NonNullable<typeof history>>(base + '/admin/accounts/access-history', {
                        subject_id: row.subject_id,
                      })
                      .then(setHistory)
                      .catch((value) => setError(String(value)))
                  }
                />
              </Space>
            ),
          },
        ]}
      />
      <Modal
        title={t('aiAccessManageTitle')}
        forceRender
        open={!!editing}
        onCancel={() => !busy && setEditing(undefined)}
        onOk={() => form.submit()}
        confirmLoading={busy}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            if (!editing) return;
            setBusy(true);
            setError('');
            void request
              .post<{ status: string; reason?: string }>(base + '/admin/accounts/access', {
                ...values,
                suspended: values.suspended === 'hold',
                subject_id: editing.subject_id,
              })
              .then(async (result) => {
                setEditing(undefined);
                await load();
                if (values.suspended === 'release' && result.status === 'suspended')
                  setError(result.reason || t('aiAccessReviewStillBlocked'));
              })
              .catch((value) => setError(String(value)))
              .finally(() => setBusy(false));
          }}
        >
          <Form.Item name="suspended" label={t('aiAccessAction')} rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'hold', label: t('aiAccessHold') },
                { value: 'release', label: t('aiAccessRelease') },
              ]}
            />
          </Form.Item>
          <Form.Item name="reason" label={t('aiAccessActionReason')} rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="operation_key" hidden>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={t('aiAccessHistoryTitle')}
        open={history !== null}
        onCancel={() => setHistory(null)}
        footer={null}
        width={760}
      >
        <Table
          rowKey="id"
          dataSource={history || []}
          columns={[
            { title: t('aiAccessTime'), dataIndex: 'created_at' },
            { title: t('aiAccessActor'), dataIndex: 'actor_id' },
            {
              title: t('aiAccessReason'),
              render: (_, row: NonNullable<typeof history>[number]) => row.request.reason,
            },
          ]}
        />
      </Modal>
    </>
  );
}

type ManagedTag = { id: string; name: string; aliases: string[] };
export function AITagManagement() {
  const { t } = useTranslation();
  const [tags, setTags] = useState<ManagedTag[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form] = Form.useForm();
  const load = () => request.get<ManagedTag[]>(base + '/tags').then(setTags);
  useEffect(() => {
    void load().catch((value) => setError(String(value)));
  }, []);
  return (
    <>
      {error && <Alert message={error} type="error" showIcon />}
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          setBusy(true);
          setError('');
          void request
            .post(base + '/tags/upsert', values)
            .then(async () => {
              form.resetFields();
              await load();
            })
            .catch((value) => setError(String(value)))
            .finally(() => setBusy(false));
        }}
      >
        <Form.Item name="name" label={t('aiAccessCanonicalTag')} rules={[{ required: true }]}>
          <Input maxLength={64} />
        </Form.Item>
        <Form.Item name="aliases" label={t('aiAccessAliases')} initialValue={[]}>
          <Select mode="tags" tokenSeparators={[',']} />
        </Form.Item>
        <Space>
          <Button
            htmlType="submit"
            icon={<SaveOutlined />}
            aria-label={t('aiAccessSaveTag')}
            loading={busy}
          >
            {t('aiAccessSaveTag')}
          </Button>
          <Button icon={<UndoOutlined />} onClick={() => form.resetFields()}>
            {t('aiAccessClear')}
          </Button>
        </Space>
      </Form>
      <Table
        rowKey="id"
        dataSource={tags}
        columns={[
          { title: t('aiAccessCanonicalName'), dataIndex: 'name' },
          { title: t('aiAccessAliases'), render: (_, row: ManagedTag) => row.aliases.join(', ') },
          {
            title: t('aiAccessActions'),
            render: (_, row: ManagedTag) => (
              <Button onClick={() => form.setFieldsValue(row)}>{t('aiAccessEditAliases')}</Button>
            ),
          },
        ]}
      />
    </>
  );
}
