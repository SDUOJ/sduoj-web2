import { useEffect, useLayoutEffect, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import apiAddress from '../../Utils/API/apiAddress';
import { message } from 'antd';
import i18n from '../../Config/i18n';
import { parseJudgeFrame, JudgeMessage } from './judgeMessages';

export interface IWebSocket {
  queryList: string[];
  dataHandle: (data: JudgeMessage) => void;
  open: boolean;
}

export const SyncJudging = (props: IWebSocket) => {
  const handler = useRef(props.dataHandle);
  const queries = useRef(props.queryList);
  const completed = useRef(new Map<string, number>());
  const rejectedFrame = useRef(false);
  useLayoutEffect(() => {
    handler.current = props.dataHandle;
    queries.current = props.queryList;
  }, [props.dataHandle, props.queryList]);
  const { sendMessage, lastMessage, readyState } = useWebSocket(
    apiAddress().SOCKET_SERVER + '/ws/submission',
    {
      share: false,
      shouldReconnect: () => true,
      reconnectAttempts: 5,
      reconnectInterval: 1000,
    },
    props.open,
  );

  useEffect(() => {
    if (typeof lastMessage?.data !== 'string') return;
    const frame = parseJudgeFrame(lastMessage.data);
    if (frame.rejection && !rejectedFrame.current) {
      rejectedFrame.current = true;
      message.error(i18n.t('JudgeFrameRejected'));
    }
    for (const row of frame.messages) {
      if (!queries.current.includes(row[0])) continue;
      const saved = localStorage.getItem(`submissionVersion:${row[0]}`);
      const version = saved === null ? NaN : Number(saved);
      if (Number.isFinite(version) && row[1] < version) continue;
      if ((completed.current.get(row[0]) ?? -Infinity) >= row[1]) continue;
      handler.current(row);
      // Completion is per subscriber: another visible view may write the same storage version first.
      if (row[3] === -1) completed.current.set(row[0], row[1]);
    }
  }, [lastMessage]);

  useEffect(() => {
    if (props.open && readyState === ReadyState.OPEN) {
      sendMessage(JSON.stringify(props.queryList));
    }
  }, [props.open, props.queryList, readyState, sendMessage]);

  return null;
};
