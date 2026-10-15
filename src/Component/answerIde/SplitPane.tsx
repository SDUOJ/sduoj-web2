import { ReactNode, useLayoutEffect, useRef, useState } from 'react';

type SecondCollapse = {
  collapsed: boolean;
  onChange: (collapsed: boolean) => void;
  collapsedSize: number;
  minSize: number;
  dragThreshold?: number;
};

/** Keeps both panes mounted while resizing or collapsing, including editor and task state. */
export default function SplitPane(props: {
  first: ReactNode;
  second: ReactNode;
  vertical?: boolean;
  ratio: number;
  onChange: (ratio: number) => void;
  label: string;
  firstHidden?: boolean;
  secondHidden?: boolean;
  secondCollapse?: SecondCollapse;
  minFirstSize?: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const drag = useRef<{ offset: number; collapsed: boolean; anchor: number }>();
  const [availableSize, setAvailableSize] = useState(0);
  const collapse = props.secondCollapse;
  const collapsible = Boolean(collapse);
  useLayoutEffect(() => {
    const element = container.current;
    if (!element || !collapsible) return;
    const measure = () => {
      const bounds = element.getBoundingClientRect();
      setAvailableSize(Math.max(0, (props.vertical ? bounds.height : bounds.width) - 10));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [collapsible, props.vertical]);
  const limits = (available = availableSize) => {
    if (!collapse || available <= 0) return { min: 25, max: 80 };
    // On short viewports divide the available space evenly rather than overflow either pane.
    return {
      min: (Math.min(props.minFirstSize ?? 160, available / 2) / available) * 100,
      max: 100 - (Math.min(collapse.minSize, available / 2) / available) * 100,
    };
  };
  const clamp = (ratio: number, available?: number) => {
    const { min, max } = limits(available);
    return Math.max(min, Math.min(max, ratio));
  };
  const ratio = clamp(props.ratio);
  const collapsed = Boolean(collapse?.collapsed);
  return (
    <div ref={container} className={`ide-split ${props.vertical ? 'ide-split-vertical' : ''}`}>
      <div
        className="ide-split-pane"
        style={{
          flex: props.secondHidden || collapsed ? '1 1 0' : `0 0 calc(${ratio}% - ${ratio / 10}px)`,
          display: props.firstHidden ? 'none' : undefined,
        }}
      >
        {props.first}
      </div>
      <div
        className="ide-split-handle"
        style={{ display: props.firstHidden || props.secondHidden ? 'none' : undefined }}
        role="separator"
        tabIndex={0}
        aria-label={props.label}
        aria-orientation={props.vertical ? 'horizontal' : 'vertical'}
        aria-valuemin={Math.round(limits().min)}
        aria-valuemax={collapse ? 100 : 80}
        aria-valuenow={collapsed ? 100 : Math.round(ratio)}
        onDoubleClick={collapse ? () => collapse.onChange(!collapsed) : undefined}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          const handle = event.currentTarget.getBoundingClientRect();
          const bounds = container.current?.getBoundingClientRect();
          const offset = props.vertical ? event.clientY - handle.top : event.clientX - handle.left;
          const position = props.vertical
            ? event.clientY - (bounds?.top ?? 0)
            : event.clientX - (bounds?.left ?? 0);
          drag.current = { offset, collapsed, anchor: position - offset };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId) || !drag.current) return;
          const bounds = container.current?.getBoundingClientRect();
          if (!bounds) return;
          const length = props.vertical ? bounds.height : bounds.width;
          const handle = event.currentTarget.getBoundingClientRect();
          const available = length - (props.vertical ? handle.height : handle.width);
          if (available <= 0) return;
          const position =
            (props.vertical ? event.clientY - bounds.top : event.clientX - bounds.left) -
            drag.current.offset;
          if (collapse) {
            const threshold = collapse.dragThreshold ?? 64;
            if (drag.current.collapsed) {
              if (drag.current.anchor - position < threshold) return;
              drag.current.collapsed = false;
              collapse.onChange(false);
            } else if (position >= (available * limits(available).max) / 100 + threshold) {
              drag.current.collapsed = true;
              drag.current.anchor = position;
              collapse.onChange(true);
              return;
            }
          }
          props.onChange(clamp((position / available) * 100, available));
        }}
        onPointerUp={(event) => {
          drag.current = undefined;
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onLostPointerCapture={() => {
          drag.current = undefined;
        }}
        onKeyDown={(event) => {
          const decrease = props.vertical ? 'ArrowUp' : 'ArrowLeft';
          const increase = props.vertical ? 'ArrowDown' : 'ArrowRight';
          if (collapse && ['Enter', ' '].includes(event.key)) {
            event.preventDefault();
            collapse.onChange(!collapsed);
            return;
          }
          if (![decrease, increase, 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          if (collapse && event.key === 'End') {
            collapse.onChange(true);
            return;
          }
          if (collapsed && collapse) {
            if (event.key === increase) return;
            collapse.onChange(false);
          }
          props.onChange(
            event.key === 'Home'
              ? limits().min
              : event.key === 'End'
                ? 80
                : clamp(ratio + (event.key === decrease ? -2 : 2)),
          );
        }}
      >
        <span />
      </div>
      <div
        className="ide-split-pane"
        style={{
          flex: collapsed ? `0 0 ${collapse!.collapsedSize}px` : '1 1 0',
          display: props.secondHidden ? 'none' : undefined,
        }}
      >
        {props.second}
      </div>
    </div>
  );
}
