import React, {useState} from "react";
import {Button, message, Modal, Space, Table} from "antd";
import {InboxOutlined, PlusOutlined, SyncOutlined} from "@ant-design/icons";
import Dragger from "antd/lib/upload/Dragger";
import XLSX from "xlsx";
import mApi from "../../Utils/API/m-api";
import deepClone from "Utils/deepClone";


const AutoImportObjective = () => {
    const [modalVis, setModalVis] = useState<boolean>(false);
    const [proData, setProData] = useState([]);
    const [submitProData, setSubmitProData] = useState([]);
    const [canSubmitAll, setCanSubmitAll] = useState<boolean>(true)
    // 0 init   1 wait   2 finish
    const [uploadState, setUploadState] = useState<number[]>([])


    const onImportExcel = (file: any) => {
        // 通过FileReader对象读取文件
        const fileReader = new FileReader();
        fileReader.readAsBinaryString(file); // 以二进制方式打开文件
        fileReader.onload = (event) => {
            try {
                const {result}: any = event.target;
                const workbook = XLSX.read(result, {type: 'binary'});
                let data: any = [];
                for (const sheet in workbook.Sheets) {
                    if (workbook.Sheets.hasOwnProperty(sheet)) {
                        data = data.concat(XLSX.utils.sheet_to_json(workbook.Sheets[sheet]));
                    }
                }
                message.success('上传成功！')
                let pd: any = []
                let show: any = []
                let us: any = []
                for (let i = 1; i < data.length; i++) {
                    let choice: any = {}
                    let cp: string = ""
                    for (let j = 0; j < 26; j++) {
                        const lt = String.fromCharCode('A'.charCodeAt(0) + j)
                        if (data[i]["choice-" + lt] === undefined) break
                        choice[lt] = data[i]["choice-" + lt]
                        if (cp.length !== 0) cp += "\n"
                        cp += lt + ". " + data[i]["choice-" + lt]
                    }
                    pd.push({
                        isPublic: 1,
                        problemTitle: data[i].problemTitle,
                        isMulti: data[i].isMulti,
                        description: {
                            content: data[i].content,
                            choice: choice
                        },
                        answer: data[i].answer.replaceAll(" ", "").split(','),
                        managerGroups: data[i].managerGroups === undefined ? [] : data[i].managerGroups
                    })
                    show.push({
                        problemTitle: data[i].problemTitle,
                        isMulti: data[i].isMulti === 0 ? "单选题" : "多选题",
                        description: data[i].content + "\n" + cp,
                        answer: data[i].answer,
                        managerGroups: data[i].managerGroups === undefined ? [] : data[i].managerGroups
                    })
                    us.push(0)
                }
                setProData(show)
                setSubmitProData(pd)
                setUploadState(us)
            } catch (e) {
                message.error('文件类型不正确！');
            }
        };
    }

    const close = () => {
        setModalVis(false)
        setProData([])
        setSubmitProData([])
        setUploadState([])
    }
    return (
        <>
            <Button
                type={"default"}
                onClick={() => {
                    setModalVis(true)
                }}
            >
                <PlusOutlined/> 批量导入
            </Button>
            <Modal
                title={"批量导入题目"}
                maskClosable={false}
                visible={modalVis}
                onCancel={close}
                width={1600}
                footer={
                    <Space>
                        <Button type={"default"} onClick={close}> 取消 </Button>
                        <Button
                            type={"primary"}
                            onClick={() => {
                                if (submitProData.length === 0) {
                                    message.error("未加载题目信息")
                                    return
                                }
                                for (let i = 0; i < uploadState.length; i++) if (uploadState[i] === 0) uploadState[i] = 1
                                setUploadState(deepClone(uploadState))
                                setCanSubmitAll(false)

                                const waitTime = (time: number = 100) => {
                                    return new Promise((resolve) => {
                                        setTimeout(() => {
                                            resolve(true);
                                        }, time);
                                    });
                                };

                                const run = async () => {
                                    for (let idx = 0; idx < submitProData.length; idx++) {
                                        if (uploadState[idx] === 2) continue
                                        const payload = submitProData[idx]
                                        try {
                                            await mApi.createChoiceProblem(payload)
                                            uploadState[idx] = 2
                                        } catch (e) {
                                            uploadState[idx] = 0
                                        }
                                        setUploadState(deepClone(uploadState))
                                        await waitTime(200)
                                    }
                                    setCanSubmitAll(true)
                                }
                                run()
                            }}
                            disabled={!canSubmitAll}
                        >
                            全部提交
                        </Button>
                    </Space>
                }
            >
                <Dragger
                    multiple={false}
                    accept={".xlsx"}
                    action=""
                    listType="text"
                    beforeUpload={onImportExcel}
                    showUploadList={false}
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined/>
                    </p>
                    <p className="ant-upload-text">单击或拖动文件到此区域进行上传</p>
                    <p className="ant-upload-hint">
                        请上传一个 *.xlsx 文件，示例文件在右下方下载
                    </p>
                </Dragger>
                <div style={{textAlign: "right", marginTop: "10px", marginBottom: "20px"}}>
                    <a href={require("../../Utils/API/apiAddress").default().CLIENT_SERVER + "/api/filesys/download/262337552520937533/AutoImportObjective.xlsx"}>示例文件下载</a>
                </div>
                <Table
                    size={"small"}
                    pagination={{
                        pageSize: 5
                    }}
                    columns={[
                        {
                            title: "题目名",
                            dataIndex: "problemTitle",
                            key: "problemTitle"
                        }, {
                            title: "题目类型",
                            dataIndex: "isMulti",
                            key: "isMulti"
                        }, {
                            title: "题目内容",
                            dataIndex: "description",
                            key: "description",
                            render: (text) => {
                                return <pre>{text}</pre>
                            }
                        }, {
                            title: "答案",
                            dataIndex: "answer",
                            key: "answer",
                        }, {
                            title: "管理组编号",
                            dataIndex: "managerGroups",
                            key: "managerGroups"
                        }, {
                            title: "上传",
                            key: "isUpload",
                            render: (text, record, index) => {
                                if (uploadState[index] === 0)
                                    return (
                                        <Button type={"link"} onClick={() => {
                                            uploadState[index] = 1
                                            setUploadState(deepClone(uploadState))
                                            mApi.createChoiceProblem(submitProData[index]).then((resData) => {
                                                message.success("提交成功")
                                                uploadState[index] = 2
                                                setUploadState(deepClone(uploadState))
                                            }).catch(() => {
                                                message.success("提交失败")
                                                uploadState[index] = 0
                                                setUploadState(deepClone(uploadState))
                                            })
                                        }}>
                                            提交
                                        </Button>
                                    )
                                if (uploadState[index] === 1)
                                    return <><SyncOutlined spin/> 提交中 </>
                                if (uploadState[index] === 2)
                                    return <span style={{color: "green"}}> 已创建 </span>
                            }
                        }
                    ]}
                    dataSource={proData}
                />
            </Modal>
        </>
    )
}

export default AutoImportObjective