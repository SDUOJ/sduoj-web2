import Editor from '../../Editor';
import { Form } from 'antd';
import { constraintRules } from '../../../../Config/validation/constraints';

const ItemEditor = (props: any) => {
  return (
    <Form.Item
      label={props.label}
      name={props.name}
      required={props.constraint?.required ?? props.required}
      rules={[
        ...(props.constraint ? constraintRules(props.constraint) : []),
        ...(props.rules ?? []),
      ]}
    >
      <Editor height={500} id={props.id} />
    </Form.Item>
  );
};

export default ItemEditor;
