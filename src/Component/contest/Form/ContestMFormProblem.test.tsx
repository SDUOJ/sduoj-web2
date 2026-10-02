import { Button, Form } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ContestMFormProblem from './ContestMFormProblem';

jest.mock('../../problem/From/Item/ProblemAddBody', () => ({ value, onChange }: any) => (
  <textarea
    aria-label="Problem rows"
    value={JSON.stringify(value)}
    onChange={(event) => onChange(JSON.parse(event.target.value))}
  />
));

it('blocks an existing duplicate list and permits submission after it is corrected', async () => {
  const submit = jest.fn();
  render(
    <Form
      initialValues={{ problems: [{ problemCode: 'SDUOJ-1806' }, { problemCode: 'SDUOJ-1806' }] }}
      onFinish={submit}
    >
      <ContestMFormProblem />
      <Button htmlType="submit">Save contest</Button>
    </Form>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Save contest' }));
  expect(await screen.findByText(/SDUOJ-1806（第 1、2 行）/)).toBeVisible();
  expect(submit).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Problem rows'), {
    target: {
      value: JSON.stringify([{ problemCode: 'SDUOJ-1806' }, { problemCode: 'SDUOJ-1807' }]),
    },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save contest' }));
  await waitFor(() =>
    expect(submit).toHaveBeenCalledWith({
      problems: [{ problemCode: 'SDUOJ-1806' }, { problemCode: 'SDUOJ-1807' }],
    }),
  );
});
