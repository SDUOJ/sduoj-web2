import {Component} from "react";
import {Button, Image, Result, Space} from "antd";
import I404 from "Assert/img/404.png"
import {withRouter} from "react-router-dom";
import {UrlPrefix} from "../../Config/constValue";
import {withTranslation} from "react-i18next";

class CBuild extends Component<any, any>{

    render() {
        return (
            <>
                <Result
                    icon={<Image src={I404} width={"180px"} preview={false} />}
                    title={this.props.t("siteUnderConstruction")}
                    subTitle={this.props.t("devsWentToPetCats")}
                    extra={
                        <Space size={30}>
                            <Button type="default" onClick={()=>{
                                this.props.history.push("/")
                                window.location.reload();
                            }}>{this.props.t("backToOldVersion")}</Button>
                            <Button type="primary" onClick={()=>{
                                this.props.history.push(UrlPrefix + "/exam")
                                window.location.reload();
                            }}>{this.props.t("examSystem")}</Button>
                            <Button type="default" onClick={()=>{
                                this.props.history.push(UrlPrefix + "/manage")
                                window.location.reload();
                            }}>{this.props.t("adminConsole")}</Button>
                        </Space>

                    }
                />
            </>
        );
    }
}

export default withTranslation()(withRouter(CBuild))