export default function apiAddress() {
    if (process.env.NODE_ENV === 'development') return {
        CLIENT_SERVER: 'http://api.oj.cs.sdu.edu.cn:8080',
        MANAGE_SERVER: 'http://api.oj.cs.sdu.edu.cn:8080',
        EXAM_SERVER: 'http://api.oj.cs.sdu.edu.cn:8080',
        FRONT_SERVER: 'http://oj.cs.sdu.edu.cn'
    }
    return {
        CLIENT_SERVER: '',
        MANAGE_SERVER: '//',
        EXAM_SERVER:'http://127.0.0.1:8000',
        FRONT_SERVER: 'http://localhost:3000'
    }
}
