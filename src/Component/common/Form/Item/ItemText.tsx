import { Form, Input } from 'antd';
import type { FormItemProps, InputProps } from 'antd';
import { Constraint, constraintRules } from '../../../../Config/validation/constraints';

export interface ItemTextProps extends Pick<
  FormItemProps,
  'name' | 'label' | 'required' | 'initialValue' | 'help' | 'rules'
> {
  addonAfter?: InputProps['addonAfter'];
  constraint?: Constraint;
}

const ItemText = ({ required, rules = [], addonAfter, constraint, ...props }: ItemTextProps) => {
  const isRequired = required ?? (constraint ? (constraint.required ?? false) : true);
  return (
    <Form.Item
      {...props}
      required={isRequired}
      rules={
        constraint
          ? [...constraintRules({ ...constraint, required: isRequired }), ...rules]
          : isRequired
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
};

export default ItemText;
