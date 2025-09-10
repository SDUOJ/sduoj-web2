import {withTranslation, useTranslation} from "react-i18next";
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
    t?: any
}

const Reconfirm = (props: ReconfirmProps) => {
    const { t } = useTranslation();

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
                            message.error(t('FormIncomplete'))
                        })
                    }else{
                        setModalVis(true)
                    }
                }}>{props.btnText}</Button>
            <Modal
                title={t('OperationConfirm')}
                open={modalVis}
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
                    > {t('IConfirmToDo', {todo: props.todo})} </Button>
                ]}
            >
                <Alert message={<span style={{fontWeight: "bold"}}>{t('AreYouSureToDo', {todo: props.todo})}</span>} type="warning" showIcon style={{marginBottom: 10}}/>
                <div className={"Reconfirm-Modal-Input"}>
                    {t('PleaseInputToConfirm')} <span style={{fontWeight: "bold"}}>{props.confirm}</span> {t('ToConfirm')}。
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