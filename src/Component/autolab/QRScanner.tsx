import React, {useEffect, useRef} from "react";
import {Modal} from "antd";
import {BrowserMultiFormatReader} from "@zxing/browser";

interface QRScannerProps {
    open: boolean;
    onClose: () => void;
    onResult: (text: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({open, onClose, onResult}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (!open) return;
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;
        
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                reader.decodeFromVideoDevice(undefined, videoRef.current as HTMLVideoElement, (result: any, err: any) => {
                    if (result) {
                        onResult(result.getText());
                    }
                }).catch(() => {
                    // ignore
                });
            })
            .catch(() => {
                // ignore
            });
        
        return () => {
            // Stop all tracks in the stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            readerRef.current = null;
            streamRef.current = null;
        };
    }, [open, onResult]);

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            title="扫码签到"
            destroyOnHidden={true}
        >
            <video ref={videoRef} style={{width: "100%"}} />
        </Modal>
    );
};

export default QRScanner;
