import { useEffect, useState } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { Provider, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { createAppStore, RootState } from '../../Redux/Store';
import i18n from '../../Config/i18n';
import ChangeLang from './ChangeLang';

function Layout() {
  const locale = useSelector((state: RootState) => state.ConfigReducer.lang);
  const { t } = useTranslation();
  const [showHeader, setShowHeader] = useState(false);
  useEffect(() => setShowHeader(true), []);
  return (
    <>
      <output data-testid="locale">{locale.locale}</output>
      <output data-testid="translation">{t('Login')}</output>
      {showHeader && <ChangeLang />}
    </>
  );
}

it('applies the saved language after the header mounts without updating a rendering layout', async () => {
  const previousLanguage = localStorage.getItem('language');
  const previousDocumentLanguage = document.documentElement.lang;
  const previousI18nLanguage = i18n.language;
  const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  try {
    await i18n.changeLanguage('zh');
    localStorage.setItem('language', 'en');
    render(
      <Provider store={createAppStore()}>
        <Layout />
      </Provider>,
    );
    await waitFor(() => expect(screen.getByTestId('translation')).toHaveTextContent('login'));
    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('language')).toBe('en_US');
    expect(error.mock.calls.map((call) => call.join(' ')).join('\n')).not.toMatch(
      /Cannot update a component|Too many re-renders|Maximum update depth/,
    );
  } finally {
    cleanup();
    error.mockRestore();
    if (previousLanguage === null) localStorage.removeItem('language');
    else localStorage.setItem('language', previousLanguage);
    document.documentElement.lang = previousDocumentLanguage;
    await i18n.changeLanguage(previousI18nLanguage);
  }
});
