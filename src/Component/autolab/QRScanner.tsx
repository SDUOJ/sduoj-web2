import React, { useEffect, useRef } from 'react';
import { Modal } from 'antd';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onResult: (text: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ open, onClose, onResult }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    if (!open) return;
    let active = true;
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader
      .decodeFromConstraints(
        { video: { facingMode: 'environment' } },
        videoRef.current as HTMLVideoElement,
        (result) => {
          if (active && result) onResultRef.current(result.getText());
        },
      )
      .then((controls) => {
        if (!active) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      })
      .catch(() => {
        // ignore
      });

    return () => {
      active = false;
      controlsRef.current?.stop();
      controlsRef.current = null;
      readerRef.current = null;
    };
  }, [open]);

  return (
    <Modal open={open} onCancel={onClose} footer={null} title="扫码签到" destroyOnHidden={true}>
      <video ref={videoRef} style={{ width: '100%' }} />
    </Modal>
  );
};

export default QRScanner;
