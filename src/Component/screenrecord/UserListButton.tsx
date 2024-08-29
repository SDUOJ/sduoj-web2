import React, { useState } from 'react';
import { Button, message, Modal, Space, Table } from 'antd';
import mApi from "Utils/API/m-api";

interface VideoListProps {
  psid: number;
  token: string;
  onRefresh: () => void;
}

const UserListButton: React.FC<VideoListProps> = ({ psid, onRefresh}) => {
  const [videoList, setVideoList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchVideoList = async () => {
    setLoading(true);
    try {
        const data = await mApi.getVideoList({ bs_id: psid });
        // 假设响应格式是 { data: any[] }
        if (data && Array.isArray(data)) {
            setVideoList(data);
            setIsModalVisible(true); // 显示模态框
        } else {
            // 如果响应格式不正确或数据不是数组，则抛出错误
            throw new Error('Invalid data format or data is not an array');
        }
    } finally {
        setLoading(false);
    }
  };

  const handleDownload = async (record: any) => {
  try {
    const response = await fetch(`http://api2.test.sduoj.com:8000/screen_record/getVideo?token=${encodeURIComponent(record.token)}`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch video, status: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // 修改视频文件名为 用户名_开始时间.mp4
    const videoName = `${record.u_name}_${record.start_time.replace(/:/g, '-')}.mp4`;
    link.setAttribute('download', videoName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    message.success('视频下载成功');
  } catch (error: any) {
    message.error(`视频下载失败: ${error.message}`);
  }
};

  const handleDelete = async (token: string) => {
    await mApi.deleteVideo({token:token});
    message.success('视频删除成功');
    setVideoList(videoList.filter((video) => video.token !== token));
  };

  const handleDeleteAll = async () => {
    await mApi.deleteAll({ bs_id: psid });
    message.success('所有视频记录删除成功');
    setVideoList([]);
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'u_name',
      key: 'u_name',
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
    },
    {
      title: '最后修改时间',
      dataIndex: 'modify_time',
      key: 'modify_time',
    },
    {
      title: '操作',
      key: 'action',
      render: (text: any, record: any) => (
        <Space size="middle">
          <Button onClick={() => handleDownload(record)}>下载</Button>
          <Button onClick={() => handleDelete(record.token)}>删除</Button>
        </Space>
      ),
    },
  ];

  const handleOk = () => {
    setIsModalVisible(false);
    onRefresh();
  };

  const modalFooter = (
    <Button type="primary" onClick={handleOk}>
      确定
    </Button>
  );

  return (
    <>
      <Button type="primary" onClick={fetchVideoList}>
        查看视频记录
      </Button>
      {loading && <div>加载中...</div>}
      <Modal
        title={
          <div>
            视频记录
            <Button
              style={{ float: 'right' }}
              onClick={handleDeleteAll}
            >
              删除所有视频
            </Button>
          </div>
        }
        visible={isModalVisible}
        onOk={handleOk}
        width={1000}
        closable={false}
        footer={modalFooter}
      >
        <Table
          columns={columns}
          dataSource={videoList}
          rowKey={(record) => record.u_id}
          pagination={false}
          bordered
        />
      </Modal>
    </>
  );
};

export default UserListButton;