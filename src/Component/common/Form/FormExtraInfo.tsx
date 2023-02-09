import {useEffect} from "react";

const FormExtraInfo = (props: any) =>{

    const {value, onChange} = props

    useEffect(() => {
        if (props.v !== undefined && !props.eqs(value, props.v)){
            // console.log("value", value, "props.v", props.v)
            onChange(props.v)
        }
    }, [props.v])

    useEffect(() => {
        if (value !== undefined && !props.eqs(value, props.v))
            props.setV(value)
    }, [value])

    return (
        <></> 
    )
}

export default FormExtraInfo
