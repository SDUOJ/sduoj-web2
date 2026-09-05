import { act, render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { createAppStore } from '../../Redux/Store';
import Submit, { Submit as RawSubmit } from './Submit';

jest.mock('../common/CodeEditor', () => ({
  __esModule: true,
  default: (props: any) => (
    <textarea
      aria-label="Code source"
      value={props.value ?? ''}
      onChange={(event) => props.onChange(event.target.value)}
    />
  ),
}));

async function setup() {
  localStorage.setItem('SDUOJ-Last-Submit-JT', '1');
  const store = createAppStore();
  store.dispatch({ type: 'userLogin' });
  const view = render(
    <Provider store={store}>
      <MemoryRouter>
        <Submit
          name="test"
          title="Program"
          API={jest.fn()}
          TopSubmissionInfo={{}}
          JudgeTemplates={[{ id: '1', title: 'C++', acceptFileExtensions: ['cpp'] }]}
        />
      </MemoryRouter>
    </Provider>,
  );
  await userEvent.setup().click(screen.getByRole('button', { name: 'Submit' }));
  const input = await screen.findByLabelText('Code source');
  const upload = view.baseElement.querySelector('input[type="file"]') as HTMLInputElement;
  return { input, upload };
}

it('imports a complete code file above the former arbitrary 50 KiB cutoff', async () => {
  const { input, upload } = await setup();
  const code = 'x'.repeat(60000);
  await userEvent.setup().upload(upload, new File([code], 'solution.cpp', { type: 'text/plain' }));
  await waitFor(() => expect(input).toHaveValue(code));
});

it('rejects UTF-8 overflow without replacing the previous draft', async () => {
  const { input, upload } = await setup();
  fireEvent.change(input, { target: { value: 'draft' } });
  await userEvent
    .setup()
    .upload(upload, new File(['中'.repeat(22000)], 'solution.cpp', { type: 'text/plain' }));
  expect(await screen.findByText(/65535/)).toBeVisible();
  expect(input).toHaveValue('draft');
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

async function setupRaw(api: jest.Mock) {
  localStorage.setItem('SDUOJ-Last-Submit-JT', '1');
  const setTopSubmission = jest.fn();
  const setSubmissionModalVis = jest.fn();
  render(
    <RawSubmit
      isLogin
      name="raw"
      title="Program"
      API={api}
      TopSubmissionInfo={{}}
      JudgeTemplates={[{ id: '1', title: 'C++', acceptFileExtensions: ['cpp'] }]}
      setTopSubmission={setTopSubmission}
      setSubmissionModalVis={setSubmissionModalVis}
      addTableVersion={jest.fn()}
      t={(key: string) => key}
    />,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Submit' }));
  const input = await screen.findByLabelText('Code source');
  await user.type(input, 'return 0');
  return { user, setTopSubmission, setSubmissionModalVis };
}

it('discards a late successful result after the submit form is canceled', async () => {
  const pending = deferred<string>();
  const api = jest.fn(() => pending.promise);
  const { user, setTopSubmission, setSubmissionModalVis } = await setupRaw(api);
  const dialog = screen.getByRole('dialog');
  await user.click(within(dialog).getByRole('button', { name: 'Submit' }));
  await waitFor(() => expect(api).toHaveBeenCalledTimes(1));
  await user.click(within(dialog).getByRole('button', { name: 'no' }));

  await act(async () => pending.resolve('late-submission'));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(setTopSubmission).not.toHaveBeenCalled();
  expect(setSubmissionModalVis).not.toHaveBeenCalled();
});

it('keeps the form available for retry after an API failure', async () => {
  const api = jest
    .fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce('accepted');
  const { user, setTopSubmission, setSubmissionModalVis } = await setupRaw(api);
  const submit = within(screen.getByRole('dialog')).getByRole('button', { name: 'Submit' });
  await user.click(submit);
  await waitFor(() => expect(submit).toBeEnabled());
  await user.click(submit);

  await waitFor(() => expect(setTopSubmission).toHaveBeenCalledWith('accepted', {}));
  expect(setSubmissionModalVis).toHaveBeenCalledWith(true);
  expect(api).toHaveBeenCalledTimes(2);
});
