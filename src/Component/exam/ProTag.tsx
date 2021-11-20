import React, {Component, Dispatch} from "react";
import {Badge, Button, Col, Row, Tag} from "antd";
import {ClockCircleOutlined} from "@ant-design/icons";

interface IProTag {
    ProIndex: number
    ProURL: string
    TagState: ("d" | "f" | "c")[]
    exp?: string
}


export default class ProTag extends Component<IProTag, any> {


    constructor(props: Readonly<IProTag> | IProTag) {
        super(props);
        this.JumpTOPro = this.JumpTOPro.bind(this)
    }

    JumpTOPro() {
        console.log(this.props.ProIndex)
    }

    render() {
        return (
            <div>
                <Row>
                    <Col span={this.props.ProIndex === 0 ? 12 : 24}>
                        <a className={"ProTag"} onClick={this.props.ProIndex !== 0 ? this.JumpTOPro : undefined}>
                            <Badge dot={this.props.TagState.indexOf("c") !== -1}>
                                <Tag color={this.props.TagState.indexOf("f") !== -1 ? "green" : undefined}>{
                                    [''].map(() => {
                                        if (this.props.ProIndex !== 0) {
                                            return this.props.ProIndex
                                        } else return (<>&nbsp;&nbsp;</>)
                                    })
                                }</Tag>
                            </Badge>
                        </a>
                    </Col>
                    <Col span={this.props.ProIndex === 0 ? 12 : 0}>
                        {
                            [''].map(() => {
                                if (this.props.ProIndex === 0) {
                                    return <span style={{color:"black", marginLeft:"-10px"}}>{this.props.exp}</span>
                                }
                            })
                        }
                    </Col>
                </Row>
            </div>

        )
    }
}