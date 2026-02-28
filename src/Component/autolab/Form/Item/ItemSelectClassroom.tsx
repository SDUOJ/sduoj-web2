import React, {useEffect, useMemo, useState} from "react";
import {Form, Select} from "antd";

import autolabApi from "../../../../Utils/API/autolab-api";

interface ClassroomOption {
    value: number;
    label: string;
}

const ItemSelectClassroom = (props: any) => {
    const [options, setOptions] = useState<ClassroomOption[]>([]);
    const [loading, setLoading] = useState(false);

    const form = Form.useFormInstance();
    const selected = Form.useWatch(props.name, form);

    const selectedIds = useMemo(() => {
        if (!Array.isArray(selected)) return [] as number[];
        return Array.from(new Set(selected
            .map((item: any) => Number(item))
            .filter((item: number) => Number.isInteger(item) && item > 0)));
    }, [selected]);

    const mergeOptions = (incoming: ClassroomOption[]) => {
        setOptions((prev) => {
            const m = new Map<number, ClassroomOption>();
            prev.forEach((item) => m.set(item.value, item));
            incoming.forEach((item) => m.set(item.value, item));
            return Array.from(m.values()).sort((a, b) => a.value - b.value);
        });
    };

    const toOption = (row: any): ClassroomOption => ({
        value: Number(row.c_id),
        label: `${row.c_id}: ${row.c_name}${row.address ? ` (${row.address})` : ""}`,
    });

    const queryClassrooms = async (keyword: string) => {
        setLoading(true);
        try {
            const res: any = await autolabApi.listClassrooms({
                pageNow: 1,
                pageSize: 100,
                keyword,
            });
            const rows = Array.isArray(res?.rows) ? res.rows : [];
            mergeOptions(rows.map(toOption));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        queryClassrooms("");
    }, []);

    useEffect(() => {
        if (selectedIds.length === 0) return;
        const missing = selectedIds.filter((id) => options.find((item) => item.value === id) === undefined);
        if (missing.length === 0) return;

        Promise.all(missing.map((cId) => autolabApi.getClassroom(cId).catch(() => null))).then((list: any[]) => {
            const valid = list.filter((item: any) => item && item.c_id !== undefined).map(toOption);
            if (valid.length > 0) mergeOptions(valid);
        });
    }, [selectedIds.join(","), options]);

    return (
        <Form.Item label={props.label} name={props.name} help={props.help} required={props.required}>
            <Select
                mode={props.mode ?? "multiple"}
                showSearch
                allowClear
                filterOption={false}
                onSearch={(value) => queryClassrooms(value)}
                onFocus={() => queryClassrooms("")}
                options={options}
                placeholder={props.placeholder ?? "请输入关键字检索教室"}
                loading={loading}
            />
        </Form.Item>
    );
};

export default ItemSelectClassroom;
