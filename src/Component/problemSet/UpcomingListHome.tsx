import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, List, Space, Spin, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FieldTimeOutlined, RocketOutlined } from '@ant-design/icons';
import cApi from '../../Utils/API/c-api';
import dayjs from 'dayjs';
import { UrlPrefix } from '../../Config/constValue';
import { mergeQuickEntries, QuickEntries, QuickEntry } from '../../Type/quickEntry';
import { useAppSelector } from '../../Redux/Store/hooks';

const PAGE_SIZE = 5;

function EntryItem({ entry, now }: { entry: QuickEntry; now: number }) {
  const { t } = useTranslation();
  const upcoming = Number(entry.startTime) > now;
  const target = upcoming ? Number(entry.startTime) : Number(entry.endTime);
  const minutes = Math.max(0, Math.ceil((target - now) / 60000));
  const duration = t('quickEntries.duration', {
    days: Math.floor(minutes / 1440),
    hours: Math.floor((minutes % 1440) / 60),
    minutes: minutes % 60,
  });
  const start = dayjs(Number(entry.startTime));
  const href =
    entry.type === 'contest'
      ? `${UrlPrefix}/contest/${entry.id}`
      : `${UrlPrefix}/problemSet/${entry.id}/overview`;
  return (
    <List.Item>
      <List.Item.Meta
        avatar={
          <div style={{ textAlign: 'center', minWidth: 52 }}>
            <div style={{ fontSize: 22 }}>{start.format('DD')}</div>
            <div style={{ color: '#888', fontSize: 12 }}>{start.format('YYYY-MM')}</div>
          </div>
        }
        title={
          <Space size={[6, 6]} wrap>
            <Link to={href}>{entry.title}</Link>
            <Tag color={entry.type === 'contest' ? 'purple' : 'cyan'}>
              {t(entry.type === 'contest' ? 'contest' : 'problemSet')}
            </Tag>
            <Tag color={upcoming ? 'blue' : 'orange'}>{t(upcoming ? 'upcoming' : 'running')}</Tag>
            {entry.tag && <Tag>{entry.tag}</Tag>}
          </Space>
        }
        description={
          <Space size={[8, 4]} wrap>
            {entry.groupTitle && <Tag>{entry.groupTitle}</Tag>}
            <span
              title={`${start.format('YYYY-MM-DD HH:mm')} – ${dayjs(Number(entry.endTime)).format('YYYY-MM-DD HH:mm')}`}
            >
              <FieldTimeOutlined />{' '}
              {t(upcoming ? 'quickEntries.startsIn' : 'quickEntries.endsIn', { duration })}
            </span>
          </Space>
        }
      />
    </List.Item>
  );
}

export default function UpcomingListHome() {
  const { t } = useTranslation();
  const username = useAppSelector((state) => state.UserReducer.userInfo?.username);
  const authStatus = useAppSelector((state) => state.UserReducer.authStatus);
  const [sources, setSources] = useState<QuickEntries[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [pageRun, setPageRun] = useState(1);
  const [pageUp, setPageUp] = useState(1);
  const [now, setNow] = useState(Date.now());
  const entries = useMemo(() => mergeQuickEntries(sources, now), [sources, now]);

  useEffect(() => {
    let active = true;
    let inFlight = false;
    setSources([]);
    setLoading(true);
    setFailed(false);
    setPageRun(1);
    setPageUp(1);
    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      const results = await Promise.allSettled([
        cApi.getContestQuickEntries(),
        cApi.getProblemSetQuickEntries(),
      ]);
      inFlight = false;
      if (!active) return;
      setSources(
        results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : [])),
      );
      setFailed(results.some((result) => result.status === 'rejected'));
      setLoading(false);
      setNow(Date.now());
    };
    void load();
    const timer = setInterval(() => {
      setNow(Date.now());
      void load();
    }, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [username, authStatus, retry]);

  const section = (
    bucket: 'running' | 'upcoming',
    page: number,
    setPage: (page: number) => void,
  ) => {
    const items = entries[bucket];
    if (!items.length) return null;
    const current = Math.min(page, Math.max(1, Math.ceil(items.length / PAGE_SIZE)));
    return (
      <section aria-label={t(bucket)}>
        <div style={{ fontWeight: 600, margin: '12px 0 8px' }}>{t(bucket)}</div>
        <List
          rowKey={(entry) => `${entry.type}:${entry.id}`}
          dataSource={items.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)}
          renderItem={(entry) => <EntryItem entry={entry} now={now} />}
          pagination={{
            current,
            pageSize: PAGE_SIZE,
            onChange: setPage,
            total: items.length,
            showSizeChanger: false,
            size: 'small',
            showLessItems: true,
            hideOnSinglePage: true,
          }}
        />
      </section>
    );
  };
  return (
    <Card
      title={
        <span>
          <RocketOutlined style={{ marginRight: 6 }} />
          {t('QuickEntry')}
        </span>
      }
      size="small"
      style={{ height: '100%' }}
    >
      {failed && (
        <Alert
          type="warning"
          showIcon
          message={t('quickEntries.loadFailed')}
          action={
            <Button size="small" onClick={() => setRetry((value) => value + 1)}>
              {t('Retry')}
            </Button>
          }
        />
      )}
      {loading && (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Spin />
        </div>
      )}
      {!loading && !failed && !entries.running.length && !entries.upcoming.length && (
        <Empty description={t('notAvailable')} />
      )}
      {section('running', pageRun, setPageRun)}
      {section('upcoming', pageUp, setPageUp)}
    </Card>
  );
}
