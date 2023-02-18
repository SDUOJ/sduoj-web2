import React, {Dispatch} from "react";
import {Button, Modal} from "antd";
import Processing from "./Processing";
import {SubmissionState} from "../../../Type/ISubmission";
import {connect} from "react-redux";
import {withRouter} from "react-router-dom";
import {useTranslation} from "react-i18next";


const ModalProcessing = (props: any) => {
    const {t} = useTranslation()
    return (
        <Modal
            title={
                t("submissionDetails") +
                (props.title !== undefined ? "(" + props.title + ")" : "")
            }
            destroyOnClose={true}
            visible={props.submissionModalVis}
            onCancel={() => props.setSubmissionModalVis(false)}
            width={1200}
            zIndex={2000}
            style={{overflow: "hidden"}}
            footer={[
                <Button key="back" onClick={() => {
                    props.setSubmissionModalVis(false)
                }}>
                    关闭
                </Button>
            ]}
        >
            <Processing/>
        </Modal>
    )

}

const mapStateToProps = (state: any) => {
    const SubState: SubmissionState = state.SubmissionReducer
    return {
        submissionModalVis: SubState.SubmissionModalVis,
        title: SubState.TopSubmissionInfo?.title
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    setSubmissionModalVis: (data: boolean) => dispatch({
        type: "setSubmissionModalVis", data: data
    })
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withRouter(ModalProcessing))
