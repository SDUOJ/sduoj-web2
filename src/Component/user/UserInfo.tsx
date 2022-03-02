import React, {Component} from "react";

import {IUser, IUserPropRoles} from '../../Type/Iuser'
import {Button, FormInstance, Modal, Tabs} from "antd";
import {withTranslation} from "react-i18next";
import UserFormProfile from "./Form/UserFormProfile";
import UserFormPass from "./Form/UserFormPass";
import UserFormAdditional from "./Form/UserFormAdditional";


interface UserInfoProp extends IUserPropRoles {
    data?: IUser
    setVisible: any
    visible: boolean
    type: "AddUser" | "EditUser" | "ChangePass"
}

interface UserInfoState {
    visible: boolean
    loading: boolean
}

let typeList: { [key: string]: string[] } = {
    AddUser: ["profile", "additional"],
    EditUser: ["profileEdit", "additional"],
    ChangePass: ["password"]
}

class UserInfo extends Component<UserInfoProp, UserInfoState> {
    userInfo = React.createRef<FormInstance>();
    userPassword = React.createRef<FormInstance>();
    userAdditional = React.createRef<FormInstance>();

    constructor(props: Readonly<UserInfoProp> | UserInfoProp) {
        super(props);
        this.state = {
            loading: false,
            visible: true,
        };
    }

    submit = () => {
        this.setState({loading: true});
        setTimeout(() => {
            this.setState({loading: false});
        }, 3000);
        this.props.setVisible(false)
    };

    handleCancel = () => {
        this.props.setVisible(false)
    };


    static getDerivedStateFromProps(nextProps: any, prevState: any) {
        if (nextProps.visible !== prevState.visible) {
            return {visible: nextProps.visible}
        }
        return null
    }


    render() {
        if (this.props.roles.includes("superadmin")) {
            typeList['EditUser'] = ["profileEdit", "additional", "password"]
        }

        const showTab: string[] = typeList[this.props.type]

        const tabList: { [key: string]: any } = {
            profile: this.props.t("profile"),
            additional: this.props.t('AdditionalConfiguration'),
            profileEdit: this.props.t("profile"),
            password: this.props.t("password")
        }

        const contentList: any = {
            profile: (
                <>
                    <UserFormProfile key="userInfo" id={this.props.id} roles={this.props.roles} userForm={this.userInfo}
                                     showUsername={true}/>
                    <UserFormPass key="userPass" userForm={this.userPassword}/>
                </>
            ),
            profileEdit: (
                <>
                    <UserFormProfile key="userInfo"
                                     id={this.props.id}
                                     roles={this.props.roles}
                                     userForm={this.userInfo}
                                     initData={this.props.data}
                                     showUsername={false}/>
                </>
            ),
            additional: (
                <UserFormAdditional key="userAdditional" userForm={this.userAdditional}/>
            ),
            password: (
                <UserFormPass key="userPass" userForm={this.userPassword}/>
            )
        };


        return (
            <Modal
                visible={this.props.visible}
                title={this.props.t(this.props.type)}
                onCancel={this.handleCancel}
                footer={[
                    <Button key="back" onClick={this.handleCancel}>
                        {this.props.t("Return")}
                    </Button>,
                    <Button key="submit" type="primary" loading={this.state.loading} onClick={this.submit}>
                        {this.props.t("Submit")}
                    </Button>,
                ]}
            >
                {[''].map(() => {
                    if (showTab.length === 1) {
                        return contentList[showTab[0]]
                    } else {
                        return (
                            <Tabs key="tabs" defaultActiveKey={showTab[0]}>
                                {
                                    showTab.map((v) => {
                                        return (
                                            <Tabs.TabPane tab={tabList[v]} key={v}>
                                                {contentList[v]}
                                            </Tabs.TabPane>
                                        )
                                    })
                                }
                            </Tabs>
                        )
                    }
                })}
            </Modal>
        )
    }
}

export default withTranslation()(UserInfo)