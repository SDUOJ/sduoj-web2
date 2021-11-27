import React, {Component, Dispatch} from 'react';
import {ExamState, SProInfo} from "../../Redux/Reducer/exam";
import {ProgramContent} from "../../Type/IProblem";
import {connect} from "react-redux";
import {WithTranslation, withTranslation} from "react-i18next";
import {Space} from "antd";
import Paragraph from "antd/lib/typography/Paragraph";

interface ICopyableCode {
    code: string
}

class CopyableCode extends Component<ICopyableCode & WithTranslation, any> {

    render() {
        return (
            <>
                <Paragraph style={{fontSize: "14px"}}>
                    <pre style={{width: "100%"}}>{this.props.code}</pre>
                </Paragraph>
                <div style={{position: "absolute", right: "2%", top:"43px"}}>
                    <Paragraph
                        copyable={
                            {
                                tooltips: [this.props.t("Copy"), this.props.t("Copied")],
                                text: this.props.code
                            }}
                    >
                    </Paragraph>
                </div>
            </>
        )
    }
}

const mapStateToProps = (state: any) => {
    const State: ExamState = state.ExamReducer
    const NowPro = (State.proInfo as SProInfo[])[State.TopProblemIndex - 1]
    const content = (NowPro.content as ProgramContent)
    return {}
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(CopyableCode))