import React, {useEffect, useState} from "react";
import {Button, Descriptions, Space, Spin, Typography, message} from "antd";
import {DownloadOutlined} from "@ant-design/icons";
import {withTranslation, WithTranslation} from "react-i18next";
import cApi from "../../../Utils/API/c-api";
import apiAddress from "../../../Utils/API/apiAddress";

interface SummaryExportResultProps extends WithTranslation {
    taskId: string;
    taskDetail: any;
    onClose: () => void;
}

const SummaryExportResult: React.FC<SummaryExportResultProps> = (props) => {
    const {t, taskDetail, onClose} = props;
    const [fileId, setFileId] = useState<string | null>(null);
    const [groupName, setGroupName] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    const parsedPayload = React.useMemo(() => {
        if (!taskDetail?.logs) return null;
        const payloadLog = taskDetail.logs.find((log: any) => log.tag === "payload");
        if (!payloadLog?.content) return null;
        try {
            return JSON.parse(payloadLog.content);
        } catch {
            return null;
        }
    }, [taskDetail]);

    useEffect(() => {
        // 从任务详情的日志中提取 fileId
        if (taskDetail?.logs && Array.isArray(taskDetail.logs)) {
            const resultLog = taskDetail.logs.find((log: any) => log.tag === "result");
            if (resultLog?.content) {
                try {
                    const parsed = JSON.parse(resultLog.content);
                    if (parsed.fileId) {
                        setFileId(parsed.fileId);
                    }
                } catch (error) {
                    // 忽略解析错误
                }
            }
        }
    }, [taskDetail]);

    useEffect(() => {
        if (parsedPayload?.groupId) {
            cApi.getGroupInfo({ groupId: parsedPayload.groupId.toString() })
                .then((res: any) => {
                    if (res && res.name) {
                        setGroupName(res.name);
                    }
                })
                .catch(() => {
                    // ignore
                });
        }
    }, [parsedPayload?.groupId]);

    const handleDownload = () => {
        if (!fileId) {
            message.error(t("SummaryExportNoFile"));
            return;
        }
        // 构建下载链接
        const fileName = groupName ? `${groupName}_成绩报告.xlsx` : "成绩报告.xlsx";
        const downloadUrl = cApi.getFileDownloadUrl(fileId, fileName);
        window.open(downloadUrl, "_blank");
        message.success(t("SummaryExportDownloadStarted"));
    };

    return (
        <div>
            {loading ? (
                <div style={{textAlign: "center", padding: "24px 0"}}>
                    <Spin/>
                </div>
            ) : (
                <>
                    <Descriptions column={1} size="small" bordered style={{marginBottom: 16}}>
                        <Descriptions.Item label={t("AutoTaskTaskId")}>
                            <Typography.Text code copyable>{taskDetail.id}</Typography.Text>
                        </Descriptions.Item>
                        {parsedPayload && (
                            <>
                                <Descriptions.Item label={t("SummaryExportGroupId")}>
                                    {parsedPayload.groupId}
                                </Descriptions.Item>
                                <Descriptions.Item label={t("SummaryExportProblemSets")}>
                                    {parsedPayload.psids && parsedPayload.psids.length > 0
                                        ? parsedPayload.psids.join(", ")
                                        : t("SummaryExportAllProblemSets")}
                                </Descriptions.Item>
                            </>
                        )}
                        <Descriptions.Item label={t("SummaryExportFileStatus")}>
                            {fileId ? (
                                <Typography.Text type="success">{t("SummaryExportFileReady")}</Typography.Text>
                            ) : (
                                <Typography.Text type="warning">{t("SummaryExportFileNotFound")}</Typography.Text>
                            )}
                        </Descriptions.Item>
                    </Descriptions>
                    
                    <Space style={{marginTop: 16}}>
                        <Button onClick={onClose}>{t("close")}</Button>
                        <Button
                            type="primary"
                            icon={<DownloadOutlined/>}
                            onClick={handleDownload}
                            disabled={!fileId}
                        >
                            {t("SummaryExportDownload")}
                        </Button>
                    </Space>
                </>
            )}
        </div>
    );
};

export default withTranslation()(SummaryExportResult);
