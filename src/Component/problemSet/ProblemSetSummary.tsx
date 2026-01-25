import React, {useEffect, useState} from "react";
import {Card, Tabs, Row, Col, Statistic, Progress, Empty, Spin, message, Table, Space, Tooltip, Input, Switch, Button} from "antd";
import {SearchOutlined} from "@ant-design/icons";
import {useTranslation} from "react-i18next";
import {useSelector} from "react-redux";
import {useHistory} from "react-router-dom";
import cApi from "../../Utils/API/c-api";
import {UserState} from "../../Type/Iuser";
import {UrlPrefix} from "../../Config/constValue";

interface ProblemSetObject {
    psid: number;
    name: string;
    global_score: number;
    groups: Array<{
        gid: number;
        name: string;
        type: number;
        problems: Array<{
            pid: number;
            name: string;
            hasAnswer: boolean;
            score: number;
            point: number;
            weighted_point: number;
        }>
    }>
}

interface TagSummaryData {
    [tagName: string]: ProblemSetObject[];
}

interface ProblemSetSummaryProps {
    groupId: number;
    username?: string;
    force?: boolean;
}

const ProblemSetSummary: React.FC<ProblemSetSummaryProps> = ({groupId, username: initialUsername, force: initialForce}) => {
    const {t} = useTranslation();
    const history = useHistory();
    const userState = useSelector((state: any) => state.UserReducer as UserState);
    const [loading, setLoading] = useState<boolean>(true);
    const [data, setData] = useState<TagSummaryData>({});
    const [activeTagKey, setActiveTagKey] = useState<string>("");
    
    // 是否为管理员
    const isAdmin = userState?.userInfo?.roles?.some(role => role === "admin" || role === "superadmin") || false;

    // 管理员功能状态
    const [queryUsername, setQueryUsername] = useState<string>(initialUsername || "");
    const [showAll, setShowAll] = useState<boolean>(initialForce || false);

    useEffect(() => {
        fetchSummaryData();
    }, [groupId, initialUsername, initialForce]);

    const fetchSummaryData = async (user?: string, forceAll?: boolean) => {
        try {
            setLoading(true);
            const res = (await cApi.getPersonalTagSummary({
                groupId,
                username: user !== undefined ? user : queryUsername,
                force: forceAll !== undefined ? forceAll : showAll
            })) as any as TagSummaryData;
            setData(res || {});
            const keys = Object.keys(res || {});
            if (keys.length > 0) {
                if (!keys.includes(activeTagKey)) {
                    setActiveTagKey(keys[0]);
                }
            } else {
                setActiveTagKey("");
            }
        } catch (error) {
            // Error is already handled by cApi (request.ts)
        } finally {
            setLoading(false);
        }
    };

    // 计算按 Tag 分类的统计信息
    const getTagStats = () => {
        const stats: any[] = [];
        let totalScore = 0;
        let totalMaxScore = 0;
        let totalSubmittedCount = 0;
        let totalProblemsCount = 0;

        Object.entries(data).forEach(([tagName, problemSets]) => {
            let tagScore = 0;
            let tagMaxScore = 0;
            let tagSubmittedCount = 0;
            let tagTotalProblems = 0;

            problemSets.forEach(ps => {
                ps.groups.forEach(group => {
                    group.problems.forEach(problem => {
                        // 计算该题目的实际加权得分
                        const problemActualWeightedScore = problem.point > 0 
                            ? (problem.score / problem.point) * problem.weighted_point 
                            : 0;
                        
                        tagScore += problemActualWeightedScore;
                        tagMaxScore += problem.weighted_point;
                        tagTotalProblems += 1;
                        if (problem.hasAnswer) {
                            tagSubmittedCount += 1;
                        }
                    });
                });
            });

            totalScore += tagScore;
            totalMaxScore += tagMaxScore;
            totalSubmittedCount += tagSubmittedCount;
            totalProblemsCount += tagTotalProblems;

            stats.push({
                tagName,
                tagScore: tagScore.toFixed(2),
                tagMaxScore: tagMaxScore.toFixed(2),
                percentage: tagMaxScore > 0 ? ((tagScore / tagMaxScore) * 100).toFixed(1) : 0,
                submissionRate: tagTotalProblems > 0 ? ((tagSubmittedCount / tagTotalProblems) * 100).toFixed(1) : 0,
                submittedCount: tagSubmittedCount,
                totalProblems: tagTotalProblems
            });
        });

        return {stats, totalScore, totalMaxScore, totalSubmittedCount, totalProblemsCount};
    };

    // 获取题单合并详情数据
    const getProblemSetDetailData = () => {
        const result: any[] = [];

        Object.entries(data).forEach(([_, problemSets]) => {
            problemSets.forEach(ps => {
                const existing = result.find(item => item.psid === ps.psid);
                if (existing) return;

                let submitted = 0;
                let total = 0;
                let actualScore = 0;
                let psMaxScore = 0;

                ps.groups.forEach(group => {
                    group.problems.forEach(problem => {
                        total += 1;
                        if (problem.hasAnswer) {
                            submitted += 1;
                        }
                        const problemActualWeightedScore = problem.point > 0 
                            ? (problem.score / problem.point) * problem.weighted_point 
                            : 0;
                        actualScore += problemActualWeightedScore;
                        psMaxScore += problem.weighted_point;
                    });
                });

                result.push({
                    psid: ps.psid,
                    psName: ps.name,
                    submitted,
                    total,
                    submissionRate: total > 0 ? ((submitted / total) * 100).toFixed(1) : 0,
                    actualScore: parseFloat(actualScore.toFixed(2)),
                    maxScore: parseFloat(psMaxScore.toFixed(2)),
                    scoreRate: psMaxScore > 0 ? ((actualScore / psMaxScore) * 100).toFixed(1) : 0
                });
            });
        });

        return result;
    };

    // 获取指定 Tag 的详细信息
    const getTagDetailData = (tagName: string) => {
        const problemSets = data[tagName] || [];
        const tabItems: any[] = [];

        problemSets.forEach(ps => {
            const columns: any[] = [
                {
                    title: t("Problem"),
                    dataIndex: "name",
                    key: "name",
                    render: (text: string, record: any) => (
                        <a 
                            onClick={() => history.push(`${UrlPrefix}/problem/${record.pid}`)}
                            style={{cursor: 'pointer', color: '#1890ff'}}
                        >
                            {text}
                        </a>
                    )
                },
                {
                    title: t("hasAnswer"),
                    dataIndex: "hasAnswer",
                    key: "hasAnswer",
                    render: (hasAnswer: boolean) => hasAnswer ? "✓" : "✗"
                },
                {
                    title: t("Score"),
                    dataIndex: "score",
                    key: "score",
                    render: (_: number, record: any) => {
                        const problemActualWeightedScore = record.point > 0 
                            ? (record.score / record.point) * record.weighted_point 
                            : 0;
                        return (
                            <Tooltip title={`${t("Weight")}: ${record.weighted_point}`}>
                                <span>{problemActualWeightedScore.toFixed(2)} / {record.weighted_point.toFixed(2)}</span>
                            </Tooltip>
                        );
                    }
                },
                {
                    title: t("Correctness"),
                    dataIndex: "correctness",
                    key: "correctness",
                    render: (_: any, record: any) => {
                        const correctness = record.point > 0 ? (record.score / record.point) * 100 : 0;
                        return (
                            <Tooltip title={`${t("Point")}: ${record.score.toFixed(1)} / ${record.point}`}>
                                <span>{correctness.toFixed(1)}%</span>
                            </Tooltip>
                        );
                    }
                }
            ];

            const problemTableData: any[] = [];
            ps.groups.forEach(group => {
                group.problems.forEach(problem => {
                    problemTableData.push({
                        key: problem.pid,
                        name: problem.name,
                        hasAnswer: problem.hasAnswer,
                        score: problem.score,
                        point: problem.point,
                        weighted_point: problem.weighted_point,
                        group: group.name
                    });
                });
            });

            tabItems.push({
                key: ps.psid.toString(),
                label: `${ps.name} (${ps.global_score}${t("point")})`,
                children: (
                    <Table
                        columns={columns}
                        dataSource={problemTableData}
                        pagination={false}
                        size="small"
                        scroll={{x: 400}}
                    />
                )
            });
        });

        return tabItems;
    };

    const {stats, totalScore, totalMaxScore, totalSubmittedCount, totalProblemsCount} = getTagStats();
    const psDetailData = getProblemSetDetailData();

    const mainTabItems = [
        {
            key: "overview",
            label: t("Overview"),
            children: (
                <>
                    <Card style={{marginBottom: 24}}>
                        <Row gutter={32}>
                            <Col xs={24} sm={12} md={8}>
                                <Statistic
                                    title={t("Total Score")}
                                    value={totalScore.toFixed(2)}
                                    suffix={`/ ${totalMaxScore.toFixed(2)} ${t("point")}`}
                                    valueStyle={{color: '#1890ff'}}
                                />
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Statistic
                                    title={t("Score Rate")}
                                    value={totalMaxScore > 0 ? ((totalScore / totalMaxScore) * 100).toFixed(1) : 0}
                                    suffix="%"
                                    valueStyle={{color: '#52c41a'}}
                                />
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Statistic
                                    title={t("Total Submission Rate")}
                                    value={totalProblemsCount > 0 ? ((totalSubmittedCount / totalProblemsCount) * 100).toFixed(1) : 0}
                                    suffix={`% (${totalSubmittedCount}/${totalProblemsCount})`}
                                    valueStyle={{color: '#faad14'}}
                                />
                            </Col>
                        </Row>
                    </Card>

                    <Table
                        columns={[
                            {title: t("Tag"), dataIndex: "tagName", key: "tagName", width: "25%"},
                            {
                                title: t("Score"),
                                dataIndex: "tagScore",
                                key: "tagScore",
                                width: "20%",
                                render: (score: string, record: any) => `${score} / ${record.tagMaxScore}`
                            },
                            {
                                title: t("Score Rate"),
                                dataIndex: "percentage",
                                key: "percentage",
                                width: "20%",
                                render: (pct: string) => (
                                    <Progress percent={parseFloat(pct)} size="small" />
                                )
                            },
                            {
                                title: t("Submission Rate"),
                                dataIndex: "submissionRate",
                                key: "submissionRate",
                                width: "20%",
                                render: (rate: string, record: any) => (
                                    <Tooltip title={`${record.submittedCount} / ${record.totalProblems}`}>
                                        <Progress percent={parseFloat(rate)} size="small" />
                                    </Tooltip>
                                )
                            }
                        ]}
                        dataSource={stats}
                        pagination={false}
                        size="small"
                        scroll={{x: 600}}
                    />
                </>
            )
        },
        {
            key: "psDetails",
            label: t("Problem Set Details"),
            children: (
                <Table
                    columns={[
                        {
                            title: t("Problem Set"), 
                            dataIndex: "psName", 
                            key: "psName", 
                            width: "30%",
                            render: (text: string, record: any) => (
                                <a 
                                    onClick={() => history.push(`${UrlPrefix}/problemSet/${record.psid}`)}
                                    style={{cursor: 'pointer', color: '#1890ff'}}
                                >
                                    {text}
                                </a>
                            )
                        },
                        {
                            title: t("Submission"),
                            dataIndex: "submitted",
                            key: "submitted",
                            width: "15%",
                            render: (submitted: number, record: any) => `${submitted}/${record.total}`
                        },
                        {
                            title: t("Submission Rate"),
                            dataIndex: "submissionRate",
                            key: "submissionRate",
                            width: "20%",
                            render: (rate: string, record: any) => (
                                <Tooltip title={`${record.submitted} / ${record.total}`}>
                                    <Progress percent={parseFloat(rate)} size="small" />
                                </Tooltip>
                            )
                        },
                        {
                            title: t("Score"),
                            dataIndex: "actualScore",
                            key: "actualScore",
                            width: "15%",
                            render: (score: number, record: any) => `${score.toFixed(2)}/${record.maxScore.toFixed(2)}`
                        },
                        {
                            title: t("Score Rate"),
                            dataIndex: "scoreRate",
                            key: "scoreRate",
                            width: "20%",
                            render: (rate: string) => (
                                <Progress percent={parseFloat(rate)} size="small" />
                            )
                        }
                    ]}
                    dataSource={psDetailData}
                    pagination={false}
                    size="small"
                    scroll={{x: 800}}
                />
            )
        },
        {
            key: "problemDetails",
            label: t("Problem Details"),
            children: (
                <Tabs
                    activeKey={activeTagKey}
                    onChange={setActiveTagKey}
                    items={Object.keys(data).map(tagName => ({
                        key: tagName,
                        label: tagName,
                        children: (
                            <Tabs items={getTagDetailData(tagName)} />
                        )
                    }))}
                />
            )
        }
    ];

    return (
        <div className="problem-set-summary">
            {/* 管理员/查询控制栏 */}
            {isAdmin && (
                <Card style={{marginBottom: 24}}>
                    <Space wrap size="large">
                        <Space>
                            <span>{t("searchByUsername")}:</span>
                            <Input
                                placeholder={t("placeholderUsername")}
                                value={queryUsername}
                                onChange={e => setQueryUsername(e.target.value)}
                                onPressEnter={() => fetchSummaryData()}
                                style={{width: 200}}
                                suffix={
                                    <SearchOutlined
                                        style={{cursor: 'pointer', color: '#1890ff'}}
                                        onClick={() => fetchSummaryData()}
                                    />
                                }
                            />
                        </Space>
                        <Space>
                            <span>{t("showAll")}:</span>
                            <Switch
                                checked={showAll}
                                onChange={(checked) => {
                                    setShowAll(checked);
                                    fetchSummaryData(queryUsername, checked);
                                }}
                            />
                        </Space>
                        <Button
                            type="primary"
                            icon={<SearchOutlined />}
                            onClick={() => fetchSummaryData()}
                        >
                            {t("Search")}
                        </Button>
                    </Space>
                </Card>
            )}

            {loading ? (
                <div style={{textAlign: 'center', padding: '50px'}}>
                    <Spin size="large" tip={t("Loading")} />
                </div>
            ) : Object.keys(data).length === 0 ? (
                <Empty description={t("notAvailable")} />
            ) : (
                <Card>
                    <Tabs items={mainTabItems} />
                </Card>
            )}
        </div>
    );
};

export default ProblemSetSummary;
