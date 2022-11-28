import {Button, Form, Input, Modal, Transfer} from "antd";
import {useEffect, useState} from "react";
import {DownloadOutlined, LoadingOutlined} from "@ant-design/icons";
import mApi from "../../Utils/API/m-api";
import {unix2Time} from "../../Utils/Time";

const PackageDownload = (props: any) => {
    const [vis, setVis] = useState<boolean>(false)
    const [download, setDownload] = useState<any>(null)
    const [ban, setBan] = useState<any>(false)

    const [targetKeys, setTargetKeys] = useState<string[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [splitChar, setSplitChar] = useState<string>(".")
    const [appendV, setAppendV] = useState<string>("")
    const [dataSource, setDataSource] = useState<any>([
        {key: "1", title: "学号"},
        {key: "2", title: "姓名"},
        {key: "3", title: "提交时间（毫秒时间戳）"},
        {key: "4", title: "提交时间（Y-M-D-h-m-s）"},
        {key: "5", title: "是否按时（按时/延期）"},
        {key: "6", title: "原文件名"},
    ])

    useEffect(() => {
        if (targetKeys.length !== 0) {
            let down: any = []
            for (const x of props.submitInfo) {
                let downloadFilename = ""
                if (targetKeys.indexOf("1") != -1) downloadFilename += x["username"] + splitChar
                if (targetKeys.indexOf("2") != -1) downloadFilename += x["real_name"] + splitChar
                if (targetKeys.indexOf("3") != -1) downloadFilename += x["create_time"] + splitChar
                if (targetKeys.indexOf("4") != -1)
                    downloadFilename += unix2Time(parseInt(x["create_time"])).replaceAll(":", "-").replaceAll(" ", "-") + "."
                if (targetKeys.indexOf("5") != -1) {
                    const before = parseInt(x["create_time"]) <= parseInt(props.deadline)
                    if (before) downloadFilename += "按时" + splitChar
                    else downloadFilename += "延时" + splitChar
                }
                for (let i = 0; i < targetKeys.length; i++) {
                    let item = dataSource.find((item:any)=>item.key == targetKeys[i])
                    if (parseInt(item.key) > 6) {
                        downloadFilename += item.title + splitChar
                    }
                }
                if (targetKeys.indexOf("6") != -1) {
                    downloadFilename += x['file_name']
                } else {
                    let s = x['file_name'].split(".")
                    if (splitChar != ".") {
                        downloadFilename = downloadFilename.slice(0, downloadFilename.length - splitChar.length)
                        downloadFilename += "."
                    }
                    downloadFilename += s[s.length - 1]
                }
                down.push({
                    id: x["file_id"],
                    downloadFilename: downloadFilename
                })
            }
            setBan(false)
            setDownload(down)
        } else {
            setDownload(null)
        }
    }, [targetKeys, splitChar])

    const onChange = (nextTargetKeys: string[]) => {
        setTargetKeys(nextTargetKeys)
    };

    const onSelectChange = (sourceSelectedKeys: string[], targetSelectedKeys: string[]) => {
        setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys]);
    };

    return (
        <>
            <Button type={"primary"} icon={<DownloadOutlined/>}
                    onClick={() => {
                        setVis(true)
                    }}> 打包下载 </Button>
            <Modal
                title={"设定文件名"}
                visible={vis}
                width={800}
                onCancel={() => {
                    setVis(false)
                }}
                footer={
                    <>
                        <Button type={"primary"} icon={ban ? <LoadingOutlined/> : <DownloadOutlined/>}
                                disabled={download === null || ban}
                                onClick={() => {
                                    setBan(true)
                                    mApi.zipDownloadFast(download, props.filename).then(() => {
                                        setBan(false)
                                    }).catch(() => {
                                        setBan(false)
                                    })
                                }}> {ban ? "文件生成中" : "打包下载"} </Button>
                    </>
                }
            >
                <Form layout={"vertical"}>
                    <Form.Item label={"分隔符"}>
                        <Input value={splitChar} onChange={(e) => {
                            setSplitChar(e.target.value)
                        }}/>
                    </Form.Item>
                    <Form.Item label={"添加文件名"}>
                        <Input value={appendV} onChange={(e) => {
                            setAppendV(e.target.value)
                        }}/>
                        <Button type={"primary"} size={"small"} style={{marginTop: 12}} disabled={appendV.length === 0} onClick={() => {
                            dataSource.push({
                                key: (dataSource.length + 1).toString(),
                                title: appendV
                            })
                            setDataSource(dataSource)
                            setAppendV("")
                        }}>添加</Button>
                    </Form.Item>
                    <Form.Item label={"文件名选项"}>
                        <Transfer
                            dataSource={dataSource}
                            titles={['可选文件名', '已选文件名']}
                            targetKeys={targetKeys}
                            selectedKeys={selectedKeys}
                            onChange={onChange}
                            onSelectChange={onSelectChange}
                            render={(item: any) => item.title}
                        />
                    </Form.Item>
                </Form>
                {download !== null && (
                    <div style={{marginTop: 24}}> 文件名预览：{download[0].downloadFilename}</div>
                )}
            </Modal>
        </>
    )
}

export default PackageDownload