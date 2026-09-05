import { Form } from 'antd';
import CodeEditor from '../../CodeEditor';
import { constraintRules } from '../../../../Config/validation/constraints';

const ItemEditor = (props: any) => {
  const { constraint, ...formProps } = props;
  return (
    <Form.Item
      label={props.label}
      name={props.name}
      {...formProps}
      rules={[...(constraint ? constraintRules(constraint) : []), ...(props.rules ?? [])]}
    >
      <CodeEditor lang={props.lang} />
    </Form.Item>
  );
};

export default ItemEditor;
