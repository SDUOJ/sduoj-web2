import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimeSettingX from './TimeSettingX';

it('keeps invalid time windows in the editor instead of returning an incomplete configuration', async () => {
  const onChange = jest.fn();
  const user = userEvent.setup();
  render(<TimeSettingX onChange={onChange} />);
  await user.click(screen.getByRole('button'));
  const buttons = screen.getAllByRole('button');
  const add = buttons.find((button) => button.querySelector('[aria-label="plus"]'))!;
  await user.click(add);
  await user.click(screen.getByRole('button', { name: 'OK' }));
  await waitFor(() => expect(document.querySelector('.ant-form-item-explain-error')).toBeVisible());
  expect(screen.getByRole('dialog')).toBeVisible();
  expect(onChange).not.toHaveBeenCalled();
});
