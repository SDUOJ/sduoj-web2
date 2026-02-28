import React, {useEffect, useRef, useState} from "react";
import {Card, Spin, Button} from "antd";
import QRCode from "qrcode.react";
import dayjs from "dayjs";
import useProblemSetInfo from "../problemSet/API/getProblemSetInfo";
import autolabApi from "../../Utils/API/autolab-api";

interface QRFloatProps {
    problemSetId: string;
    username: string;
}

const QRFloat: React.FC<QRFloatProps> = ({problemSetId, username}) => {
    const info = useProblemSetInfo(problemSetId);
    const groupId = info?.groupId;
    const [loading, setLoading] = useState<boolean>(false);
    const [token, setToken] = useState<string | undefined>();
    const [sgId, setSgId] = useState<number | undefined>();
    const [signed, setSigned] = useState<boolean>(false);
    const [visible, setVisible] = useState<boolean>(false);
    const [collapsed, setCollapsed] = useState<boolean>(false);

    const refreshTimer = useRef<any>();
    const pollTimer = useRef<any>();

    const findActiveSchedule = async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            const gid = typeof groupId === 'string' ? parseInt(groupId) : groupId;
            const courseList: any = await autolabApi.listCourses({group_id: gid, page_now: 1, page_size: 100});
            const courses = courseList?.courses ?? [];
            const now = dayjs();
            for (const course of courses) {
                const res: any = await autolabApi.listSchedule({course_id: course.course_id, page_now: 1, page_size: 200});
                const schedules = res?.schedules ?? [];
                for (const sc of schedules) {
                    const st = dayjs(sc.start_time);
                    const et = dayjs(sc.end_time);
                    if (st.isValid() && et.isValid() && now.isAfter(st) && now.isBefore(et)) {
                        return {courseId: course.course_id, schedule: sc};
                    }
                }
            }
        } finally {
            setLoading(false);
        }
        return undefined;
    };

    const initAndStart = async () => {
        if (!groupId || !username) return;
        try {
            const active = await findActiveSchedule();
            if (!active) {
                setVisible(false);
                return;
            }
            const {courseId, schedule} = active;
            const gid = typeof groupId === 'string' ? parseInt(groupId) : groupId;
            const initRes: any = await autolabApi.initAttendance(courseId, schedule.schedule_id, {group_id: gid});
            const sg = initRes.sg_id;
            setSgId(sg);
            const attendance: any = await autolabApi.getAttendance(sg);
            const mode = attendance?.sign_mode ?? 0;
            if (mode !== 1) {
                setVisible(false);
                return;
            }
            setVisible(true);
            await refreshToken(sg);
            pollSignStatus(sg);
        } catch (e) {
            setVisible(false);
        }
    };

    const refreshToken = async (sg: number) => {
        if (!username) return;
        try {
            const res: any = await autolabApi.generateToken(sg, {username});
            setToken(res?.token);
        } catch (e) {
            // ignore
        }
    };

    const pollSignStatus = (sg: number) => {
        pollTimer.current && clearInterval(pollTimer.current);
        pollTimer.current = setInterval(async () => {
            const attendance: any = await autolabApi.getAttendance(sg);
            const students = attendance?.students ?? [];
            const me = students.find((s: any) => s.username === username);
            if (me && (me.status ?? 0) !== 0) {
                setSigned(true);
            }
        }, 8000);
    };

    useEffect(() => {
        if (!problemSetId || !username) return;
        initAndStart();
        refreshTimer.current && clearInterval(refreshTimer.current);
        refreshTimer.current = setInterval(() => {
            if (sgId) refreshToken(sgId);
        }, 30000);
        return () => {
            refreshTimer.current && clearInterval(refreshTimer.current);
            pollTimer.current && clearInterval(pollTimer.current);
        };
    }, [problemSetId, username, groupId, sgId]);

    if (!visible) return null;

    return (
        <div style={{
            position: "fixed",
            top: 80,
            right: 24,
            zIndex: 900,
            width: 220
        }}>
            <Card
                size="small"
                title="二维码签到"
                extra={<Button size="small" onClick={() => setCollapsed(!collapsed)}>{collapsed ? "展开" : "折叠"}</Button>}
            >
                {loading && <Spin/>}
                {!loading && signed && (
                    <div style={{textAlign: "center"}}>已签到</div>
                )}
                {!loading && !signed && token && !collapsed && (
                    <div style={{textAlign: "center"}}>
                        <QRCode value={token} size={160}/>
                        <div style={{marginTop: 8, fontSize: 12}}>请出示二维码完成扫码签到</div>
                    </div>
                )}
                {!loading && !signed && token && collapsed && (
                    <div style={{textAlign: "center", fontSize: 12}}>待签到</div>
                )}
            </Card>
        </div>
    );
};

export default QRFloat;
