import React, { useEffect, useState } from 'react';
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
        aria-label="筛选 OJ 用户 ID"
        placeholder="OJ 用户 ID"
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
            title: '用户',
            render: (_, row: ManagedAccount) => `${row.username} (${row.subject_id})`,
          },
          { title: '状态', render: (_, row: ManagedAccount) => <Tag>{row.status}</Tag> },
          { title: '原因', dataIndex: 'reason' },
          {
            title: '操作',
            render: (_, row: ManagedAccount) => (
              <Space wrap>
                <Button
                  icon={<StopOutlined />}
                  aria-label="管理资格"
                  onClick={() => {
                    setEditing(row);
                    form.setFieldsValue({
                      suspended: 'hold',
                      reason: '',
                      operation_key: operationKey(),
                    });
                  }}
                >
                  管理资格
                </Button>
                <Button
                  aria-label="操作历史"
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
        title="管理 AI 使用资格"
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
                  setError(result.reason || '内容复核仍未解除');
              })
              .catch((value) => setError(String(value)))
              .finally(() => setBusy(false));
          }}
        >
          <Form.Item name="suspended" label="操作" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'hold', label: '暂停 AI 使用' },
                { value: 'release', label: '解除人工暂停' },
              ]}
            />
          </Form.Item>
          <Form.Item name="reason" label="操作依据" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="operation_key" hidden>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="资格操作历史"
        open={history !== null}
        onCancel={() => setHistory(null)}
        footer={null}
        width={760}
      >
        <Table
          rowKey="id"
          dataSource={history || []}
          columns={[
            { title: '时间', dataIndex: 'created_at' },
            { title: '操作人', dataIndex: 'actor_id' },
            {
              title: '依据',
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
        <Form.Item name="name" label="规范标签名称" rules={[{ required: true }]}>
          <Input maxLength={64} />
        </Form.Item>
        <Form.Item name="aliases" label="别名" initialValue={[]}>
          <Select mode="tags" tokenSeparators={[',']} />
        </Form.Item>
        <Space>
          <Button htmlType="submit" icon={<SaveOutlined />} aria-label="保存标签" loading={busy}>
            保存标签
          </Button>
          <Button icon={<UndoOutlined />} onClick={() => form.resetFields()}>
            清空
          </Button>
        </Space>
      </Form>
      <Table
        rowKey="id"
        dataSource={tags}
        columns={[
          { title: '规范名称', dataIndex: 'name' },
          { title: '别名', render: (_, row: ManagedTag) => row.aliases.join(', ') },
          {
            title: '操作',
            render: (_, row: ManagedTag) => (
              <Button onClick={() => form.setFieldsValue(row)}>编辑别名</Button>
            ),
          },
        ]}
      />
    </>
  );
}
