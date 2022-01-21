import {Component} from "react";
import {withRouter} from "react-router-dom";
import Editor from "../Component/common/Editor";
import AnnouncementForm from "../Component/announcement/AnnouncementForm";
import {Button} from "antd";


class CTest extends Component<any, any> {

    render() {
        return (
            <div style={{width: "1250px"}}>
                <AnnouncementForm button={<Button>1</Button>}/>
            </div>
        );
    }
}

export default withRouter(CTest)