import React, {Component} from "react";
import {withRouter} from "react-router";
import {RouteComponentProps} from "react-router-dom";
import {IUserPropRoles} from "../Type/Iuser";
import GroupListOperHead from "../Component/group/GroupListOperHead";
import GroupList from "../Component/group/GroupList";



class MGroup extends Component<any, any> {


    render() {
        return (
            <>
                组页面
            </>
        )
    }
}

export default withRouter(MGroup)
