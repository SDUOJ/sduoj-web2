import { Form, Input } from 'antd';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { contracts } from '../../../../Config/validation/contracts';
import { constraintRules } from '../../../../Config/validation/constraints';

const ItemStudentId = (props: any) => {
  return (
    <Form.Item
      name="studentId"
      label={props.t('student_id')}
      initialValue={props.value}
      rules={constraintRules(contracts.user.studentId)}
    >
      <Input />
    </Form.Item>
  );
};

export default withTranslation()(ItemStudentId);
