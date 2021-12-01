import React, {Component} from "react";
import {SortableTable} from "../Component/common/sortableTable";
import ObjectiveForm from "../Component/problem/ObjectiveForm";

export default class MObjective extends Component<any, any> {
    render() {
        return (
            <>
                <ObjectiveForm/>
            </>
        )
    }
}