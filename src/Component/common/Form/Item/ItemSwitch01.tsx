import { Form } from 'antd';
import type { FormItemProps } from 'antd';
import React from 'react';
import SwitchX from './SwitchX';

interface Props extends Pick<FormItemProps, 'name' | 'label' | 'required' | 'rules'> {
  InitValue?: number;
  ck?: React.ReactNode;
  unck?: React.ReactNode;
}

const ItemSwitch01 = (props: Props) => {
  return (
    <>
      <Form.Item
        name={props.name}
        label={props.label}
        initialValue={props.InitValue ?? 0}
        required={props.required ?? true}
        rules={props.rules}
      >
        <SwitchX ck={props.ck} unck={props.unck} />
      </Form.Item>
    </>
  );
};

export default ItemSwitch01;
