import {Button, Result} from "antd";
import {withRouter} from "react-router-dom";
import {UrlPrefix} from "../../Config/constValue";
import {useTranslation} from "react-i18next";

const BrowserVersionError = (props: any) => {
    const {t} = useTranslation();
    return (
        <div className={"page-center"}>
            <Result
                status="error"
                title={t("browserTooOldTitle")}
                subTitle={
                    <>
                        <span><a href={"https://www.microsoft.com/zh-cn/edge"}>Microsoft Edge (85+)</a></span> <br/>
                        <span><a href={"https://www.google.cn/intl/zh-CN/chrome/"}>Google Chrome (85+)</a></span> <br/>
                        <span><a href={"https://www.firefox.com.cn/"}>Mozilla Firefox (79+)</a></span> <br/>
                        <span><a href={"https://www.apple.com.cn/safari/"}>Apple Safari (13.4+)</a></span>
                    </>
                }
                extra={
                    <Button
                        type="primary"
                        key="return"
                        onClick={() => {
                            props.history.replace(UrlPrefix + "/home")
                        }}
                    >
                        {t("backToHome")}
                    </Button>
                }
            />
        </div>
    )
}

export default withRouter(BrowserVersionError)
