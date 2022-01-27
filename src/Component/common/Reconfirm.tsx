import {withTranslation} from "react-i18next";
import {Alert, Button, Input, Modal} from "antd";
import {useState} from "react";
import "Assert/css/Reconfirm.css"

const Reconfirm = (props: any) => {

    const [modalVis, setModalVis] = useState<boolean>(false)
    const [value, setValue] = useState<string>("")

    return (
        <>
            <Button
                {...props.btnProps}
                onClick={() => {
                    setModalVis(true)
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