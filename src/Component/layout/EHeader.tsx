import React, { Dispatch } from 'react';
import { Layout, message } from 'antd';
import ChangeLang from '../common/ChangeLang';
import logo from '../../Assert/img/logo.png';
import { UserState } from '../../Type/Iuser';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { withRouter } from 'react-router';
import { userLogoutTodo } from '../../Redux/Action/user';
import ExamOver from '../exam/ExamOver';
import UserAccountDropdown from './UserAccountDropdown';

const { Header } = Layout;

const EHeader = (props: any) => {
  return (
    <Header
      className="site-layout-sub-header-background"
      style={{
        minWidth: 0,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 clamp(8px, 3vw, 20px)',
        height: 64,
      }}
    >
      <div className="logo" style={{ display: 'flex', alignItems: 'center' }}>
        <img
          src={logo}
          style={{ width: 'clamp(88px, 32vw, 125px)', height: 'auto' }}
          alt="SDUOJ-logo"
        />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          minWidth: 0,
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
        }}
      >
        {props.location.pathname.match(/\/exam\/running\//) !== null && <ExamOver />}
        <ChangeLang />
        <UserAccountDropdown
          isLogin={props.isLogin}
          mode="exam"
          realName={props.realName}
          sduId={props.sduId}
          onLogout={async () => {
            try {
              await props.userLogout();
              message.info(props.t('LogoutSuccess', { defaultValue: props.t('Logout') }));
            } catch {
              // Transport reports the failed logout.
            }
          }}
        />
      </div>
    </Header>
  );
};

const mapStateToProps = (state: any) => {
  const UState: UserState = state.UserReducer;
  const realName = UState.userInfo?.realName;
  const sduId = UState.userInfo?.sduId;
  return {
    isLogin: UState.isLogin,
    realName: realName ?? UState.userInfo?.nickname,
    sduId: sduId ?? UState.userInfo?.studentId,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
  userLogout: () => dispatch(userLogoutTodo()),
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(withRouter(EHeader)));
