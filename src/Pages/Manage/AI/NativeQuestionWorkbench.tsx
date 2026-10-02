import React, { useRef, useState } from 'react';
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
      if (!values.text?.trim() && !files.length) throw new Error('请填写原文或选择文件');
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
      <Typography.Text type="secondary">
        按录入批次建立题组。保存后即可在原有题组列表中编辑、组卷和使用；混合题型按客观题、主观题分别成组。
      </Typography.Text>
      {error && <Alert type="error" showIcon message={error} />}
      {groups.length > 0 && (
        <Alert
          type="success"
          showIcon
          message="题组已保存"
          description={groups.map((g) => `${g.name}（#${g.gid}）`).join('、')}
        />
      )}
      <Tabs
        items={[
          {
            key: 'manual',
            label: '手工录入',
            children: (
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  title: '录入批次',
                  score: 10,
                  questions: [{ type: 'short_answer', text: '', answer: '' }],
                }}
                onFinish={save}
              >
                <Form.Item
                  name="title"
                  label="批次名称"
                  rules={[{ required: true, whitespace: true, max: 55 }]}
                >
                  <Input maxLength={55} />
                </Form.Item>
                <Form.Item name="score" label="每题默认分值" rules={[{ required: true }]}>
                  <InputNumber min={0} max={10000} />
                </Form.Item>
                <Form.List name="questions">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map((field, index) => (
                        <Card
                          key={field.key}
                          size="small"
                          title={`第 ${index + 1} 题`}
                          style={{ marginBottom: 12 }}
                          extra={
                            fields.length > 1 && (
                              <Button
                                aria-label={`删除第 ${index + 1} 题`}
                                icon={<MinusCircleOutlined />}
                                onClick={() => remove(field.name)}
                              />
                            )
                          }
                        >
                          <Form.Item
                            name={[field.name, 'type']}
                            label="题型"
                            rules={[{ required: true }]}
                          >
                            <Select
                              options={[
                                { value: 'single_choice', label: '单选题' },
                                { value: 'multiple_choice', label: '多选题' },
                                { value: 'true_false', label: '判断题' },
                                { value: 'short_answer', label: '主观题' },
                              ]}
                            />
                          </Form.Item>
                          <Form.Item
                            name={[field.name, 'text']}
                            label="题目内容"
                            rules={[{ required: true, whitespace: true }]}
                          >
                            <Input.TextArea rows={4} placeholder="支持 Markdown 和数学公式" />
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
                                  label="选项（每行一项，自动编号 A、B…）"
                                  rules={[{ required: true }]}
                                >
                                  <Input.TextArea rows={4} />
                                </Form.Item>
                              ) : null
                            }
                          </Form.Item>
                          <Form.Item name={[field.name, 'answer']} label="参考答案">
                            <Input.TextArea
                              rows={2}
                              placeholder="选择题填写 A 或 A,B；判断题填写正确或错误"
                            />
                          </Form.Item>
                        </Card>
                      ))}
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={() => add({ type: 'short_answer', text: '', answer: '' })}
                      >
                        添加题目
                      </Button>
                    </>
                  )}
                </Form.List>
                <Form.Item style={{ marginTop: 16 }}>
                  <Button type="primary" htmlType="submit" loading={busy}>
                    保存到题组
                  </Button>
                </Form.Item>
              </Form>
            ),
          },
          {
            key: 'recognize',
            label: '文字 / 文件识别',
            children: (
              <Form
                form={sourceForm}
                layout="vertical"
                onFinish={recognize}
                initialValues={{ title: '识别录入批次' }}
              >
                <Form.Item
                  name="title"
                  label="批次名称"
                  rules={[{ required: true, whitespace: true, max: 55 }]}
                >
                  <Input maxLength={55} />
                </Form.Item>
                <Form.Item name="text" label="原始题目">
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
                  <Button icon={<UploadOutlined />}>选择文件或照片</Button>
                </Upload>
                <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
                  识别完成后自动保存到题组。模型未配置时可使用手工录入。
                </Typography.Paragraph>
                <Button type="primary" htmlType="submit" loading={busy}>
                  识别并保存到题组
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
