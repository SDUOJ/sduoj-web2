import {Form, Select} from "antd";
import {useTranslation} from "react-i18next";
import {NEWLINE_CONVERT, NEWLINE_CONVERT_INDEX} from "../../../Config/constValue";
import TextArea from "antd/es/input/TextArea";

const UploadForm = () => {

    const {Option} = Select;
    const { t } = useTranslation()

    return (
        <>
            <Form.Item name={"mode"} label={t("newlineHandling")} initialValue={NEWLINE_CONVERT_INDEX.DOS2UNIX}>
                <Select style={{width: 260}} variant={"outlined"}>
                    {Object.keys(NEWLINE_CONVERT).map((index) => {
                        return <Option value={index}>{NEWLINE_CONVERT[index].description}</Option>
                    })}
                </Select>
            </Form.Item>
            <Form.Item label={t("inputData")} name={"input"}>
                <TextArea rows={4}/>
            </Form.Item>
            <Form.Item label={t("outputData")} name={"output"}>
                <TextArea rows={4}/>
            </Form.Item>
            <Form.Item label={t("noteShort")} name={"note"}>
                <TextArea rows={4}/>
            </Form.Item>
        </>
    )
}

export default UploadForm
