import {withTranslation, useTranslation} from "react-i18next";
import {Form, message} from "antd";
import ItemText from "../../Component/common/Form/Item/ItemText";
import {useForm} from "antd/es/form/Form";
import React from "react";
import Title from "antd/es/typography/Title";
import Reconfirm from "../../Component/common/Reconfirm";
import cApi from "Utils/API/c-api"
import LoginCheck from "../../Component/common/LoginCheck";

const TCancel = (props: any) => {
    const {t} = useTranslation()

    const [form] = useForm()

    return (
        <div style={{textAlign: "center", margin: "0 auto"}}>
            <div style={{textAlign: "left", maxWidth: "400px", margin: "0 auto"}}>
                <LoginCheck jump={true}/>
                <div style={{textAlign: "center", margin: 24}}>
                    <Title level={3}> {t("ContestSubmissionCancel")} </Title>
                </div>
                <div style={{paddingTop: 24, paddingBottom: 24}}>
                    1. {t("OnlyRevokeOwnSubmission")}  <br/>
                    2. {t("OnlyAfterContestEnd")}  <br/>
                    3. {t("OnlyIOIContestCancelable")}  <br/>
                </div>
            <Form form={form} layout={"vertical"}>
                <ItemText name={"contestId"} label={t("ContestIdHint")}/>
                <ItemText name={"submissionId"} label={t("SubmissionIdHint")}/>
                <Reconfirm
                    btnProps={{type: "primary", block: true}}
                    beforeCheck={async () =>{
                        return form.validateFields()
                    }}
                    btnText={t("Submit")}
                    confirm={t("ICertainToCancel")}
                    todo={t("CancelCurrentSubmission")}
                    API={()=>{
                        form.validateFields().then((value:any)=>{
                            cApi.invalidateContestSubmission({
                                submissionId: value.submissionId,
                                contestId: value.contestId,
                            }).then(()=>{
                                message.success(t("CancelSuccess"))
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
