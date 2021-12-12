import React, {Component} from "react";
import {Result} from "antd";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";


class EFinish extends Component<any, any> {

    constructor(props: any, context: any) {
        super(props, context);
    }

    render() {
        return (
            <>
                <Result status="success"
                    title="试卷已提交成功"
                    subTitle="请有序离场并耐心等待考试成绩"
                />
            </>
        )
    }
}

export default withTranslation()(
    withRouter(EFinish)
)