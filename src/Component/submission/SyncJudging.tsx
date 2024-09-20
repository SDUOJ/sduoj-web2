import React, {useEffect} from 'react';
import useWebSocket, {ReadyState} from 'react-use-websocket';
import apiAddress from "../../Utils/API/apiAddress";
import {isValueEmpty} from "../../Utils/empty";

export interface IWebSocket {
    queryList: string[]
    dataHandle: any
    open: boolean
}

export const SyncJudging = (props: IWebSocket) => {
    const {sendMessage, lastMessage, readyState} = useWebSocket(
        apiAddress().SOCKET_SERVER + "/ws/submission", {share: false}, props.open
    );

    useEffect(() => {
        if (lastMessage !== null) {
            if (lastMessage.data.length > 2) {
                const data = JSON.parse(lastMessage.data)
                if (data instanceof Array && data[0] instanceof Array) {
                    // 记录每个评测记录的最高版本
                    const versionMap = new Map<string, number>()
                    for (const x of data) {
                        versionMap.set(x[0], versionMap.has(x[0]) ? Math.max(versionMap.get(x[0])!, x[1]) : x[1])
                    }
                    // 仅更新最新版本的评测记录
                    for (const x of data) {
                        if (x[1] === versionMap.get(x[0])){
                            let vers = localStorage.getItem(`submissionVersion:${x[0]}`)
                            if (isValueEmpty(vers) || x[1] > parseInt(vers!)) {
                                props.dataHandle(x)
                            }
                        }
                    }
                } else {
                    props.dataHandle(JSON.parse(data))
                }
            }
        }
    }, [lastMessage]);

    useEffect(() => {
        if (props.open && readyState === ReadyState.OPEN) {
            sendMessage(JSON.stringify(props.queryList))
        }
    }, [props.queryList, readyState])

    // const connectionStatus = {
    //     [ReadyState.CONNECTING]: '连接中',
    //     [ReadyState.OPEN]: '已连接',
    //     [ReadyState.CLOSING]: '关闭中',
    //     [ReadyState.CLOSED]: '已关闭',
    //     [ReadyState.UNINSTANTIATED]: '未知',
    // }[readyState];

    return (
        <>
            {/*<span>(连接状态：{connectionStatus})</span>*/}
        </>
    );
};
