import React, {Component} from "react";
import {withRouter} from "react-router";
import {RouteComponentProps} from "react-router-dom";
import {IUserPropRoles} from "../Type/Iuser";
import GroupListOperHead from "../Component/group/GroupListOperHead";
import GroupList from "../Component/group/GroupList";

interface MGroupState {
    groupList: {},
    ids: number[]
}

class MGroup extends Component<IUserPropRoles & RouteComponentProps, MGroupState> {
    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            groupList: [],
            ids: []
        }
    }

    Ref = (ref: any, ids: number[]) => {
        this.setState((state) => {
            return {groupList: ref, ids: ids}
        })
    }

    render() {
        return (
            <>
                <div className="option-table">
                    <GroupListOperHead id={this.props.id} roles={this.props.roles} obj={this.state.groupList} data={this.state.ids} />
                    <GroupList id={this.props.id} roles={this.props.roles} obj={this.Ref} data={this.state.ids}  />
                </div>
            </>
        )
    }
}

export default withRouter(MGroup)
