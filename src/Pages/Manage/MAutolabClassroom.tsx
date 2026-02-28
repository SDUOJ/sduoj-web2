import React from "react";
import {Card, Form, Input, InputNumber, Space, Tag, message} from "antd";
import autolabApi from "../../Utils/API/autolab-api";
import TableWithPagination from "../../Component/common/Table/TableWithPagination";
import ModalFormUseForm from "../../Component/common/Form/ModalFormUseForm";
import TableRowDeleteButton from "../../Component/common/Table/TableRowDeleteButton";

interface ISeatBan {
    seat_number: number;
    reason?: string;
}

const TABLE_NAME = "AutolabClassroomList";

const seatBanToInput = (extConfig: any): string => {
    const seatBan = Array.isArray(extConfig?.["seat-ban"])
        ? extConfig["seat-ban"].filter((item: any) => Number.isInteger(item?.seat_number) && item.seat_number > 0)
        : [];

    const disabledSeats = Array.isArray(extConfig?.disabled_seats)
        ? extConfig.disabled_seats
            .filter((item: any) => Number.isInteger(item) && item > 0)
            .map((seatNumber: number) => ({seat_number: seatNumber, reason: ""}))
        : [];

    const normalized = seatBan.length > 0 ? seatBan : disabledSeats;

    return [...normalized]
        .sort((a: ISeatBan, b: ISeatBan) => a.seat_number - b.seat_number)
        .map((item: ISeatBan) => item.reason ? `${item.seat_number}|${item.reason}` : `${item.seat_number}`)
        .join("\n");
};

const parseSeatBanInput = (raw?: string) => {
    const lines = (raw ?? "")
        .split(/\n+/)
        .map(item => item.trim())
        .filter(Boolean);

    const seatBan: ISeatBan[] = [];
    const invalidLines: string[] = [];

    lines.forEach((line) => {
        const match = line.match(/^(\d+)(?:\s*[|｜]\s*(.*))?$/);
        if (match === null) {
            invalidLines.push(line);
            return;
        }

        const seatNumber = Number(match[1]);
        if (!Number.isInteger(seatNumber) || seatNumber <= 0) {
            invalidLines.push(line);
            return;
        }

        seatBan.push({
            seat_number: seatNumber,
            reason: (match[2] ?? "").trim()
        });
    });

    const deduplicated = Array.from(new Map(seatBan.map((item) => [item.seat_number, item])).values())
        .sort((a, b) => a.seat_number - b.seat_number);

    return {
        seatBan: deduplicated,
        invalidLines
    };
};

const buildClassroomPayload = (values: any) => {
    const {seatBan, invalidLines} = parseSeatBanInput(values?.seat_ban_text);
    if (invalidLines.length > 0) {
        message.error(`禁用座位格式错误：${invalidLines.join("，")}`);
        return Promise.reject(new Error("invalid seat-ban"));
    }

    return Promise.resolve({
        c_name: values.c_name,
        address: values.address,
        c_seat_num: values.c_seat_num,
        ext_config: seatBan.length > 0 ? {"seat-ban": seatBan} : undefined
    });
};

const classroomForm = (
    <>
        <Form.Item name="c_name" label="教室名称" rules={[{required: true}]}> 
            <Input />
        </Form.Item>
        <Form.Item name="address" label="教室地点" rules={[{required: true}]}> 
            <Input />
        </Form.Item>
        <Form.Item name="c_seat_num" label="座位数量" rules={[{required: true}]}> 
            <InputNumber min={1} style={{width: "100%"}} />
        </Form.Item>
        <Form.Item name="seat_ban_text" label="禁用座位（每行：座位号|原因，可仅填座位号）"> 
            <Input.TextArea rows={4} placeholder="5|座位损坏\n12|电脑故障" />
        </Form.Item>
    </>
);

const seatBanSummary = (extConfig: any) => {
    const text = seatBanToInput(extConfig);
    if (!text) return [];
    return text.split("\n").filter(Boolean);
};

const MAutolabClassroom: React.FC = () => {
    const colData: any[] = [
        {title: "ID", dataIndex: "c_id", width: 80},
        {title: "教室名", dataIndex: "c_name"},
        {title: "地点", dataIndex: "address"},
        {title: "总座位", dataIndex: "c_seat_num", width: 100},
        {title: "可用座位", dataIndex: "available_seats", width: 100},
        {
            title: "禁用座位",
            render: (_: any, row: any) => {
                const summaries = seatBanSummary(row.ext_config);
                if (summaries.length === 0) return "-";
                const visible = summaries.slice(0, 3);
                return (
                    <Space size={[4, 4]} wrap>
                        {visible.map((item: string) => <Tag key={item} color="red">{item}</Tag>)}
                        {summaries.length > 3 ? <Tag>+{summaries.length - 3}</Tag> : null}
                    </Space>
                );
            }
        },
        {
            title: "操作",
            width: 180,
            render: (_: any, row: any) => (
                <Space>
                    <ModalFormUseForm
                        TableName={TABLE_NAME}
                        title={`编辑教室：${row.c_name}`}
                        type={"update"}
                        subForm={[{component: classroomForm}]}
                        dataLoader={async () => {
                            const res: any = await autolabApi.getClassroom(row.c_id);
                            return {
                                c_name: res?.c_name,
                                address: res?.address,
                                c_seat_num: res?.c_seat_num,
                                seat_ban_text: seatBanToInput(res?.ext_config)
                            };
                        }}
                        dataSubmitter={async (values: any) => {
                            const payload = await buildClassroomPayload(values);
                            return autolabApi.updateClassroom(row.c_id, payload);
                        }}
                    />
                    <TableRowDeleteButton
                        type={"inline"}
                        API={() => autolabApi.deleteClassroom(row.c_id)}
                        data={{}}
                        name={TABLE_NAME}
                    />
                </Space>
            )
        }
    ];

    return (
        <div style={{marginTop: -20, overflow: "hidden"}}>
            <Card
                size={"small"}
                bordered={true}
                title={"教室管理"}
                extra={
                    <ModalFormUseForm
                        TableName={TABLE_NAME}
                        title={"新增教室"}
                        type={"create"}
                        subForm={[{component: classroomForm}]}
                        dataSubmitter={async (values: any) => {
                            const payload = await buildClassroomPayload(values);
                            return autolabApi.createClassroom(payload);
                        }}
                    />
                }
            >
                <TableWithPagination
                    name={TABLE_NAME}
                    columns={colData}
                    API={autolabApi.listClassroomsTable}
                    size={"small"}
                    rowKey={"c_id"}
                    search={true}
                />
            </Card>
        </div>
    );
};

export default MAutolabClassroom;
