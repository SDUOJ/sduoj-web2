import { DatePicker, Form } from 'antd';
import type { FormItemProps } from 'antd';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

interface Props {
  label?: React.ReactNode;
  required?: boolean;
  startName?: FormItemProps['name'];
  endName?: FormItemProps['name'];
  prefix?: (string | number)[];
  startRules?: FormItemProps['rules'];
  endRules?: FormItemProps['rules'];
}

function timestamp(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const date = dayjs(Number(value));
  return date.isValid() ? date : null;
}

export default function ItemTimeRange({
  label,
  required = false,
  startName = 'gmtStart',
  endName = 'gmtEnd',
  prefix = [],
  startRules = [],
  endRules = [],
}: Props) {
  const { t } = useTranslation();
  const endPath = [...prefix, ...(Array.isArray(endName) ? endName : [endName])];
  const requiredRules = required ? [{ required: true, message: t('ValidationRequired') }] : [];
  return (
    <Form.Item noStyle shouldUpdate>
      {(form) => (
        <Form.Item label={label} required={required}>
          <Form.Item
            noStyle
            name={startName}
            rules={[...requiredRules, ...startRules]}
            getValueProps={(value) => ({
              value: [timestamp(value), timestamp(form.getFieldValue(endPath))],
            })}
            getValueFromEvent={(range) => {
              // Store clears too, so reset/edit cannot restore stale dates.
              form.setFieldValue(endPath, range?.[1]?.valueOf() ?? null);
              return range?.[0]?.valueOf() ?? null;
            }}
          >
            <DatePicker.RangePicker
              showTime={{ minuteStep: 5, secondStep: 30 }}
              format="YYYY-MM-DD HH:mm:ss"
            />
          </Form.Item>
          <Form.Item
            noStyle
            name={endName}
            rules={[...requiredRules, ...endRules]}
            getValueProps={(value) => ({ value: value ?? '' })}
          >
            <input type="hidden" />
          </Form.Item>
        </Form.Item>
      )}
    </Form.Item>
  );
}
