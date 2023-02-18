import {withTranslation} from "react-i18next";
import {Button, message} from "antd";
import {CloseOutlined} from "@ant-design/icons";

const Invalidate = (props: any)=>{
    return (
        <>
            <Button
                icon={<CloseOutlined />}
                onClick={()=>{
                    props.API(props.data).then((res: any)=>{
                        message.success(props.t("canceledResults"))
                        props.afterSuccess !== undefined && props.afterSuccess()
                    })
                }}
            >
                {props.t("cancelResults")}
            </Button>
        </>
    )
}

export default withTranslation()(Invalidate)
