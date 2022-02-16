import {Component} from "react";
import {withRouter} from "react-router-dom";
import {Button, Card, Space, Tag} from "antd";
import CApi from "Utils/API/c-api"
import TableWithPagination from "../../Component/common/Table/TableWithPagination";
import {CheckOutlined} from "@ant-design/icons";

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
                        <Card title={"题目列表"}>
                            <TableWithPagination
                                API={CApi.getProblemList}
                                columns={[
                                    {
                                        title: "题号",
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
                                        title: "标题",
                                        dataIndex: "problemTitle",
                                        key: "problemTitle",
                                        render: (text: string, row: any) => {
                                            return <>
                                                <Space size={3}>
                                                    <Button size={"small"} type={"text"} onClick={()=>{
                                                        this.props.history.push("/v2/problem/" + row.problemCode)
                                                    }}>{text}</Button>
                                                    {[""].map(() => {
                                                        if (this.state.ACList.indexOf(row.problemCode) !== -1) {
                                                            return <CheckOutlined style={{color: "green"}}/>
                                                        }
                                                    })}
                                                    {[""].map(() => {
                                                        if (row.isPublic === 0) {
                                                            return <Tag color={"orange"}>私有</Tag>
                                                        }
                                                    })}
                                                </Space>
                                            </>
                                        }
                                    },
                                    {
                                        title: "来源",
                                        dataIndex: "source",
                                        key: "source"
                                    },
                                    {
                                        title: "通过数",
                                        dataIndex: "acceptNum",
                                        key: "acceptNum"
                                    },
                                ]}
                                size={"small"}
                            />
                        </Card>
                    </div>
                </div>
            </>
        );
    }
}

export default withRouter(CProblem)