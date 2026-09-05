import { Form, Input } from 'antd';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { contracts } from '../../../../Config/validation/contracts';
import { constraintRules } from '../../../../Config/validation/constraints';

const ItemNickname = (props: any) => {
  return (
    <Form.Item
      name="nickname"
      label={props.t('nickname')}
      initialValue={props.value}
      rules={constraintRules({
        ...contracts.user.nickname,
        required: props.required,
        notBlank: props.required,
      })}
    >
      <Input />
    </Form.Item>
  );
};

export default withTranslation()(ItemNickname);
