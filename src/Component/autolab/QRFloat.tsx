import React, { useEffect, useRef, useState } from 'react';
import { Card, Spin, Button } from 'antd';
import QRCode from 'qrcode.react';
import dayjs from 'dayjs';
import useProblemSetInfo from '../problemSet/API/getProblemSetInfo';
import autolabApi from '../../Utils/API/autolab-api';

interface QRFloatProps {
  problemSetId: string;
  username: string;
}

const QRFloat: React.FC<QRFloatProps> = ({ problemSetId, username }) => {
  const info = useProblemSetInfo(problemSetId);
  const groupId = info?.groupId;
  const [loading, setLoading] = useState<boolean>(false);
  const [token, setToken] = useState<string | undefined>();
  const [signed, setSigned] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const refreshTimer = useRef<ReturnType<typeof setTimeout>>();
  const pollTimer = useRef<ReturnType<typeof setTimeout>>();
  const sessionIdRef = useRef(0);

  useEffect(() => {
    const sessionId = ++sessionIdRef.current;
    const isCurrent = () => sessionId === sessionIdRef.current;
    const clearTimers = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      if (pollTimer.current) clearTimeout(pollTimer.current);
      refreshTimer.current = undefined;
      pollTimer.current = undefined;
    };

    clearTimers();
    setLoading(false);
    setToken(undefined);
    setSigned(false);
    setVisible(false);
    setCollapsed(false);

    if (!problemSetId || !username || !groupId) return clearTimers;

    const gid = typeof groupId === 'string' ? parseInt(groupId, 10) : groupId;

    const refreshToken = async (activeSgId: number) => {
      try {
        const res: any = await autolabApi.generateToken(activeSgId, { username });
        if (isCurrent()) setToken(res?.token);
      } catch (error) {
        if (isCurrent()) setToken(undefined);
      } finally {
        if (isCurrent()) {
          refreshTimer.current = setTimeout(() => refreshToken(activeSgId), 30000);
        }
      }
    };

    const pollSignStatus = async (activeSgId: number) => {
      try {
        const attendance: any = await autolabApi.getAttendance(activeSgId);
        if (!isCurrent()) return;
        const students = Array.isArray(attendance?.students) ? attendance.students : [];
        const me = students.find((student: any) => student.username === username);
        setSigned(!!me && Number(me.status ?? 0) !== 0);
      } catch (error) {
        // A transient poll failure is retried by the serial scheduler below.
      } finally {
        if (isCurrent()) {
          pollTimer.current = setTimeout(() => pollSignStatus(activeSgId), 8000);
        }
      }
    };

    const findActiveSchedule = async () => {
      const courseList: any = await autolabApi.listCourses({
        group_id: gid,
        page_now: 1,
        page_size: 100,
      });
      const courses = Array.isArray(courseList?.courses) ? courseList.courses : [];
      const now = dayjs();
      for (const course of courses) {
        if (!isCurrent()) return undefined;
        const res: any = await autolabApi.listSchedule({
          course_id: course.course_id,
          page_now: 1,
          page_size: 200,
        });
        const schedules = Array.isArray(res?.schedules) ? res.schedules : [];
        const schedule = schedules.find((item: any) => {
          const start = dayjs(item.start_time);
          const end = dayjs(item.end_time);
          return start.isValid() && end.isValid() && now.isAfter(start) && now.isBefore(end);
        });
        if (schedule) return { courseId: course.course_id, schedule };
      }
      return undefined;
    };

    const initAndStart = async () => {
      setLoading(true);
      try {
        const active = await findActiveSchedule();
        if (!isCurrent() || !active) return;
        const initRes: any = await autolabApi.initAttendance(
          active.courseId,
          active.schedule.schedule_id,
          { group_id: gid },
        );
        if (!isCurrent()) return;
        const activeSgId = Number(initRes?.sg_id ?? 0);
        if (!activeSgId) return;
        const attendance: any = await autolabApi.getAttendance(activeSgId);
        if (!isCurrent() || Number(attendance?.sign_mode ?? 0) !== 1) return;
        setVisible(true);
        const students = Array.isArray(attendance?.students) ? attendance.students : [];
        const me = students.find((student: any) => student.username === username);
        setSigned(!!me && Number(me.status ?? 0) !== 0);
        void refreshToken(activeSgId);
        pollTimer.current = setTimeout(() => pollSignStatus(activeSgId), 8000);
      } catch (error) {
        if (isCurrent()) setVisible(false);
      } finally {
        if (isCurrent()) setLoading(false);
      }
    };

    void initAndStart();
    return () => {
      sessionIdRef.current += 1;
      clearTimers();
    };
  }, [problemSetId, username, groupId]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 80,
        right: 24,
        zIndex: 900,
        width: 220,
      }}
    >
      <Card
        size="small"
        title="二维码签到"
        extra={
          <Button size="small" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '展开' : '折叠'}
          </Button>
        }
      >
        {loading && <Spin />}
        {!loading && signed && <div style={{ textAlign: 'center' }}>已签到</div>}
        {!loading && !signed && token && !collapsed && (
          <div style={{ textAlign: 'center' }}>
            <QRCode value={token} size={160} />
            <div style={{ marginTop: 8, fontSize: 12 }}>请出示二维码完成扫码签到</div>
          </div>
        )}
        {!loading && !signed && token && collapsed && (
          <div style={{ textAlign: 'center', fontSize: 12 }}>待签到</div>
        )}
      </Card>
    </div>
  );
};

export default QRFloat;
