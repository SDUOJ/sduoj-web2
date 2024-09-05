import { useEffect } from 'react';
import cApi from "Utils/API/c-api";
import html2canvas from 'html2canvas';
import {useSelector} from "react-redux";

const ScreenshotComponent = (props: any) => {
    const userInfo = useSelector((state: any) => state.UserReducer?.userInfo);

    const bs_id = props.match.params.problemSetId
    const u_name = userInfo.username
    const u_id = parseInt(userInfo.userId, 10)
    const token = generateToken(userInfo.userid)

    useEffect(() => {
        const takeScreenshot = async () => {
            try {
                // 使用html2canvas来截取屏幕
                const element = document.body; // 你可以根据需要选择不同的元素
                const canvas = await html2canvas(element, { scale: window.devicePixelRatio });

                canvas.toBlob(async (blob) => {
                    if (blob) {
                        const formData = new FormData();
                        formData.append('token', token);
                        formData.append('pic', blob, 'screenshot.jpg');

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

function generateToken(username: string) {
    const date = new Date();
    const formattedDate = date.toISOString().replace(/[-:.TZ]/g, '').substring(0, 14);
    return `${username}#${formattedDate}`;
}
