import {Button, Card, Form, message} from "antd";
import ItemPassword from "../../Component/user/Form/Item/ItemPassword";
import {getUrlParams} from "../../Utils/getUrlParams";
import {withRouter} from "react-router-dom";
import {useForm} from "antd/es/form/Form";
import CApi from "Utils/API/c-api"
import {UrlPrefix} from "../../Config/constValue";
import {useTranslation} from "react-i18next";


const ResetPass = (props: any) => {

    const token = getUrlParams(props.location.search).token
    const [form] = useForm()
    const {t} = useTranslation()

    return (
        <>
            <div style={{width: "500px", textAlign: "center", margin: "0 auto"}}>
                <div style={{textAlign: "left"}}>
                    <Card
                        title={t("resetPassword")}
                    >
                        <Form
                            layout={"vertical"}
                            form={form}
                        >
                            <ItemPassword/>
                        </Form>
                        <Button
                            type={"primary"}
                            block={true}
                            onClick={() => {
                                form.validateFields().then((value) => {
                                    CApi.resetPassword({
                                        ...value,
                                        token: token
                                    }).then(()=>{
                                        props.history.push(UrlPrefix + "/login")
                                        message.success(t("passwordResetSuccessfully,PleaseLogInAgain"))
                                    })
                                })
                            }}
                        >
                            {t("Submit")}
                        </Button>
                    </Card>
                </div>
            </div>

        </>
    )
}

export default withRouter(ResetPass)
