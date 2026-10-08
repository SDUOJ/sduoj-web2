import React, { useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Card, Col, Divider, Form, FormInstance, message, Row } from 'antd';
import Avatar from '../../Component/user/Avatar';
import ItemEmail from '../../Component/user/Form/Item/ItemEmail';
import ItemUsername from '../../Component/user/Form/Item/ItemUsername';
import { UserState } from '../../Type/Iuser';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import ItemNickname from '../../Component/user/Form/Item/ItemNickname';
import ItemStudentId from '../../Component/user/Form/Item/ItemStudentId';
import ItemGender from '../../Component/user/Form/Item/ItemGender';
import ItemPhone from '../../Component/user/Form/Item/ItemPhone';
import ItemRoles from '../../Component/user/Form/Item/ItemRoles';
import CApi from 'Utils/API/c-api';
import SubmitButton from '../../Component/common/SubmitButton';
import ItemPassword from '../../Component/user/Form/Item/ItemPassword';
import Reconfirm from '../../Component/common/Reconfirm';
import { isValueEmpty } from '../../Utils/empty';
import LoadingData from '../../Component/common/LoadingData';
import { loginRedirect } from '../../Utils/authReturn';

const CUser = (props: any) => {
  const { t } = useTranslation();
  const { isLogin, userInfo, setUserInfo } = props;
  const history = useHistory();
  const location = useLocation();
  const ref1 = useRef<FormInstance<any>>(null);
  const ref2 = useRef<FormInstance<any>>(null);
  const ref3 = useRef<FormInstance<any>>(null);

  useEffect(() => {
    if (!isLogin) {
      history.replace(loginRedirect(location));
    }
  }, [isLogin, history, location]);

  return (
    <>
      <LoadingData
        loading={userInfo === undefined}
        content={
          <div style={{ textAlign: 'center', margin: '0 auto' }}>
            <div style={{ textAlign: 'left', maxWidth: '1500px', margin: '0 auto' }}>
              <Row style={{ marginTop: 0 }}>
                <Col span={16}>
                  <Card title={t('Profile')}>
                    <Form initialValues={userInfo} ref={ref1}>
                      <Row>
                        <Col span={11}>
                          <ItemUsername editable={false} />
                          <ItemNickname required />
                          <ItemStudentId />
                          <SubmitButton
                            API={async () => {
                              return ref1.current
                                ?.validateFields()
                                .then((data: any) => {
                                  return CApi.updateProfile(data).then(() => {
                                    CApi.getProfile().then((res: any) => {
                                      setUserInfo(res);
                                    });
                                    return Promise.resolve(t('success'));
                                  });
                                })
                                .catch((e: any) => {
                                  return Promise.reject(e);
                                });
                            }}
                            btnProps={{ type: 'default' }}
                            btnText={t('update')}
                          />
                        </Col>
                        <Col span={11} offset={1}>
                          <ItemGender />
                          <ItemPhone />
                          <ItemEmail needVerify={false} editable={false} />
                          <ItemRoles editable={false} />
                        </Col>
                      </Row>
                    </Form>
                  </Card>
                  <Card style={{ marginTop: 30 }} title={t('ChangePass')}>
                    <Form ref={ref2} layout={'vertical'}>
                      <Row>
                        <Col span={11}>
                          <ItemPassword oldpass={true} />
                          <SubmitButton
                            API={async () => {
                              return ref2.current
                                ?.validateFields()
                                .then((data: any) => {
                                  return CApi.updatePassword(data).then(() => {
                                    ref2.current?.resetFields();
                                    return Promise.resolve(t('success'));
                                  });
                                })
                                .catch((e: any) => {
                                  return Promise.reject(e);
                                });
                            }}
                            btnProps={{ type: 'default' }}
                            btnText={t('update')}
                          />
                        </Col>
                        <Col offset={1} span={11}>
                          <ItemPassword newpass={true} />
                        </Col>
                      </Row>
                    </Form>
                  </Card>
                  <Card style={{ marginTop: 30 }} title={t('modifyEmail')}>
                    <Form ref={ref3} layout={'vertical'}>
                      <Row>
                        <Col span={11}>
                          <ItemPassword noConfirm={true} />
                          <SubmitButton
                            API={async () => {
                              return ref3.current
                                ?.validateFields()
                                .then((data: any) => {
                                  return CApi.updateEmail(data).then(() => {
                                    ref3.current?.resetFields();
                                    return Promise.resolve(t('success'));
                                  });
                                })
                                .catch((e: any) => {
                                  return Promise.reject(e);
                                });
                            }}
                            btnProps={{ type: 'default' }}
                            btnText={t('update')}
                          />
                        </Col>
                        <Col offset={1} span={11}>
                          <ItemEmail
                            needVerify={true}
                            emailVerifyType={'updateEmail'}
                            getEmail={async () => {
                              return ref3.current
                                ?.validateFields(['email'])
                                .then((data: any) => {
                                  return Promise.resolve(data.email);
                                })
                                .catch(() => {
                                  return Promise.reject();
                                });
                            }}
                          />
                        </Col>
                      </Row>
                    </Form>
                  </Card>
                </Col>
                <Col span={7} style={{ marginLeft: '30px' }}>
                  <Card>
                    <div style={{ textAlign: 'center', margin: '0 auto' }}>
                      <div>
                        <Avatar email={userInfo?.email} size={150} />
                        <br />
                      </div>
                      <div style={{ marginTop: 25 }}>
                        {t('weUse')} <a href={'https://cravatar.cn/'}>Cravatar</a>{' '}
                        {t('toPresentYourAvatarIcon')}
                      </div>
                    </div>
                  </Card>
                  {!isValueEmpty(userInfo?.sduId) && (
                    <Card
                      title={`SDUCAS（${t('sduUnifiedIdentityPlatform')}）`}
                      style={{ marginTop: 30 }}
                    >
                      <div style={{ textAlign: 'center', margin: '0 auto' }}>
                        {userInfo.sduId}
                        <Divider type={'vertical'} />
                        <Reconfirm
                          btnProps={{ size: 'small', type: 'link' }}
                          btnText={t('unbinding')}
                          todo={t('unbindSdusForUnifiedAuthentication')}
                          confirm={userInfo.sduId}
                          API={() => {
                            CApi.thirdPartyUnbinding({ thirdParty: 'SDUCAS' }).then(() => {
                              CApi.getProfile().then((res: any) => {
                                setUserInfo(res);
                              });
                              message.success(t('unwindingSuccessful'));
                            });
                          }}
                        />
                      </div>
                    </Card>
                  )}
                </Col>
              </Row>
            </div>
          </div>
        }
      />
    </>
  );
};

const mapStateToProps = (state: any) => {
  const UState: UserState = state.UserReducer;
  return {
    isLogin: UState.isLogin,
    userInfo: UState.userInfo,
  };
};

const mapDispatchToProps = (dispatch: any) => ({
  setUserInfo: (data: any) => dispatch({ type: 'setUserInfo', data: data }),
});

export default connect(mapStateToProps, mapDispatchToProps)(CUser);
