import { Form } from 'antd';
import React from 'react';
import TimeSettingX from './TimeSettingX';

const ItemTimeSetting = (props: any) => {
  return (
    <>
      <Form.Item name={props.name} label={props.label} rules={props.rules}>
        <TimeSettingX title={props.label} />
      </Form.Item>
    </>
  );
};

export default ItemTimeSetting;
