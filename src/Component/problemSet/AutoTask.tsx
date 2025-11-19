import React, {useCallback, useEffect, useMemo, useState} from "react";
import {withRouter} from "react-router-dom";
import {withTranslation} from "react-i18next";
import {
    Button,
    Card,
    Col,
    Descriptions,
    Empty,
    Form,
    List,
    Modal,
    Popconfirm,
    Result,
    Row,
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
import cApi from "../../Utils/API/c-api";
import useProblemSetInfo from "./API/getProblemSetInfo";
import Loading from "../../Utils/Loading";
import {TimeDiff, unix2Time} from "../../Utils/Time";

interface SubjectiveOption {
    gid: number;
    pid: number;
    preview?: string;
    answerType?: number;
    pendingStudents?: string[];
}

interface ProgrammingOption {
    gid: number;
    pid: number;
    name?: string;
}

interface AutoTaskRecord {
    id: string;
    task_type: string;
    status: string;
    create_time?: string;
    start_time?: string;
    end_time?: string;
    psid?: number;
    username?: string;
}

interface AutoTaskLog {
    log_id?: number;
    tag: string;
    content: string;
    create_time?: string;
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

const parsePair = (value: string): { gid: number, pid: number } | null => {
    if (!value) return null;
    const [gidText, pidText] = value.split("-");
    const gid = Number(gidText);
    const pid = Number(pidText);
    if (Number.isNaN(gid) || Number.isNaN(pid)) return null;
    return {gid, pid};
};

const safeJsonParse = (text?: string) => {
    if (!text) return undefined;
    try {
        return JSON.parse(text);
    } catch {
        return undefined;
    }
};

const pickUniqueStrings = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    const filtered = value.filter((item): item is string => typeof item === "string");
    return Array.from(new Set(filtered));
};

const AutoTask = (props: any) => {
    const {t} = props;
    const psid = parseInt(props.match.params.problemSetId, 10);
    const problemSetInfo = useProblemSetInfo(props.match.params.problemSetId);

    const [form] = Form.useForm();
    const [optionsLoading, setOptionsLoading] = useState<boolean>(false);
    const [subjectiveOptions, setSubjectiveOptions] = useState<SubjectiveOption[]>([]);
    const [programmingOptions, setProgrammingOptions] = useState<ProgrammingOption[]>([]);
    const [studentOptions, setStudentOptions] = useState<string[]>([]);
    const [creating, setCreating] = useState<boolean>(false);
    const selectedSubjectiveValues = Form.useWatch("subjectiveProblems", form);
    const hasSubjectSelection = useMemo(() => {
        return pickUniqueStrings(selectedSubjectiveValues).length > 0;
    }, [selectedSubjectiveValues]);

    const [taskList, setTaskList] = useState<AutoTaskRecord[]>([]);
    const [listLoading, setListLoading] = useState<boolean>(false);
    const [filters, setFilters] = useState<{ status?: string, taskType?: string, username?: string }>({});
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

    const fetchOptions = useCallback(() => {
        if (!psid) return;
        setOptionsLoading(true);
        cApi.getProblemSetAutoTaskOptions(psid).then((res: any) => {
            setSubjectiveOptions((res?.subjectiveProblems || []).map((item: any) => ({
                ...item,
                pendingStudents: Array.isArray(item.pendingStudents) ? item.pendingStudents : []
            })));
            setProgrammingOptions(res?.programmingProblems || []);
            setStudentOptions(res?.students || []);
        }).catch(() => {
            message.error(t("failed"));
            setSubjectiveOptions([]);
            setProgrammingOptions([]);
            setStudentOptions([]);
        }).finally(() => {
            setOptionsLoading(false);
        });
    }, [psid, t]);

    useEffect(() => {
        fetchOptions();
    }, [fetchOptions]);

    const loadTasks = useCallback((pageNow?: number, pageSize?: number) => {
        if (!psid) return;
        const current = pageNow ?? 1;
        const size = pageSize ?? 20;
        setListLoading(true);
        cApi.listProblemSetAutoTasks({
            psid,
            pageNow: current,
            pageSize: size,
            status: filters.status,
            taskType: filters.taskType,
            username: filters.username
        }).then((res: any) => {
            setTaskList(res?.rows || []);
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
    }, [filters.status, filters.taskType, filters.username, psid, t]);

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
        switch (type) {
            case "subjective_review":
                return t("AutoTaskSubjectiveReview");
            case "invalid":
                return t("AutoTaskTypeInvalid");
            case "unknown":
                return t("AutoTaskTypeUnknown");
            default:
                return type;
        }
    }, [t]);

    const canRerun = useCallback((record: AutoTaskRecord | any) => {
        const status = record?.status;
        return status === "failed" || status === "success";
    }, []);

    const openDetail = useCallback((taskId: string) => {
        setDetailVisible(true);
        setDetailLoading(true);
        setTaskDetail(null);
        cApi.getProblemSetAutoTaskDetail(taskId).then((res: any) => {
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
            await cApi.rerunProblemSetAutoTask(taskId);
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
            await cApi.deleteProblemSetAutoTask(taskId);
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
                runnableTasks.map(task => cApi.rerunProblemSetAutoTask(task.id))
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

    const columns: ColumnsType<AutoTaskRecord> = useMemo(() => [
        {
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
        },
        {
            title: t("AutoTaskFilterType"),
            dataIndex: "task_type",
            key: "task_type",
            width: 180,
            render: (text: string) => taskTypeLabel(text)
        },
        {
            title: t("AutoTaskFilterStatus"),
            dataIndex: "status",
            key: "status",
            width: 140,
            render: (text: string) => statusTag(text)
        },
        {
            title: t("AutoTaskUsername"),
            dataIndex: "username",
            key: "username",
            width: 160,
            render: (text: string) => text || "-"
        },
        {
            title: t("AutoTaskStartedAt"),
            dataIndex: "start_time",
            key: "start_time",
            width: 180,
            render: (text: any) => formatDateTime(text)
        },
        {
            title: t("AutoTaskDuration"),
            key: "duration",
            width: 160,
            render: (_, record) => formatDuration(record.start_time, record.end_time)
        },
        {
            title: t("operator"),
            key: "operator",
            fixed: "right",
            width: 220,
            render: (_, record) => (
                <Space size={8}>
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
        }
    ], [t, taskTypeLabel, statusTag, canRerun, handleRerun, handleDelete, rerunLoadingId, deleteLoadingId, openDetail]);

    const subjectPendingMap = useMemo(() => {
        const map = new Map<string, string[]>();
        subjectiveOptions.forEach(item => {
            map.set(`${item.gid}-${item.pid}`, item.pendingStudents || []);
        });
        return map;
    }, [subjectiveOptions]);

    const handleCreateTasks = async () => {
        try {
            const values = await form.validateFields();
            const subjectiveSelected = pickUniqueStrings(values.subjectiveProblems);
            const studentsSelected = pickUniqueStrings(values.students);
            const programmingSelected = pickUniqueStrings(values.programmingProblems);

            const programmingRefs = programmingSelected
                .map((value) => parsePair(value))
                .filter((item): item is { gid: number, pid: number } => Boolean(item));
            const tasks: any[] = [];
            subjectiveSelected.forEach((pair) => {
                const coords = parsePair(pair);
                if (!coords) return;
                studentsSelected.forEach((username) => {
                    tasks.push({
                        psid,
                        gid: coords.gid,
                        pid: coords.pid,
                        username,
                        programmingProblems: programmingRefs.map(ref => ({...ref}))
                    });
                });
            });
            if (tasks.length === 0) {
                message.warning(t("AutoTaskSubjectiveRequired"));
                return;
            }
            setCreating(true);
            await cApi.createProblemSetSubjectiveAutoTasks({tasks});
            message.success(t("Success"));
            form.resetFields();
            loadTasks(1, pagination.pageSize);
        } catch (error: any) {
            if (!error?.errorFields) {
                message.error(t("failed"));
            }
        } finally {
            setCreating(false);
        }
    };

    const handleSelectPendingStudents = useCallback(() => {
        const selectedSubjects = pickUniqueStrings(form.getFieldValue("subjectiveProblems"));
        if (selectedSubjects.length === 0) {
            message.info(t("AutoTaskSelectPendingEmpty"));
            return;
        }
        const pendingSet = new Set<string>();
        selectedSubjects.forEach(key => {
            const list = subjectPendingMap.get(key);
            if (list) {
                list.forEach(username => pendingSet.add(username));
            }
        });
        if (pendingSet.size === 0) {
            message.info(t("AutoTaskSelectPendingEmpty"));
            return;
        }
        const current = new Set(pickUniqueStrings(form.getFieldValue("students")));
        let added = 0;
        pendingSet.forEach(username => {
            if (!current.has(username)) {
                current.add(username);
                added += 1;
            }
        });
        form.setFieldsValue({students: Array.from(current)});
        if (added === 0) {
            message.info(t("AutoTaskSelectPendingNoChange"));
        } else {
            message.success(t("AutoTaskSelectPendingSuccess", {count: added}));
        }
    }, [form, subjectPendingMap, t]);

    const subjectSelectOptions = useMemo(() => {
        return subjectiveOptions.map((item) => {
            const preview = item.preview ? ` · ${item.preview}` : "";
            return {
                label: `G${item.gid} · P${item.pid}${preview}`,
                value: `${item.gid}-${item.pid}`
            };
        });
    }, [subjectiveOptions]);

    const programSelectOptions = useMemo(() => {
        return programmingOptions.map((item) => ({
            label: item.name ? `${item.name} (${item.gid}-${item.pid})` : `G${item.gid} · P${item.pid}`,
            value: `${item.gid}-${item.pid}`
        }));
    }, [programmingOptions]);

    const studentSelectOptions = useMemo(() => {
        return studentOptions.map((username) => ({
            label: username,
            value: username
        }));
    }, [studentOptions]);

    const typeFilterOptions = useMemo(() => {
        const typeSet = new Set<string>();
        typeSet.add("subjective_review");
        taskList.forEach(item => {
            if (item.task_type) typeSet.add(item.task_type);
        });
        return Array.from(typeSet).map(value => ({
            label: taskTypeLabel(value),
            value
        }));
    }, [taskList, taskTypeLabel]);

    const payloadInfo = useMemo(() => {
        if (!taskDetail?.logs) return undefined;
        const payloadLog = (taskDetail.logs as AutoTaskLog[]).find((log) => log.tag === "payload");
        if (!payloadLog) return undefined;
        const parsed = safeJsonParse(payloadLog.content);
        if (parsed && typeof parsed === "object") {
            return parsed as any;
        }
        return undefined;
    }, [taskDetail]);

    const renderLogContent = (content: string) => {
        const parsed = safeJsonParse(content);
        if (parsed === undefined) {
            return <Typography.Text style={{whiteSpace: "pre-wrap"}}>{content || "-"}</Typography.Text>;
        }
        if (typeof parsed === "string") {
            return <Typography.Text style={{whiteSpace: "pre-wrap"}}>{parsed}</Typography.Text>;
        }
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
    };

    if (problemSetInfo === undefined) {
        return <Loading/>;
    }

    if (problemSetInfo?.isAdmin !== true) {
        return (
            <Result
                status="403"
                title={t("noPermission")}
                subTitle={t("AutoTaskTab")}
            />
        );
    }

    return (
        <div style={{marginTop: 24}} className={"ListPage"}>
            <div style={{textAlign: "center", margin: "0 auto"}}>
                <div style={{textAlign: "left", maxWidth: "1500px", margin: "0 auto"}}>
                    <Card
                        title={t("AutoTaskCreateTitle")}
                        extra={
                            <Button icon={<ReloadOutlined/>} onClick={fetchOptions} loading={optionsLoading}>
                                {t("AutoTaskOptionsRefresh")}
                            </Button>
                        }
                        style={{marginBottom: 24}}
                    >
                        <Typography.Paragraph type="secondary" style={{marginBottom: 16}}>
                            {t("AutoTaskCreateHelp")}
                        </Typography.Paragraph>
                        <Form
                            layout="vertical"
                            form={form}
                            initialValues={{
                                subjectiveProblems: [],
                                students: [],
                                programmingProblems: []
                            }}
                        >
                            <Row gutter={16}>
                                <Col xs={24} md={10}>
                                    <Form.Item
                                        label={t("AutoTaskSubjectiveSelect")}
                                        name="subjectiveProblems"
                                        rules={[{required: true, message: t("AutoTaskSubjectiveRequired")}]}
                                    >
                                        <Select
                                            mode="multiple"
                                            showSearch
                                            allowClear
                                            placeholder={t("AutoTaskSubjectiveSelect")}
                                            options={subjectSelectOptions}
                                            loading={optionsLoading}
                                            optionFilterProp="label"
                                            maxTagCount="responsive"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item
                                        label={
                                            <Space size={8}>
                                                <span>{t("AutoTaskStudentSelect")}</span>
                                                <Button
                                                    size="small"
                                                    disabled={!hasSubjectSelection}
                                                    onClick={handleSelectPendingStudents}
                                                >
                                                    {t("AutoTaskSelectPending")}
                                                </Button>
                                            </Space>
                                        }
                                        name="students"
                                        rules={[{required: true, message: t("AutoTaskStudentRequired")}]}
                                    >
                                        <Select
                                            mode="multiple"
                                            showSearch
                                            allowClear
                                            placeholder={t("AutoTaskStudentSelect")}
                                            options={studentSelectOptions}
                                            loading={optionsLoading}
                                            optionFilterProp="label"
                                            maxTagCount="responsive"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={6}>
                                    <Form.Item
                                        label={t("AutoTaskProgrammingSelect")}
                                        name="programmingProblems"
                                    >
                                        <Select
                                            mode="multiple"
                                            showSearch
                                            allowClear
                                            placeholder={t("AutoTaskProgrammingSelect")}
                                            options={programSelectOptions}
                                            loading={optionsLoading}
                                            optionFilterProp="label"
                                            maxTagCount="responsive"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Space>
                                <Button type="primary" onClick={handleCreateTasks} loading={creating}>
                                    {t("AutoTaskSubmit")}
                                </Button>
                                <Button onClick={() => form.resetFields()}>
                                    {t("Reset")}
                                </Button>
                            </Space>
                        </Form>
                    </Card>
                    <Card
                        title={t("AutoTaskListTitle")}
                        extra={
                            <Space>
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
                            <Select
                                allowClear
                                showSearch
                                placeholder={t("AutoTaskFilterUsername")}
                                style={{width: 220}}
                                options={studentSelectOptions}
                                value={filters.username}
                                optionFilterProp="label"
                                onChange={(value) => {
                                    setFilters(prev => ({...prev, username: value || undefined}));
                                }}
                            />
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
                open={detailVisible}
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
                            <Descriptions.Item label={t("AutoTaskPSID")}>
                                {taskDetail.psid ?? psid}
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
                            {payloadInfo && (
                                <>
                                    <Descriptions.Item label={t("AutoTaskPayloadSubjective")}>
                                        G{payloadInfo.gid} · P{payloadInfo.pid}
                                    </Descriptions.Item>
                                    <Descriptions.Item label={t("AutoTaskUsername")}>
                                        {payloadInfo.username}
                                    </Descriptions.Item>
                                    <Descriptions.Item label={t("AutoTaskPayloadProgramming")}>
                                        {Array.isArray(payloadInfo.programmingProblems) && payloadInfo.programmingProblems.length > 0
                                            ? payloadInfo.programmingProblems.map((item: any) => `G${item.gid}·P${item.pid}`).join(", ")
                                            : t("AutoTaskPayloadNone")}
                                    </Descriptions.Item>
                                </>
                            )}
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
        </div>
    );
};

export default withTranslation()(withRouter(AutoTask));
