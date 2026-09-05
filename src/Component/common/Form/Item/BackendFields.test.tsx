import { Button, Form } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ItemTitle from './ItemTitle';
import ItemText from './ItemText';
import ItemEditor from './ItemEditor';
import { contracts } from '../../../../Config/validation/contracts';

jest.mock('../../Editor', () => ({
  __esModule: true,
  EditorDocumentIdentityContext: jest.requireActual('react').createContext(undefined),
  default: (props: any) => (
    <textarea
      id={props.id}
      value={props.value ?? ''}
      onChange={(event) => props.onChange(event.target.value)}
    />
  ),
}));

it('applies the description-title SQL limit without truncating pasted Unicode', async () => {
  const submit = jest.fn();
  render(
    <Form onFinish={submit}>
      <ItemTitle label="Title" constraint={contracts.description.title} />
      <Button htmlType="submit">Save</Button>
    </Form>,
  );
  const input = screen.getByLabelText('Title');
  const tooLong = '😀'.repeat(17);
  fireEvent.change(input, { target: { value: tooLong } });
  await userEvent.setup().click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByText(/16/)).toBeVisible();
  expect(input).toHaveValue(tooLong);
  expect(submit).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: '😀'.repeat(16) } });
  await userEvent.setup().click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(submit).toHaveBeenCalledWith({ title: '😀'.repeat(16) }));
});

it('rejects decimal and overflowing Java Integer values while preserving numeric strings', async () => {
  const submit = jest.fn();
  render(
    <Form onFinish={submit}>
      <ItemText name="timeLimit" label="Time" constraint={contracts.problem.timeLimit} />
      <Button htmlType="submit">Save</Button>
    </Form>,
  );
  const input = screen.getByLabelText('Time');
  fireEvent.change(input, { target: { value: '2147483648' } });
  await userEvent.setup().click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByText(/2147483647/)).toBeVisible();
  expect(submit).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: '2147483647' } });
  await userEvent.setup().click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(submit).toHaveBeenCalledWith({ timeLimit: '2147483647' }));
});

it('passes storage rules through the shared Markdown form field', async () => {
  const submit = jest.fn();
  render(
    <Form onFinish={submit}>
      <ItemEditor name="markdown" label="Content" constraint={contracts.group.markdown} />
      <Button htmlType="submit">Save</Button>
    </Form>,
  );
  const input = screen.getByLabelText('Content');
  fireEvent.change(input, { target: { value: '中'.repeat(21846) } });
  await userEvent.setup().click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByText(/65535/)).toBeVisible();
  expect(submit).not.toHaveBeenCalled();
});
