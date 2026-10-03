import React, {useMemo} from "react";
import {withTranslation, WithTranslation} from "react-i18next";
import AutoTaskFramework, {AutoTaskTriggerProps} from "../../common/AutoTask/AutoTaskFramework";
import SummaryExportTrigger from "./SummaryExportTrigger";
import SummaryExportResult from "./SummaryExportResult";

interface SummaryExportProps extends WithTranslation {
    groupId: number;
}

const createSummaryExportTrigger = (groupId: number): React.ComponentType<AutoTaskTriggerProps> => {
    const SummaryExportTriggerAdapter: React.FC<AutoTaskTriggerProps> = ({onSubmit}) => (
        <SummaryExportTrigger groupId={groupId} onSubmit={onSubmit}/>
    );
    return SummaryExportTriggerAdapter;
};

const SummaryExport: React.FC<SummaryExportProps> = (props) => {
    const {t, groupId} = props;
    const TriggerComponent = useMemo(() => createSummaryExportTrigger(groupId), [groupId]);

    return (
        <AutoTaskFramework
            groupId={groupId}
            TriggerComponent={TriggerComponent}
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
