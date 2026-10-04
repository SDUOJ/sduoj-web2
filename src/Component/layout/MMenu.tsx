import React, { useEffect, useState } from 'react';
import { Menu, MenuProps } from 'antd';
import { Link, matchPath, RouteComponentProps, withRouter } from 'react-router-dom';
import { IUserPropRoles } from '../../Type/Iuser';
import { withTranslation } from 'react-i18next';
import { routerM } from '../../Config/router/routerM';
import { IRouter } from '../../Config/router/router';

// interface IMenuState {
//     selectedKey: string
// }

const MMenu = (props: IUserPropRoles & RouteComponentProps) => {
  const [selectedKey, setSelectedKey] = useState<string[]>([]);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  useEffect(() => {
    const select: string[] = [];
    const opened: string[] = [];
    let leaf: string | undefined;
    const find = (router: IRouter[], parentMatched = false) => {
      router.forEach((item) => {
        const matched =
          matchPath(props.location.pathname, { path: item.path, exact: false }) !== null;
        if (!matched && !parentMatched) return;
        const key = item.id.toString();
        if (item.children !== undefined) {
          opened.push(key);
          find(item.children, matched || parentMatched);
        } else if (matched) {
          leaf = key;
        }
      });
    };
    find(routerM);
    if (leaf !== undefined) select.push(leaf);
    setSelectedKey(select);
    setOpenKeys(opened);
  }, [props.location.pathname]);

  const buildItems = (menuList: IRouter[]): MenuProps['items'] =>
    menuList.map((r) => ({
      key: r.id,
      icon: r.icon,
      label:
        r.children === undefined ? (
          <Link to={r.path}>{props.t(r.title_i18n)}</Link>
        ) : (
          props.t(r.title_i18n)
        ),
      children: r.children ? buildItems(r.children) : undefined,
    }));

  return (
    <>
      <div>
        {/*显示目录结构*/}
        <Menu
          selectedKeys={selectedKey}
          openKeys={openKeys}
          onOpenChange={(openKeys: string[]) => {
            setOpenKeys(openKeys);
          }}
          mode="inline"
          theme="dark"
          items={buildItems(routerM)}
        />
      </div>
    </>
  );
};

export default withTranslation()(withRouter(MMenu));
