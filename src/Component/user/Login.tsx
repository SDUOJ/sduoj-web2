import React, {Dispatch, useRef, useState} from "react";
import {Button, Card, Space, Tabs} from "antd";
import {LoginForm, ProFormInstance, ProFormText} from "@ant-design/pro-form";
import {LockOutlined, UserOutlined,} from '@ant-design/icons';
import ThirdPartyLoginSDUCAS from "./ThirdPartyLoginSDUCAS";
import {useTranslation} from "react-i18next";
import {connect, useDispatch} from "react-redux";
import {withRouter} from "react-router";
import {loginInfo} from "../../Type/types";
import Logo from "Assert/img/sduoj.png"
import ForgetPass from "./Form/ForgetPass";
import ItemEmail from "./Form/Item/ItemEmail";
import CApi from "../../Utils/API/c-api";

type LoginType = 'SDUCAS' | 'account' | "email";


const Login = (props: any) => {
    const { t } = useTranslation();

    const formRef = useRef<ProFormInstance>()
    const [loginType, setLoginType] = useState<LoginType>("SDUCAS")
    const dispatch = useDispatch()
    const afterLogin = (data: loginInfo) => {
        dispatch({type: "userLogin"})
        dispatch({type: "setUserInfo", data: data})
    }
    const passwordLogin = () => {
        formRef.current?.validateFields(["username", "password"]).then((value) => {
            CApi.login(value).then((resData: any) => {
                afterLogin(resData)
            })
        })
    }
    const emailLogin = () => {
        formRef.current?.validateFields(["email", "emailCode"]).then((value) => {
            CApi.emailLogin(value).then((resData: any) => {
                afterLogin(resData)
            })
        })
    }

    return (
        <Card
            style={{width: "500px", textAlign: "center", margin: "0 auto"}}>
            <LoginForm
                formRef={formRef}
                logo={Logo}
                title={t("UserLogin", {defaultValue: t("Login")})}
                subTitle={t("SDUOJSystem", {defaultValue: "SDUOJ"})}
                actions={
                    <></>
                }
                submitter={{
                    resetButtonProps: false,
                    render: (prop, def) => {
                        if (loginType === 'account' || loginType === 'email') {
                            return <Button type={"primary"} block onClick={() => {
                                loginType === 'account' ? passwordLogin() : emailLogin()
                            }}> {t("Login")} </Button>
                        } else {
                            return <ThirdPartyLoginSDUCAS/>
                        }
                    },
                }}
            >
                <Tabs activeKey={loginType} onChange={(activeKey) => setLoginType(activeKey as LoginType)}>
                    <Tabs.TabPane key={'account'} tab={t('AccountPassword', {defaultValue: t('Login')})}/>
                    <Tabs.TabPane key={'email'} tab={t('EmailVerifyCode', {defaultValue: t('emailCode')})}/>
                    <Tabs.TabPane key={'SDUCAS'} tab={t('UnifiedIdentity', {defaultValue: 'CAS'})}/>
                </Tabs>
                {loginType === 'account' && (
                    <>
                        <ProFormText
                            name="username"
                            fieldProps={{
                                size: 'large',
                                prefix: <UserOutlined className={'prefixIcon'}/>,
                                onPressEnter: () => passwordLogin()
                            }}
                            placeholder={t('PleaseInputUsername', {defaultValue: t('usernameEmpty')})}
                            rules={[{required: true, message: t('PleaseInputUsername', {defaultValue: t('usernameEmpty')})},]}

                        />
                        <ProFormText.Password
                            name="password"
                            fieldProps={{
                                size: 'large',
                                prefix: <LockOutlined className={'prefixIcon'}/>,
                                onPressEnter: () => passwordLogin()
                            }}
                            placeholder={t('PleaseInputPassword', {defaultValue: t('passwordEmpty')})}
                            rules={[{required: true, message: t('PleaseInputPassword', {defaultValue: t('passwordEmpty')})},]}
                        />
                    </>
                )}
                {loginType === 'email' && (
                    <>
                        <ItemEmail
                            emailVerifyType={"login"} needVerify={true} checkExist={false} emailTitle={t("email")}
                            onPressEnter={() => {
                                emailLogin()
                            }}
                            getEmail={() => {
                                return formRef.current?.validateFields(["email"]).then((data: any) => {
                                    return Promise.resolve(data.email)
                                }).catch(() => Promise.reject())
                            }}/>
                    </>
                )}
                {loginType !== 'SDUCAS' && (
                    <div style={{
                        textAlign: "right", marginBottom: 10
                    }}>
                        <Space size={3}>
                            {/*<Register button={<Button type={"link"} size={"small"}>注册</Button>}/>*/}
                            <ForgetPass button={<Button type={"link"} size={"small"}>{t("ForgotPassword", {defaultValue: t("ChangePass")})}</Button>}/>
                        </Space>
                    </div>
                )}
            </LoginForm>
        </Card>
    )
}

const mapStateToProps = (state: any) => {
    return {}
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withRouter(Login))
