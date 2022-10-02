import {isValueEmpty} from "../../../../Utils/empty";
import ProblemAddBody from "./ProblemAddBody";
import React from "react";
import {Form} from "antd";

const ItemProblemAdd = (props: any) => {
    return (
        <Form.Item name={props.name}>
            <ProblemAddBody
                editable={props.editable ?? true}
                problemType={props.problemType ?? "program"}
                initNewLine={props.initNewLine ?? ((data: any[], keyMapping: any) => {
                    return {id: Date.now()}
                })}
                keyMapping={props.keyMapping}
                {...props}
            />
        </Form.Item>
    )
}

export default ItemProblemAdd