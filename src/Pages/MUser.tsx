import React, {Component} from "react";
import {withRouter} from "react-router";
import UserList from "../Component/user/UserList";
import UserListOperHeader from "../Component/user/UserListOperHeader";
import {IUserPropRoles} from "../Type/Iuser";
import {RouteComponentProps} from "react-router-dom";

interface MUserState {
    UserListObj: any
    ids: number[]
}

class MUser extends Component<IUserPropRoles & RouteComponentProps, MUserState> {


    constructor(props: IUserPropRoles & RouteComponentProps, context: any) {
        super(props, context);
        this.state = {
            UserListObj: null,
            ids: []
        }
    }

    Ref = (ref: any, ids: number[]) => {
        this.setState((state) => {
            return {UserListObj: ref, ids: ids}
        })
    }


    render() {
        return (
            <>
                <div style={{marginTop: -20, overflow: "hidden"}}>
                    <UserListOperHeader id={this.props.id} roles={this.props.roles} data={this.state.ids} obj={this.state.UserListObj}/>
                    <UserList id={this.props.id} roles={this.props.roles} obj={this.Ref}/>
                </div>
            </>
        )
    }
}

export default withRouter(MUser)