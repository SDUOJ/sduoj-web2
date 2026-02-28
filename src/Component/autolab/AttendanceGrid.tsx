import React, {useEffect, useMemo, useState} from "react";
import {Button, Card, Divider, Modal, Select, Space, Tag} from "antd";
import autolabApi from "../../Utils/API/autolab-api";
import QRScanner from "./QRScanner";

interface AttendanceGridProps {
    courseId: number;
    schedules: any[];
    groupId: number | string;
    isAdmin: boolean;
}

const statusOptions = [
    {value: 0, label: "无记录"},
    {value: 1, label: "出勤"},
    {value: 2, label: "缺勤"},
    {value: 3, label: "迟到/早退"},
    {value: 4, label: "请假已批准"},
    {value: 5, label: "请假申请中"},
];

const statusColorMap: Record<number, string> = {
    0: "default",
    1: "green",
    2: "red",
    3: "orange",
    4: "blue",
    5: "gold",
};

const AttendanceGrid: React.FC<AttendanceGridProps> = ({courseId, schedules, groupId, isAdmin}) => {
    const [scheduleId, setScheduleId] = useState<number | undefined>();
    const [sgId, setSgId] = useState<number | undefined>();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [signMode, setSignMode] = useState<number>(0);
    const [statusModalVisible, setStatusModalVisible] = useState<boolean>(false);
    const [scanModalVisible, setScanModalVisible] = useState<boolean>(false);
    const [currentStudent, setCurrentStudent] = useState<any>(null);
    const [currentStatus, setCurrentStatus] = useState<number>(0);

    const scheduleOptions = useMemo(() => schedules.map((s: any) => ({
        value: s.schedule_id,
        label: `第${s.sequence ?? "?"}次课 ${s.start_time ?? ""}`
    })), [schedules]);

    const loadAttendance = (sid: number) => {
        if (!sid) return;
        setLoading(true);
        const gid = typeof groupId === 'string' ? parseInt(groupId) : groupId;
        autolabApi.initAttendance(courseId, sid, {group_id: gid}).then((res: any) => {
            const sg = res.sg_id;
            setSgId(sg);
            return autolabApi.getAttendance(sg);
        }).then((data: any) => {
            setSignMode(data?.sign_mode ?? 0);
            const list = data?.students ?? [];
            const sorted = list.sort((a: any, b: any) => {
                const aSeat = a.seat_number ?? 0;
                const bSeat = b.seat_number ?? 0;
                if (aSeat !== bSeat) return aSeat - bSeat;
                return (a.username ?? "").localeCompare(b.username ?? "");
            });
            setStudents(sorted);
        }).finally(() => setLoading(false));
    };

    useEffect(() => {
        if (scheduleOptions.length > 0 && scheduleId === undefined) {
            setScheduleId(scheduleOptions[0].value);
        }
    }, [scheduleOptions]);

    useEffect(() => {
        if (scheduleId !== undefined) loadAttendance(scheduleId);
    }, [scheduleId]);

    const openStatusModal = (student: any) => {
        setCurrentStudent(student);
        setCurrentStatus(student.status ?? 0);
        setStatusModalVisible(true);
    };

    const submitStatus = () => {
        if (!sgId || !currentStudent) return;
        autolabApi.recordAttendance(sgId, {
            records: [{
                username: currentStudent.username,
                status: currentStatus,
                seat_number: currentStudent.seat_number
            }]
        }).then(() => {
            setStatusModalVisible(false);
            loadAttendance(scheduleId as number);
        });
    };

    const batchSet = (status: number) => {
        if (!sgId) return;
        autolabApi.recordAttendance(sgId, {
            records: students.map(s => ({
                username: s.username,
                status,
                seat_number: s.seat_number
            }))
        }).then(() => loadAttendance(scheduleId as number));
    };

    const openScanner = (student: any) => {
        setCurrentStudent(student);
        setScanModalVisible(true);
    };

    const onToken = (token: string) => {
        autolabApi.verifyToken({token}).then(() => {
            setScanModalVisible(false);
            loadAttendance(scheduleId as number);
        });
    };

    return (
        <Card size="small" style={{marginTop: 12}} loading={loading}>
            <Space size={16} style={{marginBottom: 12}}>
                <Select
                    placeholder="选择课程时间"
                    value={scheduleId}
                    onChange={(v: number) => setScheduleId(v)}
                    options={scheduleOptions}
                    style={{minWidth: 260}}
                />
                {isAdmin && sgId !== undefined && (
                    <Select
                        value={signMode}
                        onChange={(v: number) => {
                            setSignMode(v);
                            autolabApi.updateSignMode(sgId, {sign_mode: v});
                        }}
                        options={[
                            {value: 0, label: "签到+签退"},
                            {value: 1, label: "仅签到(二维码)"}
                        ]}
                        style={{minWidth: 160}}
                    />
                )}
                {isAdmin && (
                    <>
                        <Button onClick={() => batchSet(1)} type="primary">一键全到</Button>
                        <Button danger onClick={() => batchSet(2)}>一键全不到</Button>
                    </>
                )}
            </Space>
            <Divider style={{margin: '12px 0'}}/>
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 12
            }}>
                {students.map((s: any) => (
                    <Card
                        key={s.username}
                        size="small"
                        style={{borderColor: "#f0f0f0"}}
                        onClick={() => isAdmin && openStatusModal(s)}
                    >
                        <Space direction="vertical" size={4}>
                            <div>座位号: {s.seat_number ?? "-"}</div>
                            <div>用户名: {s.username}</div>
                            <Tag color={statusColorMap[s.status ?? 0]}>
                                {(statusOptions.find(o => o.value === (s.status ?? 0))?.label) ?? "无记录"}
                            </Tag>
                            {isAdmin && (
                                <Button size="small" onClick={(e) => {
                                    e.stopPropagation();
                                    openScanner(s);
                                }}>
                                    扫码签到
                                </Button>
                            )}
                        </Space>
                    </Card>
                ))}
            </div>

            <Modal
                open={statusModalVisible}
                onCancel={() => setStatusModalVisible(false)}
                onOk={submitStatus}
                title={currentStudent ? `考勤状态 - ${currentStudent.username}` : "考勤状态"}
            >
                <Select
                    value={currentStatus}
                    options={statusOptions}
                    onChange={(v: number) => setCurrentStatus(v)}
                    style={{width: "100%"}}
                />
            </Modal>

            <QRScanner
                open={scanModalVisible}
                onClose={() => setScanModalVisible(false)}
                onResult={onToken}
            />
        </Card>
    );
};

export default AttendanceGrid;
