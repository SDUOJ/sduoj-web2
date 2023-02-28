export default function apiAddress() {
    // const port = "9005"
    const port = "8889"
    //jym的测试端口
    // const port = "20000"
    //sjq开的端口
    // const port = "20001"

    // if (process.env.NODE_ENV === 'development') return {
    //     CLIENT_SERVER: 'http://api.oj.cs.sdu.edu.cn:8080',
    //     MANAGE_SERVER: 'http://api.oj.cs.sdu.edu.cn:8080',
    //     EXAM_SERVER: 'http://api.oj.cs.sdu.edu.cn:8080',
    //     FRONT_SERVER: 'http://oj.cs.sdu.edu.cn:3000',
    //     SOCKET_SERVER: "ws://api.oj.cs.sdu.edu.cn:8080"
    // }
    if (process.env.NODE_ENV === 'development') return {
        CLIENT_SERVER: 'https://oj.cs.sdu.edu.cn:' + port,
        MANAGE_SERVER: 'https://oj.cs.sdu.edu.cn:' + port,
        EXAM_SERVER: 'https://oj.cs.sdu.edu.cn:' + port,
        FRONT_SERVER: 'https://oj.cs.sdu.edu.cn:3000',
        SOCKET_SERVER: 'wss://oj.cs.sdu.edu.cn:' + port
    }
    // return {
    //     CLIENT_SERVER: 'http://exam.yhf2000.cn:9000',
    //     MANAGE_SERVER: 'http://exam.yhf2000.cn:9000',
    //     EXAM_SERVER: 'http://exam.yhf2000.cn:9000',
    //     FRONT_SERVER: 'http://exam.yhf2000.cn',
    //     SOCKET_SERVER: "ws://exam.yhf2000.cn:9000"
    // }
    return {
        CLIENT_SERVER: 'https://oj.qd.sdu.edu.cn',
        MANAGE_SERVER: 'https://oj.qd.sdu.edu.cn',
        EXAM_SERVER: 'https://oj.qd.sdu.edu.cn',
        FRONT_SERVER: 'https://oj.qd.sdu.edu.cn',
        SOCKET_SERVER: "wss://oj.qd.sdu.edu.cn"
    }
}
