import React, {Component, Dispatch} from "react";
import {Button, Modal} from "antd";
import Processing from "./Processing/Processing";
import {SubmissionState} from "../../Type/ISubmission";
import {connect} from "react-redux";
import {withRouter} from "react-router-dom";


class SubmissionModal extends Component<any, any> {


    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            ProcessingVis: false
        }
    }

    componentDidMount() {
        this.setState({
            ProcessingVis: this.props.submissionModalVis
        })
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
        if (prevProps.submissionModalVis !== this.props.submissionModalVis) {
            this.setState({
                ProcessingVis: this.props.submissionModalVis
            })
        }
    }

    render() {
        return (
            <>
                <Modal
                    title={"提交详情"}
                    destroyOnClose={true}
                    visible={this.state.ProcessingVis}
                    onCancel={() => this.props.setSubmissionModalVis(false)}
                    width={1200}
                    zIndex={2000}
                    footer={[
                        <Button key="back" onClick={() => {
                            this.props.setSubmissionModalVis(false)
                        }}>
                            关闭
                        </Button>
                    ]}
                >
                    <Processing QuerySubmission={this.props.getSubmission}/>
                </Modal>
            </>
        )
    }
}

const mapStateToProps = (state: any) => {
    const SubState: SubmissionState = state.SubmissionReducer
    return {
        submissionModalVis: SubState.SubmissionModalVis
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
)(withRouter(SubmissionModal))