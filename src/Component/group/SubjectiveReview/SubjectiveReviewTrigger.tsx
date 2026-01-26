import React, {useState, useEffect, useCallback, useMemo} from "react";
import {Button, Form, Select, Space, message, Row, Col} from "antd";
import {withTranslation, WithTranslation} from "react-i18next";
import cApi from "../../../Utils/API/c-api";

interface SubjectiveOption {
    psid: number;
    gid: number;
    pid: number;
    psName?: string;
    preview?: string;
    answerType?: number;
    pendingStudents?: string[];
}

interface ProgrammingOption {
    psid: number;
    gid: number;
    pid: number;
    name?: string;
}

interface SubjectiveReviewTriggerProps extends WithTranslation {
    groupId: number;
    onSubmit: () => Promise<void>;
}

const parsePair = (value: string): { psid: number, gid: number, pid: number } | null => {
    if (!value) return null;
    const parts = value.split("-");
    if (parts.length !== 3) return null;
    const psid = Number(parts[0]);
    const gid = Number(parts[1]);
    const pid = Number(parts[2]);
    if (Number.isNaN(psid) || Number.isNaN(gid) || Number.isNaN(pid)) return null;
    return {psid, gid, pid};
};

const pickUniqueStrings = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    const filtered = value.filter((item): item is string => typeof item === "string");
    return Array.from(new Set(filtered));
};

const SubjectiveReviewTrigger: React.FC<SubjectiveReviewTriggerProps> = (props) => {
    const {t, groupId, onSubmit} = props;
    const [form] = Form.useForm();
    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [subjectiveOptions, setSubjectiveOptions] = useState<SubjectiveOption[]>([]);
    const [programmingOptions, setProgrammingOptions] = useState<ProgrammingOption[]>([]);
    const [studentOptions, setStudentOptions] = useState<string[]>([]);

    const selectedSubjectiveValues = Form.useWatch("subjectiveProblems", form);
    const hasSubjectSelection = useMemo(() => {
        return pickUniqueStrings(selectedSubjectiveValues).length > 0;
    }, [selectedSubjectiveValues]);

    const subjectPendingMap = useMemo(() => {
        const map = new Map<string, string[]>();
        subjectiveOptions.forEach(item => {
            map.set(`${item.psid}-${item.gid}-${item.pid}`, item.pendingStudents || []);
        });
        return map;
    }, [subjectiveOptions]);

    useEffect(() => {
        setLoading(true);
        cApi.getGroupSubjectiveAutoTaskOptions(groupId)
            .then((res: any) => {
                setSubjectiveOptions((res?.subjectiveProblems || []).map((item: any) => ({
                    ...item,
                    pendingStudents: Array.isArray(item.pendingStudents) ? item.pendingStudents : []
                })));
                setProgrammingOptions(res?.programmingProblems || []);
                setStudentOptions(res?.students || []);
            })
            .catch(() => {
                message.error(t("failed"));
                setSubjectiveOptions([]);
                setProgrammingOptions([]);
                setStudentOptions([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [groupId, t]);

    const handleSubmit = useCallback(async () => {
        try {
            const values = await form.validateFields();
            const subjectiveSelected = pickUniqueStrings(values.subjectiveProblems);
            const studentsSelected = pickUniqueStrings(values.students);
            const programmingSelected = pickUniqueStrings(values.programmingProblems);

            const programmingRefs = programmingSelected
                .map((value) => {
                    const parsed = parsePair(value);
                    return parsed ? {gid: parsed.gid, pid: parsed.pid} : null;
                })
                .filter((item): item is { gid: number, pid: number } => Boolean(item));
            
            const tasks: any[] = [];
            subjectiveSelected.forEach((pair) => {
                const coords = parsePair(pair);
                if (!coords) return;
                studentsSelected.forEach((username) => {
                    tasks.push({
                        psid: coords.psid,
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
            
            setSubmitting(true);
            await cApi.createGroupSubjectiveAutoTasks({
                groupId,
                tasks
            });
            message.success(t("Success"));
            form.resetFields();
            await onSubmit();
        } catch (error: any) {
            if (!error?.errorFields) {
                message.error(t("failed"));
            }
        } finally {
            setSubmitting(false);
        }
    }, [form, groupId, onSubmit, t]);

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
            const psName = item.psName ? `[${item.psName}] ` : "";
            return {
                label: `${psName}G${item.gid} · P${item.pid}${preview}`,
                value: `${item.psid}-${item.gid}-${item.pid}`
            };
        });
    }, [subjectiveOptions]);

    const programSelectOptions = useMemo(() => {
        return programmingOptions.map((item) => ({
            label: item.name ? `${item.name} (${item.gid}-${item.pid})` : `G${item.gid} · P${item.pid}`,
            value: `${item.psid}-${item.gid}-${item.pid}`
        }));
    }, [programmingOptions]);

    const studentSelectOptions = useMemo(() => {
        return studentOptions.map((username) => ({
            label: username,
            value: username
        }));
    }, [studentOptions]);

    return (
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
                            loading={loading}
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
                            loading={loading}
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
                            loading={loading}
                            optionFilterProp="label"
                            maxTagCount="responsive"
                        />
                    </Form.Item>
                </Col>
            </Row>
            <Space>
                <Button type="primary" onClick={handleSubmit} loading={submitting}>
                    {t("AutoTaskSubmit")}
                </Button>
                <Button onClick={() => form.resetFields()}>
                    {t("Reset")}
                </Button>
            </Space>
        </Form>
    );
};

export default withTranslation()(SubjectiveReviewTrigger);
