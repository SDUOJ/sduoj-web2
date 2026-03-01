import {Button, Form, Input, Space, Typography, message} from "antd";
import {withTranslation} from "react-i18next";
import CellEditTable from "../../common/Table/CellEditTable";
import React, {useEffect, useRef, useState} from "react";
import {PlusOutlined} from "@ant-design/icons";

const DEFAULT_PROMPT_TEMPLATE = `你是一名有教学经验的课程阅卷专家，请根据下面题目信息生成主观题评测配置。

【题目标题】
{{title}}

【题目内容】
{{description}}

【已有得分项（JSON，可为空）】
{{judge_items_json}}

评分标准设计原则：
1. 采用“相对宽松、鼓励过程”的评分策略：只要核心思路正确、步骤基本合理，即应给到对应分值，不要按过严标准扣分。
2. 各评分条目必须相互独立，不要包含关系，不要交叉重复计分。
3. 条目数量不要过多，建议 2-3 条；优先覆盖关键能力点，避免过细碎。
4. 所有条目分值总和必须严格等于 100 分。
5. 每个条目名称清晰、边界明确、可单独判断，不依赖其它条目成立。
6. 每个条目的 answer 要写成可执行评分标准：至少包含“给分条件、可接受变体、常见失分点（但不要过于苛刻）”。

输出要求（只返回 JSON，不要返回解释、不要 Markdown）：
1. 返回一个 JSON 数组；
2. 每个元素必须包含字段：name（得分项名称）、score（分值，数字）、answer（评分标准/参考答案）；
3. score 必须是数字，所有 score 求和为 100；
4. 不要输出与评分无关的字段，不要生成空字符串字段。

JSON 格式强约束（必须严格遵守）：
1. 输出必须是“可直接被 JSON.parse 解析”的合法 JSON 字符串；
2. 所有 key 和字符串 value 必须使用英文半角双引号 "..."，禁止使用中文引号 “...” 或 ‘...’；
3. 禁止注释、禁止尾逗号、禁止多余前后文本；
4. 仅返回 JSON 本体（必须以 [ 开始、以 ] 结束），不要使用 \`\`\`json 包裹。`;

const NAME_KEYS = ["name", "title", "item", "scoreItem", "得分项", "得分项名称", "评分项", "评分点"];
const SCORE_KEYS = ["score", "points", "value", "分值", "分数"];
const ANSWER_KEYS = ["answer", "standardAnswer", "referenceAnswer", "rubric", "criteria", "答案", "参考答案", "标准答案", "评分标准"];

const pickByKeys = (obj: any, keys: string[]) => {
    for (const key of keys) {
        if (obj?.[key] !== undefined && obj?.[key] !== null) {
            return obj[key];
        }
    }
    return undefined;
};

const unwrapCodeFence = (text: string) => {
    const trimmed = text.trim();
    const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    return match ? match[1] : trimmed;
};

const extractLikelyJsonBlock = (text: string) => {
    const match = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    return match ? match[1] : text;
};

const normalizeJsonLikeText = (text: string) => {
    let normalized = text.replace(/^\uFEFF/, "").trim();
    normalized = normalized
        .replace(/([\{\[,]\s*)[“”]([^“”]+?)[“”]\s*[:：]/g, '$1"$2":')
        .replace(/([\{\[,]\s*)[‘’]([^‘’]+?)[‘’]\s*[:：]/g, '$1"$2":')
        .replace(/(:\s*)[“]([\s\S]*?)[”](\s*[,}\]])/g, '$1"$2"$3')
        .replace(/(:\s*)[‘]([\s\S]*?)[’](\s*[,}\]])/g, '$1"$2"$3')
        .replace(/(:\s*)'([^'\\]*(?:\\.[^'\\]*)*)'(\s*[,}\]])/g, '$1"$2"$3');
    return normalized;
};

const stripPairQuotes = (raw: string) => {
    const text = raw.trim();
    if (text.length < 2) return text;
    const pairMap: {[key: string]: string} = {
        '"': '"',
        "'": "'",
        "“": "”",
        "‘": "’"
    };
    const first = text[0];
    const last = text[text.length - 1];
    if (pairMap[first] === last) {
        return text.slice(1, -1).trim();
    }
    return text;
};

