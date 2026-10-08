import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, List, Skeleton } from 'antd';

const count = 3;
const fakeDataUrl = `https://randomuser.me/api/?results=${count}&inc=name,gender,email,nat&noinfo`;

const CodeHistory = () => {
  const { t } = useTranslation();
  const [initLoading, setInitLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [list, setList] = useState<any[]>([]);

  const getData = useCallback((_callback: any) => {
    // placeholder — historical demo loader intentionally left empty
  }, []);

  useEffect(() => {
    getData((res: any) => {
      setInitLoading(false);
      setData(res.results);
      setList(res.results);
    });
  }, [getData]);

  const onLoadMore = () => {
    setLoading(true);
    setList([]);
    getData((res: any) => {
      const next = data.concat(res.results);
      setData(next);
      setList(next);
      setLoading(false);
      window.dispatchEvent(new Event('resize'));
    });
  };

  const loadMore =
    !initLoading && !loading ? (
      <div
        style={{
          textAlign: 'center',
          marginTop: 12,
          height: 32,
          lineHeight: '32px',
        }}
      >
        <Button onClick={onLoadMore}>loading more</Button>
      </div>
    ) : null;

  return (
    <>
      <List
        className="demo-loadmore-list"
        loading={initLoading}
        itemLayout="horizontal"
        loadMore={loadMore}
        dataSource={list}
        renderItem={(item) => (
          <List.Item
            actions={[
              <a key="list-loadmore-edit">edit</a>,
              <a key="list-loadmore-more">more</a>,
            ]}
          >
            <Skeleton avatar title={false} active>
              <List.Item.Meta
                avatar={
                  <Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />
                }
                title={<a href="https://ant.design">{}</a>}
                description="Ant Design, a design language for background applications, is refined by Ant UED Team"
              />
              <div>content</div>
            </Skeleton>
          </List.Item>
        )}
      />
    </>
  );
};

export default CodeHistory;
