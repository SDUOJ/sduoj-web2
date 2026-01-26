import React, {useState, useEffect, useCallback} from "react";
import {Button, Form, Select, Space, message} from "antd";
import {withTranslation, WithTranslation} from "react-i18next";
import cApi from "../../../Utils/API/c-api";

interface SummaryExportTriggerProps extends WithTranslation {
    groupId: number;
    onSubmit: () => Promise<void>;
}

const SummaryExportTrigger: React.FC<SummaryExportTriggerProps> = (props) => {
    const {t, groupId, onSubmit} = props;
    const [form] = Form.useForm();
    const [problemSets, setProblemSets] = useState<{psid: number, name: string, tag?: string}[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);

    useEffect(() => {
        setLoading(true);
        cApi.getProblemSetListByGroup({ groupId })
            .then((res: any) => {
                const allProblemSets: {psid: number, name: string, tag?: string}[] = [];
                if (res && typeof res === 'object') {
                    Object.entries(res).forEach(([tag, psList]: [string, any]) => {
                        if (Array.isArray(psList)) {
                            psList.forEach((ps: any) => {
                                allProblemSets.push({
                                    psid: ps.psid,
                                    name: ps.name,
                                    tag: tag
                                });
                            });
                        }
                    });
                }
                setProblemSets(allProblemSets);
            })
            .catch(() => {
                message.error(t("failed"));
                setProblemSets([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [groupId, t]);

    const handleSubmit = useCallback(async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            await cApi.createSummaryExportTask({
                groupId,
                psids: values.psids && values.psids.length > 0 ? values.psids : null
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

    const problemSetOptions = problemSets.map(ps => ({
        label: `${ps.name} ${ps.tag ? `[${ps.tag}]` : ''}`,
        value: ps.psid
    }));

    return (
        <Form
            layout="vertical"
            form={form}
            initialValues={{
                psids: undefined
            }}
        >
            <Form.Item
                label={t("SummaryExportProblemSets")}
                name="psids"
                extra={t("SummaryExportProblemSetsHelp")}
            >
                <Select
                    mode="multiple"
                    showSearch
                    allowClear
                    placeholder={t("SummaryExportProblemSetsPlaceholder")}
                    options={problemSetOptions}
                    loading={loading}
                    optionFilterProp="label"
                    maxTagCount="responsive"
                />
            </Form.Item>
            <Space>
                <Button type="primary" onClick={handleSubmit} loading={submitting}>
                    {t("SummaryExportSubmit")}
                </Button>
                <Button onClick={() => form.resetFields()}>
                    {t("Reset")}
                </Button>
            </Space>
        </Form>
    );
};

export default withTranslation()(SummaryExportTrigger);