const escapeRegex = (text: string) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const extractLooseFieldRaw = (
    objectText: string,
    keyMatches: Array<{key: string, start: number, end: number}>,
    keys: string[]
) => {
    const idx = keyMatches.findIndex((item) => keys.includes(item.key));
    if (idx < 0) return undefined;
    const start = keyMatches[idx].end;
    const nextStart = idx + 1 < keyMatches.length ? keyMatches[idx + 1].start : objectText.lastIndexOf("}");
    const end = nextStart >= 0 ? nextStart : objectText.length;
    let raw = objectText.slice(start, end).trim();
    raw = raw.replace(/^,\s*/, "").replace(/,\s*$/, "").trim();
    return raw;
};

const parseLooseArrayPayload = (text: string) => {
    const objectList = text.match(/\{[\s\S]*?\}/g) || [];
    if (!objectList.length) {
        throw new Error("未识别到可解析的对象列表。");
    }
    const allKeys = Array.from(new Set([...NAME_KEYS, ...SCORE_KEYS, ...ANSWER_KEYS]))
        .map((key) => escapeRegex(key))
        .join("|");
    const keyRegex = new RegExp(`[\"'“”‘’]?(${allKeys})[\"'“”‘’]?\\s*[:：]`, "gi");

    const result = objectList.map((objectText: string, index: number) => {
        const keyMatches: Array<{key: string, start: number, end: number}> = [];
        keyRegex.lastIndex = 0;
        let match;
        while ((match = keyRegex.exec(objectText)) !== null) {
            keyMatches.push({
                key: String(match[1]),
                start: match.index,
                end: keyRegex.lastIndex
            });
        }
        keyMatches.sort((a, b) => a.start - b.start);

        const nameRaw = extractLooseFieldRaw(objectText, keyMatches, NAME_KEYS);
        const scoreRaw = extractLooseFieldRaw(objectText, keyMatches, SCORE_KEYS);
        const answerRaw = extractLooseFieldRaw(objectText, keyMatches, ANSWER_KEYS);

        const scoreMatch = (scoreRaw || "").match(/-?\d+(?:\.\d+)?/);
        return {
            name: nameRaw ? stripPairQuotes(nameRaw) : `得分项${index + 1}`,
            score: scoreMatch ? Number(scoreMatch[0]) : 0,
            answer: answerRaw ? stripPairQuotes(answerRaw) : ""
        };
    });

    if (!result.length) {
        throw new Error("未识别到可解析的评分项。");
    }
    return result;
};

const parseJsonRaw = (raw: string) => {
    const cleaned = unwrapCodeFence(raw);
    const candidate = extractLikelyJsonBlock(cleaned);
    const parseCandidates = [
        cleaned,
        candidate,
        normalizeJsonLikeText(cleaned),
        normalizeJsonLikeText(candidate)
    ];
    const seen = new Set<string>();

    for (const item of parseCandidates) {
        const cur = item?.trim();
        if (!cur || seen.has(cur)) continue;
        seen.add(cur);
        try {
            return JSON.parse(cur);
        } catch (_e) {
            // continue
        }
    }

    try {
        return parseLooseArrayPayload(candidate);
    } catch (_e) {
        throw new Error("JSON 解析失败：请检查引号、逗号和括号；支持标准 JSON 与中文引号的类 JSON。");
    }
};

const extractListFromPayload = (payload: any): any[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.list)) return payload.list;
    if (Array.isArray(payload?.judgeConfig)) return payload.judgeConfig;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.config?.judgeConfig)) return payload.config.judgeConfig;
    throw new Error("未找到可解析的列表，请提供数组/list/judgeConfig/items/data。");
};

const toNumber = (value: any) => {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
};

