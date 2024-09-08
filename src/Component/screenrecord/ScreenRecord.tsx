import { useEffect } from 'react';
import cApi from "Utils/API/c-api";
import { useSelector } from "react-redux";

const ScreenshotComponent = (props: any) => {
    const userInfo = useSelector((state: any) => state.UserReducer?.userInfo);

    const bs_id = props.match.params.problemSetId;
    const u_name = userInfo.username;
    const u_id = parseInt(userInfo.userId, 10);
    const token = generateToken(userInfo.userid);

    useEffect(() => {
        let mediaRecorder: MediaRecorder;
        let recordedBlobs: Blob[] = [];

        const startRecording = async () => {
            try {
                const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                mediaRecorder = new MediaRecorder(displayStream, { mimeType: 'video/webm' });

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data && event.data.size > 0) {
                        recordedBlobs.push(event.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    const blob = new Blob(recordedBlobs, { type: 'video/webm' });
                    const formData = new FormData();
                    formData.append('token', token);
                    formData.append('video', blob, 'recordedVideo.webm');

                    const data: any = await cApi.addFrame(formData);
                    console.log(data);
                    if (data === "无此视频记录") {
                        const recordData = {
                            bs_id,
                            u_name,
                            u_id,
                            token,
                        };
                        await cApi.addRecord(recordData);
                        await cApi.addFrame(formData);
                    } else if (data === "视频正在导出") {
                        console.log('视频正在导出');
                    }
                };

                mediaRecorder.start(1000); // Collect data in chunks every 1000ms
            } catch (error) {
                console.error('Error capturing screen:', error);
            }
        };

        startRecording();

        const intervalId = setInterval(() => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
                startRecording(); // Restart the recording
            }
        }, 5000);

        return () => {
            if (mediaRecorder) {
                mediaRecorder.stop();
            }
            clearInterval(intervalId);
        };
    }, [bs_id, u_name, u_id, token]);

    return null;
};

export default ScreenshotComponent;

function generateToken(username: string) {
    const date = new Date();
    const formattedDate = date.toISOString().replace(/[-:.TZ]/g, '').substring(0, 14);
    return `${username}#${formattedDate}`;
}
