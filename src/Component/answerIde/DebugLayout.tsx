import { ReactNode, useEffect, useRef, useState } from 'react';
import { Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

/** A bounded sidebar; collapse preserves the workbench and never stops a scene. */
export default function DebugLayout({
  enabled,
  sidebar,
  children,
  storageKey,
}: {
  enabled: boolean;
  sidebar: ReactNode;
  children: ReactNode;
  storageKey: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(() => {
    try {
      return Math.min(420, Math.max(200, Number(localStorage.getItem(storageKey)) || 248));
    } catch {
      return 248;
    }
  });
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(width));
    } catch {
      /* Optional. */
    }
  }, [storageKey, width]);
  const resize = (value: number) =>
    setWidth(Math.max(200, Math.min(420, (root.current?.clientWidth ?? 900) - 260, value)));
  return (
    <div className="ide-debug-body" ref={root}>
      {enabled && (
        <>
          <div
            className={`ide-debug-sidebar-host${collapsed ? ' collapsed' : ''}`}
            style={{ width: collapsed ? 32 : width }}
          >
            <Button
              className="ide-debug-collapse"
              type="text"
              size="small"
              aria-label={collapsed ? '展开调试侧栏' : '折叠调试侧栏'}
              onClick={() => setCollapsed(!collapsed)}
              icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
            />
            {!collapsed && sidebar}
          </div>
          {!collapsed && (
            <div
              className="ide-debug-resizer"
              role="separator"
              aria-label="调试侧栏宽度"
              aria-orientation="vertical"
              aria-valuemin={200}
              aria-valuemax={420}
              aria-valuenow={width}
              tabIndex={0}
              onKeyDown={(e) => {
                if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
                  e.preventDefault();
                  resize(width + (e.key === 'ArrowLeft' ? -10 : 10));
                }
              }}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId))
                  resize(e.clientX - (root.current?.getBoundingClientRect().left ?? 0));
              }}
              onPointerUp={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId))
                  e.currentTarget.releasePointerCapture(e.pointerId);
              }}
            />
          )}
        </>
      )}
      {children}
    </div>
  );
}
