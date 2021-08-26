import React, {Component} from "react";
import {Button, message, Popconfirm, Popover} from "antd";
import {IUserPropCbk} from "../../Type/Iuser";
import {withTranslation} from "react-i18next";

interface DeleteUserState {
    disabledButton: boolean | undefined
    MouseIn: boolean
}


class DeleteUser extends Component<IUserPropCbk, DeleteUserState> {


    constructor(props: Readonly<IUserPropCbk> | IUserPropCbk) {
        super(props);
        this.state = {
            disabledButton: true,
            MouseIn: false
        }
    }

    deleteUser = () => {
        this.setState({MouseIn: false})
        message.success(this.props.t('deleteSuccess'))

        this.props.callback(this.props.ids)


        // message.error(this.props.t("deleteFailed"))
    }

    static getDerivedStateFromProps(nextProps: any, prevState: any) {
        let newS = nextProps.ids.length === 0
        if (prevState.disabledButton !== newS) {
            return {disabledButton: newS}
        }
        return null
    }

    render() {
        return (
            <>
                <span
                    onMouseEnter={() => {this.setState({MouseIn: true})}}
                    onMouseLeave={() => {this.setState({MouseIn: false})}}
                >
                    <Popover
                        content={this.props.t("user_chooseToDelete")}
                        title={this.props.t("user_deleteBatch")}
                        visible={this.state.disabledButton && this.state.MouseIn}
                    >
                        <Popconfirm
                            title={this.props.t("deleteConfirm")}
                            onConfirm={this.deleteUser}
                            okText={this.props.t("yes")}
                            cancelText={this.props.t("no")}
                            disabled={this.state.disabledButton}
                        >
                            <Button type='primary' danger
                                    disabled={this.state.disabledButton}
                            >{this.props.t("delete")}</Button>
                        </Popconfirm>
                    </Popover>
                </span>
            </>
        )
    }
}

export default withTranslation()(DeleteUser)
