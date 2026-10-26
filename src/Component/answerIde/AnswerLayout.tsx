import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Button, Grid } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import SplitPane from './SplitPane';
import './answerIde.css';

const ToolbarHostContext = createContext<HTMLElement | null>(null);
export const useAnswerToolbarHost = () => useContext(ToolbarHostContext);

export default function AnswerLayout(props: {
  identity: string;
  statement: ReactNode;
  workspace: ReactNode;
}) {
  const { t } = useTranslation();
  const screens = Grid.useBreakpoint();
  const storageKey = `answerIde:layout:${props.identity}`;
  const [layout, setLayout] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
      const ratio = saved?.ratio ?? (saved?.width ? (saved.width / 24) * 100 : 50);
      return {
        ratio: Number.isFinite(ratio) && ratio >= 25 && ratio <= 80 ? ratio : 50,
        tab: saved?.tab === 'code' ? 'code' : 'statement',
      };
    } catch {
      return { ratio: 50, tab: 'statement' };
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(layout));
    } catch {
      /* Layout persistence is optional. */
    }
  }, [layout, storageKey]);
  const narrow = screens.lg === false;
  const [toolbarHost, setToolbarHost] = useState<HTMLDivElement | null>(null);
  return (
    <div className={`ide-mobile-layout${narrow ? ' ide-layout-narrow' : ''}`}>
      <div className="ide-narrow-toolbar" style={{ display: narrow ? undefined : 'none' }}>
        <Button
          className="ide-pane-switch"
          icon={
            layout.tab === 'code' ? (
              <ArrowLeftOutlined aria-hidden />
            ) : (
              <ArrowRightOutlined aria-hidden />
            )
          }
          onClick={() =>
            setLayout((previous) => ({
              ...previous,
              tab: previous.tab === 'code' ? 'statement' : 'code',
            }))
          }
        >
          {t(layout.tab === 'code' ? 'answerIde.statement' : 'answerIde.code')}
        </Button>
        <div className="ide-toolbar-host" ref={setToolbarHost} />
      </div>
      <ToolbarHostContext.Provider value={narrow ? toolbarHost : null}>
        <SplitPane
          firstHidden={narrow && layout.tab !== 'statement'}
          secondHidden={narrow && layout.tab !== 'code'}
          label={t('answerIde.statementWidth')}
          ratio={layout.ratio}
          onChange={(ratio) => setLayout((previous) => ({ ...previous, ratio }))}
          first={props.statement}
          second={props.workspace}
        />
      </ToolbarHostContext.Provider>
    </div>
  );
}
