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
                        message.success("已取消成绩")
                        props.afterSuccess !== undefined && props.afterSuccess()
                    })
                }}
            >
                取消成绩
            </Button>
        </>
    )
}

export default withTranslation()(Invalidate)