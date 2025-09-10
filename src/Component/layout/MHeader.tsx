import React, {Component, Dispatch} from 'react';
import {Button, Layout, message, Space} from 'antd';
import ChangeLang from '../common/ChangeLang';
import {UserState} from '../../Type/Iuser';
import {connect} from 'react-redux';
import {withTranslation} from 'react-i18next';
import {withRouter} from 'react-router';
import UserAccountDropdown from './UserAccountDropdown';
import {userLogoutTodo} from '../../Redux/Action/user';
import {UrlPrefix} from '../../Config/constValue';

const {Header} = Layout;

class MHeader extends Component<any, any> {
    render() {
        return (
            <Header
                className="site-layout-sub-header-background"
                style={{
                    minWidth: 550,
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    height: 64,
                    padding: '0 20px',
                    boxSizing: 'border-box'
                }}
            >
                <div style={{flex: 1}}/>
                <div className="mheader-ops" style={{display:'flex', gap:24, alignItems:'center', flexShrink:0}}>
                    <Button
                        type="text"
                        onClick={() => {
                            this.props.history.replace(UrlPrefix + '/manage');
                            window.location.reload();
                        }}
                    >{this.props.t('backToOldVersion', {defaultValue: '返回老版'})}</Button>
                    <ChangeLang/>
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
                            onLogout={() => {
                                this.props.userLogout();
                                setTimeout(() => {
                                    this.props.history.push(UrlPrefix + '/home');
                                }, 200);
                                message.info(this.props.t('LogoutSuccess', {defaultValue: this.props.t('Logout')}));
                            }}
                        />
                    ) : (
                        <Button type="text" onClick={() => {
                            this.props.history.push(UrlPrefix + '/login?to=' + this.props.location.pathname)
                        }}>{this.props.t('LoginOrRegister', {defaultValue: this.props.t('Login') + ' / ' + this.props.t('Register')})}</Button>
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

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(MHeader)
    ))
