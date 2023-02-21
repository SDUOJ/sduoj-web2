import {withTranslation} from "react-i18next";
import {Alert, Button, Card, Col, InputNumber, Radio, Row, Space} from "antd";
import {CheckOutlined, CloseOutlined} from "@ant-design/icons";
import MarkdownText from "../../Utils/MarkdownText";

const ScoreMode = (props: any) => {

    const {reviewInfo, setReviewInfo} = props


    const updateScore = (id: string, value: number) => {
        let nd2 = {...reviewInfo}
        let idList = id.split("-")
        let idNow = ""

        nd2[id] = (nd2[id] ?? 0)
        nd2["0"] = (nd2["0"] ?? 0) - nd2[id] + value
        for (let x of idList) {
            idNow += x;
            nd2[idNow] = (nd2[idNow] ?? 0) + value - nd2[id]
            idNow += "-";
        }
        setReviewInfo(nd2)
    }

    const scoreRender = (data: any) => {
        return (
            <Card title={data.title} size={"small"} bordered={false}>
                <div style={{float: "right"}}>
                    <Space>
                        {data.children === undefined && (
                            <Space>
                                <Button
                                    type="primary" shape="round"
                                    size={"small"} icon={<CheckOutlined/>}
                                    onClick={() => {
                                        updateScore(data.key, data.score)
                                    }}/>
                                <Button
                                    type="primary" shape="round"
                                    size={"small"} danger={true}
                                    icon={<CloseOutlined/>}
                                    onClick={() => {
                                        updateScore(data.key, 0)
                                    }}/>
                            </Space>
                        )}
                        <span>
                              {data.key === "0" ? "总分：" : "分数："}
                            {data.children === undefined && (
                                <InputNumber
                                    style={{width: 64}}
                                    size={"small"}
                                    min={0} max={data.score}
                                    value={reviewInfo[data.key]}
                                    onChange={(value) => {
                                        updateScore(data.key, value)
                                    }}/>
                            )}
                            {data.children !== undefined && (reviewInfo[data.key] ?? 0)}
                            {" "}/ {data.score}
                          </span>
                    </Space>
                </div>
                <div style={{marginTop: 32}}>
                    {(() => {
                        if (data.children === undefined) {
                            return (
                                <>
                                    {data.answer !== undefined && (

                                        <Alert
                                            message={
                                                <MarkdownText id={`problemReview-answer-${data.key}`}
                                                              text={data.answer}/>
                                            }
                                            type="success"
                                        />
                                    )}
                                    {(() => {
                                        if (data.info !== undefined) {
                                            return (
                                                <Radio.Group
                                                    onChange={(e) => {
                                                        updateScore(data.key, e.target.value)
                                                    }}
                                                    value={reviewInfo[data.key]}
                                                >
                                                    <Row>
                                                        {data.info && data.info.map((r: any) => {
                                                            return (
                                                                <Col span={12}><Radio
                                                                    value={r[0]}> {r[0]}分 {r[1]}</Radio></Col>
                                                            )
                                                        })}
                                                    </Row>
                                                </Radio.Group>
                                            )
                                        }
                                    })()}
                                </>
                            )
                        } else {
                            return data.children.map((c: any) => {
                                return scoreRender(c)
                            })
                        }
                    })()}
                </div>
            </Card>
        )
    }

    return <>
        {scoreRender(props.scoreModeInfo)}
    </>
}

export default withTranslation()(ScoreMode)
