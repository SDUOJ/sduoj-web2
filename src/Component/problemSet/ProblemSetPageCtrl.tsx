import {useSelector} from "react-redux";
import {UrlPrefix} from "../../Config/constValue";
import {Button, Space, Spin} from "antd";
import {LeftOutlined, RightOutlined} from "@ant-design/icons";
import React from "react";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";

const ProblemSetPageCtrl = (props: any) => {
    const psid = props.match.params.problemSetId
    const gid = parseInt(props.match.params.problemGroupId)
    const pid = parseInt(props.match.params.problemId)


    const groupsInfo = useSelector((state: any) => {
        return state.ProblemSetReducer.problemSetInfo[psid]?.groupInfo
    })
    const groupNumber = groupsInfo?.length
    const groupInfo = groupsInfo?.[gid]

    const ProNumber = groupInfo?.problemInfo?.length
    const Loading = (ProNumber === undefined)

    const jump = (GID: number, PID: number) => {
        props.history.push(UrlPrefix + `/problemSet/${psid}/problem/${GID}/${PID}`)
    }

    return (
        <div className={"ExamPageCtrl"}>
            <Space>
                <Button shape="round" type={"primary"}
                        disabled={(pid === 0 && gid === 0) || Loading}
                        onClick={() => {
                            if (pid === 0) jump(gid - 1, groupsInfo[gid - 1].problemInfo.length - 1)
                            else jump(gid, pid - 1)
                        }}
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
                        disabled={(pid + 1 === ProNumber && gid + 1 === groupNumber) || Loading}
                        onClick={() => {
                            if (pid + 1 === ProNumber) jump(gid + 1, 0)
                            else jump(gid, pid + 1)
                        }}
                >
                    {props.t("NextProblem")} <RightOutlined/>
                </Button>
            </Space>
        </div>
    )
}

export default withTranslation()(withRouter(ProblemSetPageCtrl))
