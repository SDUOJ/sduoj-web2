import React, {Component} from "react";
import {LockOutlined} from "@ant-design/icons";
import {Button, Card, Space, Tag} from "antd";
import MApi from "../../Utils/API/m-api";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import TableWithPagination from "../../Component/common/Table/TableWithPagination";
import {TimeDiff, unix2Time} from "../../Utils/Time";
import {isValueEmpty} from "../../Utils/empty";
import UserFormProfile from "../../Component/user/Form/UserFormProfile";
import UserFormAdditional from "../../Component/user/Form/UserFormAdditional";
import mApi from "../../Utils/API/m-api";
import ModalFormUseForm from "../../Component/common/Form/ModalFormUseForm";
import ContestMFormBase from "../../Component/contest/Form/ContestMFormBase";
import ContestMFormManagement from "../../Component/contest/Form/ContestMFormManagement";
import ContestMFormProblem from "../../Component/contest/Form/ContestMFormProblem";

class MContest extends Component<any, any> {
    render() {

        let ProblemSubForm = [
            {component: <ContestMFormBase/>, label: "基本信息"},
            {component: <ContestMFormManagement/>, label: "管理"},
            {component: <ContestMFormProblem/>, label: "题目"},
        ]

        const getValue = (v: any[]) => {
            if (v === undefined) return ""
            let str = ""
            for (let x of v) {
                if (str.length !== 0) str += ","
                str += x
            }
            return str;
        }

        const splitV = (str: any[], c: string) => {
            if (str === undefined) return []
            let res: any = []
            for (let x of str) {
                for (let y of x.split(c)) res.push(y)
            }
            return res
        }

        let dataLoader = async (contestId: any) => {
            return mApi.getContest({contestId: contestId}).then((res: any) => {
                let cnt = 0;
                for (let x of res.problems) {
                    x.id = ++cnt
                }
                res.participants = getValue(res.participants ?? "")
                res.unofficialParticipants = getValue(res.unofficialParticipants ?? "")
                return Promise.resolve(res)
            })
        }

        const beforeSubmit = (value: any) => {
            const work = (v:string)=>{
                return splitV(
                    splitV(
                        splitV(
                            v.split("\t"), "\n"
                        ), ","
                    ), " "
                ).filter((v0: string) => !isValueEmpty(v0))
            }
            value.participants = work(value.participants ?? "")
            value.unofficialParticipants = work(value.unofficialParticipants ?? "")
            return value
        }

        let colData: any[] = [
            {
                title: "ID",
                dataIndex: "contestId",
                width: 50,
                responsive: ["lg", "sm", "xs"]
            },
            {
                title: this.props.t("title"),
                dataIndex: "contestTitle",
                width: "auto",
                responsive: ["lg", "sm", "xs"],
                render: (text: any, row: any) => {
                    return (
                        <Space size={8}>
                            {text}
                            {row.features.openness === "private" && (<LockOutlined style={{color: "red"}}/>)}
                            {row.features.openness === "protected" && (<LockOutlined style={{color: "orange"}}/>)}
                            {row.isPublic === 0 && (<Tag color={"red"}>私有</Tag>)}
                        </Space>
                    )
                }
            },
            {
                title: this.props.t("StartTime"),
                dataIndex: "gmtStart",
                width: "auto",
                responsive: ["lg", "sm"],
                render: (text: string) => {
                    return unix2Time(parseInt(text))
                }
            },
            {
                title: "持续时间",
                width: "auto",
                responsive: ["lg", "sm"],
                render: (text: string, rows: any) => {
                    return TimeDiff(rows.gmtStart, rows.gmtEnd)
                }
            },
            {
                title: this.props.t("Mode"),
                width: "auto",
                responsive: ["lg", "sm"],
                render: (text: string, row: any) => {
                    return <span>{row.features.mode}</span>
                }
            },
            {
                title: this.props.t("Participants"),
                dataIndex: "participantNum",
                width: "auto",
                responsive: ["lg", "sm"],
            },
            {
                title: this.props.t("ManageGroup"),
                dataIndex: "groupId",
                width: "auto",
                responsive: ["lg"],
                render: (text: string, row: any) => {
                    if (isValueEmpty(row.managerGroupDTO)) return <></>
                    else return <span>{row.managerGroupDTO.groupId} ({row.managerGroupDTO.title})</span>
                }
            },
            {
                title: this.props.t("Owner"),
                dataIndex: "username",
                width: "auto",
                responsive: ["lg"],
            },
            {
                title: this.props.t("operator"),
                width: "150px",
                render: (text: any, rows: any) => {
                    return (
                        <Space size={3}>
                            <ModalFormUseForm
                                TableName={"ContestList"}
                                width={1200}
                                title={"编辑(" + rows.contestTitle + ")"}
                                type={"update"}
                                subForm={ProblemSubForm}
                                formName={"ContestForm"}
                                updateAppendProps={{contestId: rows.contestId}}
                                dataLoader={async () => dataLoader(rows.contestId)}
                                dataSubmitter={(value: any) => {
                                    return mApi.updateContest(beforeSubmit(value))
                                }}
                            />
                            <ModalFormUseForm
                                TableName={"ContestList"}
                                width={1200}
                                title={"新建比赛 - (克隆自" + rows.contestTitle + ")"}
                                type={"fork"}
                                subForm={ProblemSubForm}
                                formName={"ContestForm"}
                                dataLoader={async () => dataLoader(rows.contestId)}
                                dataSubmitter={(value: any) => {
                                    return mApi.createContest(beforeSubmit(value))
                                }}
                            />
                        </Space>

                    )
                }
            }
        ]

        return (
            <div style={{marginTop: -20, overflow: "hidden"}}>
                <Card
                    size={"small"}
                    bordered={false}
                    title={"比赛列表"}
                    extra={
                        <>
                            <ModalFormUseForm
                                TableName={"ContestList"}
                                width={1200}
                                title={"新建比赛"}
                                type={"create"}
                                subForm={ProblemSubForm}
                                formName={"ContestForm"}
                                dataSubmitter={(value: any) => {
                                    // console.log(value)
                                    return mApi.createContest(beforeSubmit(value))
                                }}
                            />
                        </>
                    }
                >
                    <TableWithPagination
                        name={"ContestList"}
                        columns={colData}
                        API={MApi.getContestList}
                        size={"small"}
                    />
                </Card>
            </div>
        )
    }
}

export default withTranslation()(withRouter(MContest))