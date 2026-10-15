import { useEffect, useState } from 'react';
import { Alert, Card, Col, Row, Space, Statistic, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { OpsMetrics } from '../../Type/globalSubmissions';
import mApi from '../../Utils/API/m-api';
import { unix2Time } from '../../Utils/Time';
function Trend({
  title,
  points,
}: {
  title: string;
  points: { time: number; value: number | null }[];
}) {
  const values = points.flatMap((point) => (point.value === null ? [] : [point.value]));
  const max = Math.max(1, ...values);
  const count = Math.max(1, points.length - 1);
  let path = '';
  let connected = false;
  points.forEach((point, index) => {
    if (point.value === null) {
      connected = false;
      return;
    }
    path += `${connected ? 'L' : 'M'}${46 + (index / count) * 574},${138 - (point.value / max) * 110} `;
    connected = true;
  });
  const time = (value: number) =>
    new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return (
    <Card size="small" title={title}>
      <svg
        role="img"
        aria-label={title}
        viewBox="0 0 650 170"
        style={{ width: '100%', maxHeight: 220 }}
      >
        <title>{title}</title>
        <path d="M46 25V138H620" fill="none" stroke="currentColor" opacity=".25" />
        <text x="6" y="32" fill="currentColor" fontSize="12">
          {max}
        </text>
        <text x="24" y="142" fill="currentColor" fontSize="12">
          0
        </text>
        <path d={path} fill="none" stroke="#1677ff" strokeWidth="2" />
        {points.map((point, index) =>
          point.value === null ? null : (
            <circle
              key={point.time}
              cx={46 + (index / count) * 574}
              cy={138 - (point.value / max) * 110}
              r="3"
              fill="#1677ff"
            >
              <title>
                {time(point.time)} · {point.value}
              </title>
            </circle>
          ),
        )}
        {points.length > 0 && (
          <>
            <text x="46" y="162" fill="currentColor" fontSize="12">
              {time(points[0].time)}
            </text>
            <text x="620" y="162" textAnchor="end" fill="currentColor" fontSize="12">
              {time(points[points.length - 1].time)}
            </text>
          </>
        )}
      </svg>
    </Card>
  );
}
export default function OpsMetricsPanel({ auto, revision }: { auto: boolean; revision: number }) {
  const { t } = useTranslation();
  const [data, setData] = useState<OpsMetrics>();
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    let failures = 0;
    let timer: ReturnType<typeof setTimeout>;
    const abort = new AbortController();
    const poll = async () => {
      try {
        const value = await mApi.opsMetrics(abort.signal);
        if (!active) return;
        setData(value);
        setError(false);
        failures = 0;
      } catch {
        if (active) {
          setError(true);
          failures++;
        }
      }
      if (active && auto) timer = setTimeout(poll, Math.min(60000, 10000 * 2 ** failures));
    };
    void poll();
    return () => {
      active = false;
      abort.abort();
      clearTimeout(timer);
    };
  }, [auto, revision]);
  const value = (input: number | string | null | undefined, precision = 0) =>
    input == null ? t('globalSubmissions.metrics.unknown') : Number(input).toFixed(precision);
  const metrics = [
    ['online', data?.judgerOnline, 0],
    ['queue', data?.queueDepth, 0],
    ['throughput', data?.metricsAvailable ? data.throughputPerMin : null, 1],
    ['avgWait', data?.metricsAvailable ? data.avgWaitMs : null, 1],
    ['p95Wait', data?.metricsAvailable ? data.p95WaitMs : null, 0],
  ] as const;
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Typography.Text strong>{t('globalSubmissions.metrics.title')}</Typography.Text>
      {error && <Alert type="warning" message={t('globalSubmissions.metrics.connectionError')} />}
      <Row gutter={[12, 12]}>
        {metrics.map(([key, number, precision]) => (
          <Col key={key} xs={12} md={8} xl={4}>
            <Card size="small">
              <Statistic
                title={t(`globalSubmissions.metrics.${key}`)}
                value={value(number, precision)}
                precision={precision}
                groupSeparator=""
              />
            </Card>
          </Col>
        ))}
      </Row>
      <Typography.Text type="secondary">
        {t('globalSubmissions.metrics.definition')}
        {data &&
          ` · ${t('globalSubmissions.metrics.updated')}: ${unix2Time(data.timestamp)} · ${t('globalSubmissions.metrics.samples')}: ${data.waitSampleCount}`}
      </Typography.Text>
      {data?.metricsAvailable ? (
        <Row gutter={[12, 12]}>
          <Col xs={24} lg={12}>
            <Trend
              title={t('globalSubmissions.metrics.completedTrend')}
              points={data.series.map((point) => ({
                time: Number(point.timestamp),
                value: point.completed == null ? null : Number(point.completed),
              }))}
            />
          </Col>
          <Col xs={24} lg={12}>
            <Trend
              title={t('globalSubmissions.metrics.queueTrend')}
              points={data.series.map((point) => ({
                time: Number(point.timestamp),
                value: point.queueDepth == null ? null : Number(point.queueDepth),
              }))}
            />
          </Col>
        </Row>
      ) : (
        <Typography.Text type="secondary">
          {t('globalSubmissions.metrics.noSeries')}
        </Typography.Text>
      )}
    </Space>
  );
}
