import React, { Component } from 'react';
import { Button } from 'antd';
import { withTranslation } from 'react-i18next';
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

class ThirdPartyLoginSDUCAS extends Component<any, any> {
  render() {
    return (
      <>
        <a href={buildSduCasLoginUrl(server)}>
          <Button danger type={'primary'}>
            {this.props.t(ck(this.props.title, 'SDUAuth'))}
          </Button>
        </a>
      </>
    );
  }
}

export default withTranslation()(ThirdPartyLoginSDUCAS);
