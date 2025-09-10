import {Button, Result} from "antd";
import {TimeDiff, unix2Time} from "../../Utils/Time";
import {useEffect, useState} from "react";
import {withRouter} from "react-router-dom";
import {UrlPrefix} from "../../Config/constValue";
import cApi from "Utils/API/c-api";
import {useTranslation} from "react-i18next";

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

    const update = ()=>{
        setSerTime(parseInt(localStorage.getItem("server-time") ?? "0"))
        setSysTime(Date.now())
    }

    useEffect(() => {
        update()
    }, [])

    const {t} = useTranslation();
    return (
        <div className={"page-center"}>
            {
                [''].map(() => {
                    if (Math.abs(sysTime - serTime) < 60000) {
                        return (
                            <Result
                                status="success"
                title={t("timeOkTitle")}
                                subTitle={
                                    <>
                    <span>{t('systemTime')}{unix2Time(sysTime)}</span> <br/>
                    <span>{t('serverTime')}{unix2Time(serTime)}</span> <br/>
                    <span>{t('timeDiff')}{TimeDiff(Math.min(sysTime, serTime), Math.max(sysTime, serTime))}</span>
                                    </>
                                }
                                extra={
                                    <Button
                                        type="primary"
                                        key="return"
                                        onClick={() => {
                                            props.history.replace(UrlPrefix + "/home")
                                        }}
                                    >
                    {t("backToHome")}
                                    </Button>
                                }
                            />
                        )
                    } else {
                        return (
                            <Result
                                status="warning"
                title={t("timeErrorTitle")}
                                subTitle={
                                    <>
                    <span>{t('systemTime')}{unix2Time(sysTime)}</span> <br/>
                    <span>{t('serverTime')}{unix2Time(serTime)}</span> <br/>
                    <span>{t('timeDiff')}{TimeDiff(Math.min(sysTime, serTime), Math.max(sysTime, serTime))}</span>
                                    </>
                                }
                                extra={
                                    <Button
                                        type="primary"
                                        key="retry"
                                        onClick={() => {
                                            cApi.getCopyright().then(()=>{
                                                update()
                                            })
                                        }}
                                    >
                    {t("clickRetry")}
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
