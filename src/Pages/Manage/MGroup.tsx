import React from 'react';
import { Card, Space } from 'antd';
import MApi from '../../Utils/API/m-api';
import mApi from '../../Utils/API/m-api';
import { useTranslation } from 'react-i18next';
import { unix2Time } from '../../Utils/Time';
import TableWithPagination from '../../Component/common/Table/TableWithPagination';
import ModalFormUseForm from '../../Component/common/Form/ModalFormUseForm';
import GroupFormProfile from '../../Component/group/Form/Item/GroupFormProfile';
import GroupMember from '../../Component/group/GroupMember';

const MGroup = () => {
  const { t } = useTranslation();

  const colData: any[] = [
    {
      title: 'ID',
      dataIndex: 'groupId',
      width: 50,
      responsive: ['lg', 'sm', 'xs'],
    },
    {
      title: t('title'),
      dataIndex: 'title',
      width: 'auto',
      responsive: ['lg', 'sm', 'xs'],
    },
    {
      title: t('Description'),
      dataIndex: 'description',
      width: 'auto',
      responsive: ['lg', 'sm'],
    },
    {
      title: t('CreateTime'),
      dataIndex: 'gmtCreate',
      width: '170px',
      responsive: ['lg'],
      render: (text: any) => {
        return unix2Time(text);
      },
    },
    {
      title: t('Owner'),
      width: 'auto',
      responsive: ['lg'],
      render: (text: any, row: any) => {
        return row.owner.username + '(' + row.owner.nickname + ')';
      },
    },
    {
      title: t('Openness'),
      dataIndex: 'openness',
      width: 'auto',
      responsive: ['lg'],
      render: (text: any) => {
        const map = [t('openness.public'), t('openness.apply'), t('openness.private')];
        return map[text];
      },
    },
    {
      title: t('MemberCount'),
      width: 'auto',
      dataIndex: 'memberNum',
      responsive: ['lg'],
    },
    {
      title: t('operator'),
      width: '150px',
      render: (text: any, rows: any) => {
        return (
          <Space>
            <ModalFormUseForm
              TableName={'GroupList'}
              width={1200}
              title={rows.title}
              type={'update'}
              subForm={[{ component: <GroupFormProfile /> }]}
              dataLoader={async () => mApi.getGroupDetail({ groupId: rows.groupId })}
              updateAppendProps={{ groupId: rows.groupId }}
              dataSubmitter={(value: any) => {
                return mApi.updateGroup(value);
              }}
            />
            <GroupMember
              btnName={t('memberManagement')}
              btnType={'link'}
              width={1200}
              title={t('membersInGroup', { title: rows.title, id: rows.groupId })}
              initData={rows}
              groupId={rows.groupId}
            />
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ marginTop: -20, overflow: 'hidden' }}>
      <Card
        size={'small'}
        bordered={true}
        title={t('groupList')}
        extra={
          <Space>
            <ModalFormUseForm
              TableName={'GroupList'}
              width={1200}
              title={t('createGroup')}
              type={'create'}
              subForm={[{ component: <GroupFormProfile />, label: '' }]}
              dataSubmitter={(value: any) => {
                return mApi.createGroup(value);
              }}
            />
          </Space>
        }
      >
        <TableWithPagination
          name={'GroupList'}
          columns={colData}
          disableSelection={true}
          API={MApi.getGroupList}
          size={'small'}
          rowKey={'groupId'}
        />
      </Card>
    </div>
  );
};

export default MGroup;
