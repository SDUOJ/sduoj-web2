import React, {Component, Dispatch} from "react";
import {Button} from "antd";

export default class ExamLogin extends Component<any, any> {


    constructor(props: any) {
        super(props);
    }

    render() {
        return (
            <>
                <Button type="primary" danger> 统一身份认证登录 </Button>
            </>
        )
    }


}