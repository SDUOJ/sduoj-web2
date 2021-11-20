import {Component} from "react";
import {Card, Col, Row, Space, Tabs, Progress} from "antd";
import {WithTranslation, withTranslation} from "react-i18next";
import TestCase, {StateList, TestCaseProp, TestCaseStates} from "./TestCase";


interface IJudgeResult extends WithTranslation {
    data: TestCaseProp[]
    type: "Sample" | "Test"
}

class JudgeResult extends Component<IJudgeResult, any> {


    render() {
        const title = {
            Sample: this.props.t("SampleDataSet"),
            Test: this.props.t("TestDataSet")
        }

        const getInfo = () => {
            const {data, type} = this.props
            let numList = Array(StateList.length)
            let scoreAC = 0, scoreAll = 0
            for (let i = 0; i < StateList.length; i++) numList[i] = []
            for (let i = 0; i < data.length; i++) {
                // @ts-ignore
                const add: number = data[i].caseScore === undefined ? 0 : data[i].caseScore
                if (type == "Sample") {
                    if (data[i].caseScore === 0) numList[data[i].caseType].push(data[i])
                }
                if (type == "Test") {
                    if (data[i].caseScore !== 0) numList[data[i].caseType].push(data[i])
                    if(data[i].caseType === TestCaseStates.Accepted) scoreAC += add
                    scoreAll += add
                }
            }
            return {numList: numList, AC: scoreAC, SumAll: scoreAll}
        }
        const info = getInfo()

        return (
            <>
                <Card
                    size="small"
                    title={title[this.props.type]}
                    className={"card"}
                >
                    <Row>
                        <Col span={18}>
                            <Tabs defaultActiveKey="0" tabPosition={"left"} className={"JudgeResult-tab"}>
                                {
                                    info.numList.map((value, index) => {
                                        if (value.length !== 0) {
                                            return (
                                                <Tabs.TabPane tab={(
                                                    <Space>
                                                        <TestCase type={"tag-simple"} caseType={index}/>
                                                        <span> x {value.length}</span>
                                                    </Space>
                                                )}
                                                              key={index}
                                                >
                                                    {
                                                        [''].map(() => {
                                                            if (value.length !== 0) {
                                                                return (
                                                                    <Card size={"small"} title={<TestCase type={"text"}
                                                                                                          caseType={index}/>}>
                                                                        {
                                                                            value.map((val: any) => {
                                                                                return (
                                                                                    <TestCase type={"index"}
                                                                                        {...val}/>
                                                                                )
                                                                            })
                                                                        }
                                                                    </Card>
                                                                )
                                                            }
                                                        })
                                                    }
                                                </Tabs.TabPane>
                                            )
                                        }
                                    })
                                }
                            </Tabs>
                        </Col>
                        <Col span={6} className={"Progress-set"}>
                            <Progress
                                success={{percent: info.AC / info.SumAll * 100}}
                                type="dashboard"
                                format={() => `${info.AC} / ${info.SumAll}`}
                            />
                            <span>{this.props.t("Score")}</span>
                        </Col>
                    </Row>
                </Card>
            </>
        )
    }
}


export default withTranslation()(JudgeResult)