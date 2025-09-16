import React, {useEffect, useMemo, useState} from 'react'
import {Card, Divider, Empty, List, Space, Tag} from 'antd'
import {withTranslation} from 'react-i18next'
import {withRouter} from 'react-router-dom'
import {FieldTimeOutlined, RocketOutlined} from '@ant-design/icons'
import cApi from '../../Utils/API/c-api'
import dayjs from 'dayjs'
import {TimeRangeState} from '../../Utils/Time'
import {UrlPrefix} from '../../Config/constValue'

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

const PAGE_SIZE = 5 // 首页每段默认 5 条

// 将分组数据拍平成题单级列表（保留组标题用于展示）
function flatten(list: GroupCard[]): Array<ProblemSetCard & { groupTitle?: string | null }> {
  const res: Array<ProblemSetCard & { groupTitle?: string | null }> = []
  list.forEach(g => {
    g.problemSets.forEach(ps => res.push({...ps, groupTitle: g.groupTitle}))
  })
  return res
}

function StatusTag({st, ed, t}: { st: string | null, ed: string | null, t: any }) {
  if (!st || !ed) return null
  const state = TimeRangeState(st, ed)
  if (state === 'running') return <Tag color="orange">{t('running') || 'Running'}</Tag>
  if (state === 'wait') return <Tag color="blue">{t('upcoming') || 'Upcoming'}</Tag>
  return <Tag color="green">{t('end') || 'End'}</Tag>
}

function PsItem({ps, t, onJump, now, isZh}: { ps: ProblemSetCard & { groupTitle?: string | null }, t: any, onJump: (psid: number)=>void, now: number, isZh: boolean }) {
  const st = ps.startTime ? dayjs(+ps.startTime) : null
  const ed = ps.endTime ? dayjs(+ps.endTime) : null
  const timeLeft = (() => {
    if (!ps.endTime) return null
    const end = +ps.endTime
    if (end <= now) return null
    // minute precision
    let diff = Math.floor((end - now) / 1000)
    const dd = Math.floor(diff / (3600 * 24)); diff -= dd * 3600 * 24
    const hh = Math.floor(diff / 3600); diff -= hh * 3600
    const mm = Math.floor(diff / 60)
    const parts: string[] = []
    const uD = isZh ? '天' : 'd'
    const uH = isZh ? '时' : 'h'
    const uM = isZh ? '分' : 'm'
    if (dd) parts.push(dd + uD)
    if (hh) parts.push(hh + uH)
    parts.push(mm + uM)
    return parts.join('')
  })()
  return (
    <List.Item key={ps.psid}>
      <List.Item.Meta
        avatar={
          <div>
            <div style={{textAlign: 'center', fontSize: 22}}>{st ? st.format('DD') : '—'}</div>
            <div style={{color: '#aaa', fontSize: 12, textAlign: 'center'}}>{st ? st.format('YYYY-MM') : ''}</div>
          </div>
        }
        title={
          <>
            <a onClick={() => onJump(ps.psid)}>{ps.name}</a>
            <Space size={8} style={{marginLeft: 8}}>
              <StatusTag st={ps.startTime} ed={ps.endTime} t={t} />
              {ps.tag && <Tag>{ps.tag}</Tag>}
            </Space>
          </>
        }
        description={
          <Space size={8} wrap>
            {ps.groupTitle && <Tag color="default">{ps.groupTitle}</Tag>}
            {timeLeft && (
              <>
                <Divider type="vertical" />
                <span><FieldTimeOutlined /> {timeLeft}</span>
              </>
            )}
          </Space>
        }
      />
    </List.Item>
  )
}

function UpcomingListHomeBase(props: any) {
  const {t} = props
  const [loading, setLoading] = useState(true)
  const [resp, setResp] = useState<UpcomingResp>({running: [], upcoming: []})
  const [pageRun, setPageRun] = useState(1)
  const [pageUp, setPageUp] = useState(1)
  const [now, setNow] = useState(Date.now())
  const isZh = props.i18n?.language ? String(props.i18n.language).startsWith('zh') : true

  const runList = useMemo(() => flatten(resp.running || []), [resp])
  const upList = useMemo(() => flatten(resp.upcoming || []), [resp])
  const runPageData = useMemo(() => runList.slice((pageRun - 1) * PAGE_SIZE, pageRun * PAGE_SIZE), [runList, pageRun])
  const upPageData = useMemo(() => upList.slice((pageUp - 1) * PAGE_SIZE, pageUp * PAGE_SIZE), [upList, pageUp])

  const load = async () => {
    setLoading(true)
    try {
      const data = await cApi.getUpcomingProblemSet() as any
      setResp(data as UpcomingResp)
    } catch (e) {
      console.log('load upcoming(home) failed', e)
      setResp({running: [], upcoming: []})
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(id)
  }, [])

  const hasRun = runList.length > 0
  const hasUp = upList.length > 0

  return (
    <Card
      title={<span><RocketOutlined style={{marginRight: 6}}/>{t('QuickEntry') || t('quickEntry') || '快速入口'}</span>}
      size="small"
      style={{height: '100%'}}
    >
      {(!hasRun && !hasUp && !loading) && (
        <div style={{padding: 16, textAlign: 'center'}}>
          <Empty description={t('notAvailable') || '暂无'}/>
        </div>
      )}

      {hasRun && (
        <>
          <div style={{fontWeight: 600, margin: '4px 0 8px'}}>{t('running') || 'Running'}</div>
          <List
            loading={loading}
            dataSource={runPageData}
            renderItem={(ps) => <PsItem ps={ps} t={t} now={now} isZh={isZh} onJump={(psid)=>props.history.push(UrlPrefix + `/problemSet/${psid}/overview`)}/>} 
            pagination={{
              current: pageRun,
              pageSize: PAGE_SIZE,
              onChange: setPageRun,
              total: runList.length,
              showSizeChanger: false,
              size: 'small',
              showLessItems: true,
              hideOnSinglePage: true
            }}
          />
        </>
      )}

      {hasUp && (
        <>
          <div style={{fontWeight: 600, margin: '12px 0 8px'}}>{t('upcoming') || t('Upcoming') || 'Upcoming'}</div>
          <List
            loading={loading}
            dataSource={upPageData}
            renderItem={(ps) => <PsItem ps={ps} t={t} now={now} isZh={isZh} onJump={(psid)=>props.history.push(UrlPrefix + `/problemSet/${psid}/overview`)}/>} 
            pagination={{
              current: pageUp,
              pageSize: PAGE_SIZE,
              onChange: setPageUp,
              total: upList.length,
              showSizeChanger: false,
              size: 'small',
              showLessItems: true,
              hideOnSinglePage: true
            }}
          />
        </>
      )}
    </Card>
  )
}

const UpcomingListHome = withTranslation()(withRouter(UpcomingListHomeBase))
export default UpcomingListHome
