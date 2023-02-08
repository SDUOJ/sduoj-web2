import React, {Component, Dispatch} from 'react';

import {Badge, Button, Space} from 'antd';
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import eApi from "../../Utils/API/e-api";
import mApi from "../../Utils/API/m-api";
import ExamForm from "./Form/ExamForm";
import {getDiffSecond, TimeDiff, TimeRangeState, unix2Time} from "../../Utils/Time";
import ExportExcel from "../common/ExportExcel";
import {getExamJson} from "../../Utils/exportExam";
import {isValueEmpty} from "../../Utils/empty";
import TableWithPagination from "../common/Table/TableWithPagination";
import ModalSubmissionList from "../submission/SubmissionList/ModalSubmissionList";
import {UrlPrefix} from "../../Config/constValue";


class ExamList extends Component<any, any> {
    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            nowExamId: ""
        }
    }

    getSubmission = (submissionId: string) => {
        return eApi.getSubmission(this.state.nowExamId, submissionId)
    }

    setNowExamId = (examId: string) => {
        this.setState({
            nowExamId: examId
        })
    }

    render() {
        let columns: any[] = [
            {
                title: 'ID',
                dataIndex: 'examId',
                key: 'id',
                sorter: (a: any, b: any) => parseInt(a.examId) - parseInt(b.examId)
            },
            {
                title: '考试名',
                dataIndex: 'examTitle',
                key: 'title',
                render: (text: string, record: any) => {
                    if (this.props.type !== "manage")
                        return (
                            <Button
                                size={"small"}
                                type={"link"}
                                onClick={() => {
                                    this.props.history.push(UrlPrefix + '/exam/wait/' + record.examId.toString())
                                }}
                            >{text}</Button>
                        )
                    else return text
                }
            },
            {
                title: '开始时间',
                dataIndex: "gmtStart",
                key: 'startTime',
                render: (value: string) => {
                    return unix2Time(value)
                },
                sorter: (a: any, b: any) => parseInt(a.gmtStart) - parseInt(b.gmtStart)
            },
            {
                title: '结束时间',
                dataIndex: 'gmtEnd',
                key: 'endTime',
                render: (value: string) => {
                    return unix2Time(value)
                },
                sorter: (a: any, b: any) => parseInt(a.gmtEnd) - parseInt(b.gmtEnd)
            },
            {
                title: '考试时长',
                key: 'examLength',
                render: (value: number, record: any) => {
                    return TimeDiff(record.gmtStart, record.gmtEnd)
                },
                sorter: (a: any, b: any) => {
                    return getDiffSecond(a.gmtStart, a.gmtEnd) - getDiffSecond(b.gmtStart, b.gmtEnd)
                }
            }
        ]
        let columns2: any[] = [
            {
                title: '状态',
                key: 'state',
                render: (text: any, record: any) => {
                    const state = TimeRangeState(record.gmtStart, record.gmtEnd)
                    switch (state) {
                        case "wait":
                            return <Badge status="warning" text="等待中"/>
                        case "end":
                            return <Badge status="default" text="已结束"/>
                        case "running":
                            return <Badge status="processing" text="进行中"/>

                    }
                },
                defaultFilteredValue: ['wait', 'running'],
                filters: [
                    {
                        text: <Badge status="warning" text="等待中"/>,
                        value: 'wait',
                    },
                    {
                        text: <Badge status="default" text="已结束"/>,
                        value: 'end',
                    },
                    {
                        text: <Badge status="processing" text="进行中"/>,
                        value: 'running',
                    }
                ],
                onFilter: (value: any, record: any) => {
                    return TimeRangeState(record.gmtStart, record.gmtEnd) === value
                }
            }
        ]
        let columns3: any[] = [
            {
                title: '管理组',
                key: 'manageGroup',
                render: (text: any, record: any) => {
                    return isValueEmpty(record.managerGroupDTO) ?
                        "" : record.managerGroupDTO.groupId + " (" + record.managerGroupDTO.title + ")"
                }
            },
            {
                title: '创建者',
                dataIndex: 'username',
                key: 'owner',
            },
            {
                title: '操作',
                key: 'operator',
                render: (text: any, record: any) => {
                    const isStart = record.gmtStart < Date.now()
                    return <Space>
                        <ExamForm
                            type={'update'}
                            title={record.examTitle}
                            examID={record.examId}
                            isStart={isStart}
                        />
                        <ExportExcel
                            ButtonText={"导出结果"}
                            ButtonType={"link"}
                            getJson={() => getExamJson(record.examId)}
                            fileName={record.examTitle + "_" + Date.now() + "_结果导出"}
                        />
                        <ModalSubmissionList
                            btnProps={{type: "link"}}
                            btnText={"评测记录"}
                            name={"Exam-Submission-" + record.examId}
                            useForm={true}
                            API={(data: any) => {
                                return mApi.getExamSubmission({
                                    ...data,
                                    examId: record.examId
                                })
                            }}
                            QuerySubmissionAPI={(submissionId: string) => {
                                return eApi.getSubmission(record.examId, submissionId)
                            }}
                            problemCodeRender={(text: any, row: any) => {
                                return row.problemId
                            }}
                        />
                    </Space>
                }
            }
        ]

        if (this.props.type !== "manage") {
            columns = columns.concat(columns2)
        } else {
            columns = columns.concat(columns3)
        }

        return (
            <>
                <TableWithPagination
                    size={"small"}
                    columns={columns}
                    API={this.props.type === "manage" ? mApi.getExamList : eApi.getExamList}
                    name={"ExamList"}
                />
            </>
        )
    }
}


const mapStateToProps = (state: any) => {
    return {}
}
const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(ExamList)
    ))
