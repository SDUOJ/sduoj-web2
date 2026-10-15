import { ReactNode, useEffect, useState } from 'react';
import { Grid, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import SplitPane from './SplitPane';
import './answerIde.css';

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
  return (
    <div className={`ide-mobile-layout${narrow ? ' ide-layout-narrow' : ''}`}>
      <div style={{ display: narrow ? undefined : 'none' }}>
        <Tabs
          activeKey={layout.tab}
          onChange={(tab) => setLayout((previous) => ({ ...previous, tab }))}
          items={[
            { key: 'statement', label: t('answerIde.statement') },
            { key: 'code', label: t('answerIde.code') },
          ]}
        />
      </div>
      <SplitPane
        firstHidden={narrow && layout.tab !== 'statement'}
        secondHidden={narrow && layout.tab !== 'code'}
        label={t('answerIde.statementWidth')}
        ratio={layout.ratio}
        onChange={(ratio) => setLayout((previous) => ({ ...previous, ratio }))}
        first={props.statement}
        second={props.workspace}
      />
    </div>
  );
}
