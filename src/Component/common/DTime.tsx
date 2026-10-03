import { useEffect, useState } from 'react';
import { TimeDiff } from '../../Utils/Time';

const DTime = (props: any) => {
  const [nowTime, setNowTime] = useState<number>(Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      {props.type === 'before' && TimeDiff(props.time, nowTime)}
      {props.type === 'after' && TimeDiff(nowTime, props.time)}
    </>
  );
};

export default DTime;
