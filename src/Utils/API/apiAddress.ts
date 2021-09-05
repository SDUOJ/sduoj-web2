export default function apiAddress() {
    if (process.env.NODE_ENV === 'development') return {
        CLIENT_SERVER: 'http://api.oj.cs.sdu.edu.cn:8080',
        MANAGE_SERVER: '//manage.oj.cs.sdu.edu.cn:8081'
    }
    return {
        CLIENT_SERVER: '',
        MANAGE_SERVER: '//'
    }
}
