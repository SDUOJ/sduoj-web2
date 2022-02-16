import {withTranslation} from "react-i18next";
import {ReloadOutlined} from "@ant-design/icons";
import {Button, message} from "antd";
import React from "react";
import {ck} from "../../../Utils/empty";

const ReJudge = (props: any) => {
    return (
        <>
            <Button
                icon={<ReloadOutlined/>}
                onClick={() => {
                    const RejudgeNumber = ck(props.data.length, props.data?.submissionIds?.length)
                    if (RejudgeNumber === 0) {
                        message.error("未选择任何项")
                    } else {
                        props.API(props.data).then((res: any) => {
                            message.success("正在重测" + RejudgeNumber + "个提交")
                            props.afterSuccess !== undefined && props.afterSuccess()
                        })
                    }
                }}
            >
                重测
            </Button>
        </>
    )
}

export default withTranslation()(ReJudge)