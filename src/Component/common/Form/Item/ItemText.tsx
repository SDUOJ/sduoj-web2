import { Form, Input } from 'antd';
import type { FormItemProps, InputProps } from 'antd';

export interface ItemTextProps extends Pick<
  FormItemProps,
  'name' | 'label' | 'required' | 'initialValue' | 'help' | 'rules'
> {
  addonAfter?: InputProps['addonAfter'];
}

const ItemText = ({ required = true, rules = [], addonAfter, ...props }: ItemTextProps) => (
  <Form.Item
    {...props}
    required={required}
    rules={
      required
        ? [
            {
              required: true,
              type: 'string',
              whitespace: true,
              transform: (value) => (typeof value === 'number' ? String(value) : value),
            },
            ...rules,
          ]
        : rules
    }
  >
    <Input addonAfter={addonAfter} />
  </Form.Item>
);

export default ItemText;
