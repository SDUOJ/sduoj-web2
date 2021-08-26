import React, {Component} from "react";
import {Button, message, Popconfirm} from "antd";
import {IUserPropCbk} from "../../Type/Iuser";
import {withTranslation} from "react-i18next";


 class DeleteUser extends Component<IUserPropCbk, any> {

    deleteUser = () => {
        message.success(this.props.t('deleteSuccess'))

        if(this.props.ids.length === 0){
            console.log(this.props.obj)
            this.props.callback(this.props.obj.state.selectedRowKeys)
        }else{
            this.props.callback(this.props.ids)
        }



        // message.error(this.props.t("deleteFailed"))
    }

    render() {
        return (
            <>
                <Popconfirm
                    title={this.props.t("deleteConfirm")}
                    onConfirm={this.deleteUser}
                    okText={this.props.t("yes")}
                    cancelText={this.props.t("no")}>
                    <Button type='primary' danger>{this.props.t("delete")}</Button>
                </Popconfirm>
            </>
        )
    }
}

export default withTranslation()(DeleteUser)
