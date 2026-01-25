import React from "react";
import {withRouter} from "react-router-dom";
import {withTranslation} from "react-i18next";
import {Result} from "antd";
import useProblemSetInfo from "./API/getProblemSetInfo";
import Loading from "../../Utils/Loading";
import LatePermissionList from "../common/LatePermissionList";

const LatePermission = (props: any) => {
    const {t, match} = props;
    const psid = parseInt(match.params.problemSetId, 10);
    const problemSetInfo = useProblemSetInfo(match.params.problemSetId);

    if (problemSetInfo === undefined) {
        return <Loading/>;
    }

    if (problemSetInfo?.isAdmin !== true) {
        return (
            <Result
                status={"403"}
                title={"403"}
                subTitle={t("noPermission")}
            />
        );
    }

    return <LatePermissionList psid={psid} showTitle={true} showAddButton={true} />;
};

export default withTranslation()(withRouter(LatePermission));
