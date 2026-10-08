import { Alert, Card, Space, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { UrlPrefix } from '../../Config/constValue';

export default function DeprecatedJavaExam() {
  const { t } = useTranslation();
  return (
    <main style={{ padding: 'clamp(16px, 4vw, 48px)' }}>
      <Card>
        <Typography.Title level={2}>{t('DeprecatedJavaExamTitle')}</Typography.Title>
        <Alert type="warning" showIcon message={t('DeprecatedJavaExamDescription')} />
        <Space wrap style={{ marginTop: 24 }}>
          <Link to={UrlPrefix + '/manage/problemSet/exams'}>{t('OpenAutolabExams')}</Link>
          <Link to={UrlPrefix + '/home'}>{t('ReturnToHome')}</Link>
        </Space>
      </Card>
    </main>
  );
}
