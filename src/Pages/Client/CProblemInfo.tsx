import {Component, useEffect} from "react";
import {withRouter} from "react-router-dom";
import {Button, Card, Space, Tag} from "antd";
import CApi from "Utils/API/c-api"
import TableWithPagination from "../../Component/common/Table/TableWithPagination";
import {CheckOutlined} from "@ant-design/icons";

const CProblemInfo = (props: any) => {

    return (
        <>
            <div style={{textAlign: "center", margin: "0 auto"}}>
                <div style={{textAlign: "left", maxWidth: "1500px", margin: "0 auto"}}>
                    <Card size={"small"}>
                        {props.match.params.ProblemCode}
                    </Card>
                </div>
            </div>
        </>
    );

}

export default withRouter(CProblemInfo)