import { Form, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { NEWLINE_CONVERT, NEWLINE_CONVERT_INDEX } from '../../../Config/constValue';
import TextArea from 'antd/es/input/TextArea';
import { contracts } from '../../../Config/validation/contracts';
import { constraintRules } from '../../../Config/validation/constraints';

const UploadForm = () => {
  const { Option } = Select;
  const { t } = useTranslation();

  return (
    <>
      <Form.Item
        name={'mode'}
        label={t('newlineHandling')}
        initialValue={NEWLINE_CONVERT_INDEX.DOS2UNIX}
        rules={[{ required: true }]}
      >
        <Select style={{ width: 260 }} variant={'outlined'}>
          {Object.keys(NEWLINE_CONVERT).map((index) => {
            return (
              <Option key={index} value={index}>
                {NEWLINE_CONVERT[index].description}
              </Option>
            );
          })}
        </Select>
      </Form.Item>
      <Form.Item
        label={t('inputData')}
        name={'input'}
        rules={[{ max: 1024 * 1024, message: t('ValidationMax', { max: 1024 * 1024 }) }]}
      >
        <TextArea rows={4} />
      </Form.Item>
      <Form.Item
        label={t('outputData')}
        name={'output'}
        rules={[{ max: 1024 * 1024, message: t('ValidationMax', { max: 1024 * 1024 }) }]}
      >
        <TextArea rows={4} />
      </Form.Item>
      <Form.Item
        label={t('noteShort')}
        name={'note'}
        rules={constraintRules({
          kind: 'string',
          maxUtf16: 255,
          source: 'oj_problem_checkpoint_rel.pcr_note',
        })}
      >
        <TextArea rows={4} />
      </Form.Item>
    </>
  );
};

export default UploadForm;
