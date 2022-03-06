import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import {Button, Card, Form, Input, message} from "antd";
import {useForm} from "antd/es/form/Form";
import cApi from "Utils/API/c-api"
import getContestInfo from "./API/getContestInfo";
import {useEffect, useState} from "react";

const Register = (props: any) => {

    const [form] = useForm()
    const [update, setUpdate] = useState(false)
    const contestId = props.match.params.contestId
    const contestInfo = getContestInfo(contestId, update)
    const contestInfoX = getContestInfo(contestId)

    return (
        <>
            <div style={{textAlign: "center", margin: "0 auto"}}>
                <div style={{textAlign: "left", maxWidth: "600px", margin: "0 auto"}}>
                    <Card>
                        {contestInfoX.features.openness !== "public" && (
                            <>
                                <Form layout={"vertical"} form={form}>
                                    <Form.Item label={"比赛密码"} name={"password"}>
                                        <Input required/>
                                    </Form.Item>
                                </Form>
                                <div style={{float: "right"}}>
                                    <Button type={"primary"} onClick={() => {
                                        form.validateFields().then((value: any) => {
                                            cApi.participateContest({
                                                contestId: contestId,
                                                password: value.password
                                            }).then(() => {
                                                message.success("注册成功")
                                                setUpdate(true)
                                                props.history.replace("/v2/contest/" + contestId + "/overview")
                                            })
                                        })
                                    }}>注册</Button>
                                </div>
                            </>
                        )}
                        {contestInfoX.features.openness === "public" && (
                            <>
                                <div style={{width: "50%", textAlign: "center", margin: "0 auto"}}>
                                    <Button type={"primary"} block onClick={() => {
                                        cApi.participateContest({contestId: contestId}).then(() => {
                                            message.success("注册成功")
                                            setUpdate(true)
                                            props.history.replace("/v2/contest/" + contestId + "/overview")
                                        })
                                    }}>注册</Button>
                                </div>
                            </>
                        )}
                    </Card>
                </div>
            </div>
        </>
    )
}

export default withTranslation()(withRouter(Register))