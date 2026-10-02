import { Button, Result } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { UrlPrefix } from '../../Config/constValue';

export default function NotFound() {
  const history = useHistory();
  const { t } = useTranslation();

  return (
    <Result
      status="404"
      title="404"
      subTitle={t('PageNotFound', { defaultValue: '页面不存在或已被移除' })}
      extra={
        <Button type="primary" onClick={() => history.replace(UrlPrefix + '/home')}>
          {t('BackHome', { defaultValue: '返回首页' })}
        </Button>
      }
    />
  );
}
