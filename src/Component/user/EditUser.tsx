import React, {Component, lazy, Suspense} from "react";
import {Button, message} from "antd";
import {IUser, IUserPropCbk, IUserPropRoles} from "../../Type/Iuser";
import {withTranslation} from "react-i18next";
import Loading from "../../Utils/Loading";

interface IEditUserUserProp extends IUserPropCbk, IUserPropRoles {
    user: IUser
}

interface IEditUserUserState {
    visible: boolean
}

const UserInfo = lazy(() => import('Component/user/UserInfo'))

class EditUser extends Component<IEditUserUserProp, IEditUserUserState> {


    constructor(props: Readonly<IEditUserUserProp> | IEditUserUserProp) {
        super(props);
        this.state = {
            visible: false
        }
    }

    setVisible = (visible: boolean) => {
        this.setState({visible: visible})
    }

    show = () => {
        this.setVisible(true)
    }

    deleteUser = () => {
        message.success(this.props.t('deleteSuccess'))

        this.props.callback(this.props.ids)


        // message.error(this.props.t("deleteFailed"))
    }


    render() {
        return (
            <>
                <Suspense fallback={<Loading/>}>
                    <UserInfo
                        roles={this.props.roles}
                        id={this.props.user.id}
                        setVisible={this.setVisible}
                        type={"EditUser"}
                        visible={this.state.visible}
                        data={this.props.user}
                    />
                </Suspense>
                <Button type='primary' size={"small"} onClick={this.show}>
                    {this.props.t("Edit")}
                </Button>
            </>
        )
    }
}

export default withTranslation()(EditUser)
