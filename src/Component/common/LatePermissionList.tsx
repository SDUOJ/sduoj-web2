import React, {useCallback, useEffect, useMemo, useState} from "react";
import {withTranslation, WithTranslation} from "react-i18next";
import {
    Button,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Modal,
    Select,
    Space,
    Switch,
    Typography,
    message
} from "antd";
import type {ColumnsType} from "antd/es/table";
import cApi from "../../Utils/API/c-api";
import {unix2Time} from "../../Utils/Time";
import TableWithPagination from "../common/Table/TableWithPagination";
import {connect} from "react-redux";
import {Dispatch} from "react";
import dayjs from "dayjs";

interface GrantUserInfo {
    username?: string;
    nickname?: string;
    real_name?: string;
    realName?: string;
    user_name?: string;
}

interface LatePermissionRecord {
    permission_id?: number;
    id?: number;
    username?: string;
    duration_minute?: number;
    discount?: number;
    note?: string;
    is_active?: boolean;
    enabled?: boolean;
    status?: number | boolean;
    start_time?: number;
    expire_time?: number;
    grant_user?: GrantUserInfo;
    grantUser?: GrantUserInfo;
    grant_username?: string;
    grant_nickname?: string;
    created_by?: string;
    psid?: number;
    ps_name?: string;
}

interface LatePermissionListProps extends WithTranslation {
    psid?: number;
    groupId?: number;
    showTitle?: boolean;
    showAddButton?: boolean;
    addTableVersion?: (name: string) => void;
}

const normalizeRecord = (record: any): LatePermissionRecord => {
    const permissionId = record.permission_id ?? record.id;
    const enabled = record.is_active !== undefined
        ? Boolean(record.is_active)
        : record.enabled !== undefined
        ? Boolean(record.enabled)
        : record.status !== undefined
            ? record.status === 1 || record.status === true
            : true;
    return {
        ...record,
        permission_id: permissionId,
        is_active: enabled,
        enabled,
    };
};

const extractList = (payload: any): LatePermissionRecord[] => {
    if (Array.isArray(payload)) {
        return payload.map(normalizeRecord);
    }
    if (Array.isArray(payload?.list)) {
        return payload.list.map(normalizeRecord);
    }
    if (Array.isArray(payload?.records)) {
        return payload.records.map(normalizeRecord);
    }
    if (Array.isArray(payload?.rows)) {
        return payload.rows.map(normalizeRecord);
    }
    return [];
};

