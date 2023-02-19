import request from "./request";

export default {
    // 课程相关接口
    createCourse: async (data: any) => {
        return request.post('/hws/course/add', data);
    },
    editCourse: async (data: any) => {
        return request.post('/hws/course/edit', data);
    },
    getCourseList: async (data: any) => {
        return request.post('/hws/course/list', data);
    },
    getCourseInfo: async (data: any) => {
        return request.post('/hws/course/info', data);
    },

    // 作业相关接口
    createHomework: async (data: any) => {
        return request.post('/hws/hw/add', data);
    },
    editHomework: async (data: any) => {
        return request.post('/hws/hw/edit', data);
    },
    getHomeworkList: async (data: any) => {
        return request.post('/hws/hw/list', data);
    },
    getHomeworkListAll: async (data: any) => {
        return request.post('/hws/hw/list_all', data);
    },

    // 提交相关接口
    downloadHomework: async (data: any) => {
        return request.post('/hws/hw/download', data);
    },
    hwSubmit: async (data: any) => {
        return request.post('/hws/submit/add', data);
    },
    hwPreSubmit: async (data: any) => {
        return request.post('/hws/submit/add-pre', data);
    },
    getPreSubmit: async (data: any) => {
        return request.post('/hws/submit/list_pre', data);
    },
    hwCancelSubmit: async (data: any) => {
        return request.post('/hws/submit/cancel', data);
    },
    hwDeleteSubmit: async (data: any) => {
        return request.post('/hws/submit/delete', data);
    },
    hwSubmitMove: async (data: any) =>{
        return request.post('/hws/submit/move', data);
    }

}
