import { withRouter } from 'react-router';
import { useEffect, useRef, useState } from 'react';
import { Badge, message, Modal } from 'antd';
import { useTranslation } from 'react-i18next';

const PSTakePicture = (props: any) => {
  const { t } = useTranslation();
  const problemSetId = props.match.params.problemSetId;
  const [state, setState] = useState<number>(-1);
  const [lastTime, setLastTime] = useState<number>(Date.now());
  const streamRef = useRef<MediaStream>();
  const captureTimerRef = useRef<number>();
  const monitorTimerRef = useRef<number>();
  const lastTimeRef = useRef(lastTime);
  const stateRef = useRef(state);
  const mountedRef = useRef(true);
  lastTimeRef.current = lastTime;
  stateRef.current = state;

  useEffect(() => {
    mountedRef.current = true;
    let active = true;
    let localStream: MediaStream | undefined;

    const showError = () => {
      if (!active || !mountedRef.current) return;
      setState(2);
      message.error(t('proctorErrorToast'));
    };

    const capture = async (stream: MediaStream): Promise<void> => {
      if (!active || !mountedRef.current) return;
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = window.setTimeout(() => reject(new Error('video metadata timeout')), 3000);
          video.onloadedmetadata = () => {
            window.clearTimeout(timeout);
            resolve();
          };
          video.onerror = () => {
            window.clearTimeout(timeout);
            reject(new Error('video metadata error'));
          };
        });
        await video.play().catch(() => undefined);
        if (!active || !mountedRef.current || video.videoWidth === 0 || video.videoHeight === 0) {
          throw new Error('video frame unavailable');
        }
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('canvas unavailable');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        // The backend upload contract is not available in this checkout yet. Keep the
        // capture local and make the lifecycle safe until that contract is provided.
        canvas.toDataURL('image/jpeg');
        setLastTime(Date.now());
        setState(1);
        captureTimerRef.current = window.setTimeout(() => void capture(stream), 2000);
      } catch {
        showError();
      } finally {
        video.pause();
        video.srcObject = null;
      }
    };

    if (!navigator.mediaDevices?.getDisplayMedia) {
      showError();
    } else {
      navigator.mediaDevices
        .getDisplayMedia({ video: true })
        .then((stream) => {
          if (!active || !mountedRef.current) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          localStream = stream;
          streamRef.current = stream;
          setState(0);
          setLastTime(Date.now());
          void capture(stream);
        })
        .catch(showError);
    }

    monitorTimerRef.current = window.setInterval(() => {
      if (
        stateRef.current !== -1 &&
        stateRef.current !== 2 &&
        Math.abs(lastTimeRef.current - Date.now()) > 5000
      ) {
        showError();
      }
    }, 1000);

    return () => {
      active = false;
      mountedRef.current = false;
      if (captureTimerRef.current !== undefined) window.clearTimeout(captureTimerRef.current);
      if (monitorTimerRef.current !== undefined) window.clearInterval(monitorTimerRef.current);
      (localStream ?? streamRef.current)?.getTracks().forEach((track) => track.stop());
      streamRef.current = undefined;
    };
  }, [problemSetId, t]);

  return (
    <>
      <Modal
        open={state === 2}
        title={t('proctorModalTitle')}
        footer={false}
        maskClosable={false}
        closable={false}
      >
        <div>{t('proctorModalBody')}</div>
      </Modal>
      {state === 0 && <Badge color="orange" text={t('notConnected')} />}
      {state === 1 && <Badge color="green" text={t('screenRecording')} />}
      {state === 2 && <Badge color="red" text={t('connectionFailed')} />}
    </>
  );
};

export default withRouter(PSTakePicture);
