import React from 'react';
import { withTranslation } from 'react-i18next';
import ItemTitle from '../../../common/Form/Item/ItemTitle';
import ItemEditor from 'Component/common/Form/Item/ItemEditor';
import ItemText from '../../../common/Form/Item/ItemText';
import { Form, Radio } from 'antd';
import { contracts } from '../../../../Config/validation/contracts';
import { constraintRules } from '../../../../Config/validation/constraints';

const GroupFormProfile = (props: any) => {
  return (
    <>
      <ItemTitle constraint={contracts.group.title} />
      <ItemText
        name="description"
        label={props.t('GroupDescriptionLabel')}
        constraint={contracts.group.description}
      />
      <Form.Item
        name="openness"
        label={props.t('Openness')}
        rules={constraintRules(contracts.group.openness)}
      >
        <Radio.Group>
          <Radio value={0}>{props.t('OpenPublicOption')}</Radio>
          <Radio value={1}>{props.t('OpenApplyOption')}</Radio>
          <Radio value={2}>{props.t('OpenPrivateOption')}</Radio>
        </Radio.Group>
      </Form.Item>
      <ItemEditor
        label={props.t('GroupAnnouncement')}
        name="markdown"
        constraint={contracts.group.markdown}
      />
    </>
  );
};

export default withTranslation()(GroupFormProfile);
