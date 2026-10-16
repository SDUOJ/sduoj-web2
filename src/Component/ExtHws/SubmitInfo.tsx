import { Alert, Button, Modal, Space, Tabs } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import cApi from 'Utils/API/c-api';
import extApi from 'Utils/API/ext-api';
import GroupUserListCard from '../common/GroupUserListCard';
import PackageDownload from './PackageDownload';

const SubmitInfo = (props: any) => {
  const [vis, setVis] = useState<boolean>(false);

  const [data, setData] = useState<{
    groupId: unknown;
    hid: unknown;
    groupInfo: any;
    submitInfo: any[];
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setData(null);
    setError('');
    if (vis && props.groupId !== undefined) {
      Promise.all([
        cApi.getGroupInfo({ groupId: props.groupId }),
        extApi.downloadHomework({ hid: props.hid }),
      ])
        .then(([groupInfo, submitInfo]) => {
          if (!Array.isArray(submitInfo)) throw new Error('Invalid homework submission response');
          if (active) setData({ groupId: props.groupId, hid: props.hid, groupInfo, submitInfo });
        })
        .catch((reason) => {
          if (active) setError(String(reason));
        });
    }
    return () => {
      active = false;
    };
  }, [props.groupId, props.hid, vis]);

  const details = useMemo(() => {
    if (vis && data && data.groupId === props.groupId && data.hid === props.hid) {
      let a: any = [],
        a0: any = [],
        a1: any = [],
        dn: any = [];
      let sbi: any = {};
      for (const x of data.submitInfo) {
        sbi[x['username']] = x;
      }
      for (const u of data.groupInfo.members) {
        if (sbi[u['username']] === undefined) {
          dn.push({ ...u });
        } else {
          a.push({ ...u, ...sbi[u['username']] });
          const before = parseInt(sbi[u['username']]['create_time']) <= parseInt(props.deadline);
          if (before) a0.push({ ...u, ...sbi[u['username']] });
          else a1.push({ ...u, ...sbi[u['username']] });
        }
      }
      return { already: a, already0: a0, already1: a1, did_not: dn };
    }
    return null;
  }, [data, props.deadline, props.groupId, props.hid, vis]);

  return (
    <>
      <Button
        type={'link'}
        size={'small'}
        onClick={() => {
          setVis(true);
        }}
      >
        {' '}
        提交详情{' '}
      </Button>
      <Modal
        title={props.title}
        open={vis}
        onCancel={() => {
          setVis(false);
        }}
        footer={
          <Space size={24}>
            {details && (
              <PackageDownload
                deadline={props.deadline}
                submitInfo={data?.submitInfo}
                filename={props.filename}
              />
            )}
            <Button onClick={() => setVis(false)}> 取消 </Button>
          </Space>
        }
        width={1200}
      >
        {error && <Alert type="error" showIcon message={error} />}
        {details && (
          <Tabs centered defaultActiveKey="item-1">
            <Tabs.TabPane tab="已提交-全部" key="item-1">
              <GroupUserListCard members={details.already} />
            </Tabs.TabPane>
            <Tabs.TabPane tab="已提交-按时" key="item-2">
              <GroupUserListCard members={details.already0} />
            </Tabs.TabPane>
            <Tabs.TabPane tab="已提交-延时" key="item-3">
              <GroupUserListCard members={details.already1} />
            </Tabs.TabPane>
            <Tabs.TabPane tab="未提交" key="item-4">
              <GroupUserListCard members={details.did_not} />
            </Tabs.TabPane>
          </Tabs>
        )}
      </Modal>
    </>
  );
};

export default SubmitInfo;
