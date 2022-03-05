import React from "react";
import {Button, Space, Spin} from "antd";
import {LeftOutlined, RightOutlined} from "@ant-design/icons"
import {useSelector} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";


const ExamPageCtrl = (props: any) => {
    const eid = parseInt(props.match.params.eid)
    const gid = parseInt(props.match.params.gid)
    const pid = parseInt(props.match.params.pid)

    const problemList = useSelector((state: any) => {
        return state.ExamReducer.examProListInfo[`${eid}_${gid}`]
    })

    const ProNumber = problemList?.proList?.length
    const Loading = (ProNumber === undefined)

    const jump = (PID: number) => {
        props.history.push(`/v2/exam/running/${eid}/${gid}/${PID}`)
    }

    return (
        <div className={"ExamPageCtrl"}>
            <Space>
                <Button shape="round" type={"primary"}
                        disabled={pid === 0 || Loading}
                        onClick={() => jump(pid - 1)}
                >
                    <LeftOutlined/> {props.t("PreviousProblem")}
                </Button>
                <Spin spinning={Loading}>
                    <div className={"ExamPageCtrl-Number"}>
                        <span> {pid + 1} </span>
                        /
                        <span> {ProNumber} </span>
                    </div>
                </Spin>
                <Button shape="round" type={"primary"}
                        disabled={pid + 1 === ProNumber || Loading}
                        onClick={() => jump(pid + 1)}
                >
                    {props.t("NextProblem")} <RightOutlined/>
                </Button>
            </Space>
        </div>
    )
}

export default withTranslation()(withRouter(ExamPageCtrl))