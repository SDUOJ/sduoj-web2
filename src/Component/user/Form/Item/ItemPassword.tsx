import { Form, Input } from 'antd';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { contracts } from '../../../../Config/validation/contracts';
import { constraintRules } from '../../../../Config/validation/constraints';

const ItemPassword = (props: any) => {
  const policy =
    props.policy === 'admin'
      ? contracts.user.adminPassword
      : props.oldpass
        ? contracts.user.currentPassword
        : contracts.user.newPassword;
  let firstPassProps = { name: 'password', label: props.t('password') };
  if (props.newpass === true)
    firstPassProps = { name: 'newPassword', label: props.t('NewPassword') };
  if (props.oldpass === true) firstPassProps = { name: 'password', label: props.t('OldPassword') };
  return (
    <>
      <Form.Item
        {...firstPassProps}
        rules={constraintRules({ ...policy, required: true, notBlank: true })}
        hasFeedback
      >
        <Input.Password />
      </Form.Item>
      {props.oldpass === undefined && props.noConfirm !== true && (
        <Form.Item
          name="confirm"
          label={props.t('confirm' + (props.newpass ? 'New' : '') + 'Password')}
          dependencies={[firstPassProps.name]}
          hasFeedback
          rules={[
            { required: true, message: props.t('passwordEmptyConfirm') },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue(firstPassProps.name) === value)
                  return Promise.resolve();
                return Promise.reject(props.t('passwordDifferent'));
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>
      )}
    </>
  );
};

export default withTranslation()(ItemPassword);
