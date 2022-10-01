import {withTranslation} from "react-i18next";
import ItemTitle from "../../common/Form/Item/ItemTitle";
import ItemText from "../../common/Form/Item/ItemText";
import {Form, Select} from "antd";
import ItemCodeEditor from "../../common/Form/Item/ItemCodeEditor";
import ItemUpload from "../../common/Form/Item/ItemUpload";

const TemplateMForm = (props: any) => {
    return (
        <>
            <ItemTitle/>
            <ItemText label={"备注"} name={"comment"} required={false}/>
            <Form.Item label={"文件后缀"} name={"acceptFileExtensions"} required>
                <Select mode="tags" style={{ width: '100%' }} />
            </Form.Item>
            <ItemCodeEditor
                label={"shell脚本"}
                name={"shellScript"}
                lang={"shell"}
                className={"JudgeTemplateCodeEditor"}
                rules={[{required: true}]}
            />
            <ItemUpload
                label={"ZIP资源文件"}
                name={"zipFileId"}
                required={false}
                accept={".zip"}
                use={"admin"}
                downloadFileSuffix={".zip"}
            />

        </>
    )
}

export default withTranslation()(TemplateMForm)