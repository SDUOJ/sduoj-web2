import React, {Component, Dispatch} from 'react';

import ProList from '@ant-design/pro-list';

import {Table, Tag, Space, Card, Badge, Button, Popover} from 'antd';
import {ExamState, IUserExamInfo, SExamInfo, SExamManageInfo} from "../../Type/IExam";
import {ConfigState} from "../../Type/IConfig";
import {UserState} from "../../Type/Iuser";
import {testLoginTodo} from "../../Redux/Action/user";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import moment from "moment";
import eApi from "../../Utils/API/e-api";
import mApi from "../../Utils/API/m-api";
import ExamForm from "./Form/ExamForm";
import {getDiffSecond, TimeDiff, TimeRangeState} from "../../Utils/Time";
import ExportExcel from "../common/ExportExcel";
import {getColMap, getData, getExamJson} from "../../Utils/exportExam";
import SubmissionList from "../submission/SubmissionList";
import SubmissionModal from "../submission/SubmissionModal";


class ExamList extends Component<any, any> {


    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            ExamListInfo: [],
            ExamManageListInfo: [],
            total: 0,
            nowExamId: ""
        }
        this.getList = this.getList.bind(this)
    }

    getSubmission = (submissionId: string) => {
        return eApi.getSubmission(this.state.nowExamId, submissionId)
    }

    setNowExamId = (examId: string)=>{
        this.setState({
            nowExamId: examId
        })
    }

    update = () => {
        this.getList(1, 20)
    }

    getList = (pageNow: number, pageSize: number | undefined) => {
        if (this.props.type == "manage") {
            mApi.getExamList({
                pageNow: pageNow,
                pageSize: pageSize == undefined ? 20 : pageSize
            }).then((resData: any) => {
                if (resData != null) {
                    let data: SExamManageInfo[] = []
                    this.setState({total: resData.totalNum})
                    for (const x of resData.rows) {
                        data.push({
                            id: x.examId,
                            startTime: parseInt(x.gmtStart),
                            endTime: parseInt(x.gmtEnd),
                            title: x.examTitle,
                            manageGroup: x.managerGroupDTO == undefined ?
                                "" : x.managerGroupDTO.groupId + " (" + x.managerGroupDTO.title + ")",
                            owner: x.username
                        })
                    }
                    this.setState({ExamManageListInfo: data})
                }
            })
        } else {
            eApi.getExamList({
                pageNow: pageNow,
                pageSize: pageSize == undefined ? 20 : pageSize
            }).then((resData: any) => {
                if (resData != null) {
                    let data: SExamInfo[] = []
                    this.setState({total: resData.totalNum})
                    for (const x of resData.rows) {
                        data.push({
                            id: x.examId,
                            startTime: parseInt(x.gmtStart),
                            endTime: parseInt(x.gmtEnd),
                            title: x.examTitle
                        })
                    }
                    this.setState({ExamListInfo: data})
                }
            })
        }
    }

    componentDidMount() {
        this.getList(1, 20)
    }


    render() {

        let columns: any[] = [
            {
                title: 'ID',
                dataIndex: 'id',
                key: 'id',
                sorter: (a: SExamInfo, b: SExamInfo) => parseInt(a.id) - parseInt(b.id)
            },
            {
                title: '考试名',
                dataIndex: 'title',
                key: 'title',
                render: (text: string, record: SExamInfo) => {
                    if (this.props.type != "manage")
                        return (
                            <a
                                onClick={() => {
                                    this.props.history.push('/v2/exam/wait/' + record.id.toString())
                                }}
                            >{text}</a>
                        )
                    else return text
                }
            },
            {
                title: '开始时间',
                dataIndex: "startTime",
                key: 'startTime',
                render: (value: number) => {
                    return moment(value).format('YYYY-MM-DD HH:mm:ss')
                },
                sorter: (a: SExamInfo, b: SExamInfo) => a.startTime - b.startTime
            },
            {
                title: '结束时间',
                dataIndex: 'endTime',
                key: 'endTime',
                render: (value: number) => {
                    return moment(value).format('YYYY-MM-DD HH:mm:ss')
                },
                sorter: (a: SExamInfo, b: SExamInfo) => a.endTime - b.endTime
            },
            {
                title: '考试时长',
                key: 'examLength',
                render: (value: number, record: SExamInfo) => {
                    return TimeDiff(record.startTime, record.endTime)
                },
                sorter: (a: SExamInfo, b: SExamInfo) => {
                    return getDiffSecond(a.startTime, a.endTime) - getDiffSecond(b.startTime, b.endTime)
                }
            }
        ]
        let columns2: any[] = [
            {
                title: '状态',
                key: 'id',
                render: (text: any, record: SExamInfo) => {
                    const state = TimeRangeState(record.startTime, record.endTime)
                    switch (state) {
                        case "wait":
                            return <Badge status="warning" text="等待中"/>
                        case "end":
                            return <Badge status="default" text="已结束"/>
                        case "running":
                            return <Badge status="processing" text="进行中"/>

                    }
                },
                defaultFilteredValue:['wait', 'running'],
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
                onFilter: (value: any, record: SExamInfo) => {
                    return TimeRangeState(record.startTime, record.endTime) == value
                }
            }
        ]
        let columns3: any[] = [
            {
                title: '管理组',
                dataIndex: 'manageGroup',
                key: 'manageGroup',
            },
            {
                title: '创建者',
                dataIndex: 'owner',
                key: 'owner',
            },
            {
                title: '操作',
                key: 'operator',
                render: (text: any, record: SExamInfo) => {
                    const isStart = record.startTime < Date.now()
                    // console.log(isStart)
                    return <Space>
                        <ExamForm
                            type={'update'}
                            title={record.title}
                            examID={record.id}
                            update={this.update}
                            isStart={isStart}
                        />
                        <ExportExcel
                            ButtonText={"导出结果"}
                            ButtonType={"link"}
                            getJson={() => getExamJson(record.id)}
                            fileName={record.title + "_" + Date.now() + "_结果导出"}
                        />
                        <SubmissionList examId={record.id} setNowExamId={this.setNowExamId}/>
                    </Space>
                }
            }
        ]
        if (this.props.type != "manage") {
            columns = columns.concat(columns2)
        } else {
            columns = columns.concat(columns3)
        }

        return (
            <>
                <SubmissionModal getSubmission={this.getSubmission}/>
                <Table
                    pagination={{
                        showQuickJumper: true,
                        defaultCurrent: 1,
                        defaultPageSize: 20,
                        total: this.state.total,
                        onChange: this.getList,
                        showSizeChanger: true
                    }}
                    columns={columns}
                    dataSource={
                        this.props.type == "manage" ?
                            this.state.ExamManageListInfo :
                            this.state.ExamListInfo
                    }
                />
            </>
        )
    }
}


const mapStateToProps = (state: any) => {
}
const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(ExamList)
    ))