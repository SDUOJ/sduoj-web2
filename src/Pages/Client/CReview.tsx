import {
    Alert,
    Button,
    Card,
    Col, Drawer,
    Input,
    InputNumber,
    Radio,
    Row,
    Select,
    Space,
    Switch,
    Table,
    Tabs,
    Tag,
    Typography
} from "antd";
import {useEffect, useState} from "react";
import {CheckCard} from '@ant-design/pro-card';
import "Assert/css/Review.css"
import {CheckOutlined, CloseOutlined} from "@ant-design/icons"
import MarkdownText from "../../Utils/MarkdownText";


const {Paragraph, Text} = Typography;
const {Option} = Select;

const {TabPane} = Tabs;
const onChange = (key: string) => {
    console.log(key);
};


const CReview = (props: any) => {
    // 图片模式
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);

    // 页面大小
    const [pageHeight, setPageHeight] = useState<number>(0);
    const [pageWeight, setPageWeight] = useState<number>(0);

    // 批阅用户数据
    const [userData, setUserData] = useState<any>([]);

    // 打分数据
    const [reviewInfo, setReviewInfo] = useState<any>({});
    const [inputInfo, setInputInfo] = useState<any>({});

    const [drawerOpen, setDrawerOpen] = useState(false);

    const cardInfo = [
        {
            title: "题目信息",
            data: [
                {"key": "题目名", "value": "主观题"},
                {"key": "题目详细", "value": "点击查看"},
                {"key": "关联题目列表", "value": "点击查看"},
            ]
        },
        {
            title: "提交信息",
            data: [
                {"key": "姓名", "value": "尹浩飞"},
                {"key": "学号", "value": "201805130160"},
                {"key": "提交时间", "value": "2022年8月30日"},
                {"key": "提交类型", "value": "pdf"},
                {"key": "下载文件", "value": "点击下载"},
            ]
        },
        {
            title: "批阅信息",
            data: [
                {"key": "批阅时间", "value": "2022年8月30日"},
                {"key": "批阅人", "value": "yhf2000"},
                {"key": "分数", "value": "100"},
            ]
        },
    ]

    const scoreModeInfo = {
        sumScore: 100,
        body: [
            {
                id: "1",
                title: "问答题",
                score: 20,
                answer: "时间复杂度为: $O(n)$, $O(n^2)$",
                info: [
                    [20, "答案正确，解释充分"],
                    [15, "答案正确，解释不充分"],
                    [5, "答案错误，解释部分正确"],
                    [0, "答案错误"]
                ]
            },
            {
                id: "2",
                title: "实验报告",
                score: 80,
                child: [
                    {
                        id: "2-1",
                        title: "T1",
                        score: 40,
                        child: [
                            {id: "2-1-1", title: "题目分析", score: 10, quick: true},
                            {id: "2-1-2", title: "时间复杂度", score: 10, quick: true},
                            {id: "2-1-3", title: "代码", score: 10, quick: true},
                            {
                                id: "2-1-4",
                                title: "代码注释", score: 10, info: [
                                    [10, "注释3个以上，且充分"],
                                    [5, "存在有效注释"],
                                    [0, "无注释"]
                                ]
                            },
                        ]
                    },
                    {
                        id: "2-2",
                        title: "T2",
                        score: 40,
                        child: [
                            {id: "2-2-1", title: "题目分析", score: 10, quick: true},
                            {id: "2-2-2", title: "时间复杂度", score: 10, quick: true},
                            {id: "2-2-3", title: "代码", score: 10, quick: true},
                            {
                                id: "2-2-4",
                                title: "代码注释", score: 10, info: [
                                    [10, "注释3个以上，且充分"],
                                    [5, "存在有效注释"],
                                    [0, "无注释"]
                                ]
                            },
                        ]
                    }
                ]
            }
        ]
    }

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
            <Card title={data.title} size={"small"} bordered={false}
                  extra={
                      <Space>
                          {data.child === undefined && (
                              <Space>
                                  <Button
                                      type="primary" shape="round"
                                      size={"small"} icon={<CheckOutlined/>}
                                      onClick={() => {
                                          updateScore(data.id, data.score)
                                      }}/>
                                  <Button
                                      type="primary" shape="round"
                                      size={"small"} danger={true}
                                      icon={<CloseOutlined/>}
                                      onClick={() => {
                                          updateScore(data.id, 0)
                                      }}/>
                              </Space>
                          )}
                          <span>总分：
                              {data.child === undefined && (
                                  <InputNumber
                                      style={{width: 64}}
                                      size={"small"}
                                      min={0} max={data.score}
                                      value={reviewInfo[data.id]}
                                      onChange={(value) => {
                                          updateScore(data.id, value)
                                      }}/>
                              )}
                              {data.child !== undefined && (reviewInfo[data.id] ?? 0)}
                              {" "}/ {data.score}</span>
                      </Space>
                  }
            >
                {(() => {
                    if (data.child === undefined) {
                        return (
                            <>
                                {(() => {
                                    if (data.answer !== undefined) {
                                        return (
                                            <Alert
                                                message={
                                                    <MarkdownText id={`problemReview-answer-${data.id}`}
                                                                  text={data.answer}/>
                                                }
                                                type="success"
                                            />
                                        )

                                    }
                                })()}
                                {(() => {
                                    if (data.info !== undefined) {
                                        return (
                                            <Radio.Group
                                                onChange={(e) => {
                                                    updateScore(data.id, e.target.value)
                                                }}
                                                value={reviewInfo[data.id]}
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
                        return data.child.map((c: any) => {
                            return scoreRender(c)
                        })
                    }
                })()}
            </Card>
        )
    }

    const refresh = () => {
        setPageHeight(document.body.clientHeight)
        setPageWeight(document.body.clientWidth)
    }


    useEffect(() => {
        refresh()
        window.addEventListener("resize", refresh)

        let data: any = []
        for (let i = 0; i < 300; i++) {
            data.push(i);
        }
        setUserData(data)

    }, [])

    const onDocumentLoadSuccess = (pdf: any) => {
        setNumPages(pdf.numPages);
    }

    return (
        <div style={{height: "100%", padding: 24}}>
            <Drawer
                placement={"top"}
                closable={false}
                onClose={()=>{setDrawerOpen(false)}}
                visible={drawerOpen}
                size={"large"}
                footer={<div style={{float: "right"}}>
                    <Button onClick={()=>{setDrawerOpen(false)}} type={"primary"}>关闭</Button>
                </div>}
            >
                <Tabs defaultActiveKey="1" onChange={onChange}>
                    <TabPane tab="全部" key="1" className={"scoreTabPane"}>
                        <div className={"flex-box"}>
                            <CheckCard.Group
                                onChange={(value) => {
                                    console.log('value', value);
                                }}
                                defaultValue="A"
                                style={{height: 100}}
                            >
                                {userData.map((user: any) => {
                                    return (
                                        <CheckCard
                                            size={"small"}
                                            title={
                                                <div style={{display: 'flex', alignItems: 'center'}}>
                                                    <Text style={{marginRight: 8}}
                                                          ellipsis={{tooltip: "201805130160"}}> 201805130160201805130160201805130160</Text>
                                                    <Tag color="green">100</Tag>
                                                </div>
                                            }
                                            description={
                                                <>yhf2000</>
                                            }
                                            value={user}/>
                                    )
                                })}
                            </CheckCard.Group>
                        </div>
                    </TabPane>
                    <TabPane tab="已批阅" key="2" className={"scoreTabPane"}>
                        Content of Tab Pane 2
                    </TabPane>
                    <TabPane tab="未批阅" key="3" className={"scoreTabPane"}>
                        Content of Tab Pane 3
                    </TabPane>
                </Tabs>
            </Drawer>
            <Row style={{height: pageHeight - 64}} gutter={24}>
                <Col span={4}>
                    <Button block onClick={() => {
                        setDrawerOpen(true)
                    }} style={{marginBottom: 24}} type={"primary"}> 学生名单 </Button>
                    {cardInfo.map((item: any) => {
                        return (
                            <Card title={item.title} className={"infoCard"}>
                                <Table columns={[
                                    {title: "", dataIndex: "key"},
                                    {title: "", dataIndex: "value"},
                                ]}
                                       showHeader={false}
                                       pagination={false}
                                       size={"small"}
                                       dataSource={item.data}
                                />
                            </Card>
                        )
                    })}
                </Col>
                <Col span={14}>
                    <iframe src={"http://www.cztouch.com/upfiles/soft/testpdf.pdf"}
                            style={{width: "100%", height: "100%"}}/>
                </Col>
                <Col span={6} style={{"height": Math.max(pageHeight - 64, 800), "overflow": "auto"}}>
                    <Card className={"scorePane"} title={"分数面板"} extra={
                        <>
                            总分：{reviewInfo["0"] ?? 0} / {scoreModeInfo.sumScore}
                        </>
                    }>
                        <div>
                            {scoreModeInfo.body.map((c) => {
                                return scoreRender(c)
                            })}
                            <Button block={true} type="primary"> 提交分数 </Button>
                        </div>
                    </Card>
                </Col>
            </Row>

        </div>
    )
}


export default CReview;