import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Card, Table, Tag, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { aiPlatform, PlatformJob } from '../../../Utils/API/ai-platform';
import AITaskMonitor from './AITaskMonitor';
import { positiveIntParam } from './route-context';
import AIWorkspaceNav from './AIWorkspaceNav';

export default function AIOperations({ location }: { location?: { search?: string } }) {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<PlatformJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [task, setTask] = useState<string>();
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const psid = positiveIntParam(location?.search, 'psid');
  useEffect(() => {
    let active = true;
    aiPlatform
      .jobs(page, undefined, psid)
      .then((value) => {
        if (active) {
          setJobs(value.rows);
          setTotal(value.totalNum);
          setError('');
        }
      })
      .catch((reason) => {
        if (active) setError(String(reason));
      });
    return () => {
      active = false;
    };
  }, [page, psid, revision]);
  return (
    <>
      <AIWorkspaceNav />
      <Typography.Title level={3}>{t('aiOperationsTitle')}</Typography.Title>
      <Card
        size="small"
        title={t('aiOperationsManagement')}
        extra={
          <Button
            aria-label={t('aiOperationsRefresh')}
            icon={<ReloadOutlined />}
            onClick={() => setRevision(revision + 1)}
          />
        }
      >
        {error && <Alert type="error" showIcon message={error} />}
        <Table<PlatformJob>
          size="small"
          rowKey="id"
          dataSource={jobs}
          scroll={{ x: 720 }}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            showSizeChanger: false,
            onChange: setPage,
          }}
          columns={[
            { title: t('aiOperationsTask'), dataIndex: 'id', ellipsis: true },
            { title: t('aiOperationsCategory'), dataIndex: 'task_type' },
            { title: t('aiOperationsStatus'), render: (_, row) => <Tag>{row.status}</Tag> },
            { title: t('aiOperationsAttempts'), dataIndex: 'attempt', width: 80 },
            {
              title: t('aiOperationsActions'),
              render: (_, row) => (
                <Button type="link" onClick={() => setTask(row.id)}>
                  {t('aiOperationsView')}
                </Button>
              ),
            },
          ]}
        />
        {task && <AITaskMonitor taskId={task} />}
      </Card>
    </>
  );
}
