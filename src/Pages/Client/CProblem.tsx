import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Space, Tag } from 'antd';
import CApi from 'Utils/API/c-api';
import TableWithPagination from '../../Component/common/Table/TableWithPagination';
import { CheckOutlined } from '@ant-design/icons';
import { UrlPrefix } from '../../Config/constValue';
import { useTranslation } from 'react-i18next';

const CProblem = () => {
  const { t } = useTranslation();
  const [ACList, setACList] = useState<string[]>([]);

  useEffect(() => {
    CApi.getACProblem()
      .then((res: any) => {
        setACList(Array.isArray(res) ? res : []);
      })
      .catch(() => {
        // Guests can browse the catalog without personal acceptance data.
      });
  }, []);

  return (
    <>
      <div style={{ textAlign: 'center', margin: '0 auto' }}>
        <div style={{ textAlign: 'left', maxWidth: '1500px', margin: '0 auto' }}>
          <Card title={t('ProblemList')}>
            <TableWithPagination
              API={CApi.getProblemList}
              columns={[
                {
                  title: t('problemCode'),
                  dataIndex: 'problemCode',
                  key: 'problemCode',
                  width: '120px',
                  render: (text: string) => {
                    let ps = text.split('-');
                    return (
                      <>
                        <span style={{ fontWeight: 'bold' }}>{ps[0]}</span>-<span>{ps[1]}</span>
                      </>
                    );
                  },
                },
                {
                  title: t('title'),
                  dataIndex: 'problemTitle',
                  key: 'problemTitle',
                  width: '300px',
                  render: (text: string, row: any) => {
                    return (
                      <>
                        <Space size={3}>
                          <Link
                            to={`${UrlPrefix}/problem/${encodeURIComponent(row.problemCode)}`}
                            className="table-title-link"
                          >
                            {text}
                          </Link>
                          {ACList.indexOf(row.problemCode) !== -1 && (
                            <CheckOutlined style={{ color: 'green' }} />
                          )}
                          {row.isPublic === 0 && <Tag color={'orange'}>{t('private')}</Tag>}
                        </Space>
                      </>
                    );
                  },
                },
                {
                  title: t('source'),
                  dataIndex: 'source',
                  key: 'source',
                  width: '450px',
                },
                {
                  title: t('acceptNumber'),
                  dataIndex: 'acceptNum',
                  key: 'acceptNum',
                  width: '120px',
                },
              ]}
              size={'small'}
              name={'C-ProblemList-Main'}
            />
          </Card>
        </div>
      </div>
    </>
  );
};

export default CProblem;
