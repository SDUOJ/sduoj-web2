import { render } from '@testing-library/react';
import UserAvatar from './Avatar';

it('uses a local icon during development even for a signed-in user', () => {
  jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'development' });
  const { container } = render(<UserAvatar email="test@example.invalid" />);
  expect(container.querySelector('img[src]')).toBeNull();
  expect(container.querySelector('[aria-label="user"]')).not.toBeNull();
});

it('preserves production avatar rendering', () => {
  jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'production' });
  const { container } = render(<UserAvatar email="test@example.invalid" />);
  expect(container.querySelector('img')).toHaveAttribute(
    'src',
    expect.stringContaining('https://cravatar.cn/avatar/'),
  );
});
