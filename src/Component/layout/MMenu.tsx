import React, {useEffect, useState} from "react";
import {Menu} from 'antd';
import {Link, RouteComponentProps, withRouter} from "react-router-dom";
import {IUserPropRoles} from "../../Type/Iuser";
import {withTranslation} from "react-i18next";
import {routerM} from "../../Config/router/routerM";

interface IMenuState {
    selectedKey: string
}

const MMenu = (props: IUserPropRoles & RouteComponentProps) => {


    const [selectedKey, setSelectedKey] = useState<any[]>([])


    useEffect(() => {
        let select: any[] = []
        const find = (router:any)=>{
            for (let i = 0; i < router.length; i++) {
                if (RegExp(router[i].path).exec(props.location.pathname) !== null) {
                    select.push(router[i].id.toString())
                    if(router[i].children !== undefined){
                        find(router[i].children)
                    }
                }
            }
        }
        find(routerM)
        setSelectedKey(select)
    }, [props.location.pathname])

    const geneMenu = (menuList: any[]) => {
        return menuList.map((r, i) => {
            if (r.children === undefined) {
                return (
                    <Menu.Item key={r.id} icon={r.icon}>
                        <Link to={r.path}>{props.t(r.title_i18n)}</Link>
                    </Menu.Item>
                )
            } else {
                return (
                    <Menu.SubMenu title={props.t(r.title_i18n)} icon={r.icon} key={r.id}>
                        {geneMenu(r.children)}
                    </Menu.SubMenu>
                )
            }
        })
    }

    return (
        <>
            <div>
                {/*显示目录结构*/}
                <Menu
                    selectedKeys={selectedKey}
                    openKeys={selectedKey}
                    onOpenChange={(openKeys: string[])=>{
                        setSelectedKey([...selectedKey, ...openKeys])
                    }}
                    mode="inline"
                    theme="dark"
                >
                    {geneMenu(routerM)}
                </Menu>
            </div>
        </>
    )
}

export default withTranslation()(withRouter(MMenu))
