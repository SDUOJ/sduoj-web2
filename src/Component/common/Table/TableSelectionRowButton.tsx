import React, {Component} from "react";
import {Button, message, Popconfirm, Popover} from "antd";
import {IUserPropCbk} from "../../../Type/Iuser";
import {withTranslation} from "react-i18next";
import {SizeType} from "antd/lib/config-provider/SizeContext";

interface DeleteUserState {
    disabledButton: boolean | undefined
    MouseIn: boolean
}

interface IBatchOperationUserProps{
    buttonProps: any
    buttonText: any
    getData: any
    type: "delete" | "export"
}

class BatchOperationUser extends Component<IBatchOperationUserProps & any, DeleteUserState> {

    constructor(props: any) {
        super(props);
        this.state = {
            disabledButton: true,
            MouseIn: false
        }
    }

    delete = () => {
        this.setState({MouseIn: false})
        message.success(this.props.t('deleteSuccess'))

        // TODO 实现删除数据

        this.props.callback(this.props.ids)
        // message.error(this.props.t("deleteFailed"))
    }

    export = () => {
        this.setState({MouseIn: false})

        // TODO 实现导出数据

        message.success(this.props.t('exportSuccess'))

        // message.error(this.props.t("exportFailed"))

    }


    static getDerivedStateFromProps(nextProps: any, prevState: any) {
        let newS = nextProps.ids.length === 0
        if (prevState.disabledButton !== newS) {
            return {disabledButton: newS}
        }
        return null
    }

    render() {

        const msgList:{[key: string] : any} = {
            delete: {
                popover: {
                    content: this.props.t("user_chooseToDelete"),
                    title: this.props.t("user_deleteBatch"),
                },
                confirm: {
                    title: this.props.t("deleteConfirm"),
                    onConfirm: this.delete
                },
            },
            export:{
                popover: {
                    content: this.props.t("user_chooseToExport"),
                    title: this.props.t("user_exportBatch"),
                },
                confirm: {
                    title: this.props.t("exportConfirm"),
                    onConfirm: this.export
                },
            }
        }

        const {type} = this.props

        return (
            <>
                <span
                    onMouseEnter={() => {
                        this.setState({MouseIn: true})
                    }}
                    onMouseLeave={() => {
                        this.setState({MouseIn: false})
                    }}
                >
                    <Popover
                        content={msgList[type].popover.content}
                        title={msgList[type].popover.title}
                        visible={this.state.disabledButton && this.state.MouseIn}
                    >
                        <Popconfirm
                            title={msgList[type].confirm.title}
                            onConfirm={msgList[type].confirm.onConfirm}
                            okText={this.props.t("yes")}
                            cancelText={this.props.t("no")}
                            disabled={this.state.disabledButton}
                        >
                            <Button {...this.props.buttonProps}
                                    disabled={this.state.disabledButton}
                            >{this.props.buttonText}</Button>
                        </Popconfirm>
                    </Popover>
                </span>
            </>
        )
    }
}

export default withTranslation()(BatchOperationUser)
