import {Button, Form, Space} from "antd";
import React from "react";
import {withTranslation} from "react-i18next";
import {InboxOutlined} from "@ant-design/icons";
import Dragger from "antd/lib/upload/Dragger";
import {isValueEmpty} from "../../../../Utils/empty";
import apiAddress from "../../../../Utils/API/apiAddress";
import {fileUpload, fileUploadWithoutMD5} from "../../../../Utils/fileUpload";

interface ItemUploadPropsType{
    label: string       // Form 标签
    name: string        // Form 字段
    required: boolean   // Form 必要性校验
    accept: string      // 可接受的文件类型
    use: "user" | "admin"       // 上传文件着
    downloadFilename?: string    // 下载时的文件名
    downloadFileSuffix: string  // 下载的文件后缀
}

const ItemUpload = (props: ItemUploadPropsType & any) => {

    return (
        <>
            <Form.Item label={props.label ?? "上传文件"} name={props.name} rules={[{required: props.required}]}>
                <UploadFile {...props}/>
            </Form.Item>
        </>
    )
}



const UploadFile = (props: any) => {

    const {value, onChange} = props

    let nameList: string[] = []
    for (let nm of props.accept.split(",")) {
        nameList.push("*" + nm)
    }

    const callback = (value: any) => {
        onChange(value.id)
    }
    const upload = (file: any) => {
        if (props.ues === "user")
            fileUploadWithoutMD5(file, callback)
        else fileUpload([file], callback)
    }

    const filename = (props.downloadFilename ?? value) + props.downloadFileSuffix;

    return (
        <>
            {!isValueEmpty(value) && (
                <div style={{marginBottom: 24}}>
                    <div> 已有文件： </div>
                    <Space>
                        {filename}
                        <Button size={"small"} onClick={() => {
                            const path = apiAddress().CLIENT_SERVER + "/api/filesys/download/" + value + "/" + filename
                            window.open(path)
                        }}>下载</Button>
                        <Button danger size={"small"} onClick={() => {
                            onChange(null)
                        }}>删除</Button>
                    </Space>

                </div>
            )}
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
                <p className="ant-upload-text">单击或拖动文件到此区域进行上传</p>
                <p className="ant-upload-hint">
                    请上传一个 {nameList} 文件
                </p>
            </Dragger>
        </>
    )
}

export default withTranslation()(ItemUpload)
