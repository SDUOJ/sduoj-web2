import React from "react";
import {Button, Result} from "antd";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {getRouterPath} from "../../Config/router/router";
import {routerE} from "../../Config/router/routerE";


const EFinish = (props: any) => {

    return (
        <>
            <Result
                status="success"
                title={props.t("examSubmittedSuccess")}
                subTitle={props.t("pleaseLeaveOrderlyAndWaitForResults")}
                extra={
                    <Button
                        type="primary"
                        key="return"
                        onClick={() => {
                            props.history.push(getRouterPath(routerE, 2));
                        }}
                    >
                        {props.t("returnToExamList")}
                    </Button>
                }
            />
        </>
    )
}

export default withTranslation()(
    withRouter(EFinish)
)