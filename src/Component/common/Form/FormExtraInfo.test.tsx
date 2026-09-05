import { Button, Form } from 'antd';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import FormExtraInfo from './FormExtraInfo';

const eqs = (left: unknown, right: unknown) => left === right;

function Fixture() {
  const [form] = Form.useForm();
  const [local, setLocal] = useState<string | undefined>();
  const formValue = Form.useWatch('bridge', form);
  return (
    <>
      <Form form={form} initialValues={{ bridge: 'seed' }}>
        <Form.Item name="bridge">
          <FormExtraInfo v={local} setV={setLocal} eqs={eqs} syncUndefined />
        </Form.Item>
      </Form>
      <output aria-label="local">{local ?? '<empty>'}</output>
      <output aria-label="form">{formValue ?? '<empty>'}</output>
      <Button onClick={() => setLocal('external')}>Set external</Button>
      <Button onClick={() => form.setFieldsValue({ bridge: 'loaded' })}>Load form</Button>
      <Button
        onClick={() => {
          setLocal('conflict-local');
          form.setFieldsValue({ bridge: 'conflict-form' });
        }}
      >
        Conflict
      </Button>
      <Button onClick={() => setLocal(undefined)}>Clear external</Button>
      <Button onClick={() => form.resetFields()}>Reset form</Button>
    </>
  );
}

it('moves only the changed side across external, loaded, clear, and reset transitions', async () => {
  const user = userEvent.setup();
  render(<Fixture />);
  await waitFor(() => expect(screen.getByLabelText('local')).toHaveTextContent('seed'));

  await user.click(screen.getByRole('button', { name: 'Set external' }));
  await waitFor(() => expect(screen.getByLabelText('form')).toHaveTextContent('external'));

  await user.click(screen.getByRole('button', { name: 'Load form' }));
  await waitFor(() => expect(screen.getByLabelText('local')).toHaveTextContent('loaded'));
  expect(screen.getByLabelText('form')).toHaveTextContent('loaded');

  await user.click(screen.getByRole('button', { name: 'Conflict' }));
  await waitFor(() => expect(screen.getByLabelText('local')).toHaveTextContent('conflict-form'));
  expect(screen.getByLabelText('form')).toHaveTextContent('conflict-form');

  await user.click(screen.getByRole('button', { name: 'Clear external' }));
  await waitFor(() => expect(screen.getByLabelText('form')).toHaveTextContent('<empty>'));
  expect(screen.getByLabelText('local')).toHaveTextContent('<empty>');

  await user.click(screen.getByRole('button', { name: 'Load form' }));
  await waitFor(() => expect(screen.getByLabelText('local')).toHaveTextContent('loaded'));
  await user.click(screen.getByRole('button', { name: 'Reset form' }));
  await waitFor(() => expect(screen.getByLabelText('local')).toHaveTextContent('seed'));
  expect(screen.getByLabelText('form')).toHaveTextContent('seed');
});

it('does not pass undefined to legacy local-value adapters unless explicitly enabled', async () => {
  const setLocal = jest.fn((value: string) => value.split(','));

  function LegacyFixture() {
    const [form] = Form.useForm();
    return (
      <>
        <Form form={form} initialValues={{ bridge: 'pdf,docx' }}>
          <Form.Item name="bridge">
            <FormExtraInfo v="pdf,docx" setV={setLocal} eqs={eqs} />
          </Form.Item>
        </Form>
        <Button onClick={() => form.setFieldsValue({ bridge: undefined })}>Clear form</Button>
      </>
    );
  }

  const user = userEvent.setup();
  render(<LegacyFixture />);
  await user.click(screen.getByRole('button', { name: 'Clear form' }));
  await waitFor(() => expect(setLocal).not.toHaveBeenCalled());
});
