import React from "react";
import {withTranslation, WithTranslation} from "react-i18next";
import AutoTaskFramework from "../../common/AutoTask/AutoTaskFramework";
import SummaryExportTrigger from "./SummaryExportTrigger";
import SummaryExportResult from "./SummaryExportResult";

interface SummaryExportProps extends WithTranslation {
    groupId: number;
}

const SummaryExport: React.FC<SummaryExportProps> = (props) => {
    const {t, groupId} = props;

    return (
        <AutoTaskFramework
            groupId={groupId}
            TriggerComponent={(triggerProps) => (
                <SummaryExportTrigger
                    groupId={groupId}
                    onSubmit={triggerProps.onSubmit}
                />
            )}
            ResultComponent={SummaryExportResult}
            createTitle={t("SummaryExportCreateTitle")}
            createHelp={t("SummaryExportCreateHelp")}
            title={t("SummaryExportTaskList")}
            taskTypeFilter={["summary_report"]}
            getTaskTypeLabel={(type) => {
                if (type === "summary_report") {
                    return t("AutoTaskSummaryExport");
                }
                return type;
            }}
            showColumns={{
                problemId: false,
                psid: false,
                username: false
            }}
            showFilters={{
                username: false,
                psid: false,
                problemId: false
            }}
        />
    );
};

export default withTranslation()(SummaryExport);