const LatePermissionList: React.FC<LatePermissionListProps> = (props) => {
    const {t, psid, groupId, showTitle = true, showAddButton = true, addTableVersion} = props;

    const tableName = useMemo(() => {
        if (psid) return `problemSetLatePermission-${psid}`;
        if (groupId) return `groupLatePermission-${groupId}`;
        return `latePermission-unknown`;
    }, [psid, groupId]);

    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [modalSubmitting, setModalSubmitting] = useState<boolean>(false);
    const [editingRecord, setEditingRecord] = useState<LatePermissionRecord | null>(null);
    const [switchLoadingId, setSwitchLoadingId] = useState<number | undefined>(undefined);
    const [problemSets, setProblemSets] = useState<{psid: number, name: string}[]>([]);

    const [form] = Form.useForm();

    // 在 group 模式下加载题单列表
    useEffect(() => {
        if (groupId) {
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
                    // 静默失败
                });
        }
    }, [groupId]);

    const openAddModal = useCallback(() => {
        setEditingRecord(null);
        form.resetFields();
        form.setFieldsValue({
            username: "",
            expire_time: null,
            discount: 1,
            enabled: true,
            note: "",
        });
        setIsModalVisible(true);
    }, [form]);

    const openEditModal = useCallback((record: LatePermissionRecord) => {
        setEditingRecord(record);
        const expireTime = record.expire_time ? dayjs.unix(record.expire_time / 1000) : null;
        form.setFieldsValue({
            username: record.username,
            expire_time: expireTime,
            discount: record.discount,
            enabled: record.is_active ?? record.enabled ?? true,
            note: record.note,
        });
        setIsModalVisible(true);
    }, [form]);

    const closeModal = useCallback(() => {
        setIsModalVisible(false);
        setModalSubmitting(false);
        setEditingRecord(null);
    }, []);

    const handleToggleEnabled = useCallback((record: LatePermissionRecord, enabled: boolean) => {
        const permissionId = record.permission_id ?? record.id;
        const targetPsid = record.psid ?? psid;
        if (permissionId === undefined || !targetPsid) return;
        setSwitchLoadingId(permissionId);
        cApi.updateProblemSetLatePermission({
            psid: targetPsid,
            id: permissionId,
            is_active: enabled,
        }).then(() => {
            message.success(t("Success"));
            addTableVersion?.(tableName);
        }).catch(() => {
            message.error(t("failed"));
            addTableVersion?.(tableName);
        }).finally(() => {
            setSwitchLoadingId(undefined);
        });
    }, [addTableVersion, psid, tableName, t]);

    const submitModal = async () => {
        if (!psid && !groupId) {
            message.error("Either psid or groupId must be provided");
            return;
        }

        const targetPsid = editingRecord?.psid ?? psid;
        if (!targetPsid) {
            message.error(t("This operation requires a specific problem set"));
            return;
        }

        try {
            const values = await form.validateFields();
            setModalSubmitting(true);
            const permissionId = editingRecord?.permission_id ?? editingRecord?.id;
            const expireTime = values.expire_time ? values.expire_time.valueOf() : undefined;
            if (permissionId !== undefined) {
                await cApi.updateProblemSetLatePermission({
                    psid: targetPsid,
                    id: permissionId,
                    expire_time: expireTime,
                    discount: values.discount,
                    is_active: values.enabled,
                    note: values.note,
                });
            } else {
                await cApi.addProblemSetLatePermission({
                    psid: targetPsid,
                    username: values.username,
                    expire_time: expireTime,
                    discount: values.discount,
                    note: values.note,
                });
            }
            message.success(t("Success"));
            closeModal();
            addTableVersion?.(tableName);
        } catch (error) {
            if (!(error as any)?.errorFields) {
                message.error(t("failed"));
            }
            setModalSubmitting(false);
        }
    };

    const columns: ColumnsType<LatePermissionRecord> = useMemo(() => [
        ...(groupId ? [{
            title: t("problemSet"),
            dataIndex: "ps_name",
            key: "ps_name",
            render: (value: string, record: LatePermissionRecord) => value ?? `PS-${record.psid}`,
        }] : []),
        {
            title: t("Username"),
            dataIndex: "username",
            key: "username",
        },
        {
            title: t("LatePermissionDuration"),
            dataIndex: "duration_minute",
            key: "duration_minute",
        },
        {
            title: t("LatePermissionDiscount"),
            dataIndex: "discount",
            key: "discount",
        },
        {
            title: t("LatePermissionStart"),
            dataIndex: "start_time",
            key: "start_time",
            render: (value) => {
                if (!value) {
                    return t("LatePermissionNotUsed");
                }
                return unix2Time(value);
            },
        },
        {
            title: t("LatePermissionExpire"),
            dataIndex: "expire_time",
            key: "expire_time",
            render: (value, record) => {
                const expire = value ?? (record.start_time && record.duration_minute
                    ? record.start_time + record.duration_minute * 60000
                    : undefined);
                return expire ? unix2Time(expire) : "-";
            },
        },
        {
            title: t("LatePermissionGrantedBy"),
            dataIndex: "grant_user",
            key: "grant_user",
            render: (_value, record) => {
                const grantObj = record.grant_user ?? record.grantUser;
                const grantNickname = grantObj?.nickname ?? grantObj?.real_name ?? grantObj?.realName ?? record.grant_nickname;
                const grantUsername = record.created_by ?? grantObj?.username ?? grantObj?.user_name ?? record.grant_username;
                if (!grantNickname && !grantUsername) return "-";
                if (grantNickname && grantUsername) return `${grantNickname} / ${grantUsername}`;
                return grantNickname ?? grantUsername ?? "-";
            }
        },
        {
            title: t("LatePermissionEnabled"),
            dataIndex: "is_active",
            key: "enabled",
            render: (value, record) => {
                const targetPsid = record.psid ?? psid;
                return (
                    <Switch
                        checked={value !== undefined ? value : (record.enabled ?? true)}
                        onChange={(checked) => handleToggleEnabled(record, checked)}
                        disabled={switchLoadingId === (record.permission_id ?? record.id) || !targetPsid}
                        loading={switchLoadingId === (record.permission_id ?? record.id)}
                    />
                );
            },
        },
        {
            title: t("noteShort"),
            dataIndex: "note",
            key: "note",
            render: (value) => value ?? "-",
        },
        ...((psid && showAddButton) || groupId ? [{
            title: t("operator"),
            key: "operator",
            render: (_value: any, record: LatePermissionRecord) => (
                <Space>
                    <Button type={"link"} onClick={() => openEditModal(record)}>
                        {t("Edit")}
                    </Button>
                </Space>
            ),
        }] : []),
    ], [handleToggleEnabled, openEditModal, switchLoadingId, t, psid, groupId, showAddButton]);

    const fetchLatePermissionList = useCallback((params: any = {}) => {
        const pageNow = params?.pageNow ?? 1;
        const pageSize = params?.pageSize ?? 10;
        const usernameValue = typeof params?.username === "string" ? params.username.trim() : undefined;
        const psidValue = params?.psid;

        if (!psid && !groupId) {
            return Promise.resolve({
                rows: [],
                totalNum: 0,
                totalPage: 0,
            });
        }

        const requestPayload: any = {
            page: {
                pageNow,
                pageSize,
            },
        };

        if (psid) {
            requestPayload.psid = psid;
        }

        if (groupId) {
            requestPayload.groupId = groupId;
        }

        if (usernameValue) {
            requestPayload.username = usernameValue;
        }

        if (psidValue) {
            requestPayload.psid = psidValue;
        }

        return cApi.listProblemSetLatePermissions(requestPayload)
            .then((res: any) => {
                const payload = res?.data ?? res;
                const rows = extractList(payload);
                const totalCandidate =
                    payload?.page?.total ??
                    payload?.page?.totalNum ??
                    payload?.page?.totalCount ??
                    payload?.total ??
                    payload?.totalNum ??
                    payload?.totalCount ??
                    payload?.count;
                const totalNum = typeof totalCandidate === "number" ? totalCandidate : rows.length;
                const sizeForCalc = pageSize || rows.length || 1;
                const totalPage = payload?.page?.totalPage ?? payload?.totalPage ?? Math.ceil(totalNum / sizeForCalc);
                return {
                    rows,
                    totalNum,
                    totalPage,
                };
            })
            .catch(() => {
                message.error(t("failed"));
                return {
                    rows: [],
                    totalNum: 0,
                    totalPage: 0,
                };
            });
    }, [psid, groupId, t]);

    return (
        <>
            {showTitle && (
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 12}}>
                    <Typography.Title level={5} style={{margin: 0}}>
                        {t("LatePermission")}
                    </Typography.Title>
                    {showAddButton && psid && (
                        <Button type={"primary"} onClick={openAddModal}>
                            {t("LatePermissionAdd")}
                        </Button>
                    )}
                </div>
            )}
            <TableWithPagination
                name={tableName}
                size={"small"}
                rowKey={(record: LatePermissionRecord) => `${record.permission_id ?? record.id ?? record.username}`}
                columns={columns}
                API={fetchLatePermissionList}
                getForm={(onFinish: any) => (
                    <>
                        {groupId && (
                            <Form.Item label={t("problemSet")} name={"psid"} style={{marginBottom: 0, marginRight: 16}}>
                                <Select
                                    allowClear
                                    placeholder={t("problemSet")}
                                    style={{width: 200}}
                                    onChange={() => onFinish?.()}
                                    showSearch
                                    optionFilterProp="children"
                                >
                                    {problemSets.map(ps => (
                                        <Select.Option key={ps.psid} value={ps.psid}>
                                            {ps.name}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        )}
                        <Form.Item label={t("username")} name={"username"} style={{marginBottom: 0}}>
                            <Input
                                allowClear
                                placeholder={t("username")}
                                style={{width: 200}}
                                onPressEnter={() => onFinish?.()}
                            />
                        </Form.Item>
                    </>
                )}
            />

            <Modal
                    open={isModalVisible}
                    onCancel={closeModal}
                    onOk={submitModal}
                    confirmLoading={modalSubmitting}
                    title={editingRecord ? t("LatePermissionEdit") : t("LatePermissionAdd")}
                    destroyOnHidden={true}
                >
                    <Form
                        layout={"vertical"}
                        form={form}
                    >
                        <Form.Item
                            label={t("Username")}
                            name={"username"}
                            rules={[{required: true, message: t("usernameEmpty")}]}
                        >
                            <Input disabled={!!editingRecord}/>
                        </Form.Item>
                        <Form.Item
                            label={t("LatePermissionExpire")}
                            name={"expire_time"}
                            rules={[{required: true, message: t("pleaseSelectExpireTime")}]}
                        >
                            <DatePicker
                                showTime
                                format="YYYY-MM-DD HH:mm:ss"
                                style={{width: "100%"}}
                                placeholder={t("pleaseSelectExpireTime")}
                            />
                        </Form.Item>
                        <Form.Item
                            label={t("LatePermissionDiscount")}
                            name={"discount"}
                            rules={[{required: true, message: t("pleaseEnterDiscount")}]}
                            extra={t("LatePermissionDiscountHelp")}
                        >
                            <InputNumber min={0} max={1} step={0.05} style={{width: "100%"}}/>
                        </Form.Item>
                        <Form.Item
                            label={t("LatePermissionEnabled")}
                            name={"enabled"}
                            valuePropName={"checked"}
                            hidden={!editingRecord}
                        >
                            <Switch/>
                        </Form.Item>
                        <Form.Item
                            label={t("noteShort")}
                            name={"note"}
                        >
                            <Input.TextArea rows={3}/>
                        </Form.Item>
                    </Form>
                </Modal>
        </>
    );
};

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    addTableVersion: (name: string) => dispatch({type: "addTableVersion", name}),
});

export default connect(
    null,
    mapDispatchToProps
)(withTranslation()(LatePermissionList));
