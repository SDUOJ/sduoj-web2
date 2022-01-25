import {Component} from "react";
import {withRouter} from "react-router-dom";
import Editor from "../Component/common/Editor";
import AnnouncementForm from "../Component/announcement/AnnouncementForm";
import {Button} from "antd";
import CodeEditor from "../Component/common/CodeEditor";
import EditableTableWithDrag from "../Component/common/EditableTableWithDrag";
import {ck, isValueEmpty} from "../Utils/empty";


class CTest extends Component<any, any> {

    render() {
        return (
            <div style={{width: "1250px"}}>
                <EditableTableWithDrag
                    type={"problem"}
                    editable={true}
                    problemType={"program"}
                    initNewLine={(data: any[]) => {
                        const length = data.length
                        const last = length == 0 ? undefined : data[data.length - 1]
                        const code = isValueEmpty(last?.ProblemCode) ? undefined : last?.ProblemCode
                        const score = last?.ProblemScore
                        const submitNumber = last?.ProblemSubmitNumber
                        const number = code === undefined ? 0 : parseInt(code.substr(-4))
                        const NewCode = code === undefined ? undefined : code.substr(0, code.length - 4) + (number + 1).toString()
                        return {
                            id: Date.now(),
                            ProblemCode: NewCode,
                            ProblemScore: score,
                            ProblemSubmitNumber: submitNumber,
                        }
                    }}
                />
            </div>
        );
    }
}

export default withRouter(CTest)