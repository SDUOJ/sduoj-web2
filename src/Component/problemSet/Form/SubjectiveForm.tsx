import { withTranslation, WithTranslation } from 'react-i18next';
import { Button, Form, InputNumber, Radio, Select } from 'antd';
import React from 'react';
import ItemEditor from '../../common/Form/Item/ItemEditor';
import CellEditTable from '../../common/Table/CellEditTable';
import { PlusOutlined } from '@ant-design/icons';
import { contracts } from '../../../Config/validation/contracts';
import { constraintRules } from '../../../Config/validation/constraints';
import { autolabFieldRules } from '../../../Config/validation/fields';

const SubjectiveForm = (props: WithTranslation & { type?: string }) => {
  const typeData = Form.useWatch<number>('type');
  const tableColumns = [
    {
      title: props.t('fileName'),
      dataIndex: 'name',
      editable: true,
      valueType: 'text',
      formItemProps: () => ({ rules: autolabFieldRules('fileInfo', 'name') }),
    },
    {
      title: props.t('fileSizeLimitMB'),
      dataIndex: 'maxSizeMB',
      editable: true,
      valueType: 'digit',
      formItemProps: () => ({ rules: autolabFieldRules('fileInfo', 'maxSizeMB') }),
    },
    {
      title: props.t('fileType'),
      dataIndex: 'fileType',
      tooltip: props.t('fileTypeTooltip'),
      editable: true,
      valueType: 'select',
      formItemProps: () => ({ rules: autolabFieldRules('fileInfo', 'fileType') }),
      valueEnum: {
        pdf: { text: props.t('pdfDocument'), status: 'Success' },
        docx: { text: props.t('wordDocx'), status: 'Error' },
        doc: { text: props.t('wordDoc'), status: 'Error' },
        zip: { text: props.t('zipArchive'), status: 'Error' },
      },
    },
  ];
  return (
    <>
      <Form.Item
        name="type"
        label={props.t('Type')}
        rules={autolabFieldRules('subjective_base', 'type')}
      >
        <Radio.Group disabled={props.type === 'update'}>
          <Radio value={0}>{props.t('fileAnswer')}</Radio>
          <Radio value={1}>{props.t('textAnswer')}</Radio>
          <Radio value={2}>{props.t('acceptanceAnswer')}</Radio>
        </Radio.Group>
      </Form.Item>

      {typeData === 0 && (
        <>
          <Form.Item
            name={['config', 'fileList']}
            label={props.t('submitFileList')}
            rules={autolabFieldRules('subjective_config', 'fileList')}
          >
            <CellEditTable
              columns={tableColumns}
              rowKey={'id'}
              toolBar={(actionRef: any) => {
                return [
                  <Button
                    key="add"
                    type={'dashed'}
                    block
                    icon={<PlusOutlined />}
                    onClick={() => {
                      actionRef.current?.addEditRecord?.(
                        {
                          id: Date.now(),
                        },
                        { newRecordType: 'dataSource' },
                      );
                    }}
                  >
                    {props.t('addSubmitFile')}
                  </Button>,
                ];
              }}
              rowButton={(row: any, value: any, onChange: any) => {
                return [];
              }}
            />
          </Form.Item>
        </>
      )}

      {typeData === 1 && (
        <>
          <Form.Item
            name={['config', 'maxCount']}
            label={props.t('maxWordCountLimit')}
            rules={constraintRules(contracts.subjective.maxCount)}
          >
            <InputNumber precision={0} />
          </Form.Item>
        </>
      )}

      {typeData === 2 && (
        <>
          <Form.Item
            name={['config', 'review_queue']}
            label={props.t('reviewQueue')}
            tooltip={props.t('reviewQueueTooltip')}
            rules={autolabFieldRules('subjective_config', 'review_queue')}
          >
            <Select mode="tags" placeholder={props.t('reviewQueuePlaceholder')} />
          </Form.Item>
        </>
      )}

      <ItemEditor
        label={props.t('ProblemDescription')}
        name={'description'}
        constraint={contracts.subjective.description}
      />
    </>
  );
};

export default withTranslation()(SubjectiveForm);
