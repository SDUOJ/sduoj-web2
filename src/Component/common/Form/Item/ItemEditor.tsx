import { useContext } from 'react';
import Editor, { EditorDocumentIdentityContext } from '../../Editor';
import { Form } from 'antd';
import { constraintRules } from '../../../../Config/validation/constraints';

const ItemEditor = (props: any) => {
  const contextualDocumentIdentity = useContext(EditorDocumentIdentityContext);
  const fieldIdentity = Array.isArray(props.name)
    ? props.name.map((part: string | number) => String(part)).join('.')
    : String(props.name ?? 'content');

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
      <Editor
        height={props.height ?? 500}
        id={props.id}
        documentIdentity={props.documentIdentity ?? contextualDocumentIdentity}
        fieldIdentity={props.fieldIdentity ?? fieldIdentity}
      />
    </Form.Item>
  );
};

export default ItemEditor;
