import {Button, Form} from "antd";
import React, {useState} from "react";
import Dragger from "antd/lib/upload/Dragger";
import {DownloadOutlined, InboxOutlined, LoadingOutlined} from "@ant-design/icons";
import {fileUpload, fileUploadWithoutMD5} from "../../Utils/fileUpload";
import Title from "antd/es/typography/Title";


const ItemUploadFileMulti = (props: any) => {
    return (
        <>
            <Form.Item
                label={props.label ?? "上传文件"}
                name={props.name}
                rules={[{required: props.required}]}
            >
                <UploadPro {...props}/>
            </Form.Item>
        </>
    )
}

const UploadPro = (props: any) => {

    const {value, onChange} = props

    const [data, setData] = useState<any>([])
    const [fileList, setFileList] = useState<any>([])

    const [ban, setBan] = useState<boolean>(false)

    const cb = (res: any) => {
        let nm: any = res.name.split(".")
        for(let i = 4; i < nm.length; i ++){
            nm[3] += "." + nm[i]
        }
        data.push({
            file_id: res.id,
            username: nm[0],
            real_name: nm[1],
            create_time: nm[2],
            file_name: nm[3],
            cid: props.cid
        })
        setData(data)
        if (data.length === fileList.length) {
            setBan(false)
        }
        onChange(data)
    }

    return (
        <>
            <Dragger
                multiple={true}
                action=""
                listType="text"
                showUploadList={true}
                beforeUpload={(file, FileList) => {
                    setFileList(FileList)
                    return false
                }}
            >
                <p className="ant-upload-drag-icon">
                    <InboxOutlined/>
                </p>
                <p className="ant-upload-text">单击或拖动文件到此区域进行上传</p>
                <p className="ant-upload-hint">
                    请上传一个或多个文件，单个文件的文件名为：学号.姓名.上传时间戳.文件名.zip
                </p>
            </Dragger>
            <Button
                block type={"primary"}
                style={{marginTop: 24}} disabled={ban}
                onClick={() => {
                    setData([])
                    onChange([])
                    setBan(true)
                    fileUpload(fileList, cb)
                }}
                icon={ban ? <LoadingOutlined/> : <DownloadOutlined/>}
            >
                {ban ? "上传中" : "上传文件"}
            </Button>
        </>
    )
}


export default ItemUploadFileMulti