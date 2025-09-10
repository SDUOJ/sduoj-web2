import {withRouter} from "react-router";
import {useEffect, useState} from "react";
import {Badge, message, Modal} from "antd";
import {useTranslation} from "react-i18next";
import {data} from "browserslist";

const PSTakePicture = (props: any) => {
    const { t } = useTranslation()
    const problemSetId = props.match.params.problemSetId
    const [stream, setStream] = useState<any>()
    const [state, setState] = useState<number>(-1)
    const [lastTime, setLastTime] = useState<number>(Date.now())

    useEffect(() => {
        navigator.mediaDevices.getDisplayMedia({video: true}).then((streams) => {
            setStream(streams)

            setState(0)
            setLastTime(Date.now())
            sendPicture()
        }).catch((error) => {
            console.error(error);
            showError()
        });
    }, [problemSetId])


    const showError = () => {
        setState(2)
        message.error(t("proctorErrorToast"))
    }

    const check = () => {
        console.log("+++", state, lastTime, Date.now(), Math.abs(lastTime - Date.now()))
        if (state !== -1 && Math.abs(lastTime - Date.now()) > 5000) {
            if(state !== 2){
                showError()
            }
        }
    }

    useEffect(() => {
        let intervalId = setInterval(() => check(), 1000)
        return () => clearInterval(intervalId)
    })

    const sendPicture = async () => {
        try {
            const video = document.createElement("video");
            video.srcObject = stream;
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            if (ctx !== null) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const jpgImg = canvas.toDataURL();
                // TODO 没法正常拿到视频数据
                console.log("===", Date.now(), jpgImg.toString())
                setLastTime(Date.now())
            }
            setTimeout(sendPicture, 2000);
            setState(1)
        } catch (e: any) {
            showError()
        }

    }

    return (
        <>
            <Modal
                visible={state === 2}
                title={t("proctorModalTitle")}
                footer={false}
                maskClosable={false}
                closable={false}
            >
                <div>
                    {t("proctorModalBody")}
                </div>

            </Modal>
            {state === 0 && (
                <Badge color={"orange"} text={t("notConnected")}/>
            )}
            {state === 1 && (
                <Badge color={"green"} text={t("screenRecording")}/>
            )}
            {state === 2 && (
                <Badge color={"red"} text={t("connectionFailed")}/>
            )}
        </>
    )
}

export default withRouter(PSTakePicture)

