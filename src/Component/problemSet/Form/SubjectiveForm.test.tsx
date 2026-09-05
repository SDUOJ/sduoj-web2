import { Button, Form } from 'antd';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubjectiveForm from './SubjectiveForm';

jest.mock('../../common/Editor', () => ({
  __esModule: true,
  default: () => <textarea aria-label="Description" />,
}));
jest.mock('../../common/Table/CellEditTable', () => () => <div>File configuration</div>);

it('switches the answer mode using a numeric value and displays its matching configuration', async () => {
  const submit = jest.fn();
  render(
    <Form initialValues={{ type: 0, description: 'Explain' }} onFinish={submit}>
      <SubjectiveForm type="create" />
      <Button htmlType="submit">Save</Button>
    </Form>,
  );
  expect(await screen.findByText('File configuration')).toBeVisible();
  await userEvent.setup().click(screen.getAllByRole('radio')[1]);
  expect(screen.getByRole('spinbutton')).toBeVisible();
  expect(screen.queryByText('File configuration')).not.toBeInTheDocument();
  await userEvent.setup().click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({ type: 1 })));
});
