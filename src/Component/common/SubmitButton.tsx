import {Button, message} from "antd";
import {useState} from "react";

const SubmitButton = (props: any) => {

    const [loading, setLoading] = useState<boolean>(false)

    return (
        <Button
            {...props.btnProps}
            loading={loading}
            disabled={loading}
            onClick={()=>{
                setLoading(true)
                props.API().then((res: any)=>{
                    message.success(res)
                }).catch((e:any)=>{
                    // message.error(e)
                    console.log(e)
                }).finally(()=>{
                    setLoading(false)
                })
            }}
        > {props.btnText} </Button>
    )
}


export default SubmitButton