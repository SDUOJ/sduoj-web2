import React, { useState } from 'react';
import { useForm } from 'antd/es/form/Form';
import { Button, Form, InputNumber, Modal, Space } from 'antd';
import { unix2Time } from '../../../../Utils/Time';
import ItemTimeRange from './ItemTimeRange';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { withTranslation, WithTranslation } from 'react-i18next';
import { autolabFieldRules } from '../../../../Config/validation/fields';

interface TimeWindow {
  tm_start: number;
  tm_end: number;
  weight: number;
}

interface Props extends WithTranslation {
  title?: React.ReactNode;
  value?: TimeWindow[];
  onChange?: (value: TimeWindow[]) => void;
}

const TimeSettingX = (props: Props) => {
  const { value, onChange } = props;
  const [open, setOpen] = useState<boolean>(false);
  const [form] = useForm<{ data: TimeWindow[] }>();
  return (
    <>
      <Space>
        {value && value.length !== 0 && (
          <span>
            {unix2Time(value[0].tm_start)} - {unix2Time(value[value.length - 1].tm_end)}
          </span>
        )}
        <Button
          type={'link'}
          size={'small'}
          onClick={() => {
            form.resetFields();
            form.setFieldsValue({ data: value });
            setOpen(true);
          }}
        >
          {props.t('SetTime')}
        </Button>
      </Space>

      <Modal
        title={props.title ?? props.t('TimeSettingTitle')}
        open={open}
        maskClosable={false}
        onCancel={() => {
          setOpen(false);
        }}
        onOk={() => {
          form
            .validateFields()
            .then((values) => {
              onChange?.(values.data ?? []);
              setOpen(false);
            })
            .catch(() => {
              // Keep the editor open with field errors and the current draft.
            });
        }}
        destroyOnHidden={true}
      >
        <Form form={form} style={{ maxWidth: 600 }} autoComplete="off">
          <Form.List name="data">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <ItemTimeRange
                      prefix={['data']}
                      startName={[name, 'tm_start']}
                      endName={[name, 'tm_end']}
                      startRules={autolabFieldRules('timeSettingType', 'tm_start')}
                      endRules={autolabFieldRules('timeSettingType', 'tm_end')}
                    />
                    <Form.Item
                      name={[name, 'weight']}
                      rules={autolabFieldRules('timeSettingType', 'weight')}
                    >
                      <InputNumber placeholder={props.t('Weight')} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    {props.t('AddTime')}
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </>
  );
};

export default withTranslation()(TimeSettingX);
