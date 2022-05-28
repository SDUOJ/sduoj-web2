import {withTranslation} from "react-i18next";
import {Alert, Button, Input, message, Modal} from "antd";
import {useState} from "react";
import "Assert/css/Reconfirm.css"

interface ReconfirmProps{
    btnProps: any
    btnText: any
    confirm: string
    API: any
    todo: string
    beforeCheck?: any
}

const Reconfirm = (props: ReconfirmProps) => {

    const [modalVis, setModalVis] = useState<boolean>(false)
    const [value, setValue] = useState<string>("")

    return (
        <>
            <Button
                {...props.btnProps}
                onClick={() => {
                    if(props.beforeCheck !== undefined){
                        props.beforeCheck().then(()=>{
                            setModalVis(true)
                        }).catch(()=>{
                            message.error("表单不完整")
                        })
                    }else{
                        setModalVis(true)
                    }
                }}>{props.btnText}</Button>
            <Modal
                title={"操作确认"}
                visible={modalVis}
                className={"Reconfirm-Modal"}
                onCancel={() => {
                    setModalVis(false)
                }}
                footer={[
                    <Button
                        block={true}
                        danger={true}
                        disabled={props.confirm !== value}
                        onClick={() => {
                            props.API !== undefined && props.API()
                            setValue("")
                            setModalVis(false)
                        }}
                    > 我确定要{props.todo} </Button>
                ]}
            >
                <Alert message={<span style={{fontWeight: "bold"}}>您确定要{props.todo}吗？</span>} type="warning" showIcon style={{marginBottom: 10}}/>
                <div className={"Reconfirm-Modal-Input"}>
                    请输入 <span style={{fontWeight: "bold"}}>{props.confirm}</span> 进行确认。
                    <Input
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value)
                        }}
                    />
                </div>
            </Modal>
        </>

    )
}

export default withTranslation()(Reconfirm)