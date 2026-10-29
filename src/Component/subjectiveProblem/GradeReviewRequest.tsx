import { useState } from 'react';
import { Alert, Button, Form, Input, message, Modal, Space } from 'antd';
import cApi from '../../Utils/API/c-api';
import { problemSetRouter } from '../../Type/types';
import GradeReviewTags, { GradeReviewInfo } from './GradeReviewTags';

export default function GradeReviewRequest({
  review,
  router,
  onSubmitted,
}: {
  review: GradeReviewInfo;
  router: problemSetRouter;
  onSubmitted: () => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  return (
    <Space direction="vertical" size={12} style={{ width: '100%', marginBottom: 16 }}>
      <GradeReviewTags review={review} />
      {review.status === 'pending' && (
        <Alert
          type="info"
          showIcon
          message="人工复核申请已提交，等待教师处理"
          description={review.reason}
        />
      )}
      {review.can_request && review.status !== 'pending' && (
        <Button onClick={() => setOpen(true)}>申请人工复核</Button>
      )}
      <Modal
        title="申请人工复核"
        open={open}
        okText="提交申请"
        cancelText="取消"
        confirmLoading={submitting}
        onCancel={() => {
          if (!submitting) setOpen(false);
        }}
        onOk={() => form.submit()}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async ({ reason }) => {
            if (submitting || !review.grade_version) return;
            setSubmitting(true);
            try {
              await cApi.requestGradeReview({
                router,
                reason: reason.trim(),
                grade_version: review.grade_version,
              });
              await onSubmitted();
              message.success('人工复核申请已提交');
              setOpen(false);
              form.resetFields();
            } catch {
              // The shared request layer displays the server's reason.
              await onSubmitted().catch(() => {});
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Form.Item
            label="复核理由"
            name="reason"
            rules={[
              { required: true, whitespace: true, message: '请填写复核理由' },
              { max: 2000, message: '复核理由不能超过 2000 字' },
            ]}
          >
            <Input.TextArea
              rows={5}
              maxLength={2000}
              showCount
              placeholder="请说明有疑问的评分项及理由，便于教师复核。"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
