import React, {Dispatch, useState} from "react";
import {Button, FormInstance, Modal, Tabs} from "antd";
import {MenuOutlined, PlusOutlined,} from "@ant-design/icons"
import {SortableContainer, SortableElement, SortableHandle} from 'react-sortable-hoc';
import {withTranslation} from "react-i18next";
import moment from "moment";
import {connect} from "react-redux";
import {examProblemGroupType, examProblemListType, ManageState} from "../../../Type/IManage";
import {formSubmitType, setExamFormVis, SubmitExamFormTodo} from "../../../Redux/Action/manage";
import ExamBaseForm from "./ExamBaseForm";
import TabPane from "@ant-design/pro-card/lib/components/TabPane";
import ExamMemberForm from "./ExamMemberForm";
import ExamProblemForm from "./ExamProblemForm";

// 新建 与 修改
export type ObjectiveFormMode = "new" | "modify"
// export type ElementType = "group" | "objective" | "program"
export type problemGroupProType = "objective" | "program"
export type problemGroupUIMode = "easy" | "all"


const ExamForm = (props: formSubmitType & any) => {

    const ExamBaseFormRef = React.createRef<FormInstance>()
    const ExamUserFormRef = React.createRef<FormInstance>()
    const [examProGroupData, setExamProGroupData] = useState<examProblemGroupType[]>([])
    const [proListData, setProListDataA] = useState<examProblemListType[]>([])

    const setProListData = (data: examProblemListType[]) => {
        let examPGD = examProGroupData
        for (const x of data) {
            let score = 0
            for (const y of x.proList) score += y.ProblemScore == undefined ? 0 : y.ProblemScore
            const index = examPGD.findIndex((value) => value.id == x.groupId)
            if (index != -1) examPGD[index].ProblemGroupSumScore = score
        }
        setExamProGroupData(examPGD)
        setProListDataA(data)
    }

    function getExamBaseFormRef() {
        return ExamBaseFormRef
    }

    function getExamUserFormRef() {
        return ExamUserFormRef
    }

    return (
        <>
            <Button type={props.type == "create" ? "primary" : "link"}
                    onClick={() => props.setExamFormVis(true)}>
                {
                    [''].map(() => {
                        if (props.type == "create") return <PlusOutlined/>
                    })
                }
                {props.type == "create" ? "新建" : "修改"}
            </Button>
            <Modal
                title={props.type == "create" ? "新建考试" : props.examBasicInfo.examTitle}
                className={"exam-form"}
                visible={props.examFormVis}
                maskClosable={false}
                onCancel={() => {
                    props.setExamFormVis(false)
                }}
                footer={
                    [<Button
                        type="primary"
                        key="submit"
                        onClick={() => {
                            console.log("Base", ExamBaseFormRef.current?.getFieldsValue())
                            console.log("user", ExamUserFormRef.current?.getFieldsValue())
                            console.log("group-info", examProGroupData)
                            console.log("group-ProList", proListData)
                        }}
                    >
                        {props.t("Submit")}
                    </Button>]
                }
            >
                <Tabs defaultActiveKey="1">
                    <TabPane tab="基本信息" key="1">
                        <ExamBaseForm getRef={getExamBaseFormRef}/>
                    </TabPane>
                    <TabPane tab="人员信息" key="2">
                        <ExamMemberForm getRef={getExamUserFormRef}/>
                    </TabPane>
                    <TabPane tab="题目信息" key="3">
                        <ExamProblemForm
                            groupData={examProGroupData}
                            setGroupData={setExamProGroupData}
                            listData={proListData}
                            setListData={setProListData}
                        />
                    </TabPane>
                </Tabs>


            </Modal>
        </>
    )
        ;
}

const mapStateToProps = (state: any) => {
    const State: ManageState = state.ManageReducer
    return {
        // examBasicInfo: State.examFrom.examBasicInfo,
        examFormVis: State.examData.examFormVis
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    setExamFormVis: (data: boolean) => dispatch({
        type: "setExamFormVis",
        data: data
    }),
    SubmitExamForm: (type: formSubmitType) => dispatch(SubmitExamFormTodo)
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(ExamForm))
