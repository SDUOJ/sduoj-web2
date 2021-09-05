import React, {Component} from "react";
import {Button, message, Popconfirm, Popover} from "antd";
import {IUserPropCbk} from "../../Type/Iuser";
import {withTranslation} from "react-i18next";
import {SizeType} from "antd/lib/config-provider/SizeContext";

interface DeleteUserState {
    disabledButton: boolean | undefined
    MouseIn: boolean
}

interface IBatchOperationUserProps extends IUserPropCbk {
    btSize: SizeType
    type: "delete" | "export"
}

class BatchOperationUser extends Component<IBatchOperationUserProps, DeleteUserState> {

    constructor(props: Readonly<IBatchOperationUserProps> | IBatchOperationUserProps) {
        super(props);
        this.state = {
            disabledButton: true,
            MouseIn: false
        }
    }

    deleteUser = () => {
        this.setState({MouseIn: false})
        message.success(this.props.t('deleteSuccess'))

        // TODO 实现删除数据

        this.props.callback(this.props.ids)
        // message.error(this.props.t("deleteFailed"))
    }

    exportUser = () => {
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
                    onConfirm: this.deleteUser
                },
                button:{
                    content:    this.props.t("delete"),
                    danger: true,
                    type: "primary"
                }

            },
            export:{
                popover: {
                    content: this.props.t("user_chooseToExport"),
                    title: this.props.t("user_exportBatch"),
                },
                confirm: {
                    title: this.props.t("exportConfirm"),
                    onConfirm: this.exportUser
                },
                button: {
                    content: this.props.t("export"),
                    danger: false,
                    type: "default"
                }
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
                            <Button size={this.props.btSize} type={msgList[type].button.type} danger={msgList[type].button.danger}
                                    disabled={this.state.disabledButton}
                            >{msgList[type].button.content}</Button>
                        </Popconfirm>
                    </Popover>
                </span>
            </>
        )
    }
}

export default withTranslation()(BatchOperationUser)
