import React, { Dispatch, useEffect } from 'react';
import { Layout } from 'antd';
import { withTranslation } from 'react-i18next';
import { ConfigState } from '../../Type/IConfig';

import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import cApi from '../../Utils/API/c-api';
import { sanitizeHtml } from '../../Utils/sanitizeHtml';

const { Footer } = Layout;

const FooterSDU = (props: any) => {
  const {copyRight, setCopyRight} = props;
  useEffect(() => {
    if (typeof copyRight !== 'string' || copyRight.length === 0) {
      cApi
        .getCopyright()
        .then((data: any) => {
          setCopyRight(data);
        })
        .catch(() => {
          // The request layer reports transport failures.
        });
    }
  }, [copyRight, setCopyRight]);

  return (
    <>
      <Footer style={{ textAlign: 'center' }}>
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(props.copyRight) }} />
      </Footer>
    </>
  );
};

const mapStateToProps = (state: any) => {
  const CState: ConfigState = state.ConfigReducer;
  return {
    copyRight: CState.copyRight,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
  setCopyRight: (data: any) => dispatch({ type: 'setCopyRight', data: data }),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withTranslation()(withRouter(FooterSDU)));
