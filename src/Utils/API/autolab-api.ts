import request from "./request";

const autolabApi = {
    // Classroom
    createClassroom: async (data: any) => request.post('/ps/class/create', data),
    getClassroom: async (classroomId: number) => request.get(`/ps/class/${classroomId}`),
    listClassrooms: async (data: any) => request.post('/ps/class/list', data),
    listClassroomsTable: async (data: any) => {
        const res: any = await request.post('/ps/class/list', {
            pageNow: data?.pageNow,
            pageSize: data?.pageSize,
            keyword: data?.keyword ?? data?.searchKey
        });
        return {
            rows: res?.rows ?? [],
            totalNum: res?.totalNum ?? 0
        };
    },
    updateClassroom: async (classroomId: number, data: any) => request.post(`/ps/class/${classroomId}/update`, data),
    deleteClassroom: async (classroomId: number) => request.post(`/ps/class/${classroomId}/delete`, {}),

    // Course
    createCourse: async (data: any) => request.post('/ps/course/create', data),
    updateCourse: async (courseId: number, data: any) => request.post(`/ps/course/${courseId}/update`, data),
    deleteCourse: async (courseId: number) => request.post(`/ps/course/${courseId}/delete`, {}),
    getCourse: async (courseId: number) => request.get(`/ps/course/${courseId}`),
    listCourses: async (data: any) => request.post('/ps/course/list', data),
    listMyCourses: async (data: any) => request.post('/ps/course/my/list', data),
    listCoursesTable: async (data: any) => {
        const res: any = await request.post('/ps/course/list', {
            group_id: data?.group_id,
            tag: data?.tag,
            page_now: data?.pageNow,
            page_size: data?.pageSize
        });
        return {
            rows: res?.rows ?? res?.courses ?? [],
            totalNum: res?.totalNum ?? res?.total ?? 0
        };
    },
    assignClassrooms: async (courseId: number, data: any) => request.post(`/ps/course/${courseId}/assign-classrooms`, data),

    // TA
    addTA: async (courseId: number, data: any) => request.post(`/ps/course/${courseId}/add-ta`, data),
    listTA: async (courseId: number) => request.get(`/ps/course/${courseId}/tas`),
    updateTA: async (courseId: number, taId: number, data: any) => request.post(`/ps/course/${courseId}/ta/${taId}/update`, data),
    deleteTA: async (taId: number) => request.post(`/ps/course/ta/${taId}/delete`, {}),
    listCourseStudents: async (courseId: number) => request.get(`/ps/course/${courseId}/students`),
    bindTAStudents: async (courseId: number, data: any) => request.post(`/ps/course/${courseId}/ta/bind-students`, data),

    // Schedule
    addSchedule: async (data: any) => request.post('/ps/schedule/add', data),
    listSchedule: async (data: any) => request.post('/ps/schedule/list', data),
    getSchedule: async (scheduleId: number) => request.get(`/ps/schedule/${scheduleId}`),
    updateSchedule: async (scheduleId: number, data: any) => request.post(`/ps/schedule/${scheduleId}/update`, data),
    deleteSchedule: async (scheduleId: number) => request.post(`/ps/schedule/${scheduleId}/delete`, {}),
    listCourseTimes: async (courseId: number) => request.get(`/ps/course/${courseId}/times`),
    addCourseTime: async (courseId: number, data: any) => request.post(`/ps/course/${courseId}/times/add`, data),
    updateCourseTime: async (courseId: number, timeId: number, data: any) => request.post(`/ps/course/${courseId}/times/${timeId}/update`, data),
    deleteCourseTime: async (courseId: number, timeId: number) => request.post(`/ps/course/${courseId}/times/${timeId}/delete`, {}),

    // Seat
    autoAssignSeats: async (data: any) => request.post('/ps/seat/auto-assign', data),
    getAutoAssignOptions: async (courseId: number) => request.get(`/ps/seat/${courseId}/auto-assign-options`),
    assignSeat: async (courseId: number, data: any) => request.post(`/ps/seat/${courseId}/assign`, data),
    getSeatMap: async (courseId: number) => request.get(`/ps/seat/${courseId}/map`),
    getUserSeat: async (courseId: number, username: string) => request.get(`/ps/seat/${courseId}/user/${username}`),
    deleteSeat: async (courseId: number, username: string) => request.post(`/ps/seat/${courseId}/user/${username}/delete`, {}),

    // Attendance
    initAttendance: async (courseId: number, scheduleId: number, data: any) => request.post(`/ps/attendance/${courseId}/${scheduleId}/init`, data),
    getAttendance: async (sgId: number) => request.get(`/ps/attendance/${sgId}`),
    getStudentAttendanceRecords: async (username: string, data: any) => request.get(`/ps/attendance/student/${username}/records`, data),
    signIn: async (sgId: number, data: any) => request.post(`/ps/attendance/${sgId}/sign-in`, data),
    submitLeave: async (sgId: number, username: string, data: any) => request.post(`/ps/attendance/${sgId}/leave`, data, { params: { username } }),
    reviewLeave: async (sgId: number, data: any) => request.post(`/ps/attendance/${sgId}/review-leave`, data),
    updateSignMode: async (sgId: number, data: any) => request.post(`/ps/attendance/${sgId}/update-mode`, data),
    markAbsence: async (sgId: number, username: string) => request.post(`/ps/attendance/${sgId}/mark-absence`, {}, { params: { username } }),
    recordAttendance: async (sgId: number, data: any) => request.post(`/ps/attendance/${sgId}/record`, data),

    // Token
    generateToken: async (sgId: number, data: any) => request.post(`/ps/attendance/${sgId}/token`, data),
    verifyToken: async (data: any) => request.post('/ps/attendance/verify-token', data),
}

export default autolabApi;
