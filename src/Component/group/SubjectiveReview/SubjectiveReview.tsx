import React, {useState, useEffect} from "react";
import {withTranslation, WithTranslation} from "react-i18next";
import AutoTaskFramework from "../../common/AutoTask/AutoTaskFramework";
import SubjectiveReviewTrigger from "./SubjectiveReviewTrigger";
import cApi from "../../../Utils/API/c-api";

interface SubjectiveReviewProps extends WithTranslation {
    groupId: number;
}

const SubjectiveReview: React.FC<SubjectiveReviewProps> = (props) => {
    const {t, groupId} = props;
    const [problemSets, setProblemSets] = useState<{psid: number, name: string}[]>([]);

    useEffect(() => {
        cApi.getProblemSetListByGroup({ groupId })
            .then((res: any) => {
                const allProblemSets: {psid: number, name: string}[] = [];
                if (res && typeof res === 'object') {
                    Object.entries(res).forEach(([tag, psList]: [string, any]) => {
                        if (Array.isArray(psList)) {
                            psList.forEach((ps: any) => {
                                allProblemSets.push({
                                    psid: ps.psid,
                                    name: ps.name
                                });
                            });
                        }
                    });
                }
                setProblemSets(allProblemSets);
            })
            .catch(() => {
                setProblemSets([]);
            });
    }, [groupId]);

    return (
        <AutoTaskFramework
            groupId={groupId}
            TriggerComponent={(triggerProps) => (
                <SubjectiveReviewTrigger
                    groupId={groupId}
                    onSubmit={triggerProps.onSubmit}
                />
            )}
            createTitle={t("AutoTaskCreateTitle")}
            createHelp={t("AutoTaskCreateHelp")}
            title={t("AutoTaskListTitle")}
            taskTypeFilter={["subjective_review"]}
            getTaskTypeLabel={(type) => {
                if (type === "subjective_review") {
                    return t("AutoTaskSubjectiveReview");
                }
                return type;
            }}
            showFilters={{
                status: true,
                taskType: false,
                username: true,
                psid: true,
                problemId: false,
                scoreLe: true
            }}
            showColumns={{
                taskId: true,
                taskType: false,
                status: true,
                username: true,
                psid: true,
                problemId: false,
                score: true,
                startTime: true,
                duration: true,
                actions: true
            }}
            problemSetOptions={problemSets}
        />
    );
};

export default withTranslation()(SubjectiveReview);
