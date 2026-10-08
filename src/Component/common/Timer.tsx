import React from 'react';
import { Card, Space } from 'antd';
import AntdTimer from '../../Utils/AntdTimer';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface ITimer {
  name?: string; // 如：距离考试结束还有
  deadline: number;
  inline?: boolean;
  onFinish?: any;
}

const Timer = (props: ITimer) => {
  const { t } = useTranslation();
  return (
    <div className={'Timer'}>
      {[props.inline ? 'inline' : 'block'].map((key) => {
        if (props.inline) {
          return (
            <Card key={key} className={'Timer-inline-card'}>
              <Space>
                <Space className={'Timer-inline'}>
                  <ClockCircleOutlined />
                  {t('Countdown')} :
                </Space>
                <AntdTimer value={props.deadline} format={t('TimeFormat')} onFinish={props.onFinish} />
              </Space>
            </Card>
          );
        } else {
          return (
            <Card key={key}>
              <AntdTimer
                title={props.name}
                value={props.deadline}
                format={t('TimeFormat')}
                onFinish={props.onFinish}
              />
            </Card>
          );
        }
      })}
    </div>
  );
};

export default Timer;
