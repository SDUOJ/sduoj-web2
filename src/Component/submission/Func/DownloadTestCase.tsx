import {withTranslation} from "react-i18next";
import {Button} from "antd";
import {DownloadOutlined} from "@ant-design/icons"

const DownloadTestCase = (props: any) =>{
    return (
        <>
            <Button icon={<DownloadOutlined />}>
                下载数据
            </Button>
        </>
    )
}

export default withTranslation()(DownloadTestCase)