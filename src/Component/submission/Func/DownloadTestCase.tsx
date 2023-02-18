import {withTranslation} from "react-i18next";
import {Button} from "antd";
import {DownloadOutlined} from "@ant-design/icons"

const DownloadTestCase = (props: any) =>{
    return (
        <>
            <Button icon={<DownloadOutlined />}>
                {props.t("downloadData")}
            </Button>
        </>
    )
}

export default withTranslation()(DownloadTestCase)
