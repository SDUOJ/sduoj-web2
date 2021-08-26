import React, {Component} from "react";
import {Menu} from 'antd';
import {routerM} from "../../Config/router";
import {Link, RouteComponentProps, withRouter} from "react-router-dom";
import {IUserPropRoles} from "../user/Iuser";
import {withTranslation} from "react-i18next";

interface IMenuState {
    selectedKey: string
}

class MMenu extends Component<IUserPropRoles & RouteComponentProps, IMenuState> {


    constructor(props: IUserPropRoles & RouteComponentProps, context: any) {
        super(props, context);
        this.state = {selectedKey: '1'}
    }

    componentDidMount() {
        if (this.props.location.pathname === '/' && routerM.length !== 0) {
            this.props.history.replace(routerM[0].path);
        }
        for (let i = 0; i < routerM.length; i++) {
            if (this.props.location.pathname === routerM[i].path) {
                if (this.state.selectedKey !== i.toString()) {
                    this.setState({
                        selectedKey: i.toString()
                    })
                }
            }
        }
    }

    componentDidUpdate(prevProps: Readonly<IUserPropRoles & RouteComponentProps>, prevState: Readonly<IMenuState>, snapshot?: any) {
        for (let i = 0; i < routerM.length; i++) {
            if (this.props.location.pathname === routerM[i].path) {
                if (this.state.selectedKey !== i.toString()) {
                    this.setState({
                        selectedKey: i.toString()
                    })
                }
            }
        }
    }

    render() {
        return (
            <>
                <div>
                    {/*显示目录结构*/}
                    <Menu
                        selectedKeys={[this.state.selectedKey]}
                        mode="inline"
                        theme="dark"
                    >
                        {
                            routerM.map((r, i) => {
                                return (
                                    <Menu.Item key={r.id} icon={r.icon}>
                                        <Link to={r.path}>{this.props.t(r.title_i18n)}</Link>
                                    </Menu.Item>
                                )

                            })
                        }
                    </Menu>
                </div>
            </>
        )
    }
}

export default withTranslation()(withRouter(MMenu))