import React, {Component, Dispatch, useEffect} from 'react';
import {Skeleton} from "antd";
import Options from "./ExamOptions";
import {connect, useSelector} from "react-redux";
import {ChoiceContent, IGetProInfo, ProblemState, ProContent} from "../../../Type/IProblem";
import {ExamState, SProInfo} from "../../../Type/IExam";
import {withRouter} from "react-router-dom";
import {MarkdownPreview} from "../../../Utils/MarkdownPreview";


const ExamChoice = (props: any) => {

    const eid = props.match.params.eid
    const gid = props.match.params.gid
    const pid = props.match.params.pid

    const problemInfo = useSelector((state: any) => {
        return state.ProblemReducer.ProblemInfo[`EXAM_${eid}_${gid}_${pid}`]
    })

    useEffect(() => {
        if (problemInfo?.description !== undefined) {
            MarkdownPreview("Choice-title-id", problemInfo.description.content)
        }
    }, [problemInfo])

    const choice = problemInfo?.description?.choice

    return (
        <Skeleton active loading={problemInfo?.description === undefined}>
            <div className={"Choice"}>
                <div className={"Choice-title"} id={"Choice-title-id"}>

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