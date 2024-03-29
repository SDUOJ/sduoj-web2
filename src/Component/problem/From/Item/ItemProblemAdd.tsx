import ProblemAddBody from "./ProblemAddBody";
import React from "react";
import {Form} from "antd";

const ItemProblemAdd = (props: any) => {
    return (
        <Form.Item name={props.name} label={props.label}>
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
