import React, {useState} from "react";
import {Button, message, Modal, Space, Table} from "antd";
import {InboxOutlined, PlusOutlined, SyncOutlined} from "@ant-design/icons";
import Dragger from "antd/lib/upload/Dragger";
import XLSX from "xlsx";
import mApi from "../../Utils/API/m-api";
import deepClone from "Utils/deepClone";
import {withTranslation} from "react-i18next";


const AutoImportObjective = (props: any) => {
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
                message.success(props.t('UploadSuccess'))
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
                        isMulti: data[i].isMulti === 0 ? props.t('SingleChoice') : props.t('MultipleChoice'),
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
                message.error(props.t('FileTypeIncorrect'));
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
                <PlusOutlined/> {props.t('BatchImport')}
            </Button>
            <Modal
                title={props.t('BatchImportProblems')}
                maskClosable={false}
                visible={modalVis}
                onCancel={close}
                width={1600}
                footer={
                    <Space>
                        <Button type={"default"} onClick={close}> {props.t('Cancel')} </Button>
                        <Button
                            type={"primary"}
                            onClick={() => {
                                if (submitProData.length === 0) {
                                    message.error(props.t('ProblemInfoNotLoaded'))
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
                            {props.t('SubmitAll')}
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
                    <p className="ant-upload-text">{props.t('UploadDragAreaText')}</p>
                    <p className="ant-upload-hint">
                        {props.t('UploadExcelHint')}
                    </p>
                </Dragger>
                <div style={{textAlign: "right", marginTop: "10px", marginBottom: "20px"}}>
                    <a href={require("../../Utils/API/apiAddress").default().CLIENT_SERVER + "/api/filesys/download/262337552520937533/AutoImportObjective.xlsx"}>{props.t('ExampleFileDownload')}</a>
                </div>
                <Table
                    size={"small"}
                    pagination={{
                        pageSize: 5
                    }}
                    columns={[
                        {
                            title: props.t('problemName'),
                            dataIndex: "problemTitle",
                            key: "problemTitle"
                        }, {
                            title: props.t('ProblemType'),
                            dataIndex: "isMulti",
                            key: "isMulti"
                        }, {
                            title: props.t('ProblemContentLabel'),
                            dataIndex: "description",
                            key: "description",
                            render: (text) => {
                                return <pre>{text}</pre>
                            }
                        }, {
                            title: props.t('answer'),
                            dataIndex: "answer",
                            key: "answer",
                        }, {
                            title: props.t('ManagerGroupIds'),
                            dataIndex: "managerGroups",
                            key: "managerGroups"
                        }, {
                            title: props.t('Upload'),
                            key: "isUpload",
                            render: (text, record, index) => {
                                if (uploadState[index] === 0)
                                    return (
                                        <Button type={"link"} onClick={() => {
                                            uploadState[index] = 1
                                            setUploadState(deepClone(uploadState))
                                            mApi.createChoiceProblem(submitProData[index]).then((resData) => {
                                                message.success(props.t('SubmitSuccess'))
                                                uploadState[index] = 2
                                                setUploadState(deepClone(uploadState))
                                            }).catch(() => {
                                                message.success(props.t('SubmitFailed'))
                                                uploadState[index] = 0
                                                setUploadState(deepClone(uploadState))
                                            })
                                        }}>
                                            {props.t('Submit')}
                                        </Button>
                                    )
                                if (uploadState[index] === 1)
                                    return <><SyncOutlined spin/> {props.t('Submitting')} </>
                                if (uploadState[index] === 2)
                                    return <span style={{color: "green"}}> {props.t('Created')} </span>
                            }
                        }
                    ]}
                    dataSource={proData}
                />
            </Modal>
        </>
    )
}

export default withTranslation()(AutoImportObjective)