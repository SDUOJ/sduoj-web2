import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import SplitPane from './SplitPane';

function View({ vertical = false }: { vertical?: boolean }) {
  const [ratio, setRatio] = useState(50);
  return (
    <SplitPane
      vertical={vertical}
      label="resize"
      ratio={ratio}
      onChange={setRatio}
      first={<textarea aria-label="draft" defaultValue="source" />}
      second={<p>results</p>}
    />
  );
}

it.each([false, true])(
  'resizes with the correct keyboard axis and respects limits (vertical=%s)',
  (vertical) => {
    render(<View vertical={vertical} />);
    const separator = screen.getByRole('separator', { name: 'resize' });
    fireEvent.change(screen.getByLabelText('draft'), { target: { value: 'edited' } });
    fireEvent.keyDown(separator, { key: vertical ? 'ArrowDown' : 'ArrowRight' });
    expect(separator).toHaveAttribute('aria-valuenow', '52');
    fireEvent.keyDown(separator, { key: 'End' });
    fireEvent.keyDown(separator, { key: vertical ? 'ArrowDown' : 'ArrowRight' });
    expect(separator).toHaveAttribute('aria-valuenow', '80');
    fireEvent.keyDown(separator, { key: 'Home' });
    fireEvent.keyDown(separator, { key: vertical ? 'ArrowUp' : 'ArrowLeft' });
    expect(separator).toHaveAttribute('aria-valuenow', '25');
    expect(screen.getByLabelText('draft')).toHaveValue('edited');
  },
);

it.each([false, true])(
  'drags without jumping or remounting the editor (vertical=%s)',
  (vertical) => {
    render(<View vertical={vertical} />);
    const separator = screen.getByRole('separator', { name: 'resize' });
    const editor = screen.getByLabelText('draft');
    fireEvent.change(editor, { target: { value: 'unsaved source' } });
    jest.spyOn(separator.parentElement!, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 1010,
      height: 1010,
    } as DOMRect);
    jest.spyOn(separator, 'getBoundingClientRect').mockReturnValue({
      left: 500,
      top: 500,
      width: 10,
      height: 10,
    } as DOMRect);
    let captured = false;
    separator.setPointerCapture = () => {
      captured = true;
    };
    separator.hasPointerCapture = () => captured;
    separator.releasePointerCapture = () => {
      captured = false;
    };
    const pointer = (type: string, position: number) => {
      const event = new MouseEvent(type, {
        bubbles: true,
        button: 0,
        clientX: position,
        clientY: position,
      });
      Object.defineProperty(event, 'pointerId', { value: 1 });
      fireEvent(separator, event);
    };
    pointer('pointermove', 705);
    expect(separator).toHaveAttribute('aria-valuenow', '50');
    pointer('pointerdown', 505);
    pointer('pointermove', 505);
    expect(separator).toHaveAttribute('aria-valuenow', '50');
    pointer('pointermove', 705);
    expect(separator).toHaveAttribute('aria-valuenow', '70');
    pointer('pointerup', 705);
    pointer('pointermove', 305);
    expect(separator).toHaveAttribute('aria-valuenow', '70');
    expect(screen.getByLabelText('draft')).toBe(editor);
    expect(editor).toHaveValue('unsaved source');
  },
);

function CollapsibleView({ initialCollapsed = false }: { initialCollapsed?: boolean }) {
  const [ratio, setRatio] = useState(50);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  return (
    <SplitPane
      vertical
      label="resize console"
      ratio={ratio}
      onChange={setRatio}
      minFirstSize={160}
      secondCollapse={{
        collapsed,
        onChange: setCollapsed,
        minSize: 160,
        collapsedSize: 48,
        dragThreshold: 64,
      }}
      first={<textarea aria-label="source" defaultValue="draft" />}
      second={
        <div>
          <h3>Console titles</h3>
          <div hidden={collapsed}>Results remain mounted</div>
        </div>
      }
    />
  );
}
function collapsibleDrag(initialCollapsed = false) {
  const bounds = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    height: 1010,
    width: 1010,
  } as DOMRect);
  const view = render(<CollapsibleView initialCollapsed={initialCollapsed} />);
  bounds.mockRestore();
  const separator = screen.getByRole('separator', { name: 'resize console' });
  jest
    .spyOn(separator.parentElement!, 'getBoundingClientRect')
    .mockReturnValue({ left: 0, top: 0, height: 1010, width: 1010 } as DOMRect);
  jest.spyOn(separator, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: initialCollapsed ? 952 : 500,
    height: 10,
    width: 1010,
  } as DOMRect);
  let captured = false;
  separator.setPointerCapture = () => {
    captured = true;
  };
  separator.hasPointerCapture = () => captured;
  separator.releasePointerCapture = () => {
    captured = false;
  };
  const pointer = (type: string, position: number) => {
    const event = new MouseEvent(type, { bubbles: true, button: 0, clientY: position });
    Object.defineProperty(event, 'pointerId', { value: 1 });
    fireEvent(separator, event);
  };
  return { view, separator, pointer };
}
it('preserves the expanded minimum height and requires a wide reverse drag to reopen after snapping', () => {
  const { separator, pointer } = collapsibleDrag();
  const editor = screen.getByLabelText('source');
  fireEvent.change(editor, { target: { value: 'unsaved draft' } });
  pointer('pointerdown', 505);
  pointer('pointermove', 845);
  expect(separator).toHaveAttribute('aria-valuenow', '84');
  expect(screen.getByText('Results remain mounted')).toBeVisible();
  pointer('pointermove', 900); // 55px beyond the 160px minimum, below the snap threshold.
  expect(separator).toHaveAttribute('aria-valuenow', '84');
  pointer('pointermove', 910); // 65px beyond the minimum collapses to the title bar.
  expect(separator).toHaveAttribute('aria-valuenow', '100');
  expect(screen.getByText('Results remain mounted')).not.toBeVisible();
  expect(screen.getByText('Console titles')).toBeVisible();
  pointer('pointermove', 880); // Small reverse movement must not flicker open.
  expect(separator).toHaveAttribute('aria-valuenow', '100');
  pointer('pointermove', 830);
  expect(separator).toHaveAttribute('aria-valuenow', '83');
  expect(screen.getByText('Results remain mounted')).toBeVisible();
  expect(screen.getByLabelText('source')).toBe(editor);
  expect(editor).toHaveValue('unsaved draft');
  pointer('pointerup', 830);
});
it('requires 64px upward travel from a collapsed drag and supports keyboard toggles', () => {
  const { separator, pointer } = collapsibleDrag(true);
  pointer('pointerdown', 957);
  pointer('pointermove', 907);
  expect(separator).toHaveAttribute('aria-valuenow', '100');
  pointer('pointermove', 887);
  expect(separator).toHaveAttribute('aria-valuenow', '84');
  pointer('pointerup', 887);
  fireEvent.keyDown(separator, { key: 'Enter' });
  expect(separator).toHaveAttribute('aria-valuenow', '100');
  fireEvent.keyDown(separator, { key: 'ArrowUp' });
  expect(separator).toHaveAttribute('aria-valuenow', '82');
  fireEvent.keyDown(separator, { key: 'End' });
  expect(separator).toHaveAttribute('aria-valuenow', '100');
  fireEvent.doubleClick(separator);
  expect(separator).toHaveAttribute('aria-valuenow', '82');
});
