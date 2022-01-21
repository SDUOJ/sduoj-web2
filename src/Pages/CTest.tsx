import {Component} from "react";
import {withRouter} from "react-router-dom";
import Editor from "../Component/common/Editor";
import AnnouncementForm from "../Component/announcement/AnnouncementForm";
import {Button} from "antd";
import CodeEditor from "../Component/common/CodeEditor";


class CTest extends Component<any, any> {

    render() {
        return (
            <div style={{width: "1250px"}}>
                <CodeEditor code={`#include <iostream>\n int main(){\n`} lang={"cpp"}/>
            </div>
        );
    }
}

export default withRouter(CTest)