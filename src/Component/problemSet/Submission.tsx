import {withRouter} from "react-router-dom";
import cApi from "../../Utils/API/c-api";
import SubmissionList from "../submission/SubmissionList/SubmissionList";
import React from "react";

const Submission = (props: any) => {
    const problemSetId = props.match.params.problemSetId

    const SubmissionListAPI = (data: any) => {
        return cApi.getProblemSetSubmissionList({
            ...data,
            router: {psid: problemSetId, gid: -1, pid: -1},
            problemSetId: problemSetId
        })
    }
    const QuerySubmissionAPI = (submissionId: string) => {
        return cApi.getProblemSetSubmissionInfo({
            psid: problemSetId, gid: -1, pid: -1, submissionId: submissionId
        })
    }

    return (
        <div style={{marginTop: 24}}>
            <div style={{textAlign: "center", margin: "0 auto"}}>
                <div style={{textAlign: "left", maxWidth: "1500px", margin: "0 auto"}}>
                    <SubmissionList
                        name={"ProblemSetSubmission-" + problemSetId}
                        useForm={true}
                        API={SubmissionListAPI}
                        QuerySubmissionAPI={QuerySubmissionAPI}
                        problemCodeRender={(text: any) => text}
                    />
                </div>
            </div>
        </div>
    )
}

export default withRouter(Submission)
