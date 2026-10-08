import React from 'react';
import { Spin } from 'antd';

const Loading = () => {
  return (
    <div className={'page-center'} role="status" aria-live="polite" aria-busy="true">
      <Spin delay={500} size={'large'}>
        {' '}
      </Spin>
    </div>
  );
};

export default Loading;
