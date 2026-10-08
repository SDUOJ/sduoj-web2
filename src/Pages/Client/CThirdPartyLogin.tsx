import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, Image, message, Space, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';
import { getUrlParams } from '../../Utils/getUrlParams';
import CApi from '../../Utils/API/c-api';
import SDU_Logo from '../../Assert/img/sdu-logo.jpg';
import Register from '../../Component/user/Form/Register';
import Binding from '../../Component/user/Form/Binding';
import { UrlPrefix } from '../../Config/constValue';

const CThirdPartyLogin = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const activeRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [thirdParty, setThirdParty] = useState('');
  const [info, setInfo] = useState('');
  const [token, setToken] = useState('');
  const [sduId, setSduId] = useState('');

  useEffect(() => {
    activeRef.current = true;
    const paras = getUrlParams(location.search);
    CApi.thirdPartyLogin({
      thirdParty: paras.thirdParty,
      ticket: paras.ticket,
    })
      .then((resData: any) => {
        if (!activeRef.current) return;
        message.success(t('certificationSuccess'));
        if (resData.user === null) {
          setLoading(false);
          setThirdParty(resData.thirdParty);
          setToken(resData.token);
          if (resData.thirdParty === 'SDUCAS') {
            setInfo(resData.sduRealName + ' (' + resData.sduId + ')');
            setSduId(resData.sduId);
          }
        } else {
          history.push(UrlPrefix + '/home');
        }
      })
      .catch((err: any) => {
        if (activeRef.current) {
          setLoading(false);
          setError(err?.message || t('certificationFailed', { defaultValue: '认证失败，请重试' }));
        }
      });
    return () => {
      activeRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={'center'} style={{ width: 450 }}>
      {error ? <Card>{error}</Card> : null}
      {loading === true ? (
        <Spin tip={t('certificationIn...')}>
          <div style={{ textAlign: 'center', margin: '0 auto' }}>
            <div>
              <Image width={200} src={SDU_Logo} preview={false} />
            </div>
          </div>
        </Spin>
      ) : (
        <Card
          title={
            <span>
              {t('firstTimeUse')}
              <span style={{ fontWeight: 'bold' }}>{thirdParty}</span>
              {t('login,BindingOperationRequired')}
            </span>
          }
        >
          <Space direction={'vertical'} size={15}>
            <div style={{ textAlign: 'left' }}>
              {t('certificationInformation:')}
              <span style={{ fontWeight: 'bold' }}>{info}</span>
            </div>
            <div style={{ textAlign: 'left' }}>
              {t('statuteOfLimitationsCurrentCertification')}
              <span style={{ fontWeight: 'bold' }}>{t('5Minutes')}</span>
              {t('validWithin')}
            </div>
            <Register
              token={token}
              username={sduId}
              button={
                <Button block={true} type={'primary'}>
                  {t('registerAsANewUserAndBind')}
                </Button>
              }
            />
            <Binding
              token={token}
              button={
                <Button block={true} type={'primary'}>
                  {t('bindExistingAccounts')}
                </Button>
              }
            />
          </Space>
        </Card>
      )}
    </div>
  );
};

export default CThirdPartyLogin;
