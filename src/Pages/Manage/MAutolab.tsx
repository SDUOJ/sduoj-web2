import React, {useMemo, useState} from "react";
import {
    Button,
    Card,
    DatePicker,
    Dropdown,
    Form,
    Grid,
    Input,
    Modal,
    Popconfirm,
    Select,
    Space,
    Table,
    Tag,
    Transfer,
    message,
} from "antd";
import type {TransferProps} from "antd";
import {MoreOutlined} from "@ant-design/icons";
import dayjs from "dayjs";

import autolabApi from "../../Utils/API/autolab-api";
import TableWithPagination from "../../Component/common/Table/TableWithPagination";
import ModalFormUseForm from "../../Component/common/Form/ModalFormUseForm";
import TableRowDeleteButton from "../../Component/common/Table/TableRowDeleteButton";
import ItemSelectGroup from "../../Component/group/Form/Item/ItemSelectGroup";
import ItemSelectClassroom from "../../Component/autolab/Form/Item/ItemSelectClassroom";

const tagOptions = [
    {value: "授课", label: "授课"},
    {value: "实验", label: "实验"},
    {value: "考试", label: "考试"},
    {value: "答疑", label: "答疑"},
];

const COURSE_TABLE_NAME = "AutolabCourseList";

const formatDateTime = (v: any): string | undefined => {
    if (!v) return undefined;
    if (dayjs.isDayjs(v)) return v.format("YYYY-MM-DD HH:mm:ss");
    return String(v);
};

const buildTimeRows = (res: any) => {
    const timeList = Array.isArray(res?.time_list) ? res.time_list : [];
    const signList = Array.isArray(res?.sign_list) ? res.sign_list : [];
    return timeList.map((item: any, idx: number) => ({
        ...item,
        sign_id: signList[idx] ?? null,
    }));
};

const normalizeIds = (v: any, allowEmpty = false): number[] | undefined => {
    if (!Array.isArray(v)) return undefined;
    const ids = Array.from(new Set(v
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item > 0)));
    if (ids.length > 0) return ids;
    return allowEmpty ? [] : undefined;
};

