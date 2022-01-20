import {Component} from "react";
import {withRouter} from "react-router-dom";
import Editor from "../Component/common/Editor";


class CTest extends Component<any, any> {

    render() {
        return (
            <div style={{width: "1000px"}}>
                <Editor/>
            </div>
        );
    }
}

export default withRouter(CTest)