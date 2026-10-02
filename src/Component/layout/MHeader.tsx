import React, { Component, Dispatch } from 'react';
import { Button, Layout, message, Space } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import ChangeLang from '../common/ChangeLang';
import { UserState } from '../../Type/Iuser';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { withRouter } from 'react-router';
import UserAccountDropdown from './UserAccountDropdown';
import { userLogoutTodo } from '../../Redux/Action/user';
import { UrlPrefix } from '../../Config/constValue';
import { loginRedirect } from '../../Utils/authReturn';

const { Header } = Layout;

class MHeader extends Component<any, any> {
  render() {
    const isMobile = this.props.isMobile === true;
    return (
      <Header
        className="site-layout-sub-header-background"
        style={{
          minWidth: 0,
          position: 'fixed',
          top: 0,
          left: isMobile ? 0 : 200,
          width: isMobile ? '100%' : 'calc(100% - 200px)',
          display: 'flex',
          alignItems: 'center',
          height: 64,
          padding: isMobile ? '0 8px' : '0 20px',
          boxSizing: 'border-box',
          zIndex: 100,
        }}
      >
        {isMobile && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            aria-label={this.props.t('openMenu', { defaultValue: 'Open menu' })}
            onClick={this.props.onMenuToggle}
          />
        )}
        <div style={{ flex: 1 }} />
        <div
          className="mheader-ops"
          style={{ display: 'flex', gap: isMobile ? 8 : 24, alignItems: 'center', flexShrink: 0 }}
        >
          <Button
            type="text"
            onClick={() => {
              this.props.history.replace(UrlPrefix + '/manage');
              window.location.reload();
            }}
          >
            {this.props.t('backToOldVersion', { defaultValue: '返回老版' })}
          </Button>
          <ChangeLang />
          {this.props.isLogin ? (
            <UserAccountDropdown
              isLogin={true}
              mode="manage"
              username={this.props.username}
              email={this.props.email}
              roles={this.props.roles}
              onBackToOJ={() => this.props.history.push(UrlPrefix + '/')}
              onToManage={undefined}
              onToProfile={() => this.props.history.push(UrlPrefix + '/user')}
              onLogout={async () => {
                try {
                  await this.props.userLogout();
                  this.props.history.push(UrlPrefix + '/home');
                  message.info(
                    this.props.t('LogoutSuccess', { defaultValue: this.props.t('Logout') }),
                  );
                } catch {
                  // Transport reports the failed logout.
                }
              }}
            />
          ) : (
            <Button
              type="text"
              onClick={() => {
                const loginPath = UrlPrefix + '/login';
                const { pathname, search, hash } = this.props.location;
                // 如果已经在登录页，则不要修改已有重定向地址（也不再跳转）
                if (pathname === loginPath) return;
                this.props.history.push(loginRedirect({ pathname, search, hash }));
              }}
            >
              {this.props.t('LoginOrRegister', {
                defaultValue: this.props.t('Login') + ' / ' + this.props.t('Register'),
              })}
            </Button>
          )}
        </div>
      </Header>
    );
  }
}

const mapStateToProps = (state: any) => {
  const UState: UserState = state.UserReducer;
  return {
    isLogin: UState.isLogin,
    email: UState.userInfo?.email,
    username: UState.userInfo?.username,
    roles: UState.userInfo?.roles,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
  userLogout: () => dispatch(userLogoutTodo()),
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(withRouter(MHeader)));
