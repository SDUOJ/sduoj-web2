import { useState } from 'react';
import { Button, Empty, Grid, Spin } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export type ContextProblemGroup = {
  key: string;
  title?: string;
  items: Array<{ key: string; number: string; title: string; href: string; answered?: boolean }>;
};

export default function ContextProblemMenu(props: {
  title?: string;
  groups: ContextProblemGroup[];
  activeKey: string;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const screens = Grid.useBreakpoint();
  const [collapsed, setCollapsed] = useState<boolean>();
  const compact = collapsed ?? screens.md === false;
  return (
    <aside className={`context-ide-sidebar${compact ? ' context-ide-sidebar-compact' : ''}`}>
      <div className="context-ide-menu-heading">
        <span title={props.title}>{props.title || t('ProblemNav')}</span>
        <Button
          type="text"
          size="small"
          aria-label={t(compact ? 'answerIde.expandProblemMenu' : 'answerIde.collapseProblemMenu')}
          aria-expanded={!compact}
          icon={compact ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!compact)}
        />
      </div>
      <nav aria-label={t('ProblemNav')} className="context-ide-problem-menu">
        {props.loading ? (
          <Spin size="small" />
        ) : props.groups.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('NoData')} />
        ) : (
          props.groups.map((group) => (
            <div className="context-ide-menu-group" key={group.key}>
              {group.title && <h3 title={group.title}>{group.title}</h3>}
              {group.items.map((item) => (
                <Link
                  key={item.key}
                  to={item.href}
                  title={`${item.number}. ${item.title}`}
                  aria-label={`${item.number}. ${item.title}`}
                  aria-current={item.key === props.activeKey ? 'page' : undefined}
                  className={`context-ide-problem-link${item.answered ? ' context-ide-problem-answered' : ''}`}
                >
                  <span className="context-ide-problem-number">{item.number}</span>
                  <span className="context-ide-problem-title">{item.title}</span>
                </Link>
              ))}
            </div>
          ))
        )}
      </nav>
    </aside>
  );
}
