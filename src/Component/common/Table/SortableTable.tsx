import React, { createContext, useContext, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, UniqueIdentifier } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MenuOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

export interface SortEnd {
  oldIndex: number;
  newIndex: number;
}
interface ScopeProps {
  items: readonly React.Key[];
  onSortEnd: (indices: SortEnd) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

// Normalize keys once: Ant Design exposes data-row-key while dnd-kit accepts strings/numbers.
export function sortIndices(
  items: readonly React.Key[],
  active: UniqueIdentifier,
  over: UniqueIdentifier | null,
): SortEnd | undefined {
  if (over === null) return;
  const oldIndex = items.findIndex((key) => String(key) === String(active));
  const newIndex = items.findIndex((key) => String(key) === String(over));
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
  return { oldIndex, newIndex };
}

const ScopeContext = createContext<readonly string[]>([]);
type HandleContext = Pick<
  ReturnType<typeof useSortable>,
  'attributes' | 'listeners' | 'setActivatorNodeRef'
>;
const HandleContext = createContext<HandleContext | null>(null);

export function SortableTableScope({ items, onSortEnd, disabled = false, children }: ScopeProps) {
  const keys = useMemo(() => items.map(String), [items]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const indices = sortIndices(items, active.id, over?.id ?? null);
    if (!disabled && indices) onSortEnd(indices);
  };
  return (
    <ScopeContext.Provider value={disabled ? [] : keys}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        autoScroll={false}
      >
        <SortableContext items={keys} strategy={verticalListSortingStrategy} disabled={disabled}>
          {children}
        </SortableContext>
      </DndContext>
    </ScopeContext.Provider>
  );
}

type RowProps = React.HTMLAttributes<HTMLTableRowElement> & { 'data-row-key'?: React.Key };

function ActiveRow({ rowId, style, children, ...props }: RowProps & { rowId: string }) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rowId });
  const handle = useMemo(
    () => ({ attributes, listeners, setActivatorNodeRef }),
    [attributes, listeners, setActivatorNodeRef],
  );
  return (
    <HandleContext.Provider value={handle}>
      <tr
        {...props}
        ref={setNodeRef}
        style={{
          ...style,
          transform: CSS.Transform.toString(transform && { ...transform, scaleX: 1, scaleY: 1 }),
          transition,
          ...(isDragging ? { position: 'relative', zIndex: 1 } : {}),
        }}
      >
        {children}
      </tr>
    </HandleContext.Provider>
  );
}

function SortableRow(props: RowProps) {
  const keys = useContext(ScopeContext);
  const key = props['data-row-key'];
  if (key === undefined || !keys.includes(String(key))) return <tr {...props} />;
  return <ActiveRow {...props} rowId={String(key)} />;
}

export function DragHandle() {
  const context = useContext(HandleContext);
  const { t } = useTranslation();
  return (
    <button
      type="button"
      ref={context?.setActivatorNodeRef}
      {...context?.attributes}
      {...context?.listeners}
      aria-label={t('sort')}
      title={t('sort')}
      disabled={!context}
      style={{
        border: 0,
        background: 'transparent',
        padding: 0,
        width: 24,
        height: 24,
        cursor: 'grab',
        color: '#999',
        touchAction: 'none',
      }}
    >
      <MenuOutlined />
    </button>
  );
}

export const sortableTableComponents = { body: { row: SortableRow } };
