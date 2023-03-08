import React, {useEffect} from 'react';
import {Skeleton} from "antd";
import Options from "./ExamOptions";
import {useSelector} from "react-redux";
import {withRouter} from "react-router-dom";
import MarkdownText from "../../../Utils/MarkdownText";


const ExamChoice = (props: any) => {

    const eid = props.match.params.eid
    const gid = props.match.params.gid
    const pid = props.match.params.pid

    const problemInfo = useSelector((state: any) => {
        return state.ProblemReducer.ProblemInfo[`EXAM_${eid}_${gid}_${pid}`]
    })

    const choice = problemInfo?.description?.choice

    return (
        <Skeleton active loading={problemInfo?.description === undefined}>
            <div className={"Choice"}>
                <div className={"Choice-title"}>
                    <MarkdownText id={"Choice-title-id"} text={problemInfo?.description.content}/>
                </div>
                {choice !== undefined && (
                    Object.keys(choice).map((v: any) => {
                        return (
                            <Options
                                ChoiceID={v}
                                ChoiceContent={choice[v]}
                            />
                        )
                    })
                )}
            </div>
        </Skeleton>
    )

}


export default withRouter(ExamChoice)
