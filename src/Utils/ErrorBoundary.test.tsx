import { render, screen } from '@testing-library/react';
import i18n from '../Config/i18n';
import ErrorBoundary from './ErrorBoundary';

const Broken = () => {
  throw new Error('broken');
};

describe('ErrorBoundary translations', () => {
  const originalLanguage = i18n.language;

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    void i18n.changeLanguage(originalLanguage);
  });

  it.each([
    ['en', 'Something went wrong', 'Retry'],
    ['zh', '页面出错了', '重试'],
  ])('renders the %s locale fallback', async (language, title, retry) => {
    await i18n.changeLanguage(language);
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('heading', { name: title })).toBeVisible();
    expect(screen.getByRole('button', { name: retry })).toBeVisible();
  });
});
