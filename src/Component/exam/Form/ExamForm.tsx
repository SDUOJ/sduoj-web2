import React, {Dispatch, useState} from "react";
import {Button, FormInstance, message, Modal, Tabs} from "antd";
import {PlusOutlined,} from "@ant-design/icons"
import {withTranslation} from "react-i18next";
import moment from "moment";
import {connect} from "react-redux";
import ExamBaseForm from "./ExamBaseForm";
import ExamMemberForm from "./ExamMemberForm";
import ExamProblemForm from "./ExamProblemForm";
import mApi from "Utils/API/m-api"
import {groupSelection} from "../../../Type/Igroup";
import {examFormChecker} from "../../../Utils/Checker/examFormChecker";
import {
    examBasicType,
    examProblemGroupType,
    examProblemListType,
    examProblemType,
    examUserType,
    ProGroupTypeFtS,
    ProGroupTypeStF
} from "../../../Type/IExam";


const ExamForm = (props: any) => {

    const ExamBaseFormRef = React.createRef<FormInstance>()
    const ExamUserFormRef = React.createRef<FormInstance>()

    // 初始化状态
    const [baseInit, setBaseInit] = useState<examBasicType>({
        examDescription: "",
        examStartEndTime: [],
        examTitle: "",
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
            for (const y of x.proList) score += y.ProblemScore === undefined ? 0 : y.ProblemScore
            const index = examPGD.findIndex((value) => value.id === x.groupId)
            if (index !== -1) examPGD[index].ProblemGroupSumScore = score
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
            <Button type={props.type === "create" ? "primary" : "link"}
                    onClick={() => {
                        setExamFormVis(true)
                        if (props.type === "update") {
                            mApi.getExamInfo(props.examID).then((resData: any) => {
                                if (resData !== null) {
                                    setBaseInit({
                                        examTitle: resData.examTitle,
                                        examStartEndTime: [moment(parseInt(resData.gmtStart)), moment(parseInt(resData.gmtEnd))],
                                        examDescription: resData.description,
                                        scoreMod: resData.features === null ? "show" : resData.features.scoreMod,
                                        caseMod: resData.features === null ? "show" : resData.features.caseMod,
                                        openReport: resData.features === null ? 0 : resData.features.openReport,
                                    })
                                    let PL = [], GI = [], ManageGroup = null
                                    if (resData.participatingGroupDTOList !== null)
                                        for (const x of resData.participatingGroupDTOList) {
                                            PL.push(x.groupId)
                                            GI.push(x)
                                        }
                                    if (resData.managerGroupDTO !== null) {
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
                                        let cnt = 0
                                        for (const y of x.problems) {
                                            cnt += 1
                                            score += y.problemScore
                                            proInfo.push({
                                                id: cnt,
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
                        if (props.type === "create") return <PlusOutlined/>
                        return undefined
                    })
                }
                {props.type === "create" ? props.t("create") : props.t("Edit")}
            </Button>
            <Modal
                title={props.type === "create" ? "新建考试" : props.title}
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
                        disabled={!isDataLoad}
                        onClick={() => {
                            const base = ExamBaseFormRef.current?.getFieldsValue()
                            const user = ExamUserFormRef.current?.getFieldsValue()
                            const groupInfo: examProblemGroupType[] = examProGroupData
                            const proList: examProblemListType[] = proListData

                            // console.log("Base", base)
                            // console.log("user", user)
                            // console.log("group-info", groupInfo)
                            // console.log("group-ProList", proList)

                            if (!examFormChecker({
                                examProblemListInfo: proList,
                                examProblemGroupInfo: groupInfo,
                                examBasicInfo: base
                            })) return
                            let proGroup: any = []
                            for (const x of groupInfo) {
                                let proListX: any = []

                                const proIndex = proList.findIndex((value) => {
                                    return value.groupId === x.id
                                })
                                if (proIndex !== -1) {
                                    for (const y of proList[proIndex].proList) {
                                        proListX.push({
                                            problemCode: y.ProblemCode,
                                            problemScore: y.ProblemScore,
                                            problemTitle: y.ProblemAlias,
                                            submitNum: y.ProblemSubmitNumber,
                                            problemDescriptionId:
                                                x.ProblemGroupType === "program" ? y.ProblemDescription : undefined
                                        })
                                    }
                                }

                                proGroup.push({
                                    index: x.id,
                                    title: x.ProblemGroupName,
                                    type: ProGroupTypeFtS[x.ProblemGroupType as string],
                                    problems: proListX,
                                    groupStart: x.ProblemGroupStartEndTime === undefined
                                        ? base.examStartEndTime[0].unix() * 1000
                                        : x.ProblemGroupStartEndTime[0].unix() * 1000,
                                    groupEnd: x.ProblemGroupStartEndTime === undefined
                                        ? base.examStartEndTime[1].unix() * 1000
                                        : x.ProblemGroupStartEndTime[1].unix() * 1000,
                                    previous: x.ProblemGroupPremise === undefined
                                        ? 0 : x.ProblemGroupPremise,
                                })
                            }

                            const formData: any = {
                                examTitle: base.examTitle,
                                gmtStart: base.examStartEndTime[0].unix() * 1000,
                                gmtEnd: base.examStartEndTime[1].unix() * 1000,
                                description: base.examDescription,
                                features:{
                                    scoreMod: base.scoreMod,
                                    caseMod: base.caseMod,
                                    openReport: base.openReport
                                },
                                groupId: user?.ManageGroup,
                                participatingGroups: user?.ParticipatingGroup,
                                problemGroups: proGroup
                            }
                            // console.log(base.examStartEndTime[0].unix(), base.examStartEndTime[1].unix())
                            if (props.type === "create") {
                                mApi.createExam(formData).then((resData: any) => {
                                    setExamFormVis(false)
                                    message.success("成功")
                                    setTimeout(()=>{
                                        window.location.reload()
                                    }, 1000)
                                })
                            } else if (props.type === "update") {
                                formData['examId'] = props.examID
                                mApi.updateExam(formData).then((resData: any) => {
                                    setExamFormVis(false)
                                    message.success("成功")
                                    // props.update() TODO 换做addVersion
                                })
                            }
                        }}
                    >
                        {props.t("Submit")}
                    </Button>]
                }
            >
                <Tabs defaultActiveKey="1">
                    <Tabs.TabPane tab="基本信息" key="1">
                        <ExamBaseForm
                            getRef={getExamBaseFormRef}
                            initData={baseInit}
                            isDataLoad={isDataLoad}
                            isStart={props.isStart}
                        />
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="人员信息" key="2">
                        <ExamMemberForm
                            getRef={getExamUserFormRef}
                            initData={userInit}
                            groupInfo={groupInfo}
                            isDataLoad={isDataLoad}
                        />
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="题目信息" key="3">
                        <ExamProblemForm
                            groupData={examProGroupData}
                            setGroupData={setExamProGroupData}
                            listData={proListData}
                            setListData={setProListData}
                            isDataLoad={isDataLoad}
                            isStart={props.isStart}
                        />
                    </Tabs.TabPane>
                </Tabs>
            </Modal>
        </>
    )
        ;
}

const mapStateToProps = (state: any) => {
    return {}
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(ExamForm))
