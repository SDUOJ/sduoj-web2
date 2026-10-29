import { Space, Tag } from 'antd';

export type GradeReviewInfo = {
  can_request?: boolean;
  grade_version?: string;
  ai_needs_review?: boolean;
  ai_reason?: string | null;
  status?: 'none' | 'pending' | 'resolved';
  reason?: string | null;
};

export default function GradeReviewTags({ review }: { review?: GradeReviewInfo }) {
  return (
    <Space size={4} wrap>
      {review?.ai_needs_review && <Tag color="gold">AI 建议人工复查</Tag>}
      {review?.status === 'pending' && <Tag color="orange">学生申请待复核</Tag>}
      {review?.status === 'resolved' && <Tag>复核已处理</Tag>}
    </Space>
  );
}
