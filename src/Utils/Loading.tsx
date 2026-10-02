import React, {Component} from "react";
import {Spin} from "antd";

export default class Loading extends Component<any, any> {
    render() {
        return (
            <div className={"page-center"} role="status" aria-live="polite" aria-busy="true">
                <Spin delay={500} size={"large"}> </Spin>
            </div>
        )
    }
}
