import React, {Dispatch, useEffect, useState} from "react";
import {Button, FormInstance, Modal, Tabs} from "antd";
import {MenuOutlined, PlusOutlined,} from "@ant-design/icons"
import {SortableContainer, SortableElement, SortableHandle} from 'react-sortable-hoc';
import {withTranslation} from "react-i18next";
import moment from "moment";
import {connect} from "react-redux";
import {
    examBasicType,
    examProblemGroupType, examProblemInfo,
    examProblemListType, examProblemType,
    examUserType,
    ManageState, ProGroupTypeStF
} from "../../../Type/IManage";
import {formSubmitType, setExamFormVis, SubmitExamFormTodo} from "../../../Redux/Action/manage";
import ExamBaseForm from "./ExamBaseForm";
import TabPane from "@ant-design/pro-card/lib/components/TabPane";
import ExamMemberForm from "./ExamMemberForm";
import ExamProblemForm from "./ExamProblemForm";
import mApi from "Utils/API/m-api"
import {groupSelection} from "../../../Type/Igroup";

export type problemGroupUIMode = "easy" | "all"


const ExamForm = (props: formSubmitType & any) => {

    const ExamBaseFormRef = React.createRef<FormInstance>()
    const ExamUserFormRef = React.createRef<FormInstance>()

    // 初始化状态
    const [baseInit, setBaseInit] = useState<examBasicType>({
        examDescription: "",
        examStartEndTime: [],
        examTitle: ""
    })
    const [userInit, setUserInfo] = useState<examUserType>({
        ManageGroup: "",
        ParticipatingGroup: [],
    })
    const [groupInfo, setGroupInfo] = useState<groupSelection[]>([])
    const [examProGroupData, setExamProGroupData] = useState<examProblemGroupType[]>([])
    const [proListData, setProListDataA] = useState<examProblemListType[]>([])
    const [examFormVis, setExamFormVis] = useState<boolean>(false)
    const [isDataLoad, setIsDataLoad] = useState<boolean>(false)


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
                    onClick={() => {
                        setExamFormVis(true)
                        if (props.type == "update") {
                            mApi.getExamInfo(props.examID).then((resData: any) => {
                                if (resData != null) {
                                    setBaseInit({
                                        examTitle: resData.examTitle,
                                        examStartEndTime: [moment(parseInt(resData.gmtStart)), moment(parseInt(resData.gmtEnd))],
                                        examDescription: resData.description
                                    })
                                    let PL = [], GI = [], ManageGroup = null
                                    if (resData.participatingGroupDTOList != null)
                                        for (const x of resData.participatingGroupDTOList) {
                                            PL.push(x.groupId)
                                            GI.push(x)
                                        }
                                    if (resData.managerGroupDTO != null) {
                                        GI.push(resData.managerGroupDTO)
                                        ManageGroup = resData.managerGroupDTO.groupId
                                    }
                                    setUserInfo({
                                        ManageGroup: ManageGroup,
                                        ParticipatingGroup: PL
                                    })
                                    setGroupInfo(GI)

                                    let proList: examProblemListType[] = []
                                    let groupData: examProblemGroupType[] = []

                                    for (const x of resData.problemGroups) {
                                        let score = 0
                                        let proInfo: examProblemType[] = []
                                        for (const y of x.problems) {
                                            console.log("----", y)
                                            score += y.problemScore
                                            proInfo.push({
                                                id: y.index,
                                                ProblemCode: y.problemCode,
                                                ProblemAlias: y.problemTitle,
                                                ProblemDescription: y.problemDescriptionId,
                                                ProblemScore: y.problemScore,
                                                ProblemSubmitNumber: y.submitNum
                                            })
                                        }
                                        groupData.push({
                                            id: x.index,
                                            ProblemGroupName: x.title,
                                            ProblemGroupType: ProGroupTypeStF[x.type],
                                            ProblemGroupSumScore: score,
                                            ProblemGroupPremise: x.previous,
                                            ProblemGroupStartEndTime: [moment(parseInt(x.groupStart)), moment(parseInt(x.groupEnd))],
                                        })
                                        proList.push({
                                            groupId: x.index,
                                            proList: proInfo,
                                            problemInfo: [],
                                            checkedProblemCode: []
                                        })
                                    }

                                    console.log("===", proList)

                                    setProListDataA(proList)
                                    setExamProGroupData(groupData)
                                    setIsDataLoad(true)
                                }
                            })
                        } else {
                            setIsDataLoad(true)
                        }
                    }}>
                {
                    [''].map(() => {
                        if (props.type == "create") return <PlusOutlined/>
                    })
                }
                {props.type == "create" ? "新建" : "修改"}
            </Button>
            <Modal
                title={props.type == "create" ? "新建考试" : props.title}
                className={"exam-form"}
                visible={examFormVis}
                maskClosable={false}
                onCancel={() => {
                    setExamFormVis(false)
                }}
                footer={
                    [<Button
                        type="primary"
                        key="submit"
                        onClick={() => {
                            if(props.type == "create"){

                            }else if(props.type == "update"){
                                // TODO
                            }
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
                        <ExamBaseForm
                            getRef={getExamBaseFormRef}
                            initData={baseInit}
                            isDataLoad={isDataLoad}
                        />
                    </TabPane>
                    <TabPane tab="人员信息" key="2">
                        <ExamMemberForm
                            getRef={getExamUserFormRef}
                            initData={userInit}
                            groupInfo={groupInfo}
                            isDataLoad={isDataLoad}
                        />
                    </TabPane>
                    <TabPane tab="题目信息" key="3">
                        <ExamProblemForm
                            groupData={examProGroupData}
                            setGroupData={setExamProGroupData}
                            listData={proListData}
                            setListData={setProListData}
                            isDataLoad={isDataLoad}
                        />
                    </TabPane>
                </Tabs>
            </Modal>
        </>
    )
        ;
}

const mapStateToProps = (state: any) => {
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    SubmitExamForm: (type: formSubmitType) => dispatch(SubmitExamFormTodo)
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(ExamForm))
