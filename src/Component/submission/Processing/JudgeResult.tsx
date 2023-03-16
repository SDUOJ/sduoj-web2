import {Component} from "react";
import {Button, Card, Col, Progress, Row, Space, Tabs} from "antd";
import {WithTranslation, withTranslation} from "react-i18next";
import TestCase, {TestCaseProp} from "../TestCase";
import {displayType, StateList, TestCaseStates} from "../../../Type/ISubmission";
import mApi from "../../../Utils/API/m-api";


interface IJudgeResult extends WithTranslation {
    data: TestCaseProp[]
    sumScore: number
    scoreMod: displayType
    title: string,
    useDownload: boolean
}

class JudgeResult extends Component<IJudgeResult, any> {


    render() {

        const getInfo = () => {
            const {data} = this.props
            let numList = Array(StateList.length)
            let scoreAC = 0, ACNumber = 0, firstRejectId: string = ""
            for (let i = 0; i < StateList.length; i++) numList[i] = []
            for (let i = 0; i < data.length; i++) {
                // @ts-ignore
                const add: number = data[i].caseScore === undefined ? 0 : data[i].caseScore
                numList[data[i].caseType].push(data[i])
                scoreAC += add
                if (data[i].caseType === TestCaseStates.Accepted) {
                    ACNumber++;
                } else {
                    if (firstRejectId.length === 0)
                        firstRejectId = data[i].caseID ?? ""
                }

            }
            return {
                numList: numList, AC: scoreAC, SumAll: this.props.sumScore,
                ACNumber: ACNumber, CaseNumber: data.length,
                firstRejectId: firstRejectId
            }
        }
        const info = getInfo()

        return (
            <Card
                size="small"
                title={<span style={{fontWeight: "bold"}}>{this.props.title}</span>}
                className={"card"}
                extra={<>
                    {info.firstRejectId.length !== 0 && this.props.useDownload && (
                        <Button type={"dashed"} size={"small"}  danger onClick={() => {
                            mApi.getCheckpointPreview(info.firstRejectId).then((checkpoint: any) => {
                                // TODO 先查询积分是否足够，
                                // 如果足够，直接扣除，并给作者增加积分
                                mApi.zipDownload([
                                    {
                                        id: checkpoint.inputFileId,
                                        downloadFilename: checkpoint.inputFilename ?? `${info.firstRejectId}.in`
                                    },
                                    {
                                        id: checkpoint.outputFileId,
                                        downloadFilename: checkpoint.outputFilename ?? `${info.firstRejectId}.out`
                                    }
                                ])
                            })

                        }}>
                            {this.props.t("DownloadFirstRejectCase")}
                        </Button>
                    )}
                </>}
            >
                <Row>
                    <Col span={18}>
                        <Tabs defaultActiveKey="0" tabPosition={"left"} className={"JudgeResult-tab"}>
                            {info.numList.map((value, index) => {
                                if (value.length !== 0) {
                                    return (
                                        <Tabs.TabPane
                                            tab={(
                                                <Space>
                                                    <TestCase type={"tag-simple"} caseType={index}/>
                                                    <span> x {value.length}</span>
                                                </Space>
                                            )}
                                            key={index}
                                        >
                                            {value.length !== 0 && (
                                                <Card
                                                    size={"small"}
                                                    title={<TestCase type={"text"} caseType={index}/>}
                                                >
                                                    <div style={{
                                                        display: "flex",
                                                        justifyContent: "left",
                                                        flexWrap: "wrap"
                                                    }}>
                                                        {value.map((val: any) => {
                                                            return <TestCase type={"index"} {...val}/>
                                                        })}
                                                    </div>

                                                </Card>
                                            )}
                                        </Tabs.TabPane>
                                    )
                                }
                                return undefined
                            })}
                        </Tabs>
                    </Col>
                    <Col span={6} className={"Progress-set"}>
                        {this.props.scoreMod === "show" && (
                            <>
                                <Progress
                                    success={{percent: info.AC / info.SumAll * 100}}
                                    type="dashboard"
                                    format={() => `${info.AC} / ${info.SumAll}`}
                                />
                                <span>{this.props.t("Score")}</span>
                            </>
                        )}
                        {this.props.scoreMod !== "show" && (
                            <>
                                <Progress
                                    success={{percent: info.ACNumber / info.CaseNumber * 100}}
                                    type="dashboard"
                                    format={() => `${info.ACNumber} / ${info.CaseNumber}`}
                                />
                                <span>{this.props.t("acceptedNumber")}</span>
                            </>
                        )}
                    </Col>
                </Row>
            </Card>
        )
    }
}


export default withTranslation()(JudgeResult)
