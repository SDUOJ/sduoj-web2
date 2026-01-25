import React, { useState, useEffect } from "react";
import { Card, Button, Modal, Form, Input, InputNumber, message, Transfer, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { TransferProps } from "antd";
import cApi from "../../Utils/API/c-api";
import LatePermissionList from "../common/LatePermissionList";

interface BatchExtensionProps {
    groupId: number;
}

interface ProblemSet {
    psid: number;
    name: string;
    tag: string;
}

interface TransferItem {
    key: string;
    title: string;
    description?: string;
    disabled?: boolean;
    tag?: string;
    psid?: number;
}

const BatchExtension: React.FC<BatchExtensionProps> = ({ groupId }) => {
    const { t } = useTranslation();
    const [form] = Form.useForm();
    
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [problemSets, setProblemSets] = useState<ProblemSet[]>([]);
    const [transferDataSource, setTransferDataSource] = useState<TransferItem[]>([]);
    const [targetKeys, setTargetKeys] = useState<string[]>([]);
    const [tagPsidsMap, setTagPsidsMap] = useState<Map<string, number[]>>(new Map());
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        fetchProblemSets();
    }, [groupId]);

    // 获取题单列表并构建穿梭框数据
    const fetchProblemSets = async () => {
        try {
            const res: any = await cApi.getProblemSetListByGroup({ groupId });
            
            if (res && typeof res === 'object') {
                const allProblemSets: ProblemSet[] = [];
                const transferItems: TransferItem[] = [];
                const tagMap = new Map<string, number[]>();
                
                // res 是一个对象，key 是 tag，value 是题单数组
                Object.entries(res).forEach(([tag, psList]: [string, any]) => {
                    const psids: number[] = [];
                    
                    if (Array.isArray(psList)) {
                        psList.forEach((ps: any) => {
                            allProblemSets.push({
                                psid: ps.psid,
                                name: ps.name,
                                tag
                            });
                            
                            psids.push(ps.psid);
                            
                            transferItems.push({
                                key: `ps-${ps.psid}`,
                                title: ps.name,
                                description: tag,
                                tag,
                                psid: ps.psid
                            });
                        });
                    }
                    
                    if (psids.length > 0) {
                        tagMap.set(tag, psids);
                    }
                });
                
                setProblemSets(allProblemSets);
                setTransferDataSource(transferItems);
                setTagPsidsMap(tagMap);
            }
        } catch (error) {
            message.error(t("Failed to fetch problem sets"));
        }
    };

    // 处理批量添加
    const handleBatchAdd = async (values: any) => {
        try {
            // 从 targetKeys 中提取题单 ID
            const psids = targetKeys
                .filter(key => key.startsWith('ps-'))
                .map(key => parseInt(key.replace('ps-', '')))
                .filter(id => !isNaN(id));
            
            if (psids.length === 0) {
                message.warning(t("Please select at least one problem set"));
                return;
            }
            
            const res: any = await cApi.batchAddProblemSetLatePermission({
                groupId,
                psids,
                username: values.username,
                duration_minute: values.duration_minute,
                discount: values.discount,
                note: values.note || ""
            });
            
            if (res && res.created) {
                message.success(
                    `${t("created")}: ${res.created.length}, ${t("conflicts")}: ${res.conflicts?.length || 0}, ${t("requested")}: ${res.requested}`
                );
                setModalVisible(false);
                form.resetFields();
                setTargetKeys([]);
                setRefreshKey(prev => prev + 1);
            }
        } catch (error) {
            message.error(t("Failed to add late permissions"));
        }
    };

    // 穿梭框变化处理
    const handleTransferChange: TransferProps['onChange'] = (newTargetKeys) => {
        setTargetKeys(newTargetKeys as string[]);
    };

    // 按标签全选
    const handleSelectByTag = (tag: string) => {
        const psids = tagPsidsMap.get(tag) || [];
        const tagKeys = psids.map(id => `ps-${id}`);
        
        // 检查该 tag 下的所有题单是否都已选中
        const allSelected = tagKeys.every(key => targetKeys.includes(key));
        
        if (allSelected) {
            // 取消选中该 tag 下的所有题单
            setTargetKeys(targetKeys.filter(key => !tagKeys.includes(key)));
        } else {
            // 选中该 tag 下的所有题单
            const newTargetKeys = Array.from(new Set([...targetKeys, ...tagKeys]));
            setTargetKeys(newTargetKeys);
        }
    };

    // 自定义穿梭框渲染
    const renderTransferItem = (item: TransferItem) => {
        return item.title;
    };

    return (
        <div className="batch-extension">
            <Card 
                title={t("latePermissionList")}
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setModalVisible(true)}
                    >
                        {t("addBatchLatePermission")}
                    </Button>
                }
            >
                <LatePermissionList 
                    key={refreshKey}
                    groupId={groupId} 
                    showTitle={false} 
                    showAddButton={false} 
                />
            </Card>

            <Modal
                title={t("addBatchLatePermission")}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                    setTargetKeys([]);
                }}
                onOk={() => form.submit()}
                width={900}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleBatchAdd}
                >
                    <Form.Item
                        name="username"
                        label={t("username")}
                        rules={[{ required: true, message: t("usernameEmpty") }]}
                    >
                        <Input placeholder={t("placeholderUsername")} />
                    </Form.Item>

                    <Form.Item
                        label={t("selectProblemSets")}
                        required
                    >
                        <div style={{ marginBottom: 12 }}>
                            <span style={{ marginRight: 8 }}>{t("selectByTag")}:</span>
                            {Array.from(tagPsidsMap.keys()).map(tag => {
                                const tagKeys = (tagPsidsMap.get(tag) || []).map(id => `ps-${id}`);
                                const allSelected = tagKeys.length > 0 && tagKeys.every(key => targetKeys.includes(key));
                                
                                return (
                                    <Tag
                                        key={tag}
                                        color={allSelected ? "blue" : "default"}
                                        style={{ cursor: 'pointer', marginBottom: 4 }}
                                        onClick={() => handleSelectByTag(tag)}
                                    >
                                        {tag} ({tagKeys.length})
                                    </Tag>
                                );
                            })}
                        </div>
                        <Transfer
                            dataSource={transferDataSource}
                            titles={[t("availableProblemSets"), t("selectedProblemSets")]}
                            targetKeys={targetKeys}
                            onChange={handleTransferChange}
                            render={renderTransferItem}
                            listStyle={{
                                width: 380,
                                height: 400
                            }}
                            showSearch
                            filterOption={(inputValue, item) =>
                                item.title.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1 ||
                                (item.description?.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1)
                            }
                        />
                        {targetKeys.length > 0 && (
                            <div style={{ marginTop: 8, color: '#666' }}>
                                {t("selectedProblemSets")}: {targetKeys.length}
                            </div>
                        )}
                    </Form.Item>

                    <Form.Item
                        name="duration_minute"
                        label={t("durationMinute")}
                        rules={[
                            { required: true, message: t("PleaseEnter") + t("durationMinute") },
                            { type: 'number', min: 1, message: t("Must be a positive number") }
                        ]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            placeholder={t("PleaseEnter") + t("durationMinute")}
                            min={1}
                        />
                    </Form.Item>

                    <Form.Item
                        name="discount"
                        label={t("discount")}
                        rules={[
                            { required: true, message: t("PleaseEnter") + t("discount") },
                            { type: 'number', min: 0.01, max: 1, message: t("Value must be between 0.01 and 1") }
                        ]}
                        initialValue={1}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            placeholder={t("PleaseEnter") + t("discount")}
                            min={0.01}
                            max={1}
                            step={0.01}
                        />
                    </Form.Item>

                    <Form.Item
                        name="note"
                        label={t("note")}
                    >
                        <Input.TextArea
                            rows={3}
                            placeholder={t("PleaseEnter") + t("note")}
                            maxLength={200}
                            showCount
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default BatchExtension;
