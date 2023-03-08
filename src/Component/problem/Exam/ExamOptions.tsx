import React, {Dispatch, useEffect} from 'react';
import {Col, Row} from "antd";
import {CheckOutlined, CloseOutlined} from "@ant-design/icons";
import "Assert/css/Options.scss"
import {connect, useSelector} from "react-redux";
import {withRouter} from "react-router-dom";
import {isValueEmpty} from "../../../Utils/empty";
import {updateChoiceTodo} from "../../../Redux/Action/exam";
import MarkdownText from "../../../Utils/MarkdownText";


const ExamOptions = (props: any) => {

    const eid = props.match.params.eid
    const gid = props.match.params.gid
    const pid = props.match.params.pid

    const answerSheet = useSelector((state: any) => {
        if (!isValueEmpty(state.ExamReducer.examAnswerSheetInfo[`${eid}_${gid}`]))
            return state.ExamReducer.examAnswerSheetInfo[`${eid}_${gid}`][pid]
        return undefined
    })


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
                        return undefined
                    })}
                </Col>
                <Col className={"Options-Choice"} span={1}>
                    {props.ChoiceID}.
                </Col>
                <Col className={"Options-content"} span={22}>
                    <MarkdownText id={"Options-content-id-" + props.ChoiceID} text={props?.ChoiceContent}/>
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
