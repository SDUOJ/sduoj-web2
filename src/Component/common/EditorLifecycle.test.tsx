import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { buildEditorCacheId, CopiedButton, Editor } from './Editor';
import { MD2export } from './Md2export';

const instances: Array<{ destroy: jest.Mock; getValue: jest.Mock; setValue: jest.Mock }> = [];
const options: any[] = [];
const targets: Array<HTMLElement | string> = [];
const mockClipboardDestroy = jest.fn();

jest.mock('../../Utils/fileUpload', () => ({
  fileUpload: jest.fn(),
}));

jest.mock('vditor', () =>
  jest.fn().mockImplementation((target, config) => {
    let value = globalThis.localStorage.getItem(config.cache?.id) ?? config.value ?? '';
    const instance = {
      destroy: jest.fn(),
      getValue: jest.fn(() => value),
      setValue: jest.fn((nextValue: string) => {
        value = nextValue;
      }),
      vditor: { currentMode: 'ir' },
    };
    instances.push(instance);
    options.push(config);
    targets.push(target);
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
  targets.length = 0;
  localStorage.clear();
  mockClipboardDestroy.mockClear();
  jest.spyOn(message, 'error').mockClear();
});

const waitForEditor = (count = 1) =>
  waitFor(() => expect(options).toHaveLength(count), { timeout: 2000 });

it('destroys the clipboard listener when a copy button unmounts', () => {
  const view = render(<CopiedButton text="path" btnText="Copy" />);
  view.unmount();
  expect(mockClipboardDestroy).toHaveBeenCalledTimes(1);
});

it('destroys the editor before language replacement and on unmount', async () => {
  const view = render(
    <Editor
      value="draft"
      langCode="en_US"
      userIdentity="alice"
      documentIdentity="problem:1"
      fieldIdentity="description"
      t={(key: string) => key}
    />,
  );
  await waitForEditor();
  act(() => options[0].after?.());
  expect(instances[0].getValue()).toBe('draft');
  expect(instances[0].setValue).not.toHaveBeenCalled();
  view.rerender(
    <Editor
      value="draft"
      langCode="zh_CN"
      userIdentity="alice"
      documentIdentity="problem:1"
      fieldIdentity="description"
      t={(key: string) => key}
    />,
  );
  expect(instances[0].destroy).toHaveBeenCalledTimes(1);
  await waitForEditor(2);
  expect(instances).toHaveLength(2);
  view.unmount();
  expect(instances[1].destroy).toHaveBeenCalledTimes(1);
});

it('isolates and restores drafts by user, document, and field without relying on destroy', async () => {
  const aliceDocumentOne = buildEditorCacheId('alice', 'problem:1', 'description');
  localStorage.setItem(aliceDocumentOne, 'alice document one draft');

  const first = render(
    <Editor
      value="server one"
      langCode="en_US"
      userIdentity="alice"
      documentIdentity="problem:1"
      fieldIdentity="description"
    />,
  );
  await waitForEditor();
  act(() => options[0].after?.());
  expect(instances[0].getValue()).toBe('alice document one draft');
  expect(instances[0].setValue).not.toHaveBeenCalled();

  render(
    <Editor
      value="server two"
      langCode="en_US"
      userIdentity="alice"
      documentIdentity="problem:2"
      fieldIdentity="description"
    />,
  );
  render(
    <Editor
      value="server one for bob"
      langCode="en_US"
      userIdentity="bob"
      documentIdentity="problem:1"
      fieldIdentity="description"
    />,
  );

  await waitForEditor(3);
  expect(options.map((option) => option.cache.id)).toEqual([
    aliceDocumentOne,
    buildEditorCacheId('alice', 'problem:2', 'description'),
    buildEditorCacheId('bob', 'problem:1', 'description'),
  ]);
  expect(new Set(targets.map((target) => (target as HTMLElement).id)).size).toBe(3);
  expect(instances[1].getValue()).toBe('server two');
  expect(instances[2].getValue()).toBe('server one for bob');
  expect(instances[0].destroy).not.toHaveBeenCalled();

  first.unmount();
});

it('uses unique DOM containers for duplicate mounts and disables unscoped persistent cache', async () => {
  render(<Editor value="one" langCode="en_US" />);
  render(<Editor value="two" langCode="en_US" />);

  await waitForEditor(2);
  expect(options[0].cache).toEqual({ enable: false });
  expect(options[1].cache).toEqual({ enable: false });
  expect((targets[0] as HTMLElement).id).not.toBe((targets[1] as HTMLElement).id);
});

it('uses the bundled save icon instead of an external image', async () => {
  render(
    <Editor
      langCode="en_US"
      userIdentity="alice"
      documentIdentity="problem:1"
      fieldIdentity="description"
    />,
  );
  await waitForEditor();
  const save = options[0].toolbar.find((item: any) => item?.name === 'save');
  expect(save.icon).toContain('test-asset');
  expect(save.icon).not.toContain('58cdn');
  expect(save.icon).not.toContain('http');
});

it('reports upload failures instead of leaving an unhandled promise', async () => {
  const { fileUpload } = jest.requireMock('../../Utils/fileUpload') as {
    fileUpload: jest.Mock;
  };
  fileUpload.mockRejectedValueOnce(new Error('offline'));
  render(
    <Editor
      langCode="en_US"
      userIdentity="alice"
      documentIdentity="problem:1"
      fieldIdentity="description"
    />,
  );

  await waitForEditor();
  await act(async () => {
    await options[0].upload.handler([new File(['x'], 'note.txt')]);
  });
  expect(message.error).toHaveBeenCalledWith('File upload failed');
});

it('destroys the export editor when its modal closes', async () => {
  const view = render(<MD2export value="answer" langCode="en_US" t={(key: string) => key} />);
  fireEvent.click(view.getByRole('button', { name: 'markdownText' }));
  await waitForEditor();
  expect(instances).toHaveLength(1);
  fireEvent.click(view.getByRole('button', { name: 'Close' }));
  expect(instances[0].destroy).toHaveBeenCalledTimes(1);
});
