import {Component} from "react";
import {withRouter} from "react-router-dom";
import EditableTableWithDrag from "../../Component/common/Table/EditableTableWithDrag";
import {isValueEmpty} from "../../Utils/empty";
import TimeError from "../Error/TimeError";
import Reconfirm from "../../Component/common/Reconfirm";


class CTest extends Component<any, any> {

    render() {
        return (
            <Reconfirm
                btnText={"AK比赛"}
                todo={"AK这场比赛"}
                confirm={"我真是太强了"}
            />
        );
    }


    // <div style={{width: "1250px"}}>
    //     <EditableTableWithDrag
    //         type={"problem"}
    //         editable={true}
    //         problemType={"program"}
    //         initNewLine={(data: any[]) => {
    //             const length = data.length
    //             const last = length === 0 ? undefined : data[data.length - 1]
    //             const code = isValueEmpty(last?.ProblemCode) ? undefined : last?.ProblemCode
    //             const score = last?.ProblemScore
    //             const submitNumber = last?.ProblemSubmitNumber
    //             const number = code === undefined ? 0 : parseInt(code.substr(-4))
    //             const NewCode = code === undefined ? undefined : code.substr(0, code.length - 4) + (number + 1).toString()
    //             return {
    //                 id: Date.now(),
    //                 ProblemCode: NewCode,
    //                 ProblemScore: score,
    //                 ProblemSubmitNumber: submitNumber,
    //             }
    //         }}
    //     />
    // </div>
}

export default withRouter(CTest)