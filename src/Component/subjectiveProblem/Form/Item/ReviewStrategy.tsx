import {withTranslation} from "react-i18next";
import {Col, Form, Row, Switch, Tree} from "antd";
import {useState} from "react";
import ScoreMode from "../../ScoreMode";
import Input from "antd/es/input/Input";

const ReviewStrategy = (props: any) => {

    const {value, onChange} = props

    const [treeData, setTreeData] = useState<any>([
        {
            title: '根节点',
            key: '0',
        }
    ])
    const [selectedKeys, setSelectedKeys] = useState<any>()
    const [reviewInfo, setReviewInfo] = useState<any>({});

    const [curNode, setCurNode] = useState<any>(undefined)
    const [nodeMode, setNodeMode] = useState<boolean>(false)

    // TODO: 可视化的编辑打分模式

    return (
        <div style={{width: 1100}}>
            <Row gutter={24}>
                <Col span={8}>
                    <Tree
                        showLine={true}
                        showIcon={false}
                        defaultExpandedKeys={['0-0-0']}
                        onSelect={(selectedKeys: React.Key[], info: any) => {
                            setSelectedKeys(selectedKeys)

                        }}
                        treeData={treeData}
                    />
                </Col>
                <Col span={8}>
                    <Form.Item label={"节点模式"}>
                        <Switch
                            checkedChildren={"中间节点"}
                            unCheckedChildren={"叶子节点"}
                            checked={nodeMode}
                            onChange={setNodeMode}/>
                    </Form.Item>
                    {/* 中间节点 */}
                    {nodeMode && (
                        <>
                            <Form.Item label={"节点名"}>
                                <Input value={curNode.title} onChange={(value)=>{
                                    curNode.title = value
                                }}/>
                            </Form.Item>
                        </>
                    )}

                </Col>
                <Col span={8}>
                    <ScoreMode
                        reviewInfo={reviewInfo}
                        setReviewInfo={setReviewInfo}
                        scoreModeInfo={{treeData}}
                    />
                </Col>
            </Row>

        </div>
    )
}

export default withTranslation()(ReviewStrategy)