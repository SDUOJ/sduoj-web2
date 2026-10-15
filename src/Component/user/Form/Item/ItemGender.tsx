import { Form, Radio } from 'antd';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { Sex } from '../../../../Type/Iuser';
import { ManOutlined, QuestionOutlined, WomanOutlined } from '@ant-design/icons';
import { contracts } from '../../../../Config/validation/contracts';
import { constraintRules } from '../../../../Config/validation/constraints';

const ItemGender = (props: any) => {
  const options = [
    { label: <ManOutlined style={{ color: 'rgb(30,112,185)' }} />, value: Sex.Male },
    { label: <WomanOutlined style={{ color: 'rgb(230,0,126)' }} />, value: Sex.Female },
    { label: <QuestionOutlined />, value: Sex.Unknown },
  ];
  return (
    <Form.Item name="gender" label={props.t('sex')} rules={constraintRules(contracts.user.gender)}>
      <Radio.Group options={options} optionType="button" />
    </Form.Item>
  );
};

export default withTranslation()(ItemGender);
