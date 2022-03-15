import {Component} from "react";
import {withRouter} from "react-router-dom";
import {Button} from "antd";


class CGroup extends Component<any, any> {

    render() {
        return (
            <>
                <Button onClick={()=>{
                    this.props.history.push("/group")
                    window.location.reload()
                }}>
                    返回老版 Group
                </Button>
            </>
        );
    }
}

export default withRouter(CGroup)