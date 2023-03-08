import React, {useEffect} from 'react';
import {Col, Row} from "antd";
import {CheckOutlined, CloseOutlined} from "@ant-design/icons";
import "Assert/css/Options.scss"
import {withRouter} from "react-router-dom";
import MarkdownText from "../../../Utils/MarkdownText";


const Options = (props: any) => {

    let OptionsState = ""
    if (props.answer.orgAnswer.includes(props.ChoiceID)) OptionsState = "used"
    else OptionsState = "init"


    return (
        <div
            className={"Options-" + OptionsState + ` Options-${props.answer.realAnswer.includes(props.ChoiceID) ? "green" : ""}`}>
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
                    <MarkdownText id={"Options-content-id-" + props.ChoiceID} text={props.ChoiceContent}/>
                </Col>
            </Row>
        </div>
    )

}


export default withRouter(Options)
