import React, {Dispatch, useEffect, useState} from "react";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {Table} from "antd";
import {SExamInfo} from "../../Type/IExam";
import moment from "moment";
import {getDiffSecond, TimeDiff} from "../../Utils/Time";
import mApi from "../../Utils/API/m-api";
import ExamForm from "../exam/Form/ExamForm";
import ObjectiveForm from "./ObjectiveForm";


const ProblemList = (props: any) => {

    const [total, setTotal] = useState<number>(0)
    const [objectiveProList, setObjectiveProList] = useState()

    const getList = (pageNow: number, pageSize: number | undefined) => {
        mApi.getChoiceList({
            pageNow: pageNow,
            pageSize: pageSize == undefined ? 20 : pageSize
        }).then((resData: any) => {
            if (resData != null) {
                setTotal(resData.totalNum)
                setObjectiveProList(resData.rows)
            }
        })
    }

    useEffect(() => {
        getList(1, 20)
    }, [])

    let columnsObjective: any[] = [
        {
            title: '题号',
            dataIndex: 'problemCode',
            key: 'id',
        },
        {
            title: '标题',
            dataIndex: 'problemTitle',
            key: 'problemTitle',
        },
        {
            title: '题目类型',
            dataIndex: "isMulti",
            key: 'startTime',
            render: (value: number) => {
                return value === 1 ? "多选题" : "单选题"
            },
        },
        {
            title: '创建人',
            dataIndex: 'username',
            key: 'username',
        },
        {
            title: '操作',
            key: 'operator',
            render: (value: number, record: any) => {
                if (props.type == "objective")
                    return <ObjectiveForm type={'update'} title={record.problemTitle} problemCode={record.problemCode}/>
            }
        }
    ]

    return (
        <>
            <Table
                pagination={{
                    showQuickJumper: true,
                    defaultCurrent: 1,
                    defaultPageSize: 20,
                    total: total,
                    onChange: getList,
                    showSizeChanger: true
                }}
                columns={props.type == "objective" ? columnsObjective : undefined}
                dataSource={
                    props.type == "objective" ?
                        objectiveProList :
                        undefined
                }
            />
        </>
    )

}

const mapStateToProps = (state: any) => {
}
const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(ProblemList)
    ))