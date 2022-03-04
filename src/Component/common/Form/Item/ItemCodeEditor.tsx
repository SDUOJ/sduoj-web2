import Editor from "../../Editor";
import {Form} from "antd";
import CodeEditor from "../../CodeEditor";

const ItemEditor = (props: any) => {
    return (

        <Form.Item label={props.label} name={props.name} {...props}>
            <CodeEditor lang={props.lang}/>
        </Form.Item>
    )
}

export default ItemEditor