const normalizeJudgeConfigList = (list: any[]) => {
    const baseId = Date.now();
    return list.map((item: any, index: number) => {
        if (typeof item === "string") {
            return {
                id: baseId + index,
                name: `得分项${index + 1}`,
                score: 0,
                answer: item
            };
        }
        const name = pickByKeys(item, NAME_KEYS);
        const score = pickByKeys(item, SCORE_KEYS);
        const answer = pickByKeys(item, ANSWER_KEYS);
        return {
            id: baseId + index,
            name: name ?? `得分项${index + 1}`,
            score: toNumber(score),
            answer: answer ?? ""
        };
    });
};

const replaceToken = (template: string, token: string, value: string) => {
    return template.split(token).join(value);
};

const stripHtmlTags = (text: string) => {
    return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

const SubjectiveConfigForm = (props: any) => {
    const form = Form.useFormInstance();
    const nameValue = Form.useWatch("name", form);
    const descriptionValue = Form.useWatch("description", form);
    const judgeConfigValue = Form.useWatch(["config", "judgeConfig"], form);
    const [promptTemplate, setPromptTemplate] = useState<string>(DEFAULT_PROMPT_TEMPLATE);
    const [jsonInput, setJsonInput] = useState<string>("");
    const [jsonParseHint, setJsonParseHint] = useState<string>("");
    const lastAutoAppliedRaw = useRef<string>("");

    const getPromptPreviewData = () => {
        const crossStepValues = props.getAllStepValues?.() || {};
        const step0Values = crossStepValues?.step0 || {};
        const step1Values = crossStepValues?.step1 || {};

        const titleRaw = nameValue
            ?? crossStepValues?.name
            ?? crossStepValues?.title
            ?? step0Values?.name
            ?? step0Values?.title
            ?? "";
        const descriptionRaw = descriptionValue
            ?? crossStepValues?.description
            ?? step0Values?.description
            ?? "";
        const judgeConfigRaw = judgeConfigValue
            ?? crossStepValues?.config?.judgeConfig
            ?? step1Values?.config?.judgeConfig
            ?? [];

        const descriptionText = typeof descriptionRaw === "string" ? descriptionRaw : "";
        const titleFallback = stripHtmlTags(descriptionText).slice(0, 40);
        const cleanJudgeConfig = (judgeConfigRaw || []).map((item: any) => ({
            name: item?.name ?? "",
            score: toNumber(item?.score),
            answer: item?.answer ?? ""
        }));
        return {
            title: String(titleRaw || titleFallback || "（未填写）"),
            description: String(descriptionRaw || "（未填写）"),
            judgeItemsJson: JSON.stringify(cleanJudgeConfig, null, 2)
        };
    };

    const buildPromptText = () => {
        const promptPreviewData = getPromptPreviewData();
        return replaceToken(
            replaceToken(
                replaceToken(promptTemplate, "{{title}}", String(promptPreviewData.title)),
                "{{description}}",
                String(promptPreviewData.description)
            ),
            "{{judge_items_json}}",
            String(promptPreviewData.judgeItemsJson)
        );
    };

    const applyJudgeConfigToForm = (list: any[], silent: boolean = false) => {
        const config = form.getFieldValue("config") || {};
        form.setFieldsValue({
            config: {
                ...config,
                judgeConfig: list
            }
        });
        if (!silent) {
            message.success(`已生成 ${list.length} 条得分项配置`);
        }
    };

    const parseJudgeConfigFromRaw = (raw: string) => {
        const payload = parseJsonRaw(raw);
        const list = extractListFromPayload(payload);
        if (!list.length) {
            throw new Error("JSON 列表为空，请至少提供 1 条得分项。");
        }
        return normalizeJudgeConfigList(list);
    };

    const handleApplyJson = () => {
        try {
            const normalizedList = parseJudgeConfigFromRaw(jsonInput);
            applyJudgeConfigToForm(normalizedList);
            setJsonParseHint(`解析成功：${normalizedList.length} 条得分项`);
        } catch (e: any) {
            const msg = e?.message || "JSON 解析失败，请检查格式";
            message.error(msg);
            setJsonParseHint(`解析失败：${msg}`);
        }
    };

    const copyByExecCommand = (content: string) => {
        const textarea = document.createElement("textarea");
        textarea.value = content;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
    };

    const handleCopyPrompt = async () => {
        const content = buildPromptText();
        try {
            await navigator.clipboard.writeText(content);
            message.success("提示词已复制");
        } catch (_e) {
            copyByExecCommand(content);
            message.success("提示词已复制");
        }
    };

    useEffect(() => {
        if (!jsonInput.trim()) {
            setJsonParseHint("");
            lastAutoAppliedRaw.current = "";
            return;
        }
        const timer = setTimeout(() => {
            try {
                const normalizedList = parseJudgeConfigFromRaw(jsonInput);
                setJsonParseHint(`解析成功：${normalizedList.length} 条得分项（已自动更新评测配置）`);
                if (lastAutoAppliedRaw.current !== jsonInput) {
                    applyJudgeConfigToForm(normalizedList, true);
                    lastAutoAppliedRaw.current = jsonInput;
                }
            } catch (e: any) {
                setJsonParseHint(`解析失败：${e?.message || "JSON 格式不正确"}`);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [jsonInput]);

    const tableColumns = [
        {
            title: '得分项名称',
            dataIndex: 'name',
            editable: true,
            valueType: 'text'
        },
        {
            title: '分值',
            dataIndex: 'score',
            editable: true,
            valueType: 'digit'
        },
        {
            title: "答案",
            dataIndex: "answer",
            editable: true,
            valueType: 'textarea'
        },
        {
            title: "操作",
            valueType: "option",
            width: 60
        }
    ]
    return (
        <>
            <Form.Item label={"提示词模板"}>
                <Space direction={"vertical"} style={{width: "100%"}} size={8}>
                    <Input.TextArea
                        value={promptTemplate}
                        onChange={(e) => {
                            setPromptTemplate(e.target.value);
                        }}
                        autoSize={{minRows: 8, maxRows: 16}}
                        placeholder={"支持占位符：{{title}} {{description}} {{judge_items_json}}"}
                    />
                    <Space>
                        <Button onClick={handleCopyPrompt}>复制提示词</Button>
                        <Button
                            type={"link"}
                            onClick={() => {
                                setPromptTemplate(DEFAULT_PROMPT_TEMPLATE);
                            }}
                        >
                            恢复默认模板
                        </Button>
                    </Space>
                    <Typography.Text type={"secondary"}>
                        占位符：{"{{title}}"} / {"{{description}}"} / {"{{judge_items_json}}"}。复制时会自动替换为当前题目与得分项内容。
                    </Typography.Text>
                </Space>
            </Form.Item>
            <Form.Item label={"JSON 自动解析"}>
                <Space direction={"vertical"} style={{width: "100%"}} size={8}>
                    <Input.TextArea
                        value={jsonInput}
                        onChange={(e) => {
                            setJsonInput(e.target.value);
                        }}
                        autoSize={{minRows: 6, maxRows: 16}}
                        placeholder={'可粘贴数组/list/judgeConfig，例如：[{"name":"步骤正确","score":30,"answer":"..."}]'}
                    />
                    <Space>
                        <Button type={"primary"} onClick={handleApplyJson}>解析并应用</Button>
                        <Button
                            onClick={() => {
                                setJsonInput("");
                                setJsonParseHint("");
                            }}
                        >
                            清空
                        </Button>
                    </Space>
                    {jsonParseHint && (
                        <Typography.Text type={jsonParseHint.startsWith("解析成功") ? "success" : "danger"}>
                            {jsonParseHint}
                        </Typography.Text>
                    )}
                </Space>
            </Form.Item>
            <Form.Item name={["config", "judgeConfig"]} label={"评测配置"}>
                <CellEditTable
                    columns={tableColumns}
                    rowKey={"id"}
                    toolBar={(actionRef: any) => {
                        return [
                            <Button
                                type={"dashed"}
                                block
                                icon={<PlusOutlined/>}
                                onClick={() => {
                                    actionRef.current?.addEditRecord?.({
                                        id: Date.now()
                                    }, {newRecordType: "dataSource"});
                                }}
                            >{"新增得分项"}</Button>
                        ]
                    }}
                    rowButton={() => []}
                />
            </Form.Item>
        </>
    )
}

export default withTranslation()(SubjectiveConfigForm)
