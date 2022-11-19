import {Button, Modal, Space, Tabs} from "antd";
import {useEffect, useState} from "react";
import cApi from "Utils/API/c-api"
import extApi from "Utils/API/ext-api"
import GroupUserListCard from "../common/GroupUserListCard";
import {isValueEmpty} from "../../Utils/empty";
import {DownloadOutlined, LoadingOutlined} from "@ant-design/icons";
import mApi from "../../Utils/API/m-api";
import PackageDownload from "./PackageDownload";


const SubmitInfo = (props: any) => {
    const [vis, setVis] = useState<boolean>(false)

    const [groupInfo, setGroupInfo] = useState<any>(null)
    const [submitInfo, setSubmitInfo] = useState<any>(null)

    const [already, setAlready] = useState<any>(null)
    const [already0, setAlready0] = useState<any>(null)
    const [already1, setAlready1] = useState<any>(null)
    const [did_not, setDid_not] = useState<any>(null)



    useEffect(() => {
        if (vis && groupInfo === null && props.groupId !== undefined) {
            cApi.getGroupInfo({groupId: props.groupId}).then((res) => {
                setGroupInfo(res)
            })
            extApi.downloadHomework({hid: props.hid}).then((res) => {
                setSubmitInfo(res)
            })
        }
    }, [props.groupId, vis])

    useEffect(() => {
        if (groupInfo !== null && submitInfo !== null && already === null) {
            let a: any = [], a0: any = [], a1: any = [], dn: any = []
            let sbi: any = {}
            for (const x of submitInfo) {
                sbi[x["username"]] = x
            }
            for (const u of groupInfo.members) {
                if (sbi[u["username"]] === undefined) {
                    dn.push({...u})
                } else {
                    a.push({...u, ...sbi[u["username"]]})
                    const before = parseInt(sbi[u["username"]]["create_time"]) <= parseInt(props.deadline)
                    if (before) a0.push({...u, ...sbi[u["username"]]})
                    else a1.push({...u, ...sbi[u["username"]]})
                }
            }
            setAlready(a)
            setAlready0(a0)
            setAlready1(a1)
            setDid_not(dn)
        }
    }, [groupInfo, submitInfo])

    return (
        <>
            <Button type={"link"} size={"small"} onClick={() => {
                setVis(true)
            }}> 提交详情 </Button>
            <Modal
                title={props.title}
                visible={vis}
                onCancel={() => {
                    setVis(false)
                }}
                footer={
                    <Space size={24}>
                        <PackageDownload deadline={props.deadline} submitInfo={submitInfo} filename={props.filename}/>
                        <Button onClick={() => setVis(false)}> 取消 </Button>
                    </Space>
                }
                width={1200}
            >
                {already !== null && already0 !== null &&
                    already1 !== null && did_not !== null && (
                        <Tabs centered defaultActiveKey="item-1">
                            <Tabs.TabPane tab="已提交-全部" key="item-1">
                                <GroupUserListCard members={already}/>
                            </Tabs.TabPane>
                            <Tabs.TabPane tab="已提交-按时" key="item-2">
                                <GroupUserListCard members={already0}/>
                            </Tabs.TabPane>
                            <Tabs.TabPane tab="已提交-延时" key="item-3">
                                <GroupUserListCard members={already1}/>
                            </Tabs.TabPane>
                            <Tabs.TabPane tab="未提交" key="item-4">
                                <GroupUserListCard members={did_not}/>
                            </Tabs.TabPane>
                        </Tabs>
                    )}
            </Modal>
        </>
    )
}


export default SubmitInfo