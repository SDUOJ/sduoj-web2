import React, {useCallback, useEffect, useState} from 'react';
import useWebSocket, {ReadyState} from 'react-use-websocket';
import apiAddress from "../../Utils/API/apiAddress";
import {array} from "js-md5";

export interface IWebSocket{
    running: number
    queryList: string[]
    dataHandle: any
}

export const SyncJudging = (props: IWebSocket) => {
    const {sendMessage, lastMessage, readyState} = useWebSocket(apiAddress().SOCKET_SERVER + "/ws/submission");

    useEffect(() => {
        if (lastMessage !== null) {
            if(lastMessage.data.length > 2){
                const data = JSON.parse(lastMessage.data)
                if(data instanceof Array && data[0] instanceof Array){
                    for(const x of data) props.dataHandle(x)
                }else{
                    props.dataHandle(JSON.parse(data))
                }
            }
        }
    }, [lastMessage]);

    useEffect(()=>{
        if(props.running > 0 && readyState === ReadyState.OPEN){
            sendMessage(JSON.stringify(props.queryList))
        }
    }, [props.running, props.queryList, readyState])

    const connectionStatus = {
        [ReadyState.CONNECTING]: '连接中',
        [ReadyState.OPEN]: '已连接',
        [ReadyState.CLOSING]: '关闭中',
        [ReadyState.CLOSED]: '已关闭',
        [ReadyState.UNINSTANTIATED]: '未知',
    }[readyState];

    return (
        <span>(连接状态：{connectionStatus})</span>
    );
};