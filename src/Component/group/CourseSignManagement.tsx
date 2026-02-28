import React, {useEffect, useMemo, useState} from "react";
import {
    Button,
    Card,
    Empty,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Table,
    Tabs,
    Tag,
    Transfer,
    message,
    Spin,
} from "antd";
import type {TransferProps} from "antd";

import autolabApi from "../../Utils/API/autolab-api";
import cApi from "../../Utils/API/c-api";

interface CourseSignManagementProps {
    groupId: number | string;
}

const statusLabelMap: Record<number, string> = {
    0: "无记录",
    1: "出勤",
    2: "缺勤",
    3: "迟到/早退",
    4: "请假已批准",
    5: "请假申请中",
};

const statusColorMap: Record<number, string> = {
    0: "default",
    1: "green",
    2: "red",
    3: "orange",
    4: "blue",
    5: "gold",
};

const CourseSignManagement: React.FC<CourseSignManagementProps> = ({groupId}) => {
    const numericGroupId = typeof groupId === "string" ? parseInt(groupId, 10) : groupId;

    const [loading, setLoading] = useState(false);
    const [courseCards, setCourseCards] = useState<any[]>([]);

    const [detailVisible, setDetailVisible] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [searchUsername, setSearchUsername] = useState("");

    const [editVisible, setEditVisible] = useState(false);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editStudent, setEditStudent] = useState<any>(null);
    const [editStatus, setEditStatus] = useState<number>(1);

    const [absenceVisible, setAbsenceVisible] = useState(false);
    const [absenceSubmitting, setAbsenceSubmitting] = useState(false);
    const [absenceTargetKeys, setAbsenceTargetKeys] = useState<string[]>([]);

    const loadCourses = async () => {
        if (!numericGroupId) {
            setCourseCards([]);
            return;
        }
        setLoading(true);
        try {
            const courseRes: any = await autolabApi.listCourses({
                group_id: Number(numericGroupId),
                page_now: 1,
                page_size: 100,
            });
            const courses = Array.isArray(courseRes?.courses) ? courseRes.courses : [];
            const timeResults = await Promise.all(
                courses.map(async (course: any) => {
                    try {
                        const timeRes: any = await autolabApi.listCourseTimes(course.course_id);
                        const timeList = Array.isArray(timeRes?.time_list) ? timeRes.time_list : [];
                        const signList = Array.isArray(timeRes?.sign_list) ? timeRes.sign_list : [];
                        const rows = timeList.map((item: any, idx: number) => ({
                            ...item,
                            sign_id: signList[idx] ?? null,
                        }));
                        return {...course, time_rows: rows};
                    } catch (e) {
                        return {...course, time_rows: []};
                    }
                })
            );
            timeResults.sort((a: any, b: any) => String(a?.course_name ?? "").localeCompare(String(b?.course_name ?? "")));
            setCourseCards(timeResults);
        } finally {
            setLoading(false);
        }
    };

    const loadSignDetail = async (course: any, scheduleRow: any) => {
        if (!course?.course_id || !scheduleRow?.schedule_id) return;
        setDetailLoading(true);
        try {
            const initRes: any = await autolabApi.initAttendance(course.course_id, scheduleRow.schedule_id, {
                group_id: course.group_id
            });
            const sgId = Number(scheduleRow?.sign_id ?? initRes?.sg_id ?? 0);
            if (!sgId) {
                message.error("签到初始化失败");
                return;
            }
            const data: any = await autolabApi.getAttendance(sgId);
            const rows = Array.isArray(data?.students) ? data.students : [];
            rows.sort((a: any, b: any) => {
                const aSeat = a?.seat_number ?? Number.MAX_SAFE_INTEGER;
                const bSeat = b?.seat_number ?? Number.MAX_SAFE_INTEGER;
                if (aSeat !== bSeat) return aSeat - bSeat;
                return String(a?.username ?? "").localeCompare(String(b?.username ?? ""));
            });
            setStudents(rows);
            setSelectedCourse(course);
            setSelectedSchedule({...scheduleRow, sign_id: sgId});
            setSearchUsername("");
            setAbsenceTargetKeys([]);
            setDetailVisible(true);
        } finally {
            setDetailLoading(false);
        }
    };

    const openEditStudent = (student: any) => {
        setEditStudent(student);
        setEditStatus(Number(student?.status ?? 0) === 1 ? 1 : 0);
        setEditVisible(true);
    };

    const submitEditStudent = async () => {
        const sgId = Number(selectedSchedule?.sign_id ?? 0);
        if (!sgId || !editStudent?.username) return;
        try {
            setEditSubmitting(true);
            await autolabApi.recordAttendance(sgId, {
                records: [{
                    username: editStudent.username,
                    status: editStatus,
                    seat_number: editStudent?.seat_number
                }]
            });
            setEditVisible(false);
            await loadSignDetail(selectedCourse, selectedSchedule);
        } finally {
            setEditSubmitting(false);
        }
    };

    const filteredStudents = useMemo(() => {
        const key = searchUsername.trim().toLowerCase();
        if (!key) return students;
        return students.filter((item: any) => String(item?.username ?? "").toLowerCase().includes(key));
    }, [students, searchUsername]);

    const unsignedStudents = useMemo(
        () => students.filter((item: any) => Number(item?.status ?? 0) === 0),
        [students]
    );

    const absenceDataSource = useMemo<TransferProps<any>["dataSource"]>(
        () => unsignedStudents.map((item: any) => ({
            key: String(item?.username),
            title: String(item?.username ?? ""),
            description: item?.seat_number ? `座位 ${item.seat_number}` : "未分配座位",
        })),
        [unsignedStudents]
    );

    const submitBatchAbsence = async () => {
        const sgId = Number(selectedSchedule?.sign_id ?? 0);
        if (!sgId) return;
        if (unsignedStudents.length === 0) {
            message.warning("当前没有可批量处理的无记录学生");
            return;
        }
        try {
            setAbsenceSubmitting(true);
            const absenceSet = new Set(absenceTargetKeys);
            await autolabApi.recordAttendance(sgId, {
                records: unsignedStudents.map((item: any) => ({
                    username: item.username,
                    status: absenceSet.has(String(item.username)) ? 2 : 1,
                    seat_number: item?.seat_number
                }))
            });
            setAbsenceVisible(false);
            setAbsenceTargetKeys([]);
            await loadSignDetail(selectedCourse, selectedSchedule);
        } finally {
            setAbsenceSubmitting(false);
        }
    };

    const leaveRows = useMemo(() => {
        return students.filter((item: any) =>
            item?.leave_status !== null && item?.leave_status !== undefined
            || Number(item?.status ?? 0) === 4
            || Number(item?.status ?? 0) === 5
            || !!item?.leave_message
            || (Array.isArray(item?.leave_files) && item.leave_files.length > 0)
        );
    }, [students]);

    const reviewLeave = async (approved: boolean, username: string) => {
        const sgId = Number(selectedSchedule?.sign_id ?? 0);
        if (!sgId) return;
        await autolabApi.reviewLeave(sgId, {username, approved});
        await loadSignDetail(selectedCourse, selectedSchedule);
    };

    useEffect(() => {
        loadCourses();
    }, [numericGroupId]);

    if (loading) return <Spin />;

    return (
        <>
            {courseCards.length === 0 ? (
                <Card size="small">
                    <Empty description="暂无可管理课程" />
                </Card>
            ) : (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(580px, 1fr))",
                    gap: 12,
                }}>
                    {courseCards.map((course: any) => (
                        <Card
                            key={course.course_id}
                            size="small"
                            title={
                                <Space>
                                    <span>{course.course_name}</span>
                                    <Tag>{course.tag ?? "-"}</Tag>
                                </Space>
                            }
                        >
                            {(course?.time_rows ?? []).length === 0 ? (
                                <Empty description="暂无课程时间" />
                            ) : (
                                <Table
                                    rowKey={(row: any) => row.time_id ?? row.schedule_id}
                                    size="small"
                                    dataSource={course.time_rows}
                                    pagination={{pageSize: 6}}
                                    columns={[
                                        {title: "课次", dataIndex: "time_id", width: 70},
                                        {title: "开始时间", dataIndex: "start_time", width: 160},
                                        {title: "结束时间", dataIndex: "end_time", width: 160},
                                        {title: "签到ID", dataIndex: "sign_id", width: 90, render: (v: any) => v ?? "-"},
                                        {
                                            title: "操作",
                                            width: 100,
                                            render: (_: any, row: any) => (
                                                <Button type="link" size="small" onClick={() => loadSignDetail(course, row)}>
                                                    详情
                                                </Button>
                                            )
                                        }
                                    ]}
                                />
                            )}
                        </Card>
                    ))}
                </div>
            )}

            <Modal
                open={detailVisible}
                title={selectedCourse && selectedSchedule
                    ? `签到详情：${selectedCourse.course_name} / 第${selectedSchedule.time_id ?? "-"}次课`
                    : "签到详情"}
                onCancel={() => setDetailVisible(false)}
                footer={null}
                width={1200}
                destroyOnHidden
            >
                <Spin spinning={detailLoading}>
                    <Space direction="vertical" style={{width: "100%"}} size={12}>
                        <Space wrap>
                            <span>学号检索：</span>
                            <Input
                                style={{width: 260}}
                                value={searchUsername}
                                onChange={(e) => setSearchUsername(e.target.value)}
                                placeholder="请输入学号检索"
                                allowClear
                            />
                        </Space>
                    </Space>

                    <Tabs
                        style={{marginTop: 12}}
                        tabBarExtraContent={
                            <Button type="link" onClick={() => {
                                setAbsenceTargetKeys([]);
                                setAbsenceVisible(true);
                            }}>
                                批量考勤
                            </Button>
                        }
                        items={[
                            {
                                key: "attendance",
                                label: "签到列表",
                                children: (
                                    <>
                                        {filteredStudents.length === 0 ? (
                                            <Empty description="暂无学生数据" />
                                        ) : (
                                            <div style={{
                                                display: "grid",
                                                gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
                                                gap: 12
                                            }}>
                                                {filteredStudents.map((item: any) => (
                                                    <Card
                                                        key={item?.username}
                                                        size="small"
                                                        hoverable
                                                        onClick={() => openEditStudent(item)}
                                                    >
                                                        <Space direction="vertical" size={4}>
                                                            <div>学号：{item?.username ?? "-"}</div>
                                                            <div>座位：{item?.seat_number ?? "-"}</div>
                                                            <Tag color={statusColorMap[Number(item?.status ?? 0)]}>
                                                                {statusLabelMap[Number(item?.status ?? 0)] ?? "未知状态"}
                                                            </Tag>
                                                        </Space>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )
                            },
                            {
                                key: "leave",
                                label: "请假审批",
                                children: (
                                    <Table
                                        rowKey={(row: any) => row?.username}
                                        size="small"
                                        dataSource={leaveRows}
                                        pagination={{pageSize: 10}}
                                        locale={{emptyText: "暂无请假数据"}}
                                        columns={[
                                            {title: "学号", dataIndex: "username", width: 180},
                                            {title: "座位", dataIndex: "seat_number", width: 80, render: (v: any) => v ?? "-"},
                                            {
                                                title: "当前状态",
                                                width: 120,
                                                render: (_: any, row: any) => (
                                                    <Tag color={statusColorMap[Number(row?.status ?? 0)]}>
                                                        {statusLabelMap[Number(row?.status ?? 0)] ?? "未知状态"}
                                                    </Tag>
                                                )
                                            },
                                            {title: "请假理由", dataIndex: "leave_message", render: (v: any) => v || "-"},
                                            {
                                                title: "附件",
                                                width: 120,
                                                render: (_: any, row: any) => {
                                                    const fileId = Array.isArray(row?.leave_files) ? row.leave_files[0] : undefined;
                                                    if (!fileId) return "-";
                                                    return (
                                                        <a
                                                            href={cApi.getFileDownloadUrl(String(fileId), String(fileId))}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            查看附件
                                                        </a>
                                                    );
                                                }
                                            },
                                            {
                                                title: "审批状态",
                                                width: 120,
                                                render: (_: any, row: any) => {
                                                    const leaveStatus = row?.leave_status;
                                                    if (leaveStatus === 0) return <Tag color="gold">待审批</Tag>;
                                                    if (leaveStatus === 1) return <Tag color="green">已批准</Tag>;
                                                    if (leaveStatus === 2) return <Tag color="red">已拒绝</Tag>;
                                                    return "-";
                                                }
                                            },
                                            {
                                                title: "操作",
                                                width: 180,
                                                render: (_: any, row: any) => (
                                                    Number(row?.leave_status) === 0 ? (
                                                        <Space>
                                                            <Button type="link" size="small" onClick={() => reviewLeave(true, row.username)}>
                                                                批准
                                                            </Button>
                                                            <Button type="link" size="small" danger onClick={() => reviewLeave(false, row.username)}>
                                                                拒绝
                                                            </Button>
                                                        </Space>
                                                    ) : "-"
                                                )
                                            }
                                        ]}
                                    />
                                )
                            }
                        ]}
                    />
                </Spin>
            </Modal>

            <Modal
                open={editVisible}
                title={editStudent ? `签到录入：${editStudent.username}` : "签到录入"}
                onCancel={() => setEditVisible(false)}
                onOk={submitEditStudent}
                confirmLoading={editSubmitting}
                destroyOnHidden
            >
                <Form layout="vertical">
                    <Form.Item label="签到状态">
                        <Select
                            value={editStatus}
                            onChange={(value: number) => setEditStatus(value)}
                            options={[
                                {value: 1, label: "已签到"},
                                {value: 0, label: "未签到"},
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                open={absenceVisible}
                title="批量考勤（仅无记录学生）"
                onCancel={() => setAbsenceVisible(false)}
                onOk={submitBatchAbsence}
                confirmLoading={absenceSubmitting}
                width={900}
                destroyOnHidden
            >
                <div style={{marginBottom: 8, color: "rgba(0, 0, 0, 0.65)"}}>
                    右侧选中的学生标记为缺勤，左侧未选中的无记录学生将标记为出勤。
                </div>
                <Transfer
                    dataSource={absenceDataSource}
                    targetKeys={absenceTargetKeys}
                    onChange={(nextKeys) => setAbsenceTargetKeys(nextKeys as string[])}
                    titles={["无记录学生（默认出勤）", "本次标记缺勤"]}
                    render={(item) => item.title || item.key}
                    showSearch
                    listStyle={{width: 400, height: 420}}
                    filterOption={(input, item) =>
                        String(item?.key ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                />
            </Modal>
        </>
    );
};

export default CourseSignManagement;
