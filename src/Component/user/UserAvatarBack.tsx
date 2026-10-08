import React from 'react';
import { Button, Divider, Dropdown, Menu, Space } from 'antd';
import { useHistory } from 'react-router-dom';
import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import UserAvatar from './Avatar';
import { UrlPrefix } from '../../Config/constValue';

interface UserAvatarBackProps {
  email?: string | null;
  username?: string;
}

const UserAvatarBack = (props: UserAvatarBackProps) => {
  const { t } = useTranslation();
  const history = useHistory();
  return (
    <>
      <Dropdown
        overlay={
          <Menu>
            <Menu.Item
              key="0"
              icon={<RightOutlined />}
              onClick={() => {
                history.push(UrlPrefix + '/');
              }}
            >
              {t('backToOJ')}
            </Menu.Item>
          </Menu>
        }
      >
        <Button type="text" size={'large'}>
          <Space>
            <div style={{ marginTop: -10 }}>
              {props.email !== null && props.email !== undefined && (
                <>
                  <UserAvatar email={props.email} />
                  <Divider type="vertical" />
                </>
              )}
              {props.username}
            </div>
            <DownOutlined style={{ fontSize: 10, marginBottom: 20 }} />
          </Space>
        </Button>
      </Dropdown>
    </>
  );
};

export default UserAvatarBack;
