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
                        message.error(props.t("noItemSelected"))
                    } else {
                        props.API(props.data).then((res: any) => {
                            message.success(props.t("retesting") + RejudgeNumber + props.t("submissionInProgress"))
                            props.afterSuccess !== undefined && props.afterSuccess()
                        })
                    }
                }}
            >
                {props.t("retesting")}
            </Button>
        </>
    )
}

export default withTranslation()(ReJudge)
