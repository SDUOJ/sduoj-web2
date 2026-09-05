import { Button, Form } from 'antd';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ItemTimeRange from './ItemTimeRange';

const start = new Date(2026, 8, 5, 10).valueOf();
const end = start + 3600000;

it('clears both stored timestamps and shows required errors beside the picker', async () => {
  const submit = jest.fn();
  const user = userEvent.setup();
  render(
    <Form initialValues={{ gmtStart: start, gmtEnd: end }} onFinish={submit}>
      <ItemTimeRange label="Time" required />
      <Button htmlType="submit">Save</Button>
      <Button htmlType="reset">Reset</Button>
    </Form>,
  );
  expect(screen.getAllByRole('textbox')[0]).toHaveValue('2026-09-05 10:00:00');
  await user.click(screen.getByRole('button', { name: 'close-circle' }));
  await user.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(document.querySelector('.ant-form-item-explain-error')).toBeVisible());
  expect(submit).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Reset' }));
  await user.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(submit).toHaveBeenCalledWith({ gmtStart: start, gmtEnd: end }));
});

it('submits null after clearing an optional nested range', async () => {
  const submit = jest.fn();
  const user = userEvent.setup();
  render(
    <Form initialValues={{ data: [{ tm_start: start, tm_end: end }] }} onFinish={submit}>
      <Form.List name="data">
        {(fields) =>
          fields.map(({ key, name }) => (
            <ItemTimeRange
              key={key}
              prefix={['data']}
              startName={[name, 'tm_start']}
              endName={[name, 'tm_end']}
            />
          ))
        }
      </Form.List>
      <Button htmlType="submit">Save</Button>
    </Form>,
  );
  expect(screen.getAllByRole('textbox')[1]).toHaveValue('2026-09-05 11:00:00');
  await user.click(screen.getByRole('button', { name: 'close-circle' }));
  await user.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() =>
    expect(submit).toHaveBeenCalledWith({ data: [{ tm_start: null, tm_end: null }] }),
  );
});
