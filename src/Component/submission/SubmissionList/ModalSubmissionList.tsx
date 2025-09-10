import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import React, {useState} from "react";
import {Button, Modal} from "antd";
import SubmissionList from "./SubmissionList";

const ModalSubmissionList = (props: any) => {
    const [ModalVis, setModalVis] = useState<boolean>(false);

    return (
        <>
            <Button
                {...props.btnProps}
                onClick={() => {
                    setModalVis(true)
                }}
            >
                {props.btnText}
            </Button>
            <Modal
                width={1250}
                open={ModalVis}
                footer={false}
                onCancel={() => {
                    setModalVis(false)
                }}
            >
                <SubmissionList
                    {...props}
                />
            </Modal>
        </>

    )
}

export default withTranslation()(withRouter(ModalSubmissionList))