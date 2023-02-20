import {Component} from "react";
import {withRouter} from "react-router-dom";
import {Button, Card, Space, Tag} from "antd";
import CApi from "Utils/API/c-api"
import TableWithPagination from "../../Component/common/Table/TableWithPagination";
import {CheckOutlined} from "@ant-design/icons";
import {UrlPrefix} from "../../Config/constValue";
import {withTranslation} from "react-i18next";

class CProblem extends Component<any, any> {


    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            ACList: []
        }
    }

    componentDidMount() {
        CApi.getACProblem().then((res: any) => {
            this.setState({
                ACList: res
            })
        })
    }


    render() {
        return (
            <>
                <div style={{textAlign: "center", margin: "0 auto"}}>
                    <div style={{textAlign: "left", maxWidth: "1500px", margin: "0 auto"}}>
                        <Card title={this.props.t("ProblemList")}>
                            <TableWithPagination
                                API={CApi.getProblemList}
                                columns={[
                                    {
                                        title: this.props.t("problemCode"),
                                        dataIndex: "problemCode",
                                        key: "problemCode",
                                        render: (text: string) => {
                                            let ps = text.split("-")
                                            return <>
                                                <span style={{fontWeight: "bold"}}>{ps[0]}</span>-<span>{ps[1]}</span>
                                            </>
                                        }
                                    },
                                    {
                                        title: this.props.t("title"),
                                        dataIndex: "problemTitle",
                                        key: "problemTitle",
                                        render: (text: string, row: any) => {
                                            return <>
                                                <Space size={3}>
                                                    <Button size={"small"} type={"text"} onClick={()=>{
                                                        this.props.history.push(UrlPrefix + "/problem/" + row.problemCode)
                                                    }}>{text}</Button>
                                                    {[""].map(() => {
                                                        if (this.state.ACList.indexOf(row.problemCode) !== -1) {
                                                            return <CheckOutlined style={{color: "green"}}/>
                                                        }
                                                        return undefined
                                                    })}
                                                    {[""].map(() => {
                                                        if (row.isPublic === 0) {
                                                            return <Tag color={"orange"}>{this.props.t("private")}</Tag>
                                                        }
                                                        return undefined
                                                    })}
                                                </Space>
                                            </>
                                        }
                                    },
                                    {
                                        title: this.props.t("source"),
                                        dataIndex: "source",
                                        key: "source"
                                    },
                                    {
                                        title: this.props.t("acceptNumber"),
                                        dataIndex: "acceptNum",
                                        key: "acceptNum"
                                    },
                                ]}
                                size={"small"}
                                name={"C-ProblemList-Main"}
                            />
                        </Card>
                    </div>
                </div>
            </>
        );
    }
}

export default withTranslation()(withRouter(CProblem))
