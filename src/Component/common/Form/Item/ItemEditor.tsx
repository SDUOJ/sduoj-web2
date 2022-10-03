import Editor from "../../Editor";
import {Form} from "antd";

const ItemEditor = (props: any) => {
    return (

        <Form.Item label={props.label} name={props.name}>
            <Editor height={500} id={props.id}/>
        </Form.Item>
    )
}

export default ItemEditor