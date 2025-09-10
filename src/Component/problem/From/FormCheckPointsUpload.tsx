import {withTranslation} from "react-i18next";
import {Form, Select, Tabs} from "antd";
import {NEWLINE_CONVERT, NEWLINE_CONVERT_INDEX} from "../../../Config/constValue";
import React, {useState} from "react";
import TextArea from "antd/es/input/TextArea";
import ItemUploadMulti from "../../common/Form/Item/ItemUploadMulti";
import FormExtraInfo from "../../common/Form/FormExtraInfo";

const FormCheckPointsUpload = (props: any) => {
    const [activeKey, setActiveKey] = useState("s")

    const {Option} = Select;

    return (
        <>
            <Form.Item name={"mode"} label={"行末处理"} initialValue={NEWLINE_CONVERT_INDEX.DOS2UNIX}>
                <Select style={{width: 260}} variant={"outlined"}>
                    {Object.keys(NEWLINE_CONVERT).map((index) => {
                        return <Option value={index}>{NEWLINE_CONVERT[index].description}</Option>
                    })}
                </Select>
            </Form.Item>
            <Form.Item hidden name={"type"}>
                <FormExtraInfo v={activeKey} setV={setActiveKey} eqs={(a: string, b: string) => a === b}/>
            </Form.Item>

            <Tabs activeKey={activeKey} onChange={setActiveKey}>
                <Tabs.TabPane tab="单点上传" key="s">
                    <Form.Item label={"输入数据"} name={"input"}>
                        <TextArea rows={4}/>
                    </Form.Item>
                    <Form.Item label={"输出数据"} name={"output"}>
                        <TextArea rows={4}/>
                    </Form.Item>
                </Tabs.TabPane>
                <Tabs.TabPane tab="批量上传" key="m">
                    <ItemUploadMulti accept={".in,.out"} name={"files"} required={false}/>
                </Tabs.TabPane>
            </Tabs>

        </>
    )
}


export default withTranslation()(FormCheckPointsUpload)
