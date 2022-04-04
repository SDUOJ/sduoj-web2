import {Button, message, Result} from "antd";
import {TimeDiff, unix2Time} from "../../Utils/Time";
import {useEffect, useState} from "react";
import {withRouter} from "react-router-dom";
import CApi from "Utils/API/c-api"
import {UrlPrefix} from "../../Config/constValue";

const TimeError = (props: any) => {

    const [sysTime, setSysTime] = useState<number>(Date.now())
    const [serTime, setSerTime] = useState<number>(Date.now())

    const add = () => {
        setSysTime(sysTime + 1000)
        setSerTime(serTime + 1000)
    }

    useEffect(() => {
        let id = setInterval(() => add(), 1000)
        return () => clearInterval(id)
    })

    useEffect(()=>{
        CApi.getTime().then((time: any)=>{
            setSerTime(parseInt(time))
            setSysTime(Date.now())
        })
    }, [])

    return (
        <div className={"page-center"}>
            {
                [''].map(()=>{
                    if(Math.abs(sysTime - serTime) < 60000){
                        return (
                            <Result
                                status="success"
                                title="您的系统时间与服务器时间误差在容许范围之内。"
                                subTitle={
                                    <>
                                        <span>系统时间：{unix2Time(sysTime)}</span> <br/>
                                        <span>服务器时间：{unix2Time(serTime)}</span> <br/>
                                        <span>时间相差：{TimeDiff(Math.min(sysTime, serTime), Math.max(sysTime, serTime))}</span>
                                    </>
                                }
                                extra={
                                    <Button
                                        type="primary"
                                        key="return"
                                        onClick={()=>{
                                            props.history.replace(UrlPrefix + "/home")
                                        }}
                                    >
                                        返回主页
                                    </Button>
                                }
                            />
                        )
                    }else{
                        return (
                            <Result
                                status="warning"
                                title="您的系统时间有误，这会影响 SDUOJ 系统的工作，请您更正当前系统时间。"
                                subTitle={
                                    <>
                                        <span>系统时间：{unix2Time(sysTime)}</span> <br/>
                                        <span>服务器时间：{unix2Time(serTime)}</span> <br/>
                                        <span>时间相差：{TimeDiff(Math.min(sysTime, serTime), Math.max(sysTime, serTime))}</span>
                                    </>
                                }
                                extra={
                                    <Button
                                        type="primary"
                                        key="retry"
                                        onClick={()=>{
                                            CApi.getTime().then((time: any)=>{
                                                setSerTime(parseInt(time))
                                                setSysTime(Date.now())
                                                message.success("时间同步成功")
                                            })
                                        }}
                                    >
                                        点击重试
                                    </Button>
                                }
                            />
                        )
                    }
                })
            }
        </div>
    )
}

export default withRouter(TimeError)