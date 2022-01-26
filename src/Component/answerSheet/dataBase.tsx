import {Component} from "react";
import {WithTranslation, withTranslation} from "react-i18next";
import {Badge, Button, Card, Col, Collapse, Row, Space, Table, Tabs, Tree} from 'antd';

import Problem from "../problem/Problem";

import Icon, {DownOutlined,} from '@ant-design/icons';
import {ReactComponent as DataBaseIcon} from "Assert/img/database.svg"
import {ReactComponent as TableIcon} from "Assert/img/Table.svg"
import {ReactComponent as ViewIcon} from "Assert/img/View.svg"

import CodeEditor from "../common/CodeEditor";
import Paragraph from "antd/lib/typography/Paragraph";

require('codemirror/mode/sql/sql');
const {TabPane} = Tabs;
const {Panel} = Collapse;

interface IDataBaseAnswerSheet extends WithTranslation {

}

interface SDataBaseAnswerSheet {
    columns: any
    data: any
}

class DataBaseAnswerSheet extends Component<IDataBaseAnswerSheet, SDataBaseAnswerSheet> {


    constructor(props: Readonly<IDataBaseAnswerSheet> | IDataBaseAnswerSheet) {
        super(props);
        this.state = {
            columns: [],
            data: []
        }
    }

    render() {

        let md: string = "## Description\n" +
            "给定两个整数 $x$ 和 $y$，打印它们的和\n" +
            "\n" +
            "\n" +
            "## Input\n" +
            "两个整数 $x$ 和 $y$，满足 $ 0 \\le x, y \\le 32767. $\n" +
            "\n" +
            "## Output\n" +
            "一个整数，代表 $x$ 和 $y$ 的和。\n" +
            "\n" +
            "## Sample Input\n" +
            "```\n" +
            "1381 529\n" +
            "```\n" +
            "\n" +
            "## Sample Output\n" +
            "```\n" +
            "1910\n" +
            "```\n" +
            "\n" +
            "\n"

        // console.log(md)

        const treeData = [
            {
                title: 'pub',
                key: 'pub',
                icon: <Icon component={DataBaseIcon}/>,
                children: [
                    {
                        title: '表',
                        key: 'table',
                        icon: <Icon component={TableIcon}/>,
                        children: [
                            {
                                title: "student",
                                key: "table_student",
                                icon: <Icon component={TableIcon}/>
                            },
                            {
                                title: "student_score",
                                key: "table_student_score",
                                icon: <Icon component={TableIcon}/>
                            },
                            {
                                title: "student_info",
                                key: "table_student_info",
                                icon: <Icon component={TableIcon}/>
                            },
                        ]
                    },
                    {
                        title: '视图',
                        key: 'view',
                        icon: <Icon component={ViewIcon}/>,
                    },
                ],
            },
        ];

        return (
            <div id="root" style={{minWidth: 1000, minHeight: 1000}}>
                <Row style={{height: "60%"}}>
                    <Col span={12} style={{height: "100%"}}>
                        <Card title="题目描述" className={"Problem-card"}>
                            <Problem proType={"Program"} markdown={md} style={{overflowY: "auto", height: "90%"}}/>
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card title="编辑代码" style={{minWidth: 500}}>
                            <CodeEditor code={""} lang={"sql"}/>
                            <Space>
                                <Button type={"default"} onClick={() => {
                                }}>{"执行"}</Button>
                                <Button type={"default"} onClick={() => {
                                }}>{"提交"}</Button>
                                <Button type={"default"} onClick={() => {
                                }}>{"执行并提交"}</Button>
                                <Button type={"default"} onClick={() => {
                                }}>{"回滚"}</Button>
                            </Space>
                        </Card>
                        <Tabs defaultActiveKey="1" type="card" size={"small"}>
                            <TabPane tab="评测" key="1">
                                Content of card tab 2
                            </TabPane>
                            <TabPane tab="记录" key="2">
                                <Collapse accordion>


                                    <Panel header="This is panel header 1" key="1">
                                        <Badge.Ribbon text="成功" color={"green"}>
                                            <Paragraph copyable>This is a copyable text.</Paragraph>
                                        </Badge.Ribbon>
                                    </Panel>
                                    <Badge.Ribbon text="失败" color={"red"}>
                                        <Panel header="This is panel header 2" key="2">
                                            <Paragraph copyable>This is a copyable text.</Paragraph>
                                        </Panel>
                                    </Badge.Ribbon>
                                    <Badge.Ribbon text="成功" color={"green"}>
                                        <Panel header="This is panel header 3" key="3">
                                            <Paragraph copyable>This is a copyable text.</Paragraph>
                                        </Panel>
                                    </Badge.Ribbon>
                                </Collapse>
                                <Card title="Pushes open the window" size="small">
                                    <Paragraph copyable>This is a copyable text.</Paragraph>
                                </Card>
                            </TabPane>
                        </Tabs>
                    </Col>
                </Row>
                <Row style={{height: "40%"}}>
                    <Col span={5} style={{height: "100%"}}>
                        <Card title="数据库列表" className={"Database-list-card"} style={{height: "100%", padding: 0}}>
                            <Tree
                                showIcon
                                defaultExpandAll
                                switcherIcon={<DownOutlined/>}
                                treeData={treeData}
                                style={{overflowY: "auto", height: "100%"}}
                            />
                        </Card>
                    </Col>
                    <Col span={19} style={{height: "100%"}}>
                        <Card title="查询结果" style={{height: "100%"}}>
                            <Table columns={this.state.columns} dataSource={this.state.data}/>
                        </Card>
                    </Col>
                </Row>
            </div>
        )
    }
}

export default withTranslation()(DataBaseAnswerSheet)