import {Form, Select} from "antd";
import {NEWLINE_CONVERT, NEWLINE_CONVERT_INDEX} from "../../../Config/constValue";
import TextArea from "antd/es/input/TextArea";

const UploadForm = () => {

    const {Option} = Select;

    return (
        <>
            <Form.Item name={"mode"} label={"行末处理"} initialValue={NEWLINE_CONVERT_INDEX.DOS2UNIX}>
                <Select style={{width: 260}} bordered={true}>
                    {Object.keys(NEWLINE_CONVERT).map((index) => {
                        return <Option value={index}>{NEWLINE_CONVERT[index].description}</Option>
                    })}
                </Select>
            </Form.Item>
            <Form.Item label={"输入数据"} name={"input"}>
                <TextArea rows={4}/>
            </Form.Item>
            <Form.Item label={"输出数据"} name={"output"}>
                <TextArea rows={4}/>
            </Form.Item>
            <Form.Item label={"注"} name={"note"}>
                <TextArea rows={4}/>
            </Form.Item>
        </>
    )
}

export default UploadForm
