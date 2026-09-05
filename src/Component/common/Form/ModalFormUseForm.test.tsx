import { Form, Input } from 'antd';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { createAppStore } from '../../../Redux/Store';
import ModalForm from './ModalFormUseForm';

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
