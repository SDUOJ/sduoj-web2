import {Button, Card, Form, message} from "antd";
import ItemPassword from "../../Component/user/Form/Item/ItemPassword";
import {getUrlParams} from "../../Utils/getUrlParams";
import {withRouter} from "react-router-dom";
import {useForm} from "antd/es/form/Form";
import CApi from "Utils/API/c-api"
import {UrlPrefix} from "../../Config/constValue";


const ResetPass = (props: any) => {

    const token = getUrlParams(props.location.search).token
    const [form] = useForm()
    return (
        <>
            <div style={{width: "500px", textAlign: "center", margin: "0 auto"}}>
                <div style={{textAlign: "left"}}>
                    <Card
                        title={"重置密码"}
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
                                        message.success("密码重置成功，请重新登录")
                                    })
                                })
                            }}
                        >
                            提交
                        </Button>
                    </Card>
                </div>
            </div>

        </>
    )
}

export default withRouter(ResetPass)