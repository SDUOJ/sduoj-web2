import {Component} from "react";
import {withRouter} from "react-router-dom";
import {Card} from "antd";
import CApi from "Utils/API/c-api"
import TableWithPagination from "../Component/common/TableWithPagination";

class CProblem extends Component<any, any> {

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
                                        key: "problemTitle"
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
                                size={"middle"}
                            />
                        </Card>
                    </div>
                </div>
            </>
        );
    }
}

export default withRouter(CProblem)