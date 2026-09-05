import { act, fireEvent, render } from '@testing-library/react';
import { CopiedButton, Editor } from './Editor';
import { MD2export } from './Md2export';

const instances: Array<{ destroy: jest.Mock; getValue: jest.Mock; setValue: jest.Mock }> = [];
const options: Array<{ after?: () => void }> = [];
const mockClipboardDestroy = jest.fn();

jest.mock('vditor', () =>
  jest.fn().mockImplementation((_id, config) => {
    const instance = {
      destroy: jest.fn(),
      getValue: jest.fn().mockReturnValue(''),
      setValue: jest.fn(),
      vditor: { currentMode: 'ir' },
    };
    instances.push(instance);
    options.push(config);
    return instance;
  }),
);

jest.mock('clipboard', () =>
  jest.fn().mockImplementation(() => ({
    destroy: mockClipboardDestroy,
    on: jest.fn(),
  })),
);

beforeEach(() => {
  instances.length = 0;
  options.length = 0;
  mockClipboardDestroy.mockClear();
});

it('destroys the clipboard listener when a copy button unmounts', () => {
  const view = render(<CopiedButton text="path" btnText="Copy" />);
  view.unmount();
  expect(mockClipboardDestroy).toHaveBeenCalledTimes(1);
});

it('destroys the editor before language replacement and on unmount', () => {
  const view = render(<Editor value="draft" langCode="en_US" t={(key: string) => key} />);
  act(() => options[0].after?.());
  expect(instances[0].setValue).toHaveBeenCalledWith('draft');
  view.rerender(<Editor value="draft" langCode="zh_CN" t={(key: string) => key} />);
  expect(instances[0].destroy).toHaveBeenCalledTimes(1);
  expect(instances).toHaveLength(2);
  view.unmount();
  expect(instances[1].destroy).toHaveBeenCalledTimes(1);
});

it('destroys the export editor when its modal closes', () => {
  const view = render(<MD2export value="answer" langCode="en_US" t={(key: string) => key} />);
  fireEvent.click(view.getByRole('button', { name: 'markdownText' }));
  expect(instances).toHaveLength(1);
  fireEvent.click(view.getByRole('button', { name: 'Close' }));
  expect(instances[0].destroy).toHaveBeenCalledTimes(1);
});
