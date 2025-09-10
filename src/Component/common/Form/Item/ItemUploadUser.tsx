import {Button, Form, message, Space} from "antd";
import React, {useState} from "react";
import {withTranslation} from "react-i18next";
import {InboxOutlined} from "@ant-design/icons";
import Dragger from "antd/lib/upload/Dragger";
import {isValueEmpty} from "../../../../Utils/empty";
import {fileUploadWithoutMD5} from "../../../../Utils/fileUpload";
import FormExtraInfo from "../FormExtraInfo";

interface ItemUploadPropsType {
    label: string       // Form 标签
    name: string        // Form 字段
    required: boolean   // Form 必要性校验
    accept: string      // 可接受的文件类型
    max_size: number
}

const ItemUpload = (props: ItemUploadPropsType & any) => {
    const [filename, setFilename] = useState<string>("")
    return (
        <>
            <Form.Item label={props.label ?? props.t("UploadFile")} name={props.name} rules={[{required: props.required}]}> 
                <UploadFile {...props} setFilename={setFilename}/>
            </Form.Item>
            <Form.Item name={props.filenameKey} hidden>
                <FormExtraInfo
                    v={filename} setV={setFilename} eqs={(a: string, b: string) => a === b}
                />
            </Form.Item>
        </>
    )
}


const UploadFile = (props: any) => {

    const {value, onChange} = props
    const [filename, setFilename] = useState<string>("")

    let nameList: string[] = []
    for (let nm of props.accept.split(",")) {
        nameList.push("*" + nm)
    }

    const callback = (value: any) => {
        onChange(value.id)
    }
    const upload = async (file: any) => {
        if(file.size > props.max_size * 1024 * 1024){
            message.error(props.t("FileTooLargeMB", {max: props.max_size}))
            return Promise.reject("file too large")
        }
        setFilename(file.name)
        props.setFilename(file.name)
        fileUploadWithoutMD5(file, callback)
    }

    return (
        <>
            {!isValueEmpty(value) && (
                <div style={{marginBottom: 24}}>
                    <Space>
                        {filename}
                        <Button danger size={"small"} onClick={() => {
                            onChange(null)
                        }}>{props.t("delete")}</Button>
                    </Space>
                </div>
            )}
            {isValueEmpty(value) && (
                <Dragger
                    multiple={false}
                    accept={props.accept}
                    action=""
                    listType="text"
                    beforeUpload={upload}
                    showUploadList={false}
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined/>
                    </p>
                    <p className="ant-upload-text">{props.t("UploadDragAreaText")}</p>
                    <p className="ant-upload-hint">
                        {props.t("UploadAcceptHint", {nameList: nameList.join(', ')})}
                    </p>
                </Dragger>
            )}
        </>
    )
}

export default withTranslation()(ItemUpload)
