import React, {Component, Dispatch} from "react";

import Meta from "antd/lib/card/Meta";
import ProTag from "./ProTag";
import {Col, Row} from "antd";
import {ExamState} from "../../Redux/Reducer/exam";
import {ExamAction} from "../../Redux/Action/exam";
import {connect} from "react-redux";

interface IProTagGroup {
    title: string
    proList: number[]
}

export default class ProTagGroup extends Component<IProTagGroup, any> {
    render() {
        return (
            <>
                <Meta
                    className={"ProTagGroup"}
                    title={this.props.title}
                    description={
                        <Row gutter={[0, 16]}>
                            {
                                this.props.proList.map((index: number) => {
                                    return (
                                        <Col span={3}>
                                            <ProTag ProIndex={index}/>
                                        </Col>
                                    )
                                })
                            }
                        </Row>
                    }
                />
            </>
        )
    }
}

