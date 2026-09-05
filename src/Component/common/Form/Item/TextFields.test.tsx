import { Button, Form } from 'antd';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ItemTitle from './ItemTitle';
import ItemText from './ItemText';
import '../../../../Config/i18n';

it('rejects an empty title and preserves the submitted value', async () => {
  const submit = jest.fn();
  const user = userEvent.setup();
  render(
    <Form onFinish={submit}>
      <ItemTitle label="Title" />
      <Button htmlType="submit">Save</Button>
    </Form>,
  );
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByText(/required/i)).toBeVisible();
  expect(submit).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText('Title'), 'Example');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(submit).toHaveBeenCalledWith({ title: 'Example' }));
});

it('rejects whitespace-only required text and accepts empty optional text', async () => {
  const submit = jest.fn();
  const user = userEvent.setup();
  render(
    <Form onFinish={submit}>
      <ItemText name="name" label="Name" />
      <ItemText name="note" label="Note" required={false} />
      <Button htmlType="submit">Save</Button>
    </Form>,
  );
  await user.type(screen.getByLabelText('Name'), '   ');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() =>
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true'),
  );
  expect(submit).not.toHaveBeenCalled();
  await user.clear(screen.getByLabelText('Name'));
  await user.type(screen.getByLabelText('Name'), 'Valid');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(submit).toHaveBeenCalledWith({ name: 'Valid', note: undefined }));
});

it('preserves nested names and zero initial values', async () => {
  const submit = jest.fn();
  render(
    <Form onFinish={submit}>
      <ItemText name={['limits', 'score']} label="Score" initialValue={0} addonAfter="points" />
      <Button htmlType="submit">Save</Button>
    </Form>,
  );
  await userEvent.setup().click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(submit).toHaveBeenCalledWith({ limits: { score: 0 } }));
});

it('combines required validation with caller-supplied rules', async () => {
  const submit = jest.fn();
  const user = userEvent.setup();
  render(
    <Form onFinish={submit}>
      <ItemText name="name" label="Name" rules={[{ min: 3, message: 'Too short' }]} />
      <Button htmlType="submit">Save</Button>
    </Form>,
  );
  await user.type(screen.getByLabelText('Name'), 'ab');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByText('Too short')).toBeVisible();
  expect(submit).not.toHaveBeenCalled();
});
