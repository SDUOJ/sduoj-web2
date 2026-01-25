import React from "react";
import { Tabs } from "antd";
import { useTranslation } from "react-i18next";
import BatchExtension from "./BatchExtension";

interface CourseManagementProps {
    groupId: string | number;
}

const CourseManagement: React.FC<CourseManagementProps> = ({ groupId }) => {
    const { t } = useTranslation();
    
    // 确保 groupId 是 number 类型
    const numericGroupId = typeof groupId === 'string' ? parseInt(groupId) : groupId;

    const items = [
        {
            key: "courseGradeExport",
            label: t("courseGradeExport"),
            children: <div style={{ padding: '20px 0' }}>{t("courseGradeExport")}</div>
        },
        {
            key: "codePlagiarismCheck",
            label: t("codePlagiarismCheck"),
            children: <div style={{ padding: '20px 0' }}>{t("codePlagiarismCheck")}</div>
        },
        {
            key: "batchExtension",
            label: t("batchExtension"),
            children: <BatchExtension groupId={numericGroupId} />
        },
        {
            key: "externalGradeImport",
            label: t("externalGradeImport"),
            children: <div style={{ padding: '20px 0' }}>{t("externalGradeImport")}</div>
        }
    ];

    return (
        <div className="course-management">
            <Tabs items={items} />
        </div>
    );
};

export default CourseManagement;
