import { Form, Input } from 'antd';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { createAppStore } from '../../../Redux/Store';
import ModalForm from './ModalFormUseForm';

function StepField({ name, label }: { name: string; label?: string }) {
  return (
    <Form.Item name={name} label={label}>
      <Input />
    </Form.Item>
  );
}

function renderForm(submit: jest.Mock) {
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter>
        <ModalForm
          type="create"
          title="Edit record"
          btnName="Open editor"
          dataSubmitter={submit}
          subForm={[
            {
              label: '',
              component: (
                <Form.Item
                  label="Name"
                  name="name"
                  rules={[{ required: true, message: 'Name is required' }]}
                >
                  <Input />
                </Form.Item>
              ),
            },
          ]}
        />
      </MemoryRouter>
    </Provider>,
  );
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

it('blocks invalid data, submits valid data once, and closes on success', async () => {
  const user = userEvent.setup();
  const submit = jest.fn().mockResolvedValue({});
  renderForm(submit);
  await user.click(screen.getByRole('button', { name: /Open editor/ }));
  await user.click(screen.getByRole('button', { name: /Submit/ }));
  expect(await screen.findByText('Name is required')).toBeVisible();
  expect(submit).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText('Name'), 'Example');
  await user.click(screen.getByRole('button', { name: /Submit/ }));
  await waitFor(() => expect(submit).toHaveBeenCalledWith({ name: 'Example' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

it('preserves entered data and permits a retry after a failed request', async () => {
  const user = userEvent.setup();
  const submit = jest.fn().mockRejectedValueOnce(new Error('Network')).mockResolvedValue({});
  renderForm(submit);
  await user.click(screen.getByRole('button', { name: /Open editor/ }));
  await user.type(screen.getByLabelText('Name'), 'Draft');
  await user.click(screen.getByRole('button', { name: /Submit/ }));
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
  expect(screen.getByLabelText('Name')).toHaveValue('Draft');
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /Submit/ })).not.toHaveClass('ant-btn-loading'),
  );
  await user.click(screen.getByRole('button', { name: /Submit/ }));
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(2));
});

it('ignores an older loader result when the edit action is started twice', async () => {
  const user = userEvent.setup();
  const first = deferred<{ name: string }>();
  const second = deferred<{ name: string }>();
  const loader = jest.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  render(
    <Provider store={createAppStore()}>
      <MemoryRouter>
        <ModalForm
          type="update"
          title="Edit record"
          btnName="Open editor"
          dataLoader={loader}
          dataSubmitter={jest.fn().mockResolvedValue({})}
          subForm={[
            {
              label: '',
              component: (
                <Form.Item name="name">
                  <Input aria-label="Name" />
                </Form.Item>
              ),
            },
          ]}
        />
      </MemoryRouter>
    </Provider>,
  );
  const open = screen.getByRole('button', { name: /Open editor/ });
  await user.click(open);
  await user.click(open);
  second.resolve({ name: 'Newest' });
  await waitFor(() => expect(screen.getByDisplayValue('Newest')).toBeVisible());
  first.resolve({ name: 'Stale' });
  await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue('Newest'));
});

it('applies initial values to every step without a timer', async () => {
  const user = userEvent.setup();
  const submit = jest.fn().mockResolvedValue({});
  render(
    <Provider store={createAppStore()}>
      <MemoryRouter>
        <ModalForm
          type="create"
          title="Wizard"
          btnName="Open wizard"
          initData={{ first: 'Alpha', second: 'Beta' }}
          dataSubmitter={submit}
          subForm={[
            {
              label: 'First',
              component: <StepField name="first" label="First" />,
            },
            {
              label: 'Second',
              component: <StepField name="second" label="Second" />,
            },
          ]}
        />
      </MemoryRouter>
    </Provider>,
  );
  await user.click(screen.getByRole('button', { name: /Open wizard/ }));
  await waitFor(() => expect(screen.getByLabelText('First')).toHaveValue('Alpha'));
  await user.click(screen.getByRole('button', { name: /Next|下一步/ }));
  await waitFor(() => expect(screen.getByLabelText('Second')).toHaveValue('Beta'));
});

it('resets step state when the wizard is closed and reopened', async () => {
  const user = userEvent.setup();
  render(
    <Provider store={createAppStore()}>
      <MemoryRouter>
        <ModalForm
          type="create"
          title="Wizard"
          btnName="Open wizard"
          initData={{ first: 'Initial', second: 'Second' }}
          dataSubmitter={jest.fn().mockResolvedValue({})}
          subForm={[
            { label: 'First', component: <StepField name="first" label="First" /> },
            { label: 'Second', component: <StepField name="second" label="Second" /> },
          ]}
        />
      </MemoryRouter>
    </Provider>,
  );
  const open = screen.getByRole('button', { name: /Open wizard/ });
  await user.click(open);
  await waitFor(() => expect(screen.getByLabelText('First')).toHaveValue('Initial'));
  await user.clear(screen.getByLabelText('First'));
  await user.type(screen.getByLabelText('First'), 'Changed');
  await user.click(screen.getByRole('button', { name: /Close|取消/ }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await user.click(open);
  await waitFor(() => expect(screen.getByLabelText('First')).toHaveValue('Initial'));
});
