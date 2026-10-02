import React, { useEffect, useState } from 'react';
import { Alert, Button, Spin } from 'antd';
import { Link } from 'react-router-dom';
import { aiPlatform } from '../../../Utils/API/ai-platform';

export default function AIRouteBoundary({
  children,
  allowSuspended = false,
}: {
  children: React.ReactNode;
  allowSuspended?: boolean;
}) {
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
          !['/v2/account/assistant', '/v2/manage/settings/assistant'].includes(
            window.location.pathname,
          )
        ) {
          setStatus('suspended');
          setError(account.reason || 'AI 使用资格已暂停');
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
  }, [attempt, allowSuspended]);
  if (status === 'loading')
    return (
      <div role="status" aria-label="检查 OJ 登录" style={{ padding: 32 }}>
        <Spin />
      </div>
    );
  if (status !== 'ready')
    return (
      <main style={{ padding: 24 }}>
        <Alert type="warning" message={error} showIcon />
        <Link to="/v2/home">返回 OJ</Link>
        {' · '}
        <Link to="/v2/account/assistant">账户状态</Link>
        {status === 'error' && (
          <Button onClick={() => setAttempt((value) => value + 1)}>重试</Button>
        )}
      </main>
    );
  return <>{children}</>;
}
