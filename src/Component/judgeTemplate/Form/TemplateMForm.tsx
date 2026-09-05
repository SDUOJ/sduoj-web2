import { withTranslation } from 'react-i18next';
import ItemTitle from '../../common/Form/Item/ItemTitle';
import ItemText from '../../common/Form/Item/ItemText';
import { Form, Select } from 'antd';
import ItemCodeEditor from '../../common/Form/Item/ItemCodeEditor';
import ItemUpload from '../../common/Form/Item/ItemUpload';
import { contracts } from '../../../Config/validation/contracts';
import { constraintRules } from '../../../Config/validation/constraints';

const TemplateMForm = (props: any) => {
  return (
    <>
      <ItemTitle constraint={contracts.judgeTemplate.title} />
      <ItemText
        label={props.t('note')}
        name={'comment'}
        required={false}
        constraint={contracts.judgeTemplate.comment}
      />
      <Form.Item
        label={props.t('FileSuffix')}
        name={'acceptFileExtensions'}
        rules={constraintRules(contracts.judgeTemplate.acceptFileExtensions)}
      >
        <Select mode="tags" style={{ width: '100%' }} />
      </Form.Item>
      <ItemCodeEditor
        label={props.t('ShellScript')}
        name={'shellScript'}
        constraint={contracts.judgeTemplate.shellScript}
        lang={'cpp'}
        className={'JudgeTemplateCodeEditor'}
        rules={[{ required: true }]}
      />
      <ItemUpload
        label={props.t('ZipResourceFile')}
        name={'zipFileId'}
        required={false}
        accept={'.zip'}
        use={'admin'}
        downloadFileSuffix={'.zip'}
      />
    </>
  );
};

export default withTranslation()(TemplateMForm);
