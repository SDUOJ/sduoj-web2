import React, {Dispatch, useEffect, useState} from "react";
import {withRouter} from "react-router-dom";
import {Card, Col, Row} from "antd";
import cApi from "Utils/API/c-api"
import ProProgram from "../../Component/problem/Program/ProProgram";
import {connect} from "react-redux";
import {UserState} from "../../Type/Iuser";
import {withTranslation} from "react-i18next";
import ProProgramDetail from "../../Component/problem/Program/ProProgramDetail";
import RecentSubmissionList from "../../Component/submission/SubmissionList/RecentSubmissionList";
import {getUrlParams} from "../../Utils/getUrlParams";
import ProProgramDescription from "../../Component/problem/Program/ProProgramDescription";
import useProblemInfo from "../../Component/problem/API/getProblemInfo";

const CProblemInfo = (props: any) => {

    const problemCode = props.match.params.ProblemCode
    let descriptionId = getUrlParams(props.location.search).descriptionId
    const nameWithD = problemCode + "-" + descriptionId

    const GetProblemInfoAPI = () => {
        return cApi.getProblemInfo({problemCode: problemCode, descriptionId: descriptionId})
    }
    const SubmissionListAPI = (data: any) => {
        return cApi.getSubmissionList({
            ...data,
            problemCode: problemCode,
            username: props.username
        })
    }
    const QuerySubmissionAPI = (submissionId: string) => {
        return cApi.getSubmissionInfo({submissionId: submissionId})
    }


    const problemInfo = useProblemInfo(GetProblemInfoAPI, nameWithD)

    // 在已经拿到更新的值之后才进行传递，确保不会闪烁
    const [problemInfoX, setProblemInfoX] = useState()
    useEffect(() => {
        if (problemInfo !== undefined) {
            setProblemInfoX(problemInfo)
        }
    }, [problemInfo])

    return (
        <>
            <div style={{textAlign: "center", margin: "0 auto"}}>
                <div style={{textAlign: "left", minWidth: "1200px", maxWidth: "1500px", margin: "0 auto"}}>
                    <Row gutter={20}>
                        <Col span={17}>
                            <Card size={"small"}>
                                <ProProgram
                                    showMdExport={true}
                                    name={problemCode}
                                    nameWithD={nameWithD}
                                    GetProblemInfoAPI={GetProblemInfoAPI}
                                    SubmitAPI={(judgeTemplate: string, code: string, zipId: string) => {
                                        return cApi.submit({
                                            judgeTemplateId: judgeTemplate,
                                            code: code,
                                            problemCode: problemCode,
                                            zipFileId: zipId
                                        })
                                    }}
                                    SubmissionListAPI={SubmissionListAPI}
                                    QuerySubmissionAPI={QuerySubmissionAPI}
                                    scoreMod={"show"}
                                    testcaseMod={"show"}
                                    showInfo={false}
                                />
                            </Card>
                        </Col>
                        <Col span={7}>
                            <div>
                                <ProProgramDetail
                                    problemInfo={problemInfoX}
                                />
                            </div>
                            <div style={{marginTop: 30}}>
                                <ProProgramDescription
                                    problemInfo={problemInfoX}
                                />
                            </div>
                            {props.username !== undefined && (
                                <div style={{marginTop: 30}}>
                                    <RecentSubmissionList
                                        name={"Pro-SubmissionList-Recent-" + problemCode}
                                        API={SubmissionListAPI}
                                        QuerySubmissionAPI={QuerySubmissionAPI}
                                    />
                                </div>
                            )}
                        </Col>
                    </Row>

                </div>
            </div>
        </>
    );

}


const mapStateToProps = (state: any) => {
    const State: UserState = state.UserReducer
    return {
        username: State.userInfo?.username
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(CProblemInfo)))