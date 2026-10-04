import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Card, Drawer, Input, Space, Table, Typography } from 'antd';
import request from '../../../Utils/API/request';
import { aiWorkbench } from '../../../Utils/API/ai-workbench';
import { aiPlatform, PlatformResource } from '../../../Utils/API/ai-platform';
import AITaskMonitor from './AITaskMonitor';
import { operationKey } from './operation-key';

type Row = {
  pid: number;
  score: number;
  question: { zh: string; answer: string; options: Array<{ label: string; zh: string }> };
};

export default function NativeGroupQuestions({ gid, name }: { gid: number; name: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [task, setTask] = useState<string>();
  const [followup, setFollowup] = useState('');
  const [keyword, setKeyword] = useState('');
  const load = useCallback(async () => {
    const value = await request.get<{ rows: Row[] }>(`/ps/question-bank/groups/${gid}/questions`);
    setRows(value.rows);
    setSelected((old) => (old ? value.rows.find((row) => row.pid === old.pid) : undefined));
  }, [gid]);
  useEffect(() => {
    if (open) void load().catch((reason) => setError(String(reason)));
  }, [open, load]);
  async function run(row: Row, type: 'question.solve' | 'question.verify' | 'question.chat') {
    setBusy(true);
    setError('');
    try {
      // Establish an internal task reference transparently, never a second bank entry.
      let reference = await aiWorkbench.importNative(gid, row.pid);
      reference = await aiWorkbench.detail(reference.id);
      const job = await aiPlatform.submit(
        reference as PlatformResource,
        type,
        operationKey(),
        type === 'question.chat' ? { message: followup } : {},
      );
      setSelected(row);
      setTask(job.taskId);
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button type="link" onClick={() => setOpen(true)}>
        {t('aiNativeGroupTitle')}
      </Button>
      <Drawer
        title={name}
        width="min(1000px, 96vw)"
        open={open}
        onClose={() => setOpen(false)}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {error && <Alert type="error" showIcon message={error} />}
          <Input.Search placeholder={t('aiNativeGroupSearch')} allowClear onSearch={setKeyword} />
          <Table<Row>
            rowKey="pid"
            dataSource={rows.filter((row) => row.question.zh.includes(keyword))}
            pagination={{ pageSize: 10 }}
            columns={[
              { title: t('aiNativeGroupNumber'), dataIndex: 'pid', width: 80 },
              {
                title: t('aiNativeGroupQuestion'),
                render: (_, row) => (
                  <Button
                    type="link"
                    style={{ whiteSpace: 'normal', height: 'auto', textAlign: 'left' }}
                    onClick={() => setSelected(row)}
                  >
                    {row.question.zh.slice(0, 120)}
                  </Button>
                ),
              },
              {
                title: t('aiNativeGroupActions'),
                render: (_, row) => (
                  <Space>
                    <Button loading={busy} onClick={() => void run(row, 'question.solve')}>
                      {t('aiNativeGroupSolve')}
                    </Button>
                    <Button loading={busy} onClick={() => void run(row, 'question.verify')}>
                      {t('aiNativeGroupVerify')}
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
          {selected && (
            <Card size="small" title={t('aiNativeGroupQuestionTitle', { pid: selected.pid })}>
              <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                {selected.question.zh}
              </Typography.Paragraph>
              {selected.question.options.map((option) => (
                <Typography.Paragraph key={option.label}>
                  {option.label}. {option.zh}
                </Typography.Paragraph>
              ))}
              <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                {t('aiNativeGroupReferenceAnswer')}
                {selected.question.answer || t('aiNativeGroupMissingAnswer')}
              </Typography.Paragraph>
              <Input.TextArea
                value={followup}
                onChange={(e) => setFollowup(e.target.value)}
                placeholder={t('aiNativeGroupFollowupHint')}
                rows={3}
              />
              <Button
                disabled={!followup.trim()}
                loading={busy}
                onClick={() => void run(selected, 'question.chat')}
                style={{ marginTop: 12 }}
              >
                {t('aiNativeGroupFollowup')}
              </Button>
            </Card>
          )}
          {task && (
            <AITaskMonitor
              taskId={task}
              onComplete={() => void load().catch((reason) => setError(String(reason)))}
            />
          )}
        </Space>
      </Drawer>
    </>
  );
}
