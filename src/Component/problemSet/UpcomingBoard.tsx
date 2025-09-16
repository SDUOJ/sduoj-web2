import React, {useEffect, useMemo, useState} from 'react'
import {Card, Col, Empty, List, Row, Skeleton, Space, Tabs, Tag, Typography} from 'antd'
import {withTranslation} from 'react-i18next'
import cApi from '../../Utils/API/c-api'
import dayjs from 'dayjs'
import {ClockCircleOutlined, HourglassOutlined, ThunderboltOutlined} from '@ant-design/icons'
import {UrlPrefix} from '../../Config/constValue'

// Types based on backend contract in the user request
interface ProblemSetCard {
  psid: number
  name: string
  startTime: string | null
  endTime: string | null
  tag: string
}
interface GroupCard {
  groupId: number
  groupTitle: string | null
  problemSets: ProblemSetCard[]
}
interface UpcomingResp {
  running: GroupCard[]
  upcoming: GroupCard[]
}

const PAGE_SIZE = 5 // group-level pagination size

function PsTime({start, end}: { start: string | null, end: string | null }) {
  if (!start && !end) return null
  const s = start ? dayjs(+start).format('MM-DD HH:mm') : '—'
  const e = end ? dayjs(+end).format('MM-DD HH:mm') : '—'
  return <span>{s} ~ {e}</span>
}

function GroupList({data, loading, t}: { data: GroupCard[]; loading: boolean; t: any }) {
  const [page, setPage] = useState(1)
  const total = data?.length || 0
  const slice = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return data?.slice(start, start + PAGE_SIZE) || []
  }, [data, page])

  useEffect(() => {
    setPage(1)
  }, [total])

  if (loading) {
    return (
      <>
        {Array.from({length: 2}).map((_, i) => (
          <Card key={i} style={{marginBottom: 12}}><Skeleton active/></Card>
        ))}
      </>
    )
  }

  if (!total) return <Empty description={t('noData') || t('notAvailable') || 'No Data'}/>

  return (
    <List
      dataSource={slice}
      renderItem={(g) => (
        <List.Item>
          <Card title={<Space><ThunderboltOutlined/>{g.groupTitle || t('Group') || t('group') || 'Group'}</Space>} style={{width: '100%'}}>
            <List
              dataSource={g.problemSets}
              renderItem={(ps) => (
                <List.Item>
                  <Row style={{width: '100%'}} gutter={12} align="middle">
                    <Col flex={1}>
                      <Typography.Link href={`${UrlPrefix}/problemSet/${ps.psid}/overview`}>
                        {ps.name}
                      </Typography.Link>
                    </Col>
                    <Col>
                      <Space size={8}>
                        <Tag color="blue"><ClockCircleOutlined/> <PsTime start={ps.startTime} end={ps.endTime}/></Tag>
                        {ps.tag && <Tag color="geekblue"><HourglassOutlined/> {ps.tag}</Tag>}
                      </Space>
                    </Col>
                  </Row>
                </List.Item>
              )}
            />
          </Card>
        </List.Item>
      )}
      pagination={{
        pageSize: PAGE_SIZE,
        current: page,
        onChange: setPage,
        total
      }}
    />
  )
}

function UpcomingBoardBase(props: any) {
  const {t} = props
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<UpcomingResp>({running: [], upcoming: []})

  const load = async () => {
    setLoading(true)
    try {
  const res = await cApi.getUpcomingProblemSet() as any
  // backend returns data directly per request.ts success path
  setData(res as unknown as UpcomingResp)
    } catch (e) {
      // do not toast; log only
      console.log('load upcoming failed', e)
      setData({running: [], upcoming: []})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <Card title={t('Upcoming') || 'Upcoming'}
          extra={<Typography.Link onClick={load}>{t('refresh') || 'Refresh'}</Typography.Link>}
    >
      <Tabs
        items={[
          {key: 'running', label: t('Running') || t('running') || 'Running', children: <GroupList data={data.running} loading={loading} t={t}/>},
          {key: 'upcoming', label: t('Upcoming') || 'Upcoming', children: <GroupList data={data.upcoming} loading={loading} t={t}/>}
        ]}
      />
    </Card>
  )
}

const UpcomingBoard = withTranslation()(UpcomingBoardBase)
export default UpcomingBoard
