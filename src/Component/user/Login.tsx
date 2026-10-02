import React, { useRef, useState } from 'react';
import { Button, Card, Space, Tabs } from 'antd';
import { LoginForm, ProFormInstance, ProFormText } from '@ant-design/pro-components';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import ThirdPartyLoginSDUCAS from './ThirdPartyLoginSDUCAS';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../../Redux/Store/hooks';
import { loginInfo } from '../../Type/types';
import Logo from 'Assert/img/sduoj.png';
import ForgetPass from './Form/ForgetPass';
import ItemEmail from './Form/Item/ItemEmail';
import CApi from '../../Utils/API/c-api';
import { contracts } from '../../Config/validation/contracts';
import { constraintRules } from '../../Config/validation/constraints';

type LoginType = 'SDUCAS' | 'account' | 'email';

const Login = () => {
  const { t } = useTranslation();

  const formRef = useRef<ProFormInstance>();
  const [loginType, setLoginType] = useState<LoginType>('SDUCAS');
  const [submitting, setSubmitting] = useState(false);
  const pending = useRef(false);
  const dispatch = useAppDispatch();
  const afterLogin = (data: loginInfo) => {
    dispatch({ type: 'userLogin' });
    dispatch({ type: 'setUserInfo', data: data });
  };
  const submit = async (type: 'account' | 'email') => {
    if (pending.current) return;
    pending.current = true;
    try {
      const value = await formRef.current?.validateFields(
        type === 'account' ? ['username', 'password'] : ['email', 'emailCode'],
      );
      if (!value) return;
      setSubmitting(true);
      const data: loginInfo = await (type === 'account'
        ? CApi.login(value)
        : CApi.emailLogin(value));
      afterLogin(data);
    } catch {
      // Field validation and transport already present errors; preserve credentials for retry.
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  };
  const passwordLogin = () => submit('account');
  const emailLogin = () => submit('email');

  return (
    <Card className="client-login">
      <LoginForm
        contentStyle={{ width: '100%', minWidth: 0 }}
        containerStyle={{ padding: '32px 0' }}
        formRef={formRef}
        logo={Logo}
        title={t('UserLogin', { defaultValue: t('Login') })}
        subTitle={t('SDUOJSystem', { defaultValue: 'SDUOJ' })}
        actions={<></>}
        submitter={{
          resetButtonProps: false,
          render: (prop, def) => {
            if (loginType === 'account' || loginType === 'email') {
              return (
                <Button
                  type={'primary'}
                  block
                  loading={submitting}
                  onClick={() => {
                    loginType === 'account' ? passwordLogin() : emailLogin();
                  }}
                >
                  {' '}
                  {t('Login')}{' '}
                </Button>
              );
            } else {
              return <ThirdPartyLoginSDUCAS />;
            }
          },
        }}
      >
        <Tabs
          centered
          tabBarGutter={16}
          activeKey={loginType}
          onChange={(activeKey) => setLoginType(activeKey as LoginType)}
          items={[
            {
              key: 'account',
              disabled: submitting,
              label: t('AccountPassword', { defaultValue: t('Login') }),
            },
            {
              key: 'email',
              disabled: submitting,
              label: t('EmailVerifyCode', { defaultValue: t('emailCode') }),
            },
            {
              key: 'SDUCAS',
              disabled: submitting,
              label: t('UnifiedIdentity', { defaultValue: 'CAS' }),
            },
          ]}
        />
        {loginType === 'account' && (
          <>
            <ProFormText
              name="username"
              fieldProps={{
                size: 'large',
                prefix: <UserOutlined className={'prefixIcon'} />,
                onPressEnter: () => passwordLogin(),
              }}
              placeholder={t('PleaseInputUsername', { defaultValue: t('usernameEmpty') })}
              rules={constraintRules(contracts.user.loginUsername)}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{
                size: 'large',
                prefix: <LockOutlined className={'prefixIcon'} />,
                onPressEnter: () => passwordLogin(),
              }}
              placeholder={t('PleaseInputPassword', { defaultValue: t('passwordEmpty') })}
              rules={[
                {
                  required: true,
                  message: t('PleaseInputPassword', { defaultValue: t('passwordEmpty') }),
                },
              ]}
            />
          </>
        )}
        {loginType === 'email' && (
          <>
            <ItemEmail
              emailVerifyType={'login'}
              needVerify={true}
              checkExist={false}
              emailTitle={t('email')}
              onPressEnter={() => {
                emailLogin();
              }}
              getEmail={() => {
                return formRef.current
                  ?.validateFields(['email'])
                  .then((data: any) => {
                    return Promise.resolve(data.email);
                  })
                  .catch(() => Promise.reject());
              }}
            />
          </>
        )}
        {loginType !== 'SDUCAS' && (
          <div
            style={{
              textAlign: 'right',
              marginBottom: 10,
            }}
          >
            <Space size={3}>
              {/*<Register button={<Button type={"link"} size={"small"}>注册</Button>}/>*/}
              <ForgetPass
                button={
                  <Button type={'link'} size={'small'}>
                    {t('ForgotPassword', { defaultValue: t('ChangePass') })}
                  </Button>
                }
              />
            </Space>
          </div>
        )}
      </LoginForm>
    </Card>
  );
};

export default Login;
