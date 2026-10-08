import React from 'react';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import apiAddress from '../../Utils/API/apiAddress';
import { ck } from '../../Utils/empty';
import { UrlPrefix } from '../../Config/constValue';

const server = apiAddress().FRONT_SERVER;

export const buildSduCasLoginUrl = (frontServer: string) => {
  const base = frontServer || window.location.origin;
  const service = new URL(`${UrlPrefix}/thirdPartyLogin`, base);
  service.searchParams.set('thirdParty', 'SDUCAS');
  const cas = new URL('https://pass.sdu.edu.cn/cas/login');
  cas.searchParams.set('service', service.toString());
  return cas.toString();
};

const ThirdPartyLoginSDUCAS = (props: any) => {
  const { t } = useTranslation();
  return (
    <>
      <a href={buildSduCasLoginUrl(server)}>
        <Button danger type={'primary'}>
          {t(ck(props.title, 'SDUAuth'))}
        </Button>
      </a>
    </>
  );
};

export default ThirdPartyLoginSDUCAS;
