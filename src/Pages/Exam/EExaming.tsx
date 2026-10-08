import React from 'react';
import { Button, Layout } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import ExamRun from '../../Component/exam/ExamRun';
import ChangeLang from '../../Component/common/ChangeLang';
import { useTranslation } from 'react-i18next';

const EExaming = () => {
  const { t } = useTranslation();
  return (
    <div className={'exam-container'}>
      <PageContainer
        header={{
          title: t?.('ExamTitle'),
          extra: [
            <ChangeLang key="lang" />,
            <Button key="2">{t?.('TempSave')}</Button>,
            <Button key="1" type="primary" danger>
              {t?.('SubmitPaper')}
            </Button>,
          ],
        }}
        className={'exam-content'}
      >
        <ExamRun />
      </PageContainer>
      <Layout.Footer style={{ textAlign: 'center' }}>{t?.('ExamFooterBrand')}</Layout.Footer>
    </div>
  );
};

export default EExaming;
