import { Spin } from 'antd';

const LoadingData = (props: any) => {
  if (props.loading === true) {
    return (
      <div className={'page-center'} role="status" aria-live="polite" aria-busy="true">
        <Spin size={'large'} />
      </div>
    );
  } else {
    return props.content;
  }
};

export default LoadingData;
