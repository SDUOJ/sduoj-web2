import React, {useEffect, useMemo, useState} from "react";
import {Button, Card, Descriptions, Divider, Form, Input, Modal, Space, Table, Tag} from "antd";
import autolabApi from "../../Utils/API/autolab-api";
import ItemUploadUser from "../common/Form/Item/ItemUploadUser";
import cApi from "../../Utils/API/c-api";

interface CourseDetailProps {
    course: any;
    targetUsername?: string;
    currentUsername?: string;
}

const CourseDetail: React.FC<CourseDetailProps> = ({course, targetUsername, currentUsername}) => {
    const courseId = course?.course_id;
    const [attendanceMap, setAttendanceMap] = useState<Record<number, any>>({});
    const [leaveVisible, setLeaveVisible] = useState(false);
    const [leaveSubmitting, setLeaveSubmitting] = useState(false);
    const [currentRow, setCurrentRow] = useState<any>(null);
    const [leaveForm] = Form.useForm();

    const loadAttendanceRecords = () => {
        if (!courseId || !targetUsername) {
            setAttendanceMap({});
            return;
        }
        autolabApi.getStudentAttendanceRecords(targetUsername, {
            course_id: courseId,
            pageNow: 1,
            pageSize: 500
        }).then((res: any) => {
            const rows = Array.isArray(res?.records) ? res.records : [];
            const m: Record<number, any> = {};
            rows.forEach((item: any) => {
                if (item?.sg_id !== undefined && item?.sg_id !== null) {
                    m[Number(item.sg_id)] = item;
                }
            });
            setAttendanceMap(m);
        }).catch(() => {
            setAttendanceMap({});
        });
    };

    useEffect(() => {
        loadAttendanceRecords();
    }, [courseId, targetUsername]);

    const timeRows = useMemo(() => {
        const timeList = Array.isArray(course?.course_times) ? course.course_times : [];
        const signList = Array.isArray(course?.sign_list) ? course.sign_list : [];
        return timeList.map((item: any, idx: number) => {
            const sgId = signList[idx] ?? null;
            const record = sgId ? attendanceMap[Number(sgId)] : undefined;
            return {
                ...item,
                sg_id: sgId,
                record,
            };
        });
    }, [course?.course_times, course?.sign_list, attendanceMap]);

    const seatInfo = course?.seat_info;
    const assignedTa = course?.assigned_ta;
    const canSubmitLeave = !!targetUsername && !!currentUsername && targetUsername === currentUsername;

    const attendanceTag = (row: any) => {
        if (!row?.sg_id) return <Tag>未创建签到</Tag>;
        const rec = row?.record;
        if (!rec) return <Tag color="default">未初始化</Tag>;
        if (rec.leave_status === 0 || rec.status === 5) return <Tag color="gold">请假审批中</Tag>;
        if (rec.leave_status === 1 || rec.status === 4) return <Tag color="blue">请假已批准</Tag>;
        if (rec.attendance_tag === "future") return <Tag color="default">时间未到</Tag>;
        if (rec.status === 1) return <Tag color="green">已签到</Tag>;
        if (rec.status === 2) return <Tag color="red">缺勤</Tag>;
        return <Tag color="red">未完成签到</Tag>;
    };

    const canApplyLeave = (row: any) => {
        if (!canSubmitLeave) return false;
        if (!row?.schedule_id) return false;
        const rec = row?.record;
        if (!rec) return true;
        if (rec.leave_status === 0) return false;
        if (rec.status === 1 || rec.status === 4) return false;
        if (rec.attendance_tag === "future") return true;
        return rec.status === 0 || rec.status === 2 || rec.attendance_tag === "absent";
    };

    const openLeaveModal = (row: any) => {
        setCurrentRow(row);
        leaveForm.setFieldsValue({
            leave_message: row?.record?.leave_message,
            leave_file_id: row?.record?.leave_files?.[0]
        });
        setLeaveVisible(true);
    };

    const submitLeave = async () => {
        if (!courseId || !targetUsername || !currentRow?.schedule_id) return;
        const values = await leaveForm.validateFields();
        try {
            setLeaveSubmitting(true);
            const initRes: any = await autolabApi.initAttendance(courseId, currentRow.schedule_id, {
                group_id: course?.group_id
            });
            const sgId = currentRow.sg_id ?? initRes?.sg_id;
            if (!sgId) return;

            const leaveFileId = values.leave_file_id;
            await autolabApi.submitLeave(sgId, targetUsername, {
                leave_message: values.leave_message,
                leave_files: leaveFileId ? [String(leaveFileId)] : []
            });
            setLeaveVisible(false);
            setCurrentRow(null);
            leaveForm.resetFields();
            loadAttendanceRecords();
        } finally {
            setLeaveSubmitting(false);
        }
    };

    const scheduleColumns: any[] = [
        {title: "时间ID", dataIndex: "time_id", width: 90},
        {title: "开始时间", dataIndex: "start_time"},
        {title: "结束时间", dataIndex: "end_time"},
        {title: "课程内容", dataIndex: "course_content"},
        {title: "作业", dataIndex: "course_homework", ellipsis: true},
        {
            title: "签到信息",
            dataIndex: "record",
            width: 140,
            render: (_: any, row: any) => attendanceTag(row)
        },
        {
            title: "请假",
            width: 260,
            render: (_: any, row: any) => {
                const rec = row?.record;
                const leaveFileId = rec?.leave_files?.[0];
                return (
                    <Space wrap>
                        {rec?.leave_message ? <span>{rec.leave_message}</span> : <span>-</span>}
                        {leaveFileId ? (
                            <a
                                href={cApi.getFileDownloadUrl(String(leaveFileId), String(leaveFileId))}
                                target="_blank"
                                rel="noreferrer"
                            >
                                查看附件
                            </a>
                        ) : null}
                    </Space>
                );
            }
        },
        {
            title: "操作",
            width: 120,
            render: (_: any, row: any) => (
                canApplyLeave(row) ? (
                    <Button type="link" size="small" onClick={() => openLeaveModal(row)}>申请请假</Button>
                ) : (row?.record?.leave_status === 0 ? <Tag color="gold">审批中</Tag> : "-")
            )
        }
    ];

    return (
        <>
            <Descriptions size="small" bordered column={2} style={{marginTop: 12}}>
                <Descriptions.Item label="课程地点">
                    {(course?.classrooms ?? []).length === 0
                        ? "-"
                        : (course?.classrooms ?? []).map((item: any) => `${item.c_name}(${item.address ?? "-"})`).join("、")}
                </Descriptions.Item>
                <Descriptions.Item label="课程名称">{course?.course_name}</Descriptions.Item>
                <Descriptions.Item label="课程座位分配">
                    {seatInfo
                        ? `${seatInfo.classroom_name ?? seatInfo.c_id ?? "-"} / 座位 ${seatInfo.seat_number ?? "-"}`
                        : "未分配"}
                </Descriptions.Item>
                <Descriptions.Item label="课程标签">{course?.tag}</Descriptions.Item>
                <Descriptions.Item label="助教信息">
                    {assignedTa
                        ? `${assignedTa.TA_name}${assignedTa.ext_info?.contact ? `（${assignedTa.ext_info.contact}）` : ""}`
                        : "未分配"}
                </Descriptions.Item>
                <Descriptions.Item label="当前查看学生">{targetUsername ?? "-"}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">课程时间表与签到</Divider>
            <Card size="small">
                <Table
                    rowKey={(r: any) => r.time_id ?? r.schedule_id}
                    dataSource={timeRows}
                    size="small"
                    pagination={{pageSize: 10}}
                    columns={scheduleColumns}
                />
            </Card>

            <Modal
                open={leaveVisible}
                title={currentRow ? `请假申请（第${currentRow.time_id ?? "-"}次课）` : "请假申请"}
                onCancel={() => setLeaveVisible(false)}
                onOk={submitLeave}
                confirmLoading={leaveSubmitting}
                destroyOnHidden
            >
                <Form form={leaveForm} layout="vertical" preserve={false}>
                    <Form.Item
                        name="leave_message"
                        label="请假理由"
                        rules={[{required: true, message: "请填写请假理由"}]}
                    >
                        <Input.TextArea rows={4} />
                    </Form.Item>
                    <ItemUploadUser
                        name={"leave_file_id"}
                        label={"请假附件（可选）"}
                        required={false}
                        accept={".pdf,.jpg,.jpeg,.png,.doc,.docx"}
                        max_size={20}
                    />
                </Form>
            </Modal>
        </>
    );
};

export default CourseDetail;
