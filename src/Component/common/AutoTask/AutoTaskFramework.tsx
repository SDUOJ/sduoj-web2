import React, {useCallback, useEffect, useMemo, useState} from "react";
import {withTranslation, WithTranslation} from "react-i18next";
import {
    Button,
    Card,
    Descriptions,
    Empty,
    InputNumber,
    List,
    Modal,
    Popconfirm,
    Select,
    Space,
    Spin,
    Table,
    Tag,
    Typography,
    message
} from "antd";
import type {ColumnsType} from "antd/es/table";
import {ReloadOutlined} from "@ant-design/icons";
import cApi from "../../../Utils/API/c-api";
import {TimeDiff, unix2Time} from "../../../Utils/Time";

interface AutoTaskRecord {
    id: string;
    task_type: string;
    status: string;
    create_time?: string;
    start_time?: string;
    end_time?: string;
    username?: string;
    psid?: number;
    groupId?: number;
    contestId?: number;
    problemId?: number;
    autoScore?: number | null;
    autoFullScore?: number | null;
}

interface AutoTaskLog {
    log_id?: number;
    tag: string;
    content: string;
    create_time?: string;
}

interface AutoTaskTriggerProps {
    onSubmit: () => Promise<void>;
}

interface AutoTaskResultProps {
    taskId: string;
    taskDetail: any;
    onClose: () => void;
}

interface AutoTaskFrameworkProps extends WithTranslation {
    // 任务数据源配置
    groupId?: number;
    psid?: number;
    contestId?: number;
    
    // 任务创建器组件
    TriggerComponent?: React.ComponentType<AutoTaskTriggerProps>;
    
    // 任务结果组件
    ResultComponent?: React.ComponentType<AutoTaskResultProps>;
    
    // 标题和描述
    title?: string;
    createTitle?: string;
    createHelp?: string;
    
    // 任务类型过滤
    taskTypeFilter?: string[];
    
    // 自定义任务类型标签
    getTaskTypeLabel?: (taskType: string) => string;
    
    // 是否显示创建区域
    showCreateSection?: boolean;
    
    // 筛选器配置
    showFilters?: {
        status?: boolean;
        taskType?: boolean;
        username?: boolean;
        psid?: boolean;
        problemId?: boolean;
        scoreLe?: boolean;
    };
    
    // 列显示配置
    showColumns?: {
        taskId?: boolean;
        taskType?: boolean;
        status?: boolean;
        username?: boolean;
        psid?: boolean;
        problemId?: boolean;
        score?: boolean;
        startTime?: boolean;
        duration?: boolean;
        actions?: boolean;
    };
    
    // 额外的筛选选项数据
    problemSetOptions?: Array<{psid: number, name: string}>;
    problemOptions?: Array<{problemId: number, name: string}>;
}

const formatDateTime = (value?: any) => {
    if (value === undefined || value === null || value === "") return "-";
    try {
        return unix2Time(value);
    } catch (error) {
        return "-";
    }
};

const formatDuration = (start?: any, end?: any) => {
    if (start === undefined || end === undefined || start === null || end === null || start === "" || end === "") return "-";
    const startNum = typeof start === "string" ? parseInt(start, 10) : Number(start);
    const endNum = typeof end === "string" ? parseInt(end, 10) : Number(end);
    if (Number.isNaN(startNum) || Number.isNaN(endNum)) return "-";
    if (endNum < startNum) return "-";
    const diffText = TimeDiff(startNum, endNum, "d ", "h ", "m ", "s");
    return diffText || "0s";
};

const safeJsonParse = (text?: string) => {
    if (!text) return undefined;
    try {
        return JSON.parse(text);
    } catch {
        return undefined;
    }
};

const LogMarkdownViewer = ({content}: { content: string }) => {
    return (
        <pre style={{
            background: "#f8f8f8",
            padding: "8px 12px",
            borderRadius: 4,
            maxHeight: 260,
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word"
        }}>
            {content || "-"}
        </pre>
    );
};

