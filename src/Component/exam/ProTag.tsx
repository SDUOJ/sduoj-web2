import React, {Dispatch} from "react";
import {Badge, Space, Tag} from "antd";
import {ExamAction} from "../../Redux/Action/exam";
import {connect, useSelector} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import {isValueEmpty} from "../../Utils/empty";
import {UrlPrefix} from "../../Config/constValue";


const ProTag = (props: any) => {

    const eid = props.match.params.eid
    const nowGid = parseInt(props.match.params.gid)
    const nowPid = parseInt(props.match.params.pid)
    const pid = props.pid, gid = props.gid

    const answerSheet = useSelector((state: any) => {
        if (!isValueEmpty(state.ExamReducer.examAnswerSheetInfo[`${eid}_${gid}`]))
            return state.ExamReducer.examAnswerSheetInfo[`${eid}_${gid}`][pid]
        return undefined
    })

    return (
        <div className={"tag-div"}>
            <Space>
                <a className={"ProTag"} href={UrlPrefix + `/exam/running/${eid}/${gid}/${pid}`}
                   onClick={props.empty ? undefined : () => {
                       props.history.push(UrlPrefix + `/exam/running/${eid}/${gid}/${pid}`)
                   }}
                >
                    <Badge dot={props.useDot ?? answerSheet?.marked}>
                        <Tag
                            color={(props.color ?? ((answerSheet === undefined || answerSheet?.answer?.length === 0) ? undefined : "green"))}>
                            {(() => {
                                if (props.empty) return (<>&nbsp;&nbsp;</>)
                                else return <>{pid + 1}</>
                            })()}
                        </Tag>
                    </Badge>
                </a>
                {props.empty && (
                    <span style={{color: "black", marginLeft: "-10px"}}>{props.exp}</span>
                )}
            </Space>
            {nowGid === gid && nowPid === pid && (
                <div className={"nowPro"}/>
            )}
        </div>
    )

}


const mapStateToProps = (state: any) => {
    return {}
}

const mapDispatchToProps = (dispatch: Dispatch<ExamAction>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(ProTag)))
