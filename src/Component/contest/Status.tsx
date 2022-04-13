import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import SubmissionList from "../submission/SubmissionList/SubmissionList";
import cApi from "../../Utils/API/c-api";
import {Button} from "antd";
import React from "react";
import {UrlPrefix} from "../../Config/constValue";

const Status = (props: any) =>{

    const contestId = props.match.params.contestId

    const SubmissionListAPI = (data: any) => {
        return cApi.getContestSubmissionList({
            ...data,
            // username: props.username,
            contestId: contestId
        })
    }
    const QuerySubmissionAPI = (submissionId: string) => {
        return cApi.getContestSubmissionInfo({contestId: contestId, submissionId: submissionId})
    }

    return (
        <>
            <SubmissionList
                name={"ContestSubmission-" + contestId}
                useForm={true}
                API={SubmissionListAPI}
                QuerySubmissionAPI={QuerySubmissionAPI}
                // RejudgeAPI={(data: any)=>{
                //     return cApi.rejudgeInContest({contestId: contestId, submissionIds: data})
                // }}
                InvalidateAPI={(data: any)=>{
                    return cApi.invalidateContestSubmission({submissionId: data['submissionId'], contestId: contestId})
                }}
                problemCodeRender={(text: any) => {
                    return (
                        <Button type={"text"} size={"small"} onClick={() => {
                           props.history.push(UrlPrefix + "/contest/" +contestId + "/problem/" + text)
                        }}>
                            {String.fromCharCode('A'.charCodeAt(0) + parseInt(text) - 1)}
                        </Button>
                    )
                }}
            />
        </>
    )
}

export default withTranslation()(withRouter(Status))