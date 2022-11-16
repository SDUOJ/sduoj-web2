import {useState} from "react";
import {Button, Modal} from "antd";
import MarkdownText from "../../Utils/MarkdownText";

const ModalMarkdown = (props: any) => {
    const [vis, setVis] = useState<boolean>(false)
    return (
        <>
            <Button type={"link"} size={"small"} onClick={() => {
                setVis(true)
            }}> {props.btnText} </Button>
            <Modal
                title={props.title}
                visible={vis}
                onCancel={() => {
                    setVis(false)
                }}
                footer={false}
                destroyOnClose={true}
                width={1200}
            >
                <MarkdownText id={props.id} text={props.text}/>
            </Modal>
        </>
    )
}

export default ModalMarkdown