import {withTranslation} from "react-i18next";
import {Button, Form, Image, message} from "antd";
import ItemText from "../../Component/common/Form/Item/ItemText";
import {useForm} from "antd/es/form/Form";
import BK1 from "../../Assert/img/ban1news.jpg";
import React from "react";
import Title from "antd/es/typography/Title";
import Reconfirm from "../../Component/common/Reconfirm";
import cApi from "Utils/API/c-api"
import LoginCheck from "../../Component/common/LoginCheck";

const TCancel = (props: any) => {

    const [form] = useForm()

    return (
        <div style={{textAlign: "center", margin: "0 auto"}}>
            <div style={{textAlign: "left", maxWidth: "400px", margin: "0 auto"}}>
                <LoginCheck/>
                <div style={{textAlign: "center", margin: 24}}>
                    <Title level={3}> 比赛提交取消 </Title>
                </div>
                <div style={{paddingTop: 24, paddingBottom: 24}}>
                    1. 只能撤销自己的提交  <br/>
                    2. 只有比赛结束后才能取消提交  <br/>
                    3. 只有 IOI 赛制的比赛可以取消提交  <br/>
                </div>
            <Form form={form} layout={"vertical"}>
                <ItemText name={"contestId"} label={"比赛ID（URL中的数字，例如：175）"}/>
                <ItemText name={"submissionId"} label={"提交ID（例如：225a5a7cb018012）"}/>
                <Reconfirm
                    btnProps={{type: "primary", block: true}}
                    beforeCheck={async () =>{
                        return form.validateFields()
                    }}
                    btnText={"提交"}
                    confirm={"我确定取消"}
                    todo={"取消当前提交"}
                    API={()=>{
                        form.validateFields().then((value:any)=>{
                            cApi.invalidateContestSubmission({
                                submissionId: value.submissionId,
                                contestId: value.contestId,
                            }).then(()=>{
                                message.success("取消成功")
                                form.resetFields()
                            })
                        })
                    }}
                />
            </Form>
            </div>
        </div>
    )
}

export default withTranslation()(TCancel)