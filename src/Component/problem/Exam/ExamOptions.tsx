import React, {Component, Dispatch, useEffect} from 'react';
import {Col, Row} from "antd";
import {CheckOutlined, CloseOutlined} from "@ant-design/icons";
import "Assert/css/Options.scss"
import {connect, useSelector} from "react-redux";
import {ChoiceContent, ChoiceState} from "../../../Type/IProblem";
import {ExamState, SProInfo} from "../../../Type/IExam";
import {withRouter} from "react-router-dom";
import {examID} from "../../../Type/types";
// @ts-ignore
// import VditorPreview from 'vditor/dist/method.min'
import {MarkdownPreview} from "../../../Utils/MarkdownPreview";
import {isValueEmpty} from "../../../Utils/empty";
import {updateChoiceTodo} from "../../../Redux/Action/exam";


const ExamOptions = (props: any) => {

    const eid = props.match.params.eid
    const gid = props.match.params.gid
    const pid = props.match.params.pid

    const answerSheet = useSelector((state: any) => {
        if (!isValueEmpty(state.ExamReducer.examAnswerSheetInfo[`${eid}_${gid}`]))
            return state.ExamReducer.examAnswerSheetInfo[`${eid}_${gid}`][pid]
        return undefined
    })

    useEffect(() => {
        if (props.ChoiceContent !== undefined) {
            MarkdownPreview("Options-content-id-" + props.ChoiceID, props.ChoiceContent)
        }
    }, [props.ChoiceContent])


    let OptionsState = ""
    if (isValueEmpty(answerSheet)) OptionsState = "init"
    else {
        if (answerSheet.answer.includes(props.ChoiceID)) OptionsState = "used"
        else if (answerSheet.pass.includes(props.ChoiceID)) OptionsState = "unused"
        else OptionsState = "init"
    }


    const updateChoice = (action: "yes" | "no") => {
        props.updateChoice(`${eid}_${gid}`, pid, props.ChoiceID, action)
    }

    return (
        <div className={"Options-" + OptionsState}
             onContextMenu={() => updateChoice("no")}
             onClick={() => updateChoice("yes")}>
            <Row>
                <Col span={1}>
                    {[''].map(() => {
                        if (OptionsState === "used") return <CheckOutlined/>
                        if (OptionsState === "unused") return <CloseOutlined/>
                    })}
                </Col>
                <Col className={"Options-Choice"} span={1}>
                    {props.ChoiceID}.
                </Col>
                <Col className={"Options-content"} span={22}>
                    <div id={"Options-content-id-" + props.ChoiceID}>
                    </div>
                </Col>
            </Row>
        </div>
    )

}

const mapStateToProps = (state: any) => {
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    updateChoice: (groupKey: string, proIndex: number, choice: string, action: "yes" | "no") =>
        dispatch(updateChoiceTodo(groupKey, proIndex, choice, action))
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withRouter(ExamOptions))