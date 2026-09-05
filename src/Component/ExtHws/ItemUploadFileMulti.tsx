import { Button, Form } from 'antd';
import React, { useState } from 'react';
import Dragger from 'antd/lib/upload/Dragger';
import { DownloadOutlined, InboxOutlined, LoadingOutlined } from '@ant-design/icons';
import { fileUpload } from '../../Utils/fileUpload';
import { withTranslation } from 'react-i18next';

const ItemUploadFileMulti = (props: any) => {
  return (
    <>
      <Form.Item
        label={props.label ?? props.t('UploadFile')}
        name={props.name}
        rules={[{ required: props.required }]}
      >
        <UploadPro {...props} />
      </Form.Item>
    </>
  );
};

const UploadPro = (props: any) => {
  const { onChange } = props;

  const [, setData] = useState<any>([]);
  const [fileList, setFileList] = useState<any>([]);

  const [ban, setBan] = useState<boolean>(false);

  const toDataItem = (res: any) => {
    let nm: any = res.name.split('.');
    for (let i = 4; i < nm.length; i++) {
      nm[3] += '.' + nm[i];
    }
    return {
      file_id: res.id,
      username: nm[0],
      real_name: nm[1],
      create_time: nm[2],
      file_name: nm[3],
      cid: props.cid,
    };
  };

  return (
    <>
      <Dragger
        multiple={true}
        action=""
        listType="text"
        showUploadList={true}
        beforeUpload={(file, FileList) => {
          setFileList(FileList);
          return false;
        }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">{props.t('UploadDragAreaText')}</p>
        <p className="ant-upload-hint">{props.t('UploadExtHwsPresetHint')}</p>
      </Dragger>
      <Button
        block
        type={'primary'}
        style={{ marginTop: 24 }}
        disabled={ban}
        onClick={async () => {
          setData([]);
          onChange([]);
          setBan(true);
          try {
            const uploaded = await fileUpload(fileList);
            const nextData = uploaded.map(toDataItem);
            setData(nextData);
            onChange(nextData);
          } finally {
            setBan(false);
          }
        }}
        icon={ban ? <LoadingOutlined /> : <DownloadOutlined />}
      >
        {ban ? props.t('Uploading') : props.t('UploadFile')}
      </Button>
    </>
  );
};

export default withTranslation()(ItemUploadFileMulti);
