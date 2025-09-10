import React, {useEffect, useState} from "react";
import Title from "antd/es/typography/Title";
import {useSelector} from "react-redux";
import CApi from "../../Utils/API/c-api";
import {Radio, Table, Button, message, Row, Col} from 'antd';
import * as XLSX from 'xlsx';
import {useTranslation} from "react-i18next";

const CStudentMutualEvaluation = () => {
    const isLogin = useSelector((state: any) => {
        return state.UserReducer.isLogin
    })
    const userInfo = useSelector((state: any) => {
        return state.UserReducer.userInfo
    })
    const initGradeCounts = {
        优秀: 0,
        良好: 0,
        中等: 0,
        差: 0,
    }
    const [data, setData] = useState([]);
    const [evaluations, setEvaluations] = useState<any>({});
    const [isDisabled, setIsDisabled] = useState(false);
    const [gradeCounts, setGradeCounts] = useState<{ [key: string]: number }>(initGradeCounts);
    const [is_admin, set_is_admin] = useState<boolean>(false)
    const [vote_status, set_vote_status] = useState<any>()
    const [results, set_results] = useState<any>()
    const {t} = useTranslation();

    const listUpd = () => {
        CApi.getSMEList({}).then((res: any) => {
            if (res.error !== undefined) {
                message.error(res.error)
            } else if (res.status === "已投票") {
                setEvaluations(res.my_evaluations)
                setData(res.to_evaluate)
                setIsDisabled(true);
                setGradeCounts(() => {
                    const newCounts: any = {...gradeCounts};
                    for (let x in res.my_evaluations) {
                        let v = res.my_evaluations[x]
                        newCounts[v] = (newCounts[v] || 0) + 1;
                    }
                    return {...newCounts};
                });
            } else {
                setData(res.to_evaluate)
            }
        })
    }

    const getRes = () => {
        CApi.getSMEResult({}).then((res: any) => {
            set_is_admin(res.admin)
            if (res.admin) {
                set_vote_status(res.vote_status)
                set_results(res.results)
            }
        })
    }

    useEffect(() => {
        if (isLogin) {
            listUpd()
            getRes()
        }
    }, [isLogin])

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet([
            ...Object.keys(vote_status).map((studentId) => ({
                studentId,
                status: vote_status[studentId],
                ...results[studentId],
            })),
        ]);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        XLSX.writeFile(wb, 'results.xlsx');
    };

    const handleRadioChange = (studentId: string, value: string) => {
        const prevValue = evaluations[studentId];
        setEvaluations({...evaluations, [studentId]: value});
        setGradeCounts(prevCounts => {
            const newCounts = {...prevCounts};
            if (prevValue) {
                newCounts[prevValue] = (newCounts[prevValue] || 1) - 1;
            }
            newCounts[value] = (newCounts[value] || 0) + 1;
            return newCounts;
        });
    };
    const handleSubmit = () => {
        console.log('提交的评价:', evaluations);
        CApi.submitSME({evaluations: evaluations}).then((res: any) => {
            if (res.error !== undefined) {
                message.error(res.error)
                if (res.not_evaluated !== undefined) {
                    message.info(t('notVotedCount', {count: res.not_evaluated}))
                }
            } else {
                message.success(t('voteSuccess'))
                listUpd()
                getRes()
                setGradeCounts(initGradeCounts)
            }
        })
    };

    const columns = [
        {
            title: t('studentNumber'),
            dataIndex: "student_id",
            key: "student_id",
        },
        {
            title: t('name'),
            dataIndex: "name",
            key: "name",
        },
        {
            title: t('evaluation'),
            key: "evaluation",
            render: (_: any, record: any) => (
                <Radio.Group
                    onChange={(e) => handleRadioChange(record.student_id, e.target.value)}
                    value={evaluations[record.student_id]}
                    disabled={isDisabled}  // 根据状态变量来决定是否禁用 Radio
                >
                    <Radio value="优秀">{t('grade.excellent')}</Radio>
                    <Radio value="良好">{t('grade.good')}</Radio>
                    <Radio value="中等">{t('grade.medium')}</Radio>
                    <Radio value="差">{t('grade.poor')}</Radio>
                </Radio.Group>
            ),
        },
    ];

    return (
        <>
            {isLogin && (
                <div
                    style={{
                        position: "fixed",
                        right: "20px",
                        top: "30%",
                        background: "#f9f9f9",
                        padding: "20px",
                        boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.1)",
                    }}
                >
                    <Title level={5}>{t('evaluationStats')}</Title>
                    <p>{t('grade.excellent')}: {gradeCounts["优秀"]}</p>
                    <p>{t('grade.good')}: {gradeCounts["良好"]}</p>
                    <p>{t('grade.medium')}: {gradeCounts["中等"]}</p>
                    <p>{t('grade.poor')}: {gradeCounts["差"]}</p>
                </div>
            )}
            <div style={{textAlign: "center", margin: "0 auto"}}>
                <Title> {t('smeTitle')} </Title>
                {!isLogin && (
                    <Title level={5}> {t('smePleaseLoginCAS')} </Title>
                )}
                {isDisabled && (
                    <Title level={5}> {t('smeAlreadyVoted')} </Title>
                )}
                {isLogin && (
                    <>
                        <Title level={5}> {t('nameLabel')}{userInfo?.nickname}，{t('studentNumberLabel')}{userInfo?.username} </Title>
                        <div style={{display: 'flex', justifyContent: 'center'}}>
                            <div style={{maxWidth: 1200}}>
                                <Table columns={columns} dataSource={data} rowKey="student_id" pagination={false}/>
                                <Button type="primary" onClick={handleSubmit} style={{marginTop: 24}}
                                        disabled={isDisabled}>
                                    {t('submitEvaluation')}
                                </Button>
                            </div>
                        </div>
                        {is_admin && results && vote_status && (
                            <>
                                <div style={{display: 'flex', justifyContent: 'center', marginTop: 24}}>
                                    <div style={{maxWidth: 1200}}>
                                        <Title level={5}>{t('voteStatusAndResults')}</Title>
                                        <Button type="primary" onClick={exportToExcel}
                                                style={{marginTop: 24, marginBottom: 24}}>
                                            {t('exportAsExcel')}
                                        </Button>
                                        <Table
                                            dataSource={Object.keys(vote_status).map((studentId) => ({
                                                studentId,
                                                status: vote_status[studentId],
                                                ...results[studentId]
                                            }))}
                                            pagination={false}
                                            columns={[
                                                {title: t('studentNumber'), dataIndex: 'studentId', key: 'studentId'},
                                                {
                                                    title: t('status'),
                                                    dataIndex: 'status',
                                                    key: 'status',
                                                    filters: [
                                                        {text: t('voted'), value: '已投票'},
                                                        {text: t('notVoted'), value: '未投票'},
                                                    ],
                                                    onFilter: (value, record) => record.status.includes(value),
                                                },
                                                {
                                                    title: t('grade.excellent'),
                                                    dataIndex: '优秀',
                                                    key: '优秀',
                                                    sorter: (a, b) => a.优秀 - b.优秀
                                                },
                                                {
                                                    title: t('grade.good'),
                                                    dataIndex: '良好',
                                                    key: '良好',
                                                    sorter: (a, b) => a.良好 - b.良好
                                                },
                                                {
                                                    title: t('grade.medium'),
                                                    dataIndex: '中等',
                                                    key: '中等',
                                                    sorter: (a, b) => a.中等 - b.中等
                                                },
                                                {
                                                    title: t('grade.poor'),
                                                    dataIndex: '差',
                                                    key: '差',
                                                    sorter: (a, b) => a.差 - b.差
                                                },
                                            ]}
                                            rowKey="studentId"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </>
    )
}

export default CStudentMutualEvaluation
