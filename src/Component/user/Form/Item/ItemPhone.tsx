import { Form, Input } from 'antd';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { contracts } from '../../../../Config/validation/contracts';
import { constraintRules } from '../../../../Config/validation/constraints';

const ItemPhone = (props: any) => {
  return (
    <Form.Item
      name="phone"
      label={props.t('phone')}
      initialValue={props.value}
      rules={constraintRules({ ...contracts.user.phone, required: props.required })}
    >
      <Input />
    </Form.Item>
  );
};

export default withTranslation()(ItemPhone);
