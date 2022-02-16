import React, {Component, Dispatch} from "react";
import {Button, Card, Skeleton} from "antd";
import {StarFilled, StarOutlined} from '@ant-design/icons';
import ExamChoice from "./ExamChoice";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import ExamProgram from "./ExamProgram";
import {withRouter} from "react-router-dom";
import {examID} from "../../../Type/types";
import eApi from "../../../Utils/API/e-api";


class ExamProblem extends Component<any, any> {

    componentDidMount() {
        document.oncontextmenu = function (e) {/*屏蔽浏览器默认右键事件*/
            e = e || window.event;
            return false;
        };
    }

    render() {
        const eid = this.props.match.params.eid
        const gid = this.props.match.params.gid
        const pid = this.props.match.params.pid
        return (
            <Skeleton active loading={this.props.Loading}>
                <Card
                    className={"Problem"}
                    title={
                        <>
                            【{this.props.t(this.props.proType)}】
                            {
                                [''].map(() => {
                                    if (this.props.index !== undefined) {
                                        return <>{this.props.index + 1}.</>
                                    }
                                })
                            }
                            {
                                [''].map(() => {
                                    if (this.props.score !== undefined && this.props.isScoreVisible === true) {
                                        return <>（{this.props.score}{this.props.t(this.props.score === 1 ? "point" : "points")}）</>
                                    }
                                })
                            }
                        </>
                    }
                    extra={
                        this.props.proType !== "Program" && this.props.flag === true && (
                            <Button type="default"
                                    shape="round"
                                    icon={this.props.isFlag ? <StarFilled/> : <StarOutlined/>}
                                    danger={this.props.isFlag}
                                    onClick={() => this.props.flipFlag(this.props.match.params.eid)}
                            >
                                {this.props.t("Mark")}
                            </Button>
                        )
                    }>

                    {
                        [''].map(() => {
                            switch (this.props.proType) {
                                case "Program":
                                    return (
                                        <ExamProgram
                                            getProInfo={async () => {
                                                return eApi.getProInfo({
                                                    examId: eid,
                                                    groupIndex: gid,
                                                    problemIndex: pid
                                                })
                                            }}
                                            getSubmissionList={async ()=>{
                                                return eApi.getSubmissionList({
                                                    examId: eid,
                                                    problemGroup: gid,
                                                    problemIndex: pid
                                                })
                                            }}
                                            proName={`EXAM_${eid}_${gid}_${pid}`}
                                        />
                                    )
                                case "SingleChoice":
                                case "MultipleChoice":
                                    return (
                                        <ExamChoice/>
                                    )
                            }
                        })
                    }
                </Card>
            </Skeleton>
        )
    }
}


const mapStateToProps = (state: any) => {

}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    flipFlag: (examId: examID) => dispatch({
        type: "flipFlag",
        examId: examId
    }),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(ExamProblem)))