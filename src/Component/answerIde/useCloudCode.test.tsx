import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import i18n from '../../Config/i18n';
import cApi from '../../Utils/API/c-api';
import { useCloudCode } from './useCloudCode';
import { IdeContext } from './runTypes';

jest.mock('../../Utils/API/c-api', () => ({
  __esModule: true,
  default: {
    getIdeHistory: jest.fn(),
    getIdeCode: jest.fn(),
    saveIdeCode: jest.fn(),
  },
}));
const context: IdeContext = { type: 1, bizId: '77', problemCode: '1' };
const old = {
  submissionId: 'aaa',
  savedAt: 1000000,
  judgeTemplateId: '6',
  codeLength: 3,
  code: 'old',
};
function Fixture({
  initial = 'edited',
  local = true,
  templateId = '6',
}: {
  initial?: string;
  local?: boolean;
  templateId?: string;
}) {
  const [code, setCode] = useState(initial);
  const cloud = useCloudCode({
    identity: 'alice:Contest-77-1',
    username: 'alice',
    context,
    templateId,
    code,
    templates: [
      { id: '6', title: 'C++', type: 0 } as any,
      { id: '7', title: 'Python', type: 0 } as any,
    ],
    initialize: (_, value) => {
      if (!local) setCode(value);
    },
    restore: (_, value) => setCode(value),
  });
  return (
    <>
      <textarea aria-label="source" value={code} onChange={(e) => setCode(e.target.value)} />
      {cloud.controls}
      {cloud.history}
    </>
  );
}
beforeEach(async () => {
  localStorage.clear();
  jest.resetAllMocks();
  await i18n.changeLanguage('zh');
  jest.mocked(cApi.getIdeHistory).mockResolvedValue([old]);
  jest.mocked(cApi.getIdeCode).mockResolvedValue(old);
  jest.mocked(cApi.saveIdeCode).mockImplementation(async (body) => ({
    ...old,
    submissionId: 'bbb',
    savedAt: Date.now(),
    code: body.code,
  }));
});
it('keeps a disabled cloud client idle through mount, manual save and autosave', async () => {
  jest.useFakeTimers();
  try {
    const initialize = jest.fn();
    const restore = jest.fn();
    const page = renderHook(() =>
      useCloudCode({
        enabled: false,
        identity: 'alice:P',
        username: 'alice',
        context,
        templateId: '6',
        code: 'local source',
        templates: [],
        initialize,
        restore,
      }),
    );
    await act(async () => {
      expect(await page.result.current.save()).toBe(false);
      jest.advanceTimersByTime(10 * 60 * 1000);
    });
    expect(cApi.getIdeHistory).not.toHaveBeenCalled();
    expect(cApi.getIdeCode).not.toHaveBeenCalled();
    expect(cApi.saveIdeCode).not.toHaveBeenCalled();
    expect(initialize).not.toHaveBeenCalled();
    expect(restore).not.toHaveBeenCalled();
    expect(page.result.current.controls).toBeNull();
    expect(page.result.current.history).toBeNull();
    page.unmount();
  } finally {
    jest.useRealTimers();
  }
});
it('restores cloud code for a new browser while preserving an existing local draft', async () => {
  const page = render(<Fixture initial="" local={false} />);
  await waitFor(() => expect(screen.getByLabelText('source')).toHaveValue('old'));
  expect(screen.getByText('已保存到云端')).toBeVisible();
  page.unmount();
  render(<Fixture />);
  await waitFor(() => expect(screen.getByRole('button', { name: '保存到云端' })).toBeEnabled());
  expect(screen.getByLabelText('source')).toHaveValue('edited');
  expect(screen.getByText('有未保存的更改')).toBeVisible();
});
it('saves the correct business problem and enforces a 30-second manual cooldown', async () => {
  jest.useFakeTimers();
  try {
    render(<Fixture />);
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.click(screen.getByRole('button', { name: '保存到云端' }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(cApi.saveIdeCode).toHaveBeenCalledWith({
      context,
      judgeTemplateId: '6',
      code: 'edited',
    });
    fireEvent.change(screen.getByLabelText('source'), { target: { value: 'next edit' } });
    expect(screen.getByRole('button', { name: /秒后可保存/ })).toBeDisabled();
    await act(async () => {
      jest.advanceTimersByTime(29000);
    });
    expect(screen.getByRole('button', { name: /秒后可保存/ })).toBeDisabled();
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByRole('button', { name: '保存到云端' })).toBeEnabled();
  } finally {
    jest.useRealTimers();
  }
});
it('saves changed code at five minutes and does not write unchanged snapshots again', async () => {
  jest.useFakeTimers();
  try {
    render(<Fixture />);
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      jest.advanceTimersByTime(299999);
    });
    expect(cApi.saveIdeCode).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(1);
      await Promise.resolve();
    });
    expect(cApi.saveIdeCode).toHaveBeenCalledTimes(1);
    await act(async () => {
      jest.advanceTimersByTime(300000);
      await Promise.resolve();
    });
    expect(cApi.saveIdeCode).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByLabelText('source'), { target: { value: 'new version' } });
    await act(async () => {
      jest.advanceTimersByTime(300000);
      await Promise.resolve();
    });
    expect(cApi.saveIdeCode).toHaveBeenCalledTimes(2);
  } finally {
    jest.useRealTimers();
  }
});

