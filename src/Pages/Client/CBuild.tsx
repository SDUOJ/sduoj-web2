import React from 'react';
import { Button, Image, Result, Space } from 'antd';
import I404 from 'Assert/img/404.png';
import { useHistory } from 'react-router-dom';
import { UrlPrefix } from '../../Config/constValue';
import { useTranslation } from 'react-i18next';

const CBuild = () => {
  const { t } = useTranslation();
  const history = useHistory();

  return (
    <>
      <Result
        icon={<Image src={I404} width={'180px'} preview={false} />}
        title={t('siteUnderConstruction')}
        subTitle={t('devsWentToPetCats')}
        extra={
          <Space size={30}>
            <Button
              type="default"
              onClick={() => {
                history.push('/');
                window.location.reload();
              }}
            >
              {t('backToOldVersion')}
            </Button>
            <Button
              type="primary"
              onClick={() => {
                history.push(UrlPrefix + '/exam');
                window.location.reload();
              }}
            >
              {t('examSystem')}
            </Button>
            <Button
              type="default"
              onClick={() => {
                history.push(UrlPrefix + '/manage');
                window.location.reload();
              }}
            >
              {t('adminConsole')}
            </Button>
          </Space>
        }
      />
    </>
  );
};

export default CBuild;
