import React, {useEffect, useState} from "react";
import Title from "antd/es/typography/Title";
import {useSelector} from "react-redux";
import CApi from "../../Utils/API/c-api";
import {Radio, Table, Button, message} from 'antd';

const CStudentMutualEvaluation = () => {
    const isLogin = useSelector((state: any) => {
        return state.UserReducer.isLogin
    })
    const userInfo = useSelector((state: any) => {
        return state.UserReducer.userInfo
    })
    const [data, setData] = useState([]);
    const [evaluations, setEvaluations] = useState<any>({});
    const [isDisabled, setIsDisabled] = useState(false);
    const [gradeCounts, setGradeCounts] = useState<{ [key: string]: number }>({
        优秀: 0,
        良好: 0,
        中等: 0,
        差: 0,
    });

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

    useEffect(() => {
        if (isLogin) {
            listUpd()
        }
    }, [isLogin])

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
                    message.info(res.not_evaluated.toString() + " 未投票")
                }
            } else {
                message.success("投票成功")
                listUpd()
            }
        })
    };

    const columns = [
        {
            title: "学号",
            dataIndex: "student_id",
            key: "student_id",
        },
        {
            title: "姓名",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "评价",
            key: "evaluation",
            render: (_: any, record: any) => (
                <Radio.Group
                    onChange={(e) => handleRadioChange(record.student_id, e.target.value)}
                    value={evaluations[record.student_id]}
                    disabled={isDisabled}  // 根据状态变量来决定是否禁用 Radio
                >
                    <Radio value="优秀">优秀</Radio>
                    <Radio value="良好">良好</Radio>
                    <Radio value="中等">中等</Radio>
                    <Radio value="差">差</Radio>
                </Radio.Group>
            ),
        },
    ];

    return (
        <>
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
                <Title level={5}>评价统计</Title>
                <p>优秀: {gradeCounts["优秀"]}</p>
                <p>良好: {gradeCounts["良好"]}</p>
                <p>中等: {gradeCounts["中等"]}</p>
                <p>差: {gradeCounts["差"]}</p>
            </div>
            <div style={{textAlign: "center", margin: "0 auto"}}>
                <Title> 22级学硕互评 </Title>
                {!isLogin && (
                    <Title level={5}> 您未登录，请在右上角使用统一身份认证登录或注册 </Title>
                )}
                {isDisabled && (
                    <Title level={5}> 您已投票，您可以查看您的投票，但是不能再次编辑 </Title>
                )}
                {isLogin && (
                    <>
                        <Title level={5}> 姓名：{userInfo.nickname}，学号：{userInfo.username} </Title>
                        <div style={{display: 'flex', justifyContent: 'center'}}>
                            <div style={{maxWidth: 1200}}>
                                <Table columns={columns} dataSource={data} rowKey="student_id" pagination={false}/>
                                <Button type="primary" onClick={handleSubmit} style={{marginTop: 24}}
                                        disabled={isDisabled}>
                                    提交评价
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    )
}

export default CStudentMutualEvaluation
