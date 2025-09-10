import React from 'react';
import {Button, Divider, Dropdown, Menu, Space} from 'antd';
import {DownOutlined, LogoutOutlined, RightOutlined, UserOutlined} from '@ant-design/icons';
import judgeAuth from '../../Utils/judgeAhtu';
import UserAvatar from '../user/Avatar';
import {useTranslation} from 'react-i18next';

export interface UserAccountDropdownProps {
  isLogin: boolean;
  username?: string;
  realName?: string;
  sduId?: string;
  email?: string;
  roles?: string[];
  mode?: 'exam' | 'console' | 'manage';
  onLogout?: () => void;
  onToManage?: () => void;
  onToProfile?: () => void;
  onBackToOJ?: () => void; // 新增：管理端返回主站
  height?: number;
}

const UserAccountDropdown: React.FC<UserAccountDropdownProps> = (props) => {
  const {t} = useTranslation();
  if (!props.isLogin) return null;
  const h = props.height || 64;
  // 仅当提供 onToManage 回调且拥有权限时显示 "toManage"
  const showManage = props.mode !== 'exam' && props.onToManage && props.roles && judgeAuth(props.roles as any, ['admin', 'superadmin']);
  const showProfile = props.mode !== 'exam';

  const items: any[] = [];
  if (props.onBackToOJ) items.push({key: 'backToOJ', icon: <RightOutlined/>, label: t('backToOJ'), onClick: props.onBackToOJ});
  if (showManage) items.push({key: 'toManage', icon: <RightOutlined/>, label: t('toManage'), onClick: props.onToManage});
  if (showProfile) items.push({key: 'profile', icon: <UserOutlined/>, label: t('Profile'), onClick: props.onToProfile});
  items.push({key: 'logout', icon: <LogoutOutlined/>, label: t('Logout'), onClick: props.onLogout});

  const examTrigger = (
    <Space size={8} align="center">
      <span style={{display: 'flex', alignItems: 'center'}}>
        {props.realName || props.username}
        <Divider type="vertical" style={{margin: '0 8px'}}/>
        {props.sduId}
      </span>
      <DownOutlined style={{fontSize: 10}}/>
    </Space>
  );

  const consoleTrigger = (
    <Space size={8} align="center">
      <span style={{display: 'flex', alignItems: 'center'}}>
        <UserAvatar email={props.email}/>
        <Divider type="vertical" style={{margin: '0 8px'}}/>
        {props.username || props.realName}
      </span>
      <DownOutlined style={{fontSize: 10}}/>
    </Space>
  );

  return (
  <Dropdown menu={{items}}>
      <Button type="text" size="large" style={{display: 'flex', alignItems: 'center', height: h, padding: '0 8px'}}>
        {props.mode === 'exam' ? examTrigger : consoleTrigger}
      </Button>
    </Dropdown>
  );
};

export default UserAccountDropdown;
