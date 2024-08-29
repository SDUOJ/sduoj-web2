import { useEffect } from 'react';
import cApi from "Utils/API/c-api";

const ScreenshotComponent = ({
    bs_id,
    u_name,
    u_id,
    token
}: {
    bs_id: number;
    u_name: string;
    u_id: number;
    token: string;
}) => {
    useEffect(() => {
        const takeScreenshot = async () => {
            try {
                // 使用getDisplayMedia来截取屏幕
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true
                });

                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();

                await new Promise(resolve => {
                    video.onloadedmetadata = () => {
                        resolve(null);
                    };
                });

                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx:any = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                stream.getVideoTracks().forEach(track => track.stop());

                canvas.toBlob(async (blob) => {
                    if (blob) {
                        const formData = new FormData();
                        formData.append('token', token);
                        formData.append('pic', blob, 'screenshot.jpg');

                        const data: any = await cApi.addFrame(formData);
                        if (data === "无此视频记录") {
                            const recordData = {
                                bs_id,
                                u_name,
                                u_id,
                                token,
                            };
                            await cApi.addRecord(recordData);
                            await cApi.addFrame(formData);
                        }
                        else if (data === "视频正在导出") {
                            console.log('视频正在导出');
                        }
                    }
                }, 'image/jpeg');
            } catch (error) {
                console.error('Error capturing screen:', error);
            }
        };

        const intervalId = setInterval(takeScreenshot, 5000);

        return () => clearInterval(intervalId);
    }, [bs_id, u_name, u_id, token]);

    return null;
};

export default ScreenshotComponent;