const MAutolab: React.FC = () => {
    const screens = Grid.useBreakpoint();
    const foldOperation = !screens.xl;

    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const [taModalOpen, setTaModalOpen] = useState(false);
    const [bindModalOpen, setBindModalOpen] = useState(false);
    const [assignModalOpen, setAssignModalOpen] = useState(false);

    const [currentCourse, setCurrentCourse] = useState<any>(null);
    const [timeRows, setTimeRows] = useState<any[]>([]);
    const [taRows, setTaRows] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);

    const [bindingTA, setBindingTA] = useState<any>(null);
    const [bindingUsernames, setBindingUsernames] = useState<string[]>([]);

    const [assignStudents, setAssignStudents] = useState<any[]>([]);
    const [assignClassrooms, setAssignClassrooms] = useState<any[]>([]);
    const [assignUsernames, setAssignUsernames] = useState<string[]>([]);
    const [assignClassroomIds, setAssignClassroomIds] = useState<number[]>([]);
    const [assignSubmitting, setAssignSubmitting] = useState(false);

    const courseForm = (
        <>
            <Form.Item name="course_name" label="课程名称" rules={[{required: true}]}> 
                <Input />
            </Form.Item>
            <ItemSelectGroup name={"group_id"} label={"用户组"} required={true} />
            <ItemSelectGroup name={"manager_groups"} label={"管理组"} mode={"multiple"} />
            <Form.Item name="tag" label="标签" rules={[{required: true}]}> 
                <Select options={tagOptions} />
            </Form.Item>
            <ItemSelectClassroom name={"c_ids"} label={"教室"} mode={"multiple"} />
        </>
    );

    const timeForm = (
        <>
            <Form.Item name="start_time" label="开始时间" rules={[{required: true}]}> 
                <DatePicker showTime style={{width: "100%"}} />
            </Form.Item>
            <Form.Item name="end_time" label="结束时间" rules={[{required: true}]}> 
                <DatePicker showTime style={{width: "100%"}} />
            </Form.Item>
            <Form.Item name="course_content" label="课程内容"> 
                <Input />
            </Form.Item>
            <Form.Item name="course_homework" label="课程作业"> 
                <Input />
            </Form.Item>
        </>
    );

    const taForm = (
        <>
            <Form.Item name="ta_name" label="助教姓名" rules={[{required: true}]}> 
                <Input />
            </Form.Item>
            <Form.Item name="contact" label="联系方式"> 
                <Input />
            </Form.Item>
            <Form.Item name="email" label="邮箱"> 
                <Input />
            </Form.Item>
            <Form.Item name="office" label="办公室"> 
                <Input />
            </Form.Item>
            <Form.Item name="remark" label="备注"> 
                <Input />
            </Form.Item>
        </>
    );

    const loadCourseTimes = async (course: any) => {
        const res: any = await autolabApi.listCourseTimes(course.course_id);
        setTimeRows(buildTimeRows(res));
    };

    const loadCourseTAs = async (course: any) => {
        const [taRes, studentRes]: any = await Promise.all([
            autolabApi.listTA(course.course_id),
            autolabApi.listCourseStudents(course.course_id),
        ]);
        setTaRows(Array.isArray(taRes) ? taRes : []);
        setStudents(Array.isArray(studentRes?.students) ? studentRes.students : []);
    };

    const openTimeModal = async (course: any) => {
        setCurrentCourse(course);
        await loadCourseTimes(course);
        setTimeModalOpen(true);
    };

    const openTaModal = async (course: any) => {
        setCurrentCourse(course);
        await loadCourseTAs(course);
        setTaModalOpen(true);
    };

    const openBindModal = (ta: any) => {
        setBindingTA(ta);
        setBindingUsernames(Array.isArray(ta?.students) ? ta.students : []);
        setBindModalOpen(true);
    };

    const submitBindStudents = async () => {
        if (!currentCourse || !bindingTA) return;
        await autolabApi.updateTA(currentCourse.course_id, bindingTA.TA_id, {usernames: bindingUsernames});
        setBindModalOpen(false);
        setBindingTA(null);
        await loadCourseTAs(currentCourse);
    };

    const openAssignModal = async (course: any) => {
        setCurrentCourse(course);
        const res: any = await autolabApi.getAutoAssignOptions(course.course_id);
        const studentRows = Array.isArray(res?.students) ? res.students : [];
        const classroomRows = Array.isArray(res?.classrooms) ? res.classrooms : [];
        setAssignStudents(studentRows);
        setAssignClassrooms(classroomRows);
        // 默认不勾选，只有移动到右侧“本次要分配”才参与分配
        setAssignUsernames([]);
        setAssignClassroomIds(classroomRows.map((item: any) => item.c_id));
        setAssignModalOpen(true);
    };

    const submitAutoAssign = async () => {
        if (!currentCourse) return;
        if (assignUsernames.length === 0) {
            message.warning("请至少选择一个本次要分配学生");
            return;
        }
        if (assignClassroomIds.length === 0) {
            message.warning("请至少选择一个教室");
            return;
        }
        try {
            setAssignSubmitting(true);
            await autolabApi.autoAssignSeats({
                course_id: currentCourse.course_id,
                usernames: assignUsernames,
                c_ids: assignClassroomIds,
            });
            setAssignModalOpen(false);
            await loadCourseTAs(currentCourse);
        } finally {
            setAssignSubmitting(false);
        }
    };

    const transferStudents = useMemo<TransferProps<any>["dataSource"]>(() => {
        return students.map((item: any) => ({
            key: item.username,
            title: item.nickname ? `${item.username}(${item.nickname})` : item.username,
            description: item.has_seat ? `已分配 ${item.c_id ?? "-"}-${item.seat_number ?? "-"}` : "未分配",
        }));
    }, [students]);

    const assignTransferStudents = useMemo<TransferProps<any>["dataSource"]>(() => {
        return assignStudents
            .filter((item: any) => !item.has_seat)
            .map((item: any) => ({
            key: item.username,
            title: item.nickname ? `${item.username}(${item.nickname})` : item.username,
            description: item.has_seat ? `已分配 ${item.c_id ?? "-"}-${item.seat_number ?? "-"}` : "未分配",
        }));
    }, [assignStudents]);

    const renderOperationArea = (actions: React.ReactNode[]) => {
        if (!foldOperation) {
            return <Space wrap>{actions.map((item, idx) => <React.Fragment key={idx}>{item}</React.Fragment>)}</Space>;
        }
        return (
            <Dropdown
                trigger={["click"]}
                placement="bottomLeft"
                dropdownRender={() => (
                    <div
                        style={{
                            padding: 8,
                            background: "#fff",
                            borderRadius: 8,
                            boxShadow: "0 6px 16px rgba(0, 0, 0, 0.12)",
                        }}
                    >
                        <Space direction="vertical" size={4}>
                            {actions.map((item, idx) => (
                                <div key={idx}>{item}</div>
                            ))}
                        </Space>
                    </div>
                )}
            >
                <Button type="link" size="small" icon={<MoreOutlined/>}>更多</Button>
            </Dropdown>
        );
    };

    const courseColumns: any[] = [
        {title: "ID", dataIndex: "course_id", width: 80},
        {
            title: "课程名称",
            dataIndex: "course_name",
            render: (v: any) => <span style={{whiteSpace: "nowrap"}}>{v}</span>
        },
        {title: "标签", dataIndex: "tag", width: 90, render: (v: any) => <Tag>{v}</Tag>},
        {title: "组ID", dataIndex: "group_id"},
        {title: "课程时间", dataIndex: "time_count", width: 100},
        {title: "助教数", dataIndex: "ta_count", width: 90},
        {
            title: "操作",
            render: (_: any, row: any) => renderOperationArea([
                    <ModalFormUseForm
                        key={"edit"}
                        TableName={COURSE_TABLE_NAME}
                        title={`编辑课程：${row.course_name}`}
                        type={"update"}
                        subForm={[{component: courseForm}]}
                        dataLoader={async () => {
                            const res: any = await autolabApi.getCourse(row.course_id);
                            return {
                                course_name: res?.course_name,
                                group_id: res?.group_id,
                                manager_groups: res?.manager_groups ?? res?.ext_config?.manager_groups ?? [],
                                tag: res?.tag,
                                c_ids: res?.c_ids ?? [],
                            };
                        }}
                        dataSubmitter={async (values: any) => autolabApi.updateCourse(row.course_id, {
                                course_name: values.course_name,
                                group_id: Number(values.group_id),
                                manager_groups: normalizeIds(values.manager_groups, true),
                                tag: values.tag,
                                c_ids: normalizeIds(values.c_ids, true),
                            })}
                    />,

                    <Button key={"time"} type="link" size="small" onClick={() => openTimeModal(row)}>课程时间管理</Button>,
                    <Button key={"ta"} type="link" size="small" onClick={() => openTaModal(row)}>助教管理</Button>,
                    <Button key={"assign"} type="link" size="small" onClick={() => openAssignModal(row)}>自动分配座位</Button>,
                    <TableRowDeleteButton
                        key={"delete"}
                        type={"inline"}
                        API={() => autolabApi.deleteCourse(row.course_id)}
                        data={{}}
                        name={COURSE_TABLE_NAME}
                    />,
                ]),
        },
    ];

    return (
        <div style={{marginTop: -20, overflow: "hidden"}}>
            <Card
                size={"small"}
                bordered={true}
                title="课程管理"
                extra={
                    <ModalFormUseForm
                        TableName={COURSE_TABLE_NAME}
                        title="创建课程"
                        type={"create"}
                        subForm={[{component: courseForm}]}
                        dataSubmitter={async (values: any) => autolabApi.createCourse({
                                course_name: values.course_name,
                                group_id: Number(values.group_id),
                                manager_groups: normalizeIds(values.manager_groups, true),
                                tag: values.tag,
                                c_ids: normalizeIds(values.c_ids, true),
                            })}
                    />
                }
            >
                <TableWithPagination
                    name={COURSE_TABLE_NAME}
                    columns={courseColumns}
                    API={autolabApi.listCoursesTable}
                    size={"small"}
                    rowKey={"course_id"}
                />
            </Card>

            <Modal
                open={timeModalOpen}
                title={currentCourse ? `课程时间管理：${currentCourse.course_name}` : "课程时间管理"}
                onCancel={() => setTimeModalOpen(false)}
                footer={null}
                width={960}
                destroyOnHidden
            >
                {currentCourse && (
                    <Space direction="vertical" style={{width: "100%"}} size={12}>
                        <Space>
                            <ModalFormUseForm
                                title="新增课程时间"
                                type={"create"}
                                subForm={[{component: timeForm}]}
                                dataSubmitter={(values: any) => autolabApi.addCourseTime(currentCourse.course_id, {
                                    start_time: formatDateTime(values.start_time),
                                    end_time: formatDateTime(values.end_time),
                                    course_content: values.course_content,
                                    course_homework: values.course_homework,
                                    auto_create_sign: true,
                                })}
                                afterSubmit={() => loadCourseTimes(currentCourse)}
                            />
                        </Space>

                        <Table
                            rowKey={(row: any) => row.time_id}
                            dataSource={timeRows}
                            size="small"
                            pagination={{pageSize: 8}}
                            columns={[
                                {title: "时间ID", dataIndex: "time_id", width: 90},
                                {title: "开始时间", dataIndex: "start_time", width: 180},
                                {title: "结束时间", dataIndex: "end_time", width: 180},
                                {title: "签到ID", dataIndex: "sign_id", width: 90, render: (v: any) => v ?? "-"},
                                {title: "课程内容", dataIndex: "course_content", ellipsis: true},
                                {
                                    title: "操作",
                                    width: 220,
                                    render: (_: any, row: any) => renderOperationArea([
                                            <ModalFormUseForm
                                                key={"edit"}
                                                title={`编辑时间 #${row.time_id}`}
                                                type={"update"}
                                                subForm={[{component: timeForm}]}
                                                dataLoader={async () => ({
                                                    start_time: row.start_time ? dayjs(row.start_time) : undefined,
                                                    end_time: row.end_time ? dayjs(row.end_time) : undefined,
                                                    course_content: row.course_content,
                                                    course_homework: row.course_homework,
                                                })}
                                                dataSubmitter={(values: any) => autolabApi.updateCourseTime(currentCourse.course_id, row.time_id, {
                                                    start_time: formatDateTime(values.start_time),
                                                    end_time: formatDateTime(values.end_time),
                                                    course_content: values.course_content,
                                                    course_homework: values.course_homework,
                                                })}
                                                afterSubmit={() => loadCourseTimes(currentCourse)}
                                            />,
                                            <Popconfirm
                                                key={"delete"}
                                                title="确认删除该课程时间吗？"
                                                onConfirm={async () => {
                                                    await autolabApi.deleteCourseTime(currentCourse.course_id, row.time_id);
                                                    await loadCourseTimes(currentCourse);
                                                }}
                                            >
                                                <Button type="link" danger size="small">删除</Button>
                                            </Popconfirm>,
                                        ]),
                                },
                            ]}
                        />
                    </Space>
                )}
            </Modal>

            <Modal
                open={taModalOpen}
                title={currentCourse ? `助教管理：${currentCourse.course_name}` : "助教管理"}
                onCancel={() => setTaModalOpen(false)}
                footer={null}
                width={920}
                destroyOnHidden
            >
                {currentCourse && (
                    <Space direction="vertical" style={{width: "100%"}} size={12}>
                        <Space>
                            <ModalFormUseForm
                                title="新增助教"
                                type={"create"}
                                subForm={[{component: taForm}]}
                                dataSubmitter={(values: any) => autolabApi.addTA(currentCourse.course_id, {
                                    ta_name: values.ta_name,
                                    ext_info: {
                                        contact: values.contact,
                                        email: values.email,
                                        office: values.office,
                                        remark: values.remark,
                                    },
                                })}
                                afterSubmit={() => loadCourseTAs(currentCourse)}
                            />
                        </Space>

                        <Table
                            rowKey={(row: any) => row.TA_id}
                            dataSource={taRows}
                            size="small"
                            pagination={{pageSize: 8}}
                            columns={[
                                {title: "助教ID", dataIndex: "TA_id", width: 90},
                                {title: "姓名", dataIndex: "TA_name"},
                                {title: "联系方式", render: (_: any, row: any) => row.ext_info?.contact ?? "-"},
                                {title: "邮箱", render: (_: any, row: any) => row.ext_info?.email ?? "-"},
                                {title: "已绑定学生", dataIndex: "bind_student_count", width: 100},
                                {
                                    title: "操作",
                                    width: 280,
                                    render: (_: any, row: any) => renderOperationArea([
                                            <ModalFormUseForm
                                                key={"edit"}
                                                title={`编辑助教 #${row.TA_id}`}
                                                type={"update"}
                                                subForm={[{component: taForm}]}
                                                dataLoader={async () => ({
                                                    ta_name: row.TA_name,
                                                    contact: row.ext_info?.contact,
                                                    email: row.ext_info?.email,
                                                    office: row.ext_info?.office,
                                                    remark: row.ext_info?.remark,
                                                })}
                                                dataSubmitter={(values: any) => autolabApi.updateTA(currentCourse.course_id, row.TA_id, {
                                                    ta_name: values.ta_name,
                                                    ext_info: {
                                                        contact: values.contact,
                                                        email: values.email,
                                                        office: values.office,
                                                        remark: values.remark,
                                                    },
                                                })}
                                                afterSubmit={() => loadCourseTAs(currentCourse)}
                                            />,
                                            <Button key={"bind"} type="link" size="small" onClick={() => openBindModal(row)}>绑定学生</Button>,
                                            <Popconfirm
                                                key={"delete"}
                                                title="确认删除该助教吗？"
                                                onConfirm={async () => {
                                                    await autolabApi.deleteTA(row.TA_id);
                                                    await loadCourseTAs(currentCourse);
                                                }}
                                            >
                                                <Button type="link" size="small" danger>删除</Button>
                                            </Popconfirm>,
                                        ]),
                                },
                            ]}
                        />
                    </Space>
                )}
            </Modal>

            <Modal
                open={bindModalOpen}
                title={bindingTA ? `绑定学生到助教：${bindingTA.TA_name}` : "绑定学生"}
                onCancel={() => setBindModalOpen(false)}
                onOk={submitBindStudents}
                width={820}
                destroyOnHidden
            >
                <Transfer
                    dataSource={transferStudents}
                    targetKeys={bindingUsernames}
                    onChange={(nextKeys) => setBindingUsernames(nextKeys as string[])}
                    render={(item) => item.title || item.key}
                    listStyle={{width: 360, height: 420}}
                    titles={["组内学生", "已绑定到该助教"]}
                    showSearch
                    filterOption={(inputValue, item) => {
                        const text = `${item.key} ${item.title ?? ""} ${item.description ?? ""}`;
                        return text.toLowerCase().includes(inputValue.toLowerCase());
                    }}
                />
            </Modal>

            <Modal
                open={assignModalOpen}
                title={currentCourse ? `自动分配座位：${currentCourse.course_name}` : "自动分配座位"}
                onCancel={() => setAssignModalOpen(false)}
                onOk={submitAutoAssign}
                confirmLoading={assignSubmitting}
                width={980}
                destroyOnHidden
            >
                <Space direction="vertical" style={{width: "100%"}} size={12}>
                    <div style={{color: "rgba(0, 0, 0, 0.65)"}}>
                        左侧为待分配学生，移动到右侧“本次要分配学生”后才会参与本次自动分配。
                    </div>
                    <Form layout="vertical">
                        <Form.Item label="选择参与分配的教室（多选）">
                            <Select
                                mode="multiple"
                                value={assignClassroomIds}
                                onChange={(vals) => setAssignClassroomIds(vals as number[])}
                                options={assignClassrooms.map((item: any) => ({
                                    value: item.c_id,
                                    label: `${item.c_name}(${item.address ?? "-"}) - 剩余${item.remaining_seats}`,
                                }))}
                            />
                        </Form.Item>
                    </Form>
                    <Transfer
                        dataSource={assignTransferStudents}
                        targetKeys={assignUsernames}
                        onChange={(nextKeys) => setAssignUsernames(nextKeys as string[])}
                        render={(item) => item.title || item.key}
                        listStyle={{width: 430, height: 420}}
                        titles={["待分配学生", "本次要分配学生"]}
                        showSearch
                        filterOption={(inputValue, item) => {
                            const text = `${item.key} ${item.title ?? ""} ${item.description ?? ""}`;
                            return text.toLowerCase().includes(inputValue.toLowerCase());
                        }}
                    />
                </Space>
            </Modal>
        </div>
    );
};

export default MAutolab;
