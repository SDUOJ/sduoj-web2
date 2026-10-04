import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Spin } from 'antd';
import { Link } from 'react-router-dom';
import { aiPlatform } from '../../../Utils/API/ai-platform';
import { UrlPrefix } from '../../../Config/constValue';

export default function AIRouteBoundary({
  children,
  allowSuspended = false,
}: {
  children: React.ReactNode;
  allowSuspended?: boolean;
}) {
  const { t } = useTranslation();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setStatus('loading');
    setError('');
    aiPlatform
      .account()
      .then((account) => {
        if (!active) return;
        if (
          account.status === 'suspended' &&
          !allowSuspended &&
          ![`${UrlPrefix}/account/assistant`, `${UrlPrefix}/manage/settings/assistant`].includes(
            window.location.pathname,
          )
        ) {
          setStatus('suspended');
          setError(account.reason || t('aiBoundarySuspended'));
        } else {
          setStatus('ready');
        }
      })
      .catch((reason) => {
        if (active) {
          setStatus('error');
          setError(String(reason));
        }
      });
    return () => {
      active = false;
    };
  }, [attempt, allowSuspended, t]);
  if (status === 'loading')
    return (
      <div role="status" aria-label={t('aiBoundaryChecking')} style={{ padding: 32 }}>
        <Spin />
      </div>
    );
  if (status !== 'ready')
    return (
      <main style={{ padding: 24 }}>
        <Alert type="warning" message={error} showIcon />
        <Link to={`${UrlPrefix}/home`}>{t('aiBoundaryHome')}</Link>
        {' · '}
        <Link to={`${UrlPrefix}/account/assistant`}>{t('aiBoundaryAccount')}</Link>
        {status === 'error' && (
          <Button onClick={() => setAttempt((value) => value + 1)}>{t('aiBoundaryRetry')}</Button>
        )}
      </main>
    );
  return <>{children}</>;
}
