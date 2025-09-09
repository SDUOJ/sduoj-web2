export default function apiAddress() {
    const port = "8080"

    if (process.env.NODE_ENV === 'development') return {
        CLIENT_SERVER: 'http://api.test.sduoj.com:' + port,
        MANAGE_SERVER: 'http://api.test.sduoj.com:'+ port,
        FRONT_SERVER: 'http://test.sduoj.com:3000',
        SOCKET_SERVER: 'ws://api.test.sduoj.com:' + port
    }
    return {
        CLIENT_SERVER: 'https://oj.qd.sdu.edu.cn',
        MANAGE_SERVER: 'https://oj.qd.sdu.edu.cn',
        FRONT_SERVER: 'https://oj.qd.sdu.edu.cn',
        SOCKET_SERVER: "wss://oj.qd.sdu.edu.cn"
    }
}
