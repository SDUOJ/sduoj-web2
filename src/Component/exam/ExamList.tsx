import React, {Component, Dispatch} from 'react';

import ProList from '@ant-design/pro-list';

import {Table, Tag, Space, Card, Badge} from 'antd';
import {ExamState, IUserExamInfo, SExamInfo} from "../../Type/IExam";
import {ConfigState} from "../../Type/IConfig";
import {UserState} from "../../Type/Iuser";
import {testLoginTodo} from "../../Redux/Action/user";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {getExamListTodo, getExamProblemListTodo} from "../../Redux/Action/exam";
import moment from "moment";
import {routerE} from "../../Config/router";

function TimeRangeState(start: number, end: number) {
    if (start > Date.now()) return "wait"
    if (end < Date.now()) return "end"
    return "running"
}

function getDiffSecond(start: number, end: number) {
    const Start: any = moment(start)
    const End: any = moment(end)
    return End.diff(Start, "second")
}


class ExamList extends Component<any, any> {

    componentDidMount() {
        this.props.getExamList()
    }

    columns = [
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
                return (
                    <a
                        onClick={() => {
                            this.props.history.push('/exam/wait/' + record.id.toString())
                        }}
                    >{text}</a>
                )
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
                const diffSecond: number = getDiffSecond(record.startTime, record.endTime)
                return Math.floor(diffSecond / 3600).toString() + "时"
                    + Math.floor((diffSecond % 3600) / 60).toString() + "分"
                    + (diffSecond % 60).toString() + "秒"
            },
            sorter: (a: SExamInfo, b: SExamInfo) => {
                return getDiffSecond(a.startTime, a.endTime) - getDiffSecond(b.startTime, b.endTime)
            }
        },
        {
            title: '考试人数',
            dataIndex: 'participantNum',
            key: 'participantNum',
            sorter: (a: SExamInfo, b: SExamInfo) => a.participantNum - b.participantNum
        },
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
    ];

    render() {

        return (
            <Card
                title={"考试列表"}
            >
                <Table
                    columns={this.columns}
                    dataSource={this.props.ExamListInfo}
                />
            </Card>

        )
    }
}


const mapStateToProps = (state: any) => {
    const State: ExamState = state.ExamReducer
    return {
        ExamListInfo: State.ExamListInfo
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    getExamList: () => dispatch(getExamListTodo())
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(ExamList)
    ))