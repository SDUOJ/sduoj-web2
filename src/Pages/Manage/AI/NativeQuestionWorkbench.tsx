import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Tabs,
  Typography,
  Upload,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import request from '../../../Utils/API/request';
import { aiWorkbench } from '../../../Utils/API/ai-workbench';
import AITaskMonitor from './AITaskMonitor';
import { operationKey } from './operation-key';

type Group = { gid: number; name: string; type: number; count?: number };
type QuestionInput = { type: string; text: string; options?: string; answer?: string };

/** Intake is an operation on native question groups, never a second question bank. */
export default function NativeQuestionWorkbench({
  onSaved,
}: {
  onSaved?: (groups: Group[]) => void;
}) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [sourceForm] = Form.useForm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [taskId, setTaskId] = useState<string>();
  const [files, setFiles] = useState<File[]>([]);
  const intent = useRef({ key: operationKey(), payload: '' });
  const sourceIntent = useRef({ key: operationKey(), payload: '' });

  async function save(values: { title: string; score: number; questions: QuestionInput[] }) {
    setBusy(true);
    setError('');
    try {
      const questions = values.questions.map((q) => ({
        question_type: q.type,
        language: 'zh',
        original: q.text,
        zh: q.text,
        options: (q.options || '')
          .split('\n')
          .filter((x) => x.trim())
          .map((text, i) => ({ label: String.fromCharCode(65 + i), original: text, zh: text })),
        answer: q.answer || '',
        explanation: '',
        tags: [],
        figures: [],
      }));
      const payload = JSON.stringify({ title: values.title, score: values.score, questions });
      if (intent.current.payload && intent.current.payload !== payload)
        intent.current.key = operationKey();
      intent.current.payload = payload;
      const result = await request.post<{ groups: Group[] }>('/ps/question-bank/batches', {
        ...JSON.parse(payload),
        operation_key: intent.current.key,
      });
      setGroups(result.groups);
      onSaved?.(result.groups);
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }
  async function recognize(values: { title: string; text?: string }) {
    setBusy(true);
    setError('');
    setGroups([]);
    try {
      if (!values.text?.trim() && !files.length) throw new Error(t('aiNativeMissingSource'));
      const payload = JSON.stringify([values, files.map((f) => [f.name, f.size, f.lastModified])]);
      if (sourceIntent.current.payload && sourceIntent.current.payload !== payload)
        sourceIntent.current.key = operationKey();
      sourceIntent.current.payload = payload;
      const uploaded = await Promise.all(
        files.map((file, i) => aiWorkbench.upload(file, `${sourceIntent.current.key}-${i}`)),
      );
      const result = await aiWorkbench.intake({
        title: values.title,
        text: values.text || '',
        file_ids: uploaded.map((f) => f.id),
        batch_id: sourceIntent.current.key,
        auto_solve: false,
        auto_verify: false,
      });
      setTaskId(result.taskId);
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Typography.Text type="secondary">{t('aiNativeDescription')}</Typography.Text>
      {error && <Alert type="error" showIcon message={error} />}
      {groups.length > 0 && (
        <Alert
          type="success"
          showIcon
          message={t('aiNativeSaved')}
          description={groups.map((g) => `${g.name}（#${g.gid}）`).join('、')}
        />
      )}
      <Tabs
        items={[
          {
            key: 'manual',
            label: t('aiNativeManual'),
            children: (
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  title: t('aiNativeBatch'),
                  score: 10,
                  questions: [{ type: 'short_answer', text: '', answer: '' }],
                }}
                onFinish={save}
              >
                <Form.Item
                  name="title"
                  label={t('aiNativeBatchName')}
                  rules={[{ required: true, whitespace: true, max: 55 }]}
                >
                  <Input maxLength={55} />
                </Form.Item>
                <Form.Item
                  name="score"
                  label={t('aiNativeDefaultScore')}
                  rules={[{ required: true }]}
                >
                  <InputNumber min={0} max={10000} />
                </Form.Item>
                <Form.List name="questions">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map((field, index) => (
                        <Card
                          key={field.key}
                          size="small"
                          title={t('aiNativeQuestionNumber', { number: index + 1 })}
                          style={{ marginBottom: 12 }}
                          extra={
                            fields.length > 1 && (
                              <Button
                                aria-label={t('aiNativeDeleteQuestion', { number: index + 1 })}
                                icon={<MinusCircleOutlined />}
                                onClick={() => remove(field.name)}
                              />
                            )
                          }
                        >
                          <Form.Item
                            name={[field.name, 'type']}
                            label={t('aiNativeType')}
                            rules={[{ required: true }]}
                          >
                            <Select
                              options={[
                                { value: 'single_choice', label: t('aiNativeSingleChoice') },
                                { value: 'multiple_choice', label: t('aiNativeMultipleChoice') },
                                { value: 'true_false', label: t('aiNativeTrueFalse') },
                                { value: 'short_answer', label: t('aiNativeSubjective') },
                              ]}
                            />
                          </Form.Item>
                          <Form.Item
                            name={[field.name, 'text']}
                            label={t('aiNativeContent')}
                            rules={[{ required: true, whitespace: true }]}
                          >
                            <Input.TextArea rows={4} placeholder={t('aiNativeMarkdownHint')} />
                          </Form.Item>
                          <Form.Item
                            noStyle
                            shouldUpdate={(prev, next) =>
                              prev.questions?.[index]?.type !== next.questions?.[index]?.type
                            }
                          >
                            {({ getFieldValue }) =>
                              ['single_choice', 'multiple_choice'].includes(
                                getFieldValue(['questions', index, 'type']),
                              ) ? (
                                <Form.Item
                                  name={[field.name, 'options']}
                                  label={t('aiNativeOptions')}
                                  rules={[{ required: true }]}
                                >
                                  <Input.TextArea rows={4} />
                                </Form.Item>
                              ) : null
                            }
                          </Form.Item>
                          <Form.Item name={[field.name, 'answer']} label={t('aiNativeAnswer')}>
                            <Input.TextArea rows={2} placeholder={t('aiNativeAnswerHint')} />
                          </Form.Item>
                        </Card>
                      ))}
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={() => add({ type: 'short_answer', text: '', answer: '' })}
                      >
                        {t('aiNativeAdd')}
                      </Button>
                    </>
                  )}
                </Form.List>
                <Form.Item style={{ marginTop: 16 }}>
                  <Button type="primary" htmlType="submit" loading={busy}>
                    {t('aiNativeSave')}
                  </Button>
                </Form.Item>
              </Form>
            ),
          },
          {
            key: 'recognize',
            label: t('aiNativeRecognize'),
            children: (
              <Form
                form={sourceForm}
                layout="vertical"
                onFinish={recognize}
                initialValues={{ title: t('aiNativeRecognitionBatch') }}
              >
                <Form.Item
                  name="title"
                  label={t('aiNativeBatchName')}
                  rules={[{ required: true, whitespace: true, max: 55 }]}
                >
                  <Input maxLength={55} />
                </Form.Item>
                <Form.Item name="text" label={t('aiNativeSource')}>
                  <Input.TextArea rows={8} />
                </Form.Item>
                <Upload
                  multiple
                  accept=".png,.jpg,.jpeg,.webp,.pdf,.docx,.pptx,.md,.txt"
                  beforeUpload={(file) => {
                    setFiles((old) => [...old, file]);
                    return false;
                  }}
                  onRemove={(file) => {
                    setFiles((old) =>
                      old.filter((item) => (item as File & { uid?: string }).uid !== file.uid),
                    );
                  }}
                >
                  <Button icon={<UploadOutlined />}>{t('aiNativeSelectFiles')}</Button>
                </Upload>
                <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
                  {t('aiNativeRecognitionHint')}
                </Typography.Paragraph>
                <Button type="primary" htmlType="submit" loading={busy}>
                  {t('aiNativeRecognizeSave')}
                </Button>
              </Form>
            ),
          },
        ]}
      />
      {taskId && (
        <AITaskMonitor
          taskId={taskId}
          onComplete={(job) => {
            const result = job.result as { native_groups?: Group[] } | undefined;
            if (job.status === 'success' && result?.native_groups) {
              setGroups(result.native_groups);
              onSaved?.(result.native_groups);
            }
          }}
        />
      )}
    </Space>
  );
}
