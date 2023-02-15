import TableWithPagination from "../common/Table/TableWithPagination";
import cApi from "../../Utils/API/c-api";
import {Button} from "antd";
import {withRouter} from "react-router-dom";

const ProblemSetList = (props: any) => {
    return (
        <>

            <TableWithPagination
                name={`ProblemSetList-group-${props.groupId}-tag-${props.tag}`}
                columns={[
                    {title: "ID", dataIndex: "psid"},
                    {
                        title: "标题", dataIndex: "name", render: (v: any, r: any) => {
                            return <Button type={"text"} size={"small"} onClick={() => {
                                props.history.push(`/v2/problemSet/${r.psid}`)
                            }}>
                                {v}
                            </Button>
                        }
                    },
                    {title: "分数", dataIndex: "global_score"},
                ]}
                API={(paras: any) => {
                    return cApi.getProblemSetList({...paras, groupId: props.groupId, tag: props.tag})
                }}
                size={"small"}
            />
        </>
    )
}

export default withRouter(ProblemSetList)
