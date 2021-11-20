import React, {Component} from "react";
import {Avatar, Card, Col, Row, Space} from "antd";
import Timer from "./Timer";
import Meta from "antd/lib/card/Meta";
import ProTagGroup from "./ProTagGroup";
import ProTag from "./ProTag";


export default class ExamAnswerSheet extends Component<any, any> {

    constructor(props: any, context: any) {
        super(props, context);
    }

    render() {
        return (
            <div className={"ExamAnswerSheet"}>
                <Card>
                    <Meta className={"ExamAnswerSheetMeta"}
                        title="答题卡"
                        description={
                            <>
                                <Row>
                                    <Col span={7} offset={2}>
                                        <ProTag ProIndex={0} ProURL={""} TagState={["d"]} exp={"未作答"}/>
                                    </Col>
                                    <Col span={7}>
                                        <ProTag ProIndex={0} ProURL={""} TagState={["f"]} exp={"已作答"}/>
                                    </Col>
                                    <Col span={7}>
                                        <ProTag ProIndex={0} ProURL={""} TagState={["c", "d"]} exp={"标记"}/>
                                    </Col>
                                </Row>
                                <ProTagGroup title={"单选题"} proList={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}/>
                                <ProTagGroup title={"多选题"} proList={[11, 12, 13, 14, 15]}/>
                                <ProTagGroup title={"判断题"} proList={[16, 17, 18, 19, 20]}/>
                            </>

                        }
                    />

                </Card>
            </div>
        )
    }

}