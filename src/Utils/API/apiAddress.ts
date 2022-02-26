export default function apiAddress() {
    // if (process.env.NODE_ENV === 'development') return {
    //     CLIENT_SERVER: 'http://api.oj.cs.sdu.edu.cn:8080',
    //     MANAGE_SERVER: 'http://api.oj.cs.sdu.edu.cn:8080',
    //     EXAM_SERVER: 'http://api.oj.cs.sdu.edu.cn:8080',
    //     FRONT_SERVER: 'http://oj.cs.sdu.edu.cn:3000',
    //     SOCKET_SERVER: "ws://api.oj.cs.sdu.edu.cn:8080"
    // }
    if (process.env.NODE_ENV === 'development') return {
        CLIENT_SERVER: 'http://api.oj.cs.sdu.edu.cn:9005',
        MANAGE_SERVER: 'http://api.oj.cs.sdu.edu.cn:9005',
        EXAM_SERVER: 'http://api.oj.cs.sdu.edu.cn:9005',
        FRONT_SERVER: 'http://api.oj.cs.sdu.edu.cn:9005',
        SOCKET_SERVER: 'ws://api.oj.cs.sdu.edu.cn:9005'
    }
    return {
        CLIENT_SERVER: 'https://oj.qd.sdu.edu.cn',
        MANAGE_SERVER: 'https://oj.qd.sdu.edu.cn',
        EXAM_SERVER:'https://oj.qd.sdu.edu.cn',
        FRONT_SERVER: 'https://oj.qd.sdu.edu.cn',
        SOCKET_SERVER: "wss://oj.qd.sdu.edu.cn"
    }
}
