import React, {Component} from "react";
import {Button, Result} from "antd";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {getRouterPath} from "../../Config/router/router";
import {routerE} from "../../Config/router/routerE";


class EFinish extends Component<any, any> {

    constructor(props: any, context: any) {
        super(props, context);
    }

    render() {
        return (
            <>
                <Result
                    status="success"
                    title="试卷已提交成功"
                    subTitle="请有序离场并耐心等待考试成绩"
                    extra={
                        <Button
                            type="primary"
                            key="return"
                            onClick={() => {
                                this.props.history.push(getRouterPath(routerE, 2));
                            }}
                        >
                            返回题目列表
                        </Button>
                    }
                />
            </>
        )
    }
}

export default withTranslation()(
    withRouter(EFinish)
)