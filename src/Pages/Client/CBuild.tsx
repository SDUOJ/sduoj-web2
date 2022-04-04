import {Component} from "react";
import {Button, Image, Result, Space} from "antd";
import I404 from "Assert/img/404.png"
import {withRouter} from "react-router-dom";
import {UrlPrefix} from "../../Config/constValue";

class CBuild extends Component<any, any>{

    render() {
        return (
            <>
                <Result
                    icon={<Image src={I404} width={"180px"} preview={false} />}
                    title="新版网站建设中..."
                    subTitle={"开发人员跑去吸猫了，临走前他们完成了以下功能"}
                    extra={
                        <Space size={30}>
                            <Button type="default" onClick={()=>{
                                this.props.history.push("/")
                                window.location.reload();
                            }}>返回老版</Button>
                            <Button type="primary" onClick={()=>{
                                this.props.history.push(UrlPrefix + "/exam")
                                window.location.reload();
                            }}>考试系统</Button>
                            <Button type="default" onClick={()=>{
                                this.props.history.push(UrlPrefix + "/manage")
                                window.location.reload();
                            }}>管理端</Button>
                        </Space>

                    }
                />
            </>
        );
    }
}

export default withRouter(CBuild)