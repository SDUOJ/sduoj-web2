import React, {Component} from "react";
import {Spin} from "antd";

export default class Loading extends Component<any, any> {
    render() {
        return (
            <>
                <Spin delay={500} size={"large"}> </Spin>
            </>
        )
    }
}