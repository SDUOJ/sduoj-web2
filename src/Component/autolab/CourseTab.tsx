import React, {useEffect, useMemo, useState} from "react";
import {Card, Tabs, Empty, Select, Space, Spin} from "antd";
import autolabApi from "../../Utils/API/autolab-api";
import CourseDetail from "./CourseDetail";

interface CourseTabProps {
    groupId: number | string;
    username?: string;
    members?: any[];
}

const CourseTab: React.FC<CourseTabProps> = ({groupId, username, members}) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [courses, setCourses] = useState<any[]>([]);
    const [activeKey, setActiveKey] = useState<string | undefined>();
    const [selectedUsername, setSelectedUsername] = useState<string | undefined>(username);

    const numericGroupId = useMemo(
        () => (typeof groupId === "string" ? parseInt(groupId, 10) : groupId),
        [groupId]
    );

    const loadCourses = () => {
        if (!selectedUsername || !numericGroupId) {
            setCourses([]);
            return;
        }
        setLoading(true);
        autolabApi.listMyCourses({
            group_id: numericGroupId,
            target_username: selectedUsername,
            page_now: 1,
            page_size: 100
        }).then((res: any) => {
            const list = Array.isArray(res?.courses) ? res.courses : [];
            list.sort((a: any, b: any) => String(a?.course_name ?? "").localeCompare(String(b?.course_name ?? "")));
            setCourses(list);
            if (list.length === 0) {
                setActiveKey(undefined);
                return;
            }
            const nextActiveKey = list[0].course_id?.toString();
            const stillExists = list.some((item: any) => item.course_id?.toString() === activeKey);
            setActiveKey(stillExists ? activeKey : nextActiveKey);
        }).finally(() => setLoading(false));
    };

    useEffect(() => {
        setSelectedUsername(username);
    }, [username]);

    useEffect(() => {
        if (groupId !== undefined && selectedUsername) loadCourses();
    }, [groupId, selectedUsername]);

    const canViewOtherStudents = useMemo(
        () => (courses ?? []).some((item: any) => item?.can_manage === true),
        [courses]
    );
    const showStudentSelector = canViewOtherStudents || (selectedUsername && username && selectedUsername !== username);

    const studentOptions = useMemo(() => {
        const rows = (members ?? []).map((item: any) => ({
            value: item?.username,
            label: item?.nickname ? `${item.username}(${item.nickname})` : item?.username
        })).filter((item: any) => !!item.value);
        if (username && rows.find((item: any) => item.value === username) === undefined) {
            rows.unshift({value: username, label: username});
        }
        return rows;
    }, [members, username]);

    if (loading) return <Spin/>;

    return (
        <Card size="small" style={{marginTop: 12}}>
            {showStudentSelector && (
                <Space style={{marginBottom: 12}}>
                    <span>查看学生：</span>
                    <Select
                        style={{minWidth: 260}}
                        value={selectedUsername}
                        options={studentOptions}
                        onChange={(value: string) => setSelectedUsername(value)}
                        showSearch
                        optionFilterProp="label"
                    />
                </Space>
            )}
            {(!courses || courses.length === 0) ? (
                <Empty description="暂无课程" />
            ) : (
                <Tabs
                    activeKey={activeKey}
                    onChange={(key) => setActiveKey(key)}
                    items={courses.map((course: any) => ({
                        key: course.course_id?.toString(),
                        label: `${course.course_name ?? ''}`,
                        children: (
                            <CourseDetail
                                course={course}
                                targetUsername={selectedUsername}
                                currentUsername={username}
                            />
                        )
                    }))}
                />
            )}
        </Card>
    );
};

export default CourseTab;
