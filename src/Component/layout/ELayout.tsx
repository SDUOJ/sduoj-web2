import React, { Component, Dispatch, Suspense } from 'react';
import { Layout } from 'antd';
import Loading from '../../Utils/Loading';
import { getRouterPath } from '../../Config/router/router';
import { withTranslation } from 'react-i18next';
import EHeader from './EHeader';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { routeTrees } from '../../Config/router/routeTrees';
import RouteSwitch from '../../Config/router/RouteSwitch';
import { UrlPrefix } from '../../Config/constValue';
import LoginCheck from '../common/LoginCheck';

const { Footer, Content } = Layout;

class ELayout extends Component<any, any> {
  redirectExamRoot() {
    if (this.props.authStatus !== 'authenticated') return;
    if (
      (this.props.location.pathname === UrlPrefix + '/exam' ||
        this.props.location.pathname === UrlPrefix + '/exam/') &&
      routeTrees.exam.length !== 0
    ) {
      this.props.history.replace(getRouterPath(routeTrees.exam, 2));
    }
  }

  componentDidMount() {
    this.redirectExamRoot();
  }

  componentDidUpdate(prevProps: Readonly<any>) {
    if (
      prevProps.authStatus !== this.props.authStatus ||
      prevProps.location.pathname !== this.props.location.pathname
    ) {
      this.redirectExamRoot();
    }
  }

  render() {
    if (this.props.authStatus !== 'authenticated') {
      return <LoginCheck jump={true} />;
    }
    return (
      <>
        <LoginCheck jump={true} />
        <Layout style={{ height: 'max-content', minHeight: '100%' }}>
          <Layout style={{ minWidth: 0, width: '100%' }}>
            <EHeader />
            <Content
              style={{
                margin: '24px clamp(8px, 3vw, 16px) 0',
                display: 'block',
                height: 'auto',
                minWidth: 0,
              }}
            >
              <div
                className="site-layout-background"
                style={{ padding: 'clamp(8px, 3vw, 24px)', minWidth: 0 }}
              >
                <Suspense fallback={<Loading />}>
                  {/*对应路由*/}
                  <RouteSwitch routes={routeTrees.exam} />
                </Suspense>
              </div>
            </Content>
            <Footer style={{ textAlign: 'center' }}>{this.props.t('ExamFooterNotice')}</Footer>
            {/*<FooterSDU/>*/}
          </Layout>
        </Layout>
      </>
    );
  }
}

const mapStateToProps = (state: any) => {
  return { authStatus: state.UserReducer.authStatus ?? 'unknown' };
};

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(withRouter(ELayout)));
