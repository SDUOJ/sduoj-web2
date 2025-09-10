import {Form} from "antd";
import React from "react";
import {withTranslation} from "react-i18next";
import {InboxOutlined} from "@ant-design/icons";
import Dragger from "antd/lib/upload/Dragger";

interface ItemUploadPropsType {
    label: string       // Form 标签
    name: string        // Form 字段
    accept: string      // 可接受的文件类型
}

/**
 * @function: 提交文件集合
 * */
const ItemUploadMulti = (props: ItemUploadPropsType & any) => {

    return (
        <>
            <Form.Item
                label={props.label ?? props.t("UploadFile")}
                name={props.name}
                rules={[{required: props.required}]}
            >
                <UploadPro {...props}/>
            </Form.Item>
        </>
    )
}

const UploadPro = (props: any)=>{

    const {onChange} = props

    let nameList: string[] = []
    for (let nm of props.accept.split(",")) {
        nameList.push("*" + nm)
    }
    let nameListStr = ""
    for (let x of nameList) {
        if (nameListStr.length !== 0) nameListStr += "/"
        nameListStr += x;
    }

    return (
        <>
            <Dragger
                multiple={true}
                accept={props.accept}
                action=""
                listType="text"
                showUploadList={true}
                beforeUpload={() => false}
                onChange={(info)=>{
                    let fileListOrg: any = []
                    for(let x of info.fileList){
                        fileListOrg.push(x.originFileObj)
                    }
                    onChange(fileListOrg)
                }}
            >
                <p className="ant-upload-drag-icon">
                    <InboxOutlined/>
                </p>
                <p className="ant-upload-text">{props.t("UploadDragAreaText")}</p>
                <p className="ant-upload-hint">
                    {props.t("UploadAcceptHintMulti", {nameList: nameListStr})}
                </p>
            </Dragger>
        </>
    )
}

export default withTranslation()(ItemUploadMulti)
