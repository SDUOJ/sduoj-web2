import {DatePicker, Form} from "antd";
import FormExtraInfo from "../FormExtraInfo";
import {isValueEmpty} from "../../../../Utils/empty";
import moment from "moment";
import React, {useState} from "react";


const ItemTime = (props: any) => {
    const [time, setTime] = useState<any>()
    return (
        <>
            <Form.Item
                label={props.label}
                required={props.required}
            >
                <DatePicker showTime value={time} onChange={(v: any) => {setTime(v)}}/>
            </Form.Item>
            <Form.Item name={props.name} hidden required={props.required}>
                <FormExtraInfo v={isValueEmpty(time) ? undefined : time.unix() * 1000} setV={(v: any) => {
                    setTime(moment(parseInt(v)))
                }} eqs={(a: string, b: string) => a === b}/>
            </Form.Item>
        </>
    )
}

export default ItemTime