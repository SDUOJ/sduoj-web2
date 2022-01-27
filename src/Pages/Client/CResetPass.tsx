import {Card, Form} from "antd";
import ItemPassword from "../../Component/user/Form/Item/ItemPassword";
import ItemCaptcha from "../../Component/user/Form/Item/ItemCaptcha";
import {useState} from "react";
import {getUrlParams} from "../../Utils/getUrlParams";
import {withRouter} from "react-router-dom";

const ResetPass = (props: any) => {

    const [imgId, setImgId] = useState<string>()
    const [token, setToken] = useState(getUrlParams(props.location.search).token)

    console.log(token)

    return (
        <>
            <div style={{width: "500px", textAlign: "center", margin: "0 auto"}}>
                <div style={{textAlign: "left"}}>
                    <Card
                        title={"重置密码"}
                    >
                        <Form layout={"vertical"}>
                            <ItemPassword/>
                            <ItemCaptcha setImgId={setImgId}/>
                        </Form>

                    </Card>
                </div>
            </div>

        </>
    )
}

export default withRouter(ResetPass)