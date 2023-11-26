import React, {Dispatch, useRef, useState} from "react";
import {Button, Card, Space, Tabs} from "antd";
import {LoginForm, ProFormInstance, ProFormText} from "@ant-design/pro-form";
import {LockOutlined, UserOutlined,} from '@ant-design/icons';
import ThirdPartyLoginSDUCAS from "./ThirdPartyLoginSDUCAS";
import {withTranslation} from "react-i18next";
import {connect, useDispatch} from "react-redux";
import {withRouter} from "react-router";
import {loginInfo} from "../../Type/types";
import Logo from "Assert/img/sduoj.png"
import ForgetPass from "./Form/ForgetPass";
import ItemEmail from "./Form/Item/ItemEmail";
import CApi from "../../Utils/API/c-api";

type LoginType = 'SDUCAS' | 'account' | "email";


const Login = (props: any) => {

    const formRef = useRef<ProFormInstance>()
    const [loginType, setLoginType] = useState<LoginType>("SDUCAS")
    const {t} = props
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
                title={t("用户登录")}
                subTitle={t("山东大学在线评测系统")}
                actions={
                    <></>
                }
                submitter={{
                    resetButtonProps: false,
                    render: (prop, def) => {
                        if (loginType === 'account' || loginType === 'email') {
                            return <Button type={"primary"} block onClick={() => {
                                loginType === 'account' ? passwordLogin() : emailLogin()
                            }}> {props.t("Login")} </Button>
                        } else {
                            return <ThirdPartyLoginSDUCAS/>
                        }
                    },
                }}
            >
                <Tabs activeKey={loginType} onChange={(activeKey) => setLoginType(activeKey as LoginType)}>
                    <Tabs.TabPane key={'account'} tab={t('账号密码')}/>
                    <Tabs.TabPane key={'email'} tab={t('邮箱验证码')}/>
                    <Tabs.TabPane key={'SDUCAS'} tab={t('统一身份认证')}/>
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
                            placeholder={t('请输入用户名')}
                            rules={[{required: true, message: t('请输入用户名!'),},]}

                        />
                        <ProFormText.Password
                            name="password"
                            fieldProps={{
                                size: 'large',
                                prefix: <LockOutlined className={'prefixIcon'}/>,
                                onPressEnter: () => passwordLogin()
                            }}
                            placeholder={t('请输入密码')}
                            rules={[{required: true, message: t('请输入密码！'),},]}
                        />
                    </>
                )}
                {loginType === 'email' && (
                    <>
                        <ItemEmail
                            emailVerifyType={"login"} needVerify={true} checkExist={false} emailTitle={t("邮箱")}
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
                            <ForgetPass button={<Button type={"link"} size={"small"}>{t("忘记密码")}</Button>}/>
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
)(
    withTranslation()(
        withRouter(Login)
    ))
