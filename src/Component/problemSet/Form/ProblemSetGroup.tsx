import { withTranslation } from 'react-i18next';
import ItemTitle from '../../common/Form/Item/ItemTitle';
import React, { useState } from 'react';
import { Form, Select } from 'antd';
import FormExtraInfo from '../../common/Form/FormExtraInfo';
import ItemTimeRange from '../../common/Form/Item/ItemTimeRange';
import ItemProblemAdd from '../../problem/From/Item/ItemProblemAdd';
import { contracts } from '../../../Config/validation/contracts';

const ProblemSetGroup = (props: any) => {
  const [type, setType] = useState<any>('');
  return (
    <>
      <ItemTitle label={props.t('title')} constraint={contracts.problemGroup.name} />
      <Form.Item hidden name={''}>
        <FormExtraInfo v={type} setV={setType} eqs={(a: any, b: any) => a === b} />
      </Form.Item>
      <ItemTimeRange label={props.t('TimeRange')} />

      <Form.Item
        name={'type'}
        label={props.t('ProblemType')}
        rules={[{ required: true, message: props.t('ValidationRequired') }]}
      >
        <Select
          value={type}
          onChange={(value, option) => {
            setType(value);
          }}
        >
          <Select.Option value={'objective'}>{props.t('ObjectiveQuestions')}</Select.Option>
          <Select.Option value={'subjective'}>{props.t('SubjectiveQuestions')}</Select.Option>
          <Select.Option value={'program'}>{props.t('ProgrammingQuestions')}</Select.Option>
        </Select>
      </Form.Item>

      <ItemProblemAdd name={'problems'} editable={true} problemType={'program'} />

      <Form.Item label={props.t('PracticeTimeSetting')}></Form.Item>
    </>
  );
};

export default withTranslation()(ProblemSetGroup);
