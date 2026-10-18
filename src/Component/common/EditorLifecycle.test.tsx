import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { buildEditorCacheId, CopiedButton, Editor } from './Editor';
import { MD2export } from './Md2export';
import { loadVditorRuntime } from '../../Utils/vditorRuntime';

jest.mock('../../Utils/vditorRuntime', () => ({ loadVditorRuntime: jest.fn() }));

const instances: Array<{ destroy: jest.Mock; getValue: jest.Mock; setValue: jest.Mock }> = [];
const options: any[] = [];
const targets: Array<HTMLElement | string> = [];
const mockClipboardDestroy = jest.fn();
let mockDelayInitialization = false;
const mockInitializers: Array<() => void> = [];

jest.mock('../../Utils/fileUpload', () => ({
  fileUpload: jest.fn(),
}));

jest.mock('vditor', () =>
  jest.fn().mockImplementation((target, config) => {
    let value = globalThis.localStorage.getItem(config.cache?.id) ?? config.value ?? '';
    let initialized = !mockDelayInitialization;
    const requireReady = () => {
      if (!initialized) throw new Error('Vditor has not initialized');
    };
    const instance = {
      destroy: jest.fn(() => {
        requireReady();
        if (config.cache?.enable) globalThis.localStorage.removeItem(config.cache.id);
      }),
      disabledCache: jest.fn(() => {
        config.cache.enable = false;
      }),
      getValue: jest.fn(() => {
        requireReady();
        return value;
      }),
      setValue: jest.fn((nextValue: string) => {
        requireReady();
        value = nextValue;
      }),
      vditor: { currentMode: 'ir' },
    };
    const initialize = () => {
      initialized = true;
      config.after?.();
    };
    mockInitializers.push(initialize);
    if (!mockDelayInitialization) void Promise.resolve().then(initialize);
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
  (loadVditorRuntime as jest.Mock).mockReset().mockResolvedValue({});
  mockDelayInitialization = false;
  mockInitializers.length = 0;
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

it('enables markdown sanitization in the editor preview', async () => {
  render(<Editor langCode="en_US" value={'<script>alert(1)</script>'} />);
  await waitForEditor();
  expect(options[0].preview.markdown.sanitize).toBe(true);
});

it('uses PUBLIC_URL for editor and export runtime, emoji and theme resources', async () => {
  const previousPublicUrl = process.env.PUBLIC_URL;
  process.env.PUBLIC_URL = '/preview/sduoj/';
  try {
    render(<Editor langCode="en_US" value="draft" />);
    const view = render(<MD2export value="answer" langCode="en_US" t={(key: string) => key} />);
    fireEvent.click(view.getByRole('button', { name: 'markdownText' }));
    await waitForEditor(2);

    for (const config of options) {
      expect(config.cdn).toBe('/preview/sduoj/vditor/development');
      expect(config.hint.emojiPath).toBe('/preview/sduoj/vditor/development/dist/images/emoji');
      expect(config.preview.theme.path).toBe(
        '/preview/sduoj/vditor/development/dist/css/content-theme',
      );
    }
  } finally {
    if (previousPublicUrl === undefined) delete process.env.PUBLIC_URL;
    else process.env.PUBLIC_URL = previousPublicUrl;
  }
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

function dispatchBeforeUnload() {
  const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
  window.dispatchEvent(event);
  return event.defaultPrevented || (event.returnValue as unknown) === '';
}

it('warns before leaving when the editor draft differs from the saved value', async () => {
  render(
    <Editor
      value="server"
      langCode="en_US"
      userIdentity="alice"
      documentIdentity="problem:1"
      fieldIdentity="description"
    />,
  );
  await waitForEditor();
  act(() => options[0].after?.());

  expect(dispatchBeforeUnload()).toBe(false);

  act(() => {
    instances[0].setValue('draft-not-saved');
  });
  expect(dispatchBeforeUnload()).toBe(true);
});

it('does not warn after the external value catches up with the draft', async () => {
  const view = render(
    <Editor
      value="server"
      langCode="en_US"
      userIdentity="alice"
      documentIdentity="problem:1"
      fieldIdentity="description"
    />,
  );
  await waitForEditor();
  act(() => options[0].after?.());
  act(() => {
    instances[0].setValue('draft-not-saved');
  });
  expect(dispatchBeforeUnload()).toBe(true);

  view.rerender(
    <Editor
      value="draft-not-saved"
      langCode="en_US"
      userIdentity="alice"
      documentIdentity="problem:1"
      fieldIdentity="description"
    />,
  );
  expect(dispatchBeforeUnload()).toBe(false);
});

it('stops guarding after unmount', async () => {
  const view = render(
    <Editor
      value="server"
      langCode="en_US"
      userIdentity="alice"
      documentIdentity="problem:1"
      fieldIdentity="description"
    />,
  );
  await waitForEditor();
  act(() => options[0].after?.());
  act(() => {
    instances[0].setValue('draft-not-saved');
  });
  view.unmount();
  expect(dispatchBeforeUnload()).toBe(false);
});

it('waits for async initialization before syncing a fetched document or guarding unload', async () => {
  mockDelayInitialization = true;
  const view = render(<Editor value="" langCode="en_US" />);
  await waitForEditor();
  view.rerender(<Editor value="fetched document" langCode="en_US" />);
  expect(instances[0].getValue).not.toHaveBeenCalled();
  expect(instances[0].setValue).not.toHaveBeenCalled();
  expect(dispatchBeforeUnload()).toBe(false);
  expect(instances[0].getValue).not.toHaveBeenCalled();

  act(() => mockInitializers[0]());
  expect(instances[0].getValue()).toBe('fetched document');
  expect(dispatchBeforeUnload()).toBe(false);
  view.unmount();
  expect(instances[0].destroy).toHaveBeenCalledTimes(1);
});

it('finishes old initialization before replacing it and preserves replacement drafts on cleanup', async () => {
  mockDelayInitialization = true;
  const props = {
    userIdentity: 'alice',
    documentIdentity: 'problem:1',
    fieldIdentity: 'description',
  };
  const onChange = jest.fn();
  const view = render(<Editor {...props} value="one" langCode="en_US" onChange={onChange} />);
  await waitForEditor();
  const oldHost = targets[0] as HTMLElement;
  view.rerender(<Editor {...props} value="two" langCode="zh_CN" onChange={onChange} />);
  expect(oldHost.isConnected).toBe(false);
  expect(instances).toHaveLength(1);
  expect(instances[0].destroy).not.toHaveBeenCalled();

  await act(async () => mockInitializers[0]());
  await waitForEditor(2);
  const newHost = targets[1] as HTMLElement;
  expect(instances[0].destroy).toHaveBeenCalledTimes(1);
  expect(newHost.isConnected).toBe(true);
  act(() => mockInitializers[1]());
  options[0].blur();
  expect(onChange).not.toHaveBeenCalled();
  expect(instances[1].getValue()).toBe('two');
  const key = buildEditorCacheId('alice', 'problem:1', 'description');
  localStorage.setItem(key, 'replacement draft');
  view.unmount();
  expect(instances[1].destroy).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem(key)).toBe('replacement draft');
});

it('can initialize a replacement after a resource load fails before construction', async () => {
  (loadVditorRuntime as jest.Mock).mockRejectedValueOnce(new Error('resource 404'));
  const view = render(<Editor value="document" langCode="en_US" />);
  await waitFor(() => expect(message.error).toHaveBeenCalled());
  expect(instances).toHaveLength(0);
  view.rerender(<Editor value="document" langCode="zh_CN" />);
  await waitForEditor();
  expect(instances[0].getValue()).toBe('document');
});

it('releases the initialization queue when construction throws', async () => {
  const Vditor = jest.requireMock('vditor') as jest.Mock;
  Vditor.mockImplementationOnce(() => {
    throw new Error('constructor failed');
  });
  const view = render(<Editor value="document" langCode="en_US" />);
  await waitFor(() => expect(message.error).toHaveBeenCalled());
  view.rerender(<Editor value="document" langCode="zh_CN" />);
  await waitForEditor();
  expect(instances[0].getValue()).toBe('document');
});

it('destroys an editor that finishes initialization after unmount without clearing its draft', async () => {
  mockDelayInitialization = true;
  const props = {
    userIdentity: 'alice',
    documentIdentity: 'problem:1',
    fieldIdentity: 'description',
  };
  const view = render(<Editor {...props} value="document" langCode="en_US" />);
  await waitForEditor();
  const key = buildEditorCacheId('alice', 'problem:1', 'description');
  localStorage.setItem(key, 'unsaved draft');
  view.unmount();
  act(() => mockInitializers[0]());
  expect(instances[0].destroy).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem(key)).toBe('unsaved draft');
  expect((targets[0] as HTMLElement).isConnected).toBe(false);
});