const AutoTaskFramework: React.FC<AutoTaskFrameworkProps> = (props) => {
    const {
        t,
        groupId,
        psid,
        contestId,
        TriggerComponent,
        ResultComponent,
        title,
        createTitle,
        createHelp,
        taskTypeFilter,
        getTaskTypeLabel,
        showCreateSection = true,
        showFilters = {},
        showColumns = {},
        problemSetOptions = [],
        problemOptions = []
    } = props;

    const [taskList, setTaskList] = useState<AutoTaskRecord[]>([]);
    const [listLoading, setListLoading] = useState<boolean>(false);
    const [filters, setFilters] = useState<{ 
        status?: string; 
        taskType?: string; 
        username?: string;
        psid?: number;
        problemId?: number;
        scoreLe?: number;
    }>({});
    const [pagination, setPagination] = useState<{ current: number, pageSize: number, total: number }>({
        current: 1,
        pageSize: 20,
        total: 0
    });

    const [detailVisible, setDetailVisible] = useState<boolean>(false);
    const [detailLoading, setDetailLoading] = useState<boolean>(false);
    const [taskDetail, setTaskDetail] = useState<any>(null);
    const [rerunLoadingId, setRerunLoadingId] = useState<string | null>(null);
    const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [batchRerunLoading, setBatchRerunLoading] = useState<boolean>(false);
    const [resultVisible, setResultVisible] = useState<boolean>(false);
    const [createVisible, setCreateVisible] = useState<boolean>(false);

    const loadTasks = useCallback((pageNow?: number, pageSize?: number) => {
        if (!groupId && !psid && !contestId) return;
        const current = pageNow ?? 1;
        const size = pageSize ?? 20;
        setListLoading(true);
        
        const apiCall = groupId 
            ? cApi.listGroupAutoTasks({
                groupId,
                pageNow: current,
                pageSize: size,
                status: filters.status,
                taskType: filters.taskType,
                username: filters.username,
                scoreLe: filters.scoreLe,
                psid: filters.psid,
                problemId: filters.problemId
            })
            : cApi.listProblemSetAutoTasks({
                psid: psid!,
                pageNow: current,
                pageSize: size,
                status: filters.status,
                taskType: filters.taskType,
                username: filters.username,
                scoreLe: filters.scoreLe
            });
        
        apiCall.then((res: any) => {
            let rows = res?.rows || [];
            // 如果有任务类型过滤，应用过滤
            if (taskTypeFilter && taskTypeFilter.length > 0) {
                rows = rows.filter((task: AutoTaskRecord) => 
                    taskTypeFilter.includes(task.task_type)
                );
            }
            setTaskList(rows);
            setPagination({
                current: res?.pageIndex ?? current,
                pageSize: res?.pageSize ?? size,
                total: res?.total ?? 0
            });
        }).catch(() => {
            message.error(t("failed"));
            setTaskList([]);
        }).finally(() => {
            setListLoading(false);
        });
    }, [filters.status, filters.taskType, filters.username, filters.psid, filters.problemId, filters.scoreLe, groupId, psid, contestId, taskTypeFilter, t]);

    useEffect(() => {
        loadTasks(1, pagination.pageSize);
    }, [loadTasks]);

    useEffect(() => {
        setSelectedRowKeys(prev => prev.filter(key => taskList.some(task => task.id === key)));
    }, [taskList]);

    const statusTag = useCallback((status?: string) => {
        const map: Record<string, { color: string, text: string }> = {
            pending: {color: "default", text: t("AutoTaskStatusPending")},
            running: {color: "processing", text: t("AutoTaskStatusRunning")},
            success: {color: "success", text: t("AutoTaskStatusSuccess")},
            failed: {color: "error", text: t("AutoTaskStatusFailed")}
        };
        const meta = status ? map[status] : undefined;
        if (!meta) return <Tag>{status || "-"}</Tag>;
        return <Tag color={meta.color}>{meta.text}</Tag>;
    }, [t]);

    const taskTypeLabel = useCallback((type?: string) => {
        if (!type) return "-";
        if (getTaskTypeLabel) {
            return getTaskTypeLabel(type);
        }
        // 默认的任务类型标签
        switch (type) {
            case "subjective_review":
                return t("AutoTaskSubjectiveReview");
            case "summary_report":
                return t("AutoTaskSummaryExport");
            case "invalid":
                return t("AutoTaskTypeInvalid");
            case "unknown":
                return t("AutoTaskTypeUnknown");
            default:
                return type;
        }
    }, [getTaskTypeLabel, t]);

    const canRerun = useCallback((record: AutoTaskRecord | any) => {
        const status = record?.status;
        return status === "failed" || status === "success";
    }, []);

    const openDetail = useCallback((taskId: string) => {
        setDetailVisible(true);
        setDetailLoading(true);
        setTaskDetail(null);
        cApi.getAutoTaskDetail(taskId).then((res: any) => {
            setTaskDetail(res);
        }).catch(() => {
            message.error(t("failed"));
            setTaskDetail(null);
        }).finally(() => {
            setDetailLoading(false);
        });
    }, [t]);

    const closeDetail = useCallback(() => {
        setDetailVisible(false);
        setTaskDetail(null);
    }, []);

    const handleRerun = useCallback(async (taskId: string) => {
        try {
            setRerunLoadingId(taskId);
            await cApi.rerunAutoTask(taskId);
            message.success(t("AutoTaskRerunSuccess"));
            loadTasks(pagination.current, pagination.pageSize);
            if (taskDetail?.id === taskId) {
                openDetail(taskId);
            }
        } catch (error) {
            message.error(t("failed"));
        } finally {
            setRerunLoadingId(prev => (prev === taskId ? null : prev));
        }
    }, [loadTasks, openDetail, pagination.current, pagination.pageSize, t, taskDetail]);

    const handleDelete = useCallback(async (taskId: string) => {
        try {
            setDeleteLoadingId(taskId);
            await cApi.deleteAutoTask(taskId);
            message.success(t("AutoTaskDeleteSuccess"));
            loadTasks(pagination.current, pagination.pageSize);
            if (taskDetail?.id === taskId) {
                closeDetail();
            }
            setSelectedRowKeys(prev => prev.filter(key => key !== taskId));
        } catch (error) {
            message.error(t("failed"));
        } finally {
            setDeleteLoadingId(prev => (prev === taskId ? null : prev));
        }
    }, [closeDetail, loadTasks, pagination.current, pagination.pageSize, t, taskDetail]);

    const handleBatchRerun = useCallback(async () => {
        const runnableTasks = selectedRowKeys
            .map(key => taskList.find(task => task.id === key))
            .filter((task): task is AutoTaskRecord => Boolean(task) && canRerun(task));
        if (runnableTasks.length === 0) {
            message.info(t("AutoTaskBatchRerunEmpty"));
            return;
        }
        setBatchRerunLoading(true);
        try {
            const results = await Promise.allSettled(
                runnableTasks.map(task => cApi.rerunAutoTask(task.id))
            );
            const successCount = results.filter(res => res.status === "fulfilled").length;
            const failedCount = results.length - successCount;
            if (successCount > 0) {
                message.success(t("AutoTaskBatchRerunSuccess", {count: successCount}));
            }
            if (failedCount > 0) {
                message.warning(t("AutoTaskBatchRerunPartial", {success: successCount, failed: failedCount}));
            }
            setSelectedRowKeys([]);
            loadTasks(pagination.current, pagination.pageSize);
        } catch (error) {
            message.error(t("failed"));
        } finally {
            setBatchRerunLoading(false);
        }
    }, [canRerun, loadTasks, pagination.current, pagination.pageSize, selectedRowKeys, t, taskList]);

    const hasRunnableSelection = useMemo(() => {
        if (selectedRowKeys.length === 0) return false;
        const keySet = new Set(selectedRowKeys);
        return taskList.some(task => keySet.has(task.id) && canRerun(task));
    }, [canRerun, selectedRowKeys, taskList]);

    const handleCreateTaskSubmit = useCallback(async () => {
        setCreateVisible(false);
        loadTasks(1, pagination.pageSize);
    }, [loadTasks, pagination.pageSize]);

    const openCreateModal = useCallback(() => {
        setCreateVisible(true);
    }, []);

    const closeCreateModal = useCallback(() => {
        setCreateVisible(false);
    }, []);

    const openResultModal = useCallback((taskId: string) => {
        setDetailVisible(true);
        setResultVisible(true);
        setDetailLoading(true);
        setTaskDetail(null);
        cApi.getAutoTaskDetail(taskId).then((res: any) => {
            setTaskDetail(res);
        }).catch(() => {
            message.error(t("failed"));
            setTaskDetail(null);
        }).finally(() => {
            setDetailLoading(false);
        });
    }, [t]);

    const closeResultModal = useCallback(() => {
        setResultVisible(false);
        closeDetail();
    }, [closeDetail]);

    const columns: ColumnsType<AutoTaskRecord> = useMemo(() => {
        const cols: ColumnsType<AutoTaskRecord> = [];
        
        // Task ID 列
        if (showColumns.taskId !== false) {
            cols.push({
                title: t("AutoTaskTaskId"),
                dataIndex: "id",
                key: "id",
                width: 240,
                render: (text: string) => (
                    <Typography.Text
                        code
                        style={{cursor: "pointer"}}
                        onClick={() => openDetail(text)}
                    >
                        {text}
                    </Typography.Text>
                )
            });
        }
        
        // 题单 ID 列
        // 默认策略：如果有明确配置则遵循配置，否则只有在 Group 视图下才显示
        const showPsid = showColumns.psid !== undefined ? showColumns.psid : !!groupId;
        if (showPsid) {
            cols.push({
                title: t("AutoTaskPSID"),
                dataIndex: "psid",
                key: "psid",
                width: 120,
                render: (text: number) => text || "-"
            });
        }
        
        // 任务类型列（如果有多种类型或未指定类型过滤时显示）
        if (showColumns.taskType !== false && (!taskTypeFilter || taskTypeFilter.length !== 1)) {
            cols.push({
                title: t("AutoTaskFilterType"),
                dataIndex: "task_type",
                key: "task_type",
                width: 180,
                render: (text: string) => taskTypeLabel(text)
            });
        }
        
        // 状态列
        if (showColumns.status !== false) {
            cols.push({
                title: t("AutoTaskFilterStatus"),
                dataIndex: "status",
                key: "status",
                width: 140,
                render: (text: string) => statusTag(text)
            });
        }
        
        // 用户名列
        if (showColumns.username !== false) {
            cols.push({
                title: t("AutoTaskUsername"),
                dataIndex: "username",
                key: "username",
                width: 160,
                render: (text: string) => text || "-"
            });
        }

        const isSubjectiveReviewScope = Array.isArray(taskTypeFilter) && taskTypeFilter.includes("subjective_review");
        const showScore = showColumns.score !== undefined ? showColumns.score : isSubjectiveReviewScope;
        if (showScore) {
            cols.push({
                title: t("AutoTaskScore"),
                dataIndex: "autoScore",
                key: "autoScore",
                width: 140,
                render: (_: any, record) => {
                    const score = record.autoScore;
                    if (score === undefined || score === null) return "-";
                    const full = record.autoFullScore;
                    if (full === undefined || full === null) return `${score}`;
                    return `${score} / ${full}`;
                }
            });
        }
        
        // 题目 ID 列
        // 默认策略：如果有明确配置则遵循配置，否则只有在 Group 视图下才显示
        const showProblemId = showColumns.problemId !== undefined ? showColumns.problemId : !!groupId;
        if (showProblemId) {
            cols.push({
                title: t("AutoTaskProblemId"),
                dataIndex: "problemId",
                key: "problemId",
                width: 120,
                render: (text: number) => text || "-"
            });
        }
        
        // 开始时间列
        if (showColumns.startTime !== false) {
            cols.push({
                title: t("AutoTaskStartedAt"),
                dataIndex: "start_time",
                key: "start_time",
                width: 180,
                render: (text: any) => formatDateTime(text)
            });
        }
        
        // 耗时列
        if (showColumns.duration !== false) {
            cols.push({
                title: t("AutoTaskDuration"),
                key: "duration",
                width: 160,
                render: (_, record) => formatDuration(record.start_time, record.end_time)
            });
        }
        
        // 操作列
        if (showColumns.actions !== false) {
            cols.push({
                title: t("operator"),
                key: "operator",
                fixed: "right",
                width: ResultComponent ? 300 : 220,
                render: (_, record) => (
                    <Space size={8}>
                        {ResultComponent && record.status === "success" && (
                            <Button
                                type="link"
                                onClick={() => openResultModal(record.id)}
                            >
                                {t("AutoTaskViewResult")}
                            </Button>
                        )}
                        <Popconfirm
                            title={t("AutoTaskRerunConfirm")}
                            onConfirm={() => handleRerun(record.id)}
                            disabled={!canRerun(record)}
                        >
                            <Button
                                type="link"
                                disabled={!canRerun(record)}
                                loading={rerunLoadingId === record.id}
                            >
                                {t("AutoTaskRerun")}
                            </Button>
                        </Popconfirm>
                        <Popconfirm
                            title={t("AutoTaskDeleteConfirm")}
                            onConfirm={() => handleDelete(record.id)}
                        >
                            <Button
                                type="link"
                                danger
                                loading={deleteLoadingId === record.id}
                            >
                                {t("AutoTaskDelete")}
                            </Button>
                        </Popconfirm>
                    </Space>
                )
            });
        }
        
        return cols;
    }, [t, taskTypeLabel, statusTag, canRerun, handleRerun, handleDelete, rerunLoadingId, deleteLoadingId, openDetail, ResultComponent, openResultModal, showColumns, groupId, taskTypeFilter]);

    const typeFilterOptions = useMemo(() => {
        const typeSet = new Set<string>();
        if (taskTypeFilter && taskTypeFilter.length > 0) {
            taskTypeFilter.forEach(type => typeSet.add(type));
        } else {
            taskList.forEach(item => {
                if (item.task_type) typeSet.add(item.task_type);
            });
        }
        return Array.from(typeSet).map(value => ({
            label: taskTypeLabel(value),
            value
        }));
    }, [taskList, taskTypeFilter, taskTypeLabel]);

    const renderLogContent = (content: string) => {
        const parsed = safeJsonParse(content);
        if (parsed !== undefined && typeof parsed !== "string") {
            return (
                <pre style={{
                    background: "#f8f8f8",
                    padding: "8px 12px",
                    borderRadius: 4,
                    maxHeight: 260,
                    overflow: "auto"
                }}>
                    {JSON.stringify(parsed, null, 2)}
                </pre>
            );
        }
        const markdownText = typeof parsed === "string" ? parsed : (content || "-");
        return <LogMarkdownViewer content={markdownText}/>;
    };

    return (
        <div style={{marginTop: 24}} className={"ListPage"}>
            <div style={{textAlign: "center", margin: "0 auto"}}>
                <div style={{textAlign: "left", maxWidth: "1500px", margin: "0 auto"}}>
                    <Card
                        title={title || t("AutoTaskListTitle")}
                        extra={
                            <Space>
                                {showCreateSection && TriggerComponent && (
                                    <Button
                                        type="primary"
                                        onClick={openCreateModal}
                                    >
                                        {t("AutoTaskCreate")}
                                    </Button>
                                )}
                                <Button
                                    type="primary"
                                    disabled={!hasRunnableSelection || batchRerunLoading}
                                    loading={batchRerunLoading}
                                    onClick={handleBatchRerun}
                                >
                                    {t("AutoTaskBatchRerun")}
                                </Button>
                                <Button icon={<ReloadOutlined/>} onClick={() => loadTasks(pagination.current, pagination.pageSize)} loading={listLoading}>
                                    {t("AutoTaskRefresh")}
                                </Button>
                            </Space>
                        }
                    >
                        <Space wrap style={{marginBottom: 16}}>
                            {showFilters.status !== false && (
                                <Select
                                    allowClear
                                    placeholder={t("AutoTaskFilterStatus")}
                                    style={{width: 180}}
                                    options={[
                                        {label: t("AutoTaskStatusPending"), value: "pending"},
                                        {label: t("AutoTaskStatusRunning"), value: "running"},
                                        {label: t("AutoTaskStatusSuccess"), value: "success"},
                                        {label: t("AutoTaskStatusFailed"), value: "failed"}
                                    ]}
                                    value={filters.status}
                                    onChange={(value) => {
                                        setFilters(prev => ({...prev, status: value || undefined}));
                                    }}
                                />
                            )}
                            {showFilters.taskType !== false && typeFilterOptions.length > 0 && (!taskTypeFilter || taskTypeFilter.length !== 1) && (
                                <Select
                                    allowClear
                                    placeholder={t("AutoTaskFilterType")}
                                    style={{width: 200}}
                                    options={typeFilterOptions}
                                    value={filters.taskType}
                                    onChange={(value) => {
                                        setFilters(prev => ({...prev, taskType: value || undefined}));
                                    }}
                                />
                            )}
                            {showFilters.username !== false && (
                                <Select
                                    allowClear
                                    showSearch
                                    placeholder={t("AutoTaskFilterUsername")}
                                    style={{width: 200}}
                                    value={filters.username}
                                    optionFilterProp="label"
                                    onChange={(value) => {
                                        setFilters(prev => ({...prev, username: value || undefined}));
                                    }}
                                >
                                    {/* 如果有学生选项，在这里显示 */}
                                </Select>
                            )}
                            {showFilters.psid !== false && problemSetOptions.length > 0 && (
                                <Select
                                    allowClear
                                    showSearch
                                    placeholder={t("AutoTaskFilterProblemSet")}
                                    style={{width: 200}}
                                    options={problemSetOptions.map(ps => ({
                                        label: ps.name,
                                        value: ps.psid
                                    }))}
                                    value={filters.psid}
                                    optionFilterProp="label"
                                    onChange={(value) => {
                                        setFilters(prev => ({...prev, psid: value || undefined}));
                                    }}
                                />
                            )}
                            {showFilters.problemId !== false && problemOptions.length > 0 && (
                                <Select
                                    allowClear
                                    showSearch
                                    placeholder={t("AutoTaskFilterProblem")}
                                    style={{width: 200}}
                                    options={problemOptions.map(p => ({
                                        label: p.name,
                                        value: p.problemId
                                    }))}
                                    value={filters.problemId}
                                    optionFilterProp="label"
                                    onChange={(value) => {
                                        setFilters(prev => ({...prev, problemId: value || undefined}));
                                    }}
                                />
                            )}
                            {((showFilters.scoreLe !== undefined)
                                ? showFilters.scoreLe
                                : (Array.isArray(taskTypeFilter) && taskTypeFilter.includes("subjective_review"))) && (
                                <InputNumber
                                    min={0}
                                    precision={2}
                                    style={{width: 220}}
                                    placeholder={t("AutoTaskFilterScoreLe")}
                                    value={filters.scoreLe}
                                    onChange={(value) => {
                                        setFilters(prev => ({...prev, scoreLe: value == null ? undefined : Number(value)}));
                                    }}
                                />
                            )}
                        </Space>
                        <Table
                            size="middle"
                            rowKey="id"
                            columns={columns}
                            dataSource={taskList}
                            loading={listLoading}
                            rowSelection={{
                                selectedRowKeys,
                                onChange: (keys) => setSelectedRowKeys(keys),
                                getCheckboxProps: (record: AutoTaskRecord) => ({
                                    disabled: !canRerun(record)
                                })
                            }}
                            scroll={{x: 1000}}
                            pagination={{
                                current: pagination.current,
                                total: pagination.total,
                                pageSize: pagination.pageSize,
                                showSizeChanger: true,
                                onChange: (page, pageSize) => {
                                    setPagination(prev => ({...prev, current: page, pageSize}));
                                    loadTasks(page, pageSize);
                                }
                            }}
                            locale={{
                                emptyText: <Empty description={t("AutoTaskEmpty")}/>
                            }}
                        />
                    </Card>
                </div>
            </div>
            <Modal
                title={t("AutoTaskDetail")}
                open={detailVisible && !resultVisible}
                onCancel={closeDetail}
                footer={null}
                width={800}
                destroyOnClose
            >
                {detailLoading ? (
                    <div style={{textAlign: "center", padding: "24px 0"}}>
                        <Spin/>
                    </div>
                ) : taskDetail ? (
                    <>
                        <Descriptions column={1} size="small" bordered style={{marginBottom: 16}}>
                            <Descriptions.Item label={t("AutoTaskTaskId")}>
                                <Typography.Text code copyable>{taskDetail.id}</Typography.Text>
                            </Descriptions.Item>
                            <Descriptions.Item label={t("AutoTaskUsername")}>
                                {taskDetail.username || "-"}
                            </Descriptions.Item>
                            <Descriptions.Item label={t("AutoTaskFilterType")}>
                                {taskTypeLabel(taskDetail.task_type)}
                            </Descriptions.Item>
                            <Descriptions.Item label={t("AutoTaskFilterStatus")}>
                                {statusTag(taskDetail.status)}
                            </Descriptions.Item>
                            <Descriptions.Item label={t("AutoTaskCreatedAt")}>
                                {formatDateTime(taskDetail.create_time)}
                            </Descriptions.Item>
                            <Descriptions.Item label={t("AutoTaskStartedAt")}>
                                {formatDateTime(taskDetail.start_time)}
                            </Descriptions.Item>
                            <Descriptions.Item label={t("AutoTaskFinishedAt")}>
                                {formatDateTime(taskDetail.end_time)}
                            </Descriptions.Item>
                            <Descriptions.Item label={t("AutoTaskDuration")}>
                                {formatDuration(taskDetail.start_time, taskDetail.end_time)}
                            </Descriptions.Item>
                        </Descriptions>
                        <Typography.Title level={5}>{t("AutoTaskLogs")}</Typography.Title>
                        {taskDetail.logs && taskDetail.logs.length > 0 ? (
                            <List
                                dataSource={taskDetail.logs as AutoTaskLog[]}
                                renderItem={(item) => (
                                    <List.Item key={item.log_id ?? `${item.tag}-${item.create_time}`}>
                                        <Space direction="vertical" style={{width: "100%"}}>
                                            <Space size={12}>
                                                <Tag>{item.tag}</Tag>
                                                <Typography.Text type="secondary">
                                                    {formatDateTime(item.create_time)}
                                                </Typography.Text>
                                            </Space>
                                            {renderLogContent(item.content)}
                                        </Space>
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <Empty description={t("AutoTaskLogs")}/>
                        )}
                        <Space style={{marginTop: 16}}>
                            <Button onClick={closeDetail}>{t("Cancel")}</Button>
                            <Button
                                type="primary"
                                disabled={!canRerun(taskDetail)}
                                loading={rerunLoadingId === taskDetail.id}
                                onClick={() => handleRerun(taskDetail.id)}
                            >
                                {t("AutoTaskRerun")}
                            </Button>
                            <Popconfirm
                                title={t("AutoTaskDeleteConfirm")}
                                onConfirm={() => handleDelete(taskDetail.id)}
                            >
                                <Button
                                    danger
                                    loading={deleteLoadingId === taskDetail.id}
                                >
                                    {t("AutoTaskDelete")}
                                </Button>
                            </Popconfirm>
                        </Space>
                    </>
                ) : (
                    <Empty description={t("AutoTaskDetail")}/>
                )}
            </Modal>
            
            {ResultComponent && (
                <Modal
                    title={t("AutoTaskResult")}
                    open={resultVisible}
                    onCancel={closeResultModal}
                    footer={null}
                    width={800}
                    destroyOnClose
                >
                    {detailLoading ? (
                        <div style={{textAlign: "center", padding: "24px 0"}}>
                            <Spin/>
                        </div>
                    ) : taskDetail ? (
                        <ResultComponent 
                            taskId={taskDetail.id} 
                            taskDetail={taskDetail}
                            onClose={closeResultModal}
                        />
                    ) : (
                        <Empty description={t("AutoTaskResult")}/>
                    )}
                </Modal>
            )}
            
            {TriggerComponent && (
                <Modal
                    title={createTitle || t("AutoTaskCreateTitle")}
                    open={createVisible}
                    onCancel={closeCreateModal}
                    footer={null}
                    width={900}
                    destroyOnClose
                >
                    {createHelp && (
                        <Typography.Paragraph type="secondary" style={{marginBottom: 16}}>
                            {createHelp}
                        </Typography.Paragraph>
                    )}
                    <TriggerComponent onSubmit={handleCreateTaskSubmit} />
                </Modal>
            )}
        </div>
    );
};

export default withTranslation()(AutoTaskFramework);