it.each(['', ' \t\r\n', '\u3000'])(
  'does not manually or automatically save blank code %j',
  async (initial) => {
    jest.useFakeTimers();
    try {
      render(<Fixture initial={initial} />);
      await act(async () => {
        await Promise.resolve();
      });
      const save = screen.getByRole('button', { name: '保存到云端' });
      expect(save).toBeDisabled();
      fireEvent.click(save);
      await act(async () => {
        jest.advanceTimersByTime(300000);
      });
      expect(cApi.saveIdeCode).not.toHaveBeenCalled();
      expect(screen.getByLabelText('source')).toHaveValue(initial.replace(/\r\n|\r/g, '\n'));
      fireEvent.change(screen.getByLabelText('source'), { target: { value: 'nonempty code' } });
      expect(save).toBeEnabled();
      await act(async () => {
        jest.advanceTimersByTime(300000);
      });
      expect(cApi.saveIdeCode).toHaveBeenCalledTimes(1);
      expect(cApi.saveIdeCode).toHaveBeenCalledWith({
        context,
        judgeTemplateId: '6',
        code: 'nonempty code',
      });
    } finally {
      jest.useRealTimers();
    }
  },
);

it('does not offer to save empty code when switching to a history snapshot', async () => {
  render(<Fixture initial="" />);
  fireEvent.click(await screen.findByRole('button', { name: '载入代码' }));
  await screen.findByRole('dialog');
  expect(screen.getByRole('button', { name: '保存并切换' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: '不保存并切换' }));
  expect(screen.getByLabelText('source')).toHaveValue('old');
  expect(cApi.saveIdeCode).not.toHaveBeenCalled();
});
it('asks before replacing unsaved code and saves before loading the selected version', async () => {
  render(<Fixture />);
  await waitFor(() => expect(screen.getByRole('button', { name: '保存到云端' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: '载入代码' }));
  await screen.findByRole('dialog');
  expect(screen.getByLabelText('source')).toHaveValue('edited');
  fireEvent.click(screen.getByRole('button', { name: '保存并切换' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(cApi.saveIdeCode).toHaveBeenCalledWith({ context, judgeTemplateId: '6', code: 'edited' });
  expect(screen.getByLabelText('source')).toHaveValue('old');
  expect(screen.getByText('已保存到云端')).toBeVisible();
});
it('does not replace code when saving before a history switch fails', async () => {
  jest.mocked(cApi.saveIdeCode).mockRejectedValue(new Error('offline'));
  render(<Fixture />);
  await waitFor(() => expect(screen.getByRole('button', { name: '保存到云端' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: '载入代码' }));
  await screen.findByRole('dialog');
  fireEvent.click(screen.getByRole('button', { name: '保存并切换' }));
  await screen.findByText(/云端保存失败/);
  expect(screen.getByLabelText('source')).toHaveValue('edited');
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

it('follows the IDE language and displays size before the saved time without another selector', async () => {
  jest.mocked(cApi.getIdeHistory).mockImplementation(async ({ judgeTemplateId }) => [
    {
      ...old,
      judgeTemplateId: judgeTemplateId!,
      lineCount: judgeTemplateId === '6' ? 3 : 7,
      codeLength: judgeTemplateId === '6' ? 18 : 42,
    },
  ]);
  const page = render(<Fixture />);
  expect(await screen.findByText('3 行 · 18 个字符')).toBeVisible();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(cApi.getIdeHistory).toHaveBeenCalledWith({ context, judgeTemplateId: '6' });
  expect(
    screen.getByText(new Date(old.savedAt).toLocaleString('zh', { hour12: false })),
  ).toBeVisible();
  page.rerender(<Fixture templateId="7" />);
  expect(await screen.findByText('7 行 · 42 个字符')).toBeVisible();
  expect(screen.queryByText('3 行 · 18 个字符')).not.toBeInTheDocument();
  expect(cApi.getIdeHistory).toHaveBeenLastCalledWith({ context, judgeTemplateId: '7' });
});

it('keeps pagination in the current language and ignores a page returned after switching languages', async () => {
  let finish!: (rows: (typeof old)[]) => void;
  const rows = Array.from({ length: 20 }, (_, i) => ({
    ...old,
    submissionId: `saved-${i}`,
    lineCount: 1,
  }));
  jest.mocked(cApi.getIdeHistory).mockImplementation(({ judgeTemplateId, beforeId }) => {
    if (beforeId)
      return new Promise((resolve) => {
        finish = resolve;
      });
    return Promise.resolve(judgeTemplateId === '6' ? rows : []);
  });
  const page = render(<Fixture />);
  fireEvent.click(await screen.findByRole('button', { name: '加载更早的记录' }));
  expect(cApi.getIdeHistory).toHaveBeenLastCalledWith({
    context,
    judgeTemplateId: '6',
    beforeId: 'saved-19',
  });
  page.rerender(<Fixture templateId="7" />);
  await screen.findByText('此题暂无云端代码历史');
  await act(async () => {
    finish([{ ...old, codeLength: 999 }]);
  });
  expect(screen.queryByText(/999 个字符/)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '加载更早的记录' })).not.toBeInTheDocument();
});
