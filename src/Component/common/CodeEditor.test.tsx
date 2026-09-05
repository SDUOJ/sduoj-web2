import { render, screen } from '@testing-library/react';
import CodeEditor from './CodeEditor';

let consoleError: jest.SpyInstance;

beforeEach(() => {
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  const calls = consoleError.mock.calls;
  consoleError.mockRestore();
  expect(calls).toEqual([]);
});

it.each(['c', 'cpp', 'java', 'sql', 'python', 'text'] as const)(
  'mounts the real %s editor with compatible theme and language extensions',
  (lang) => {
    render(<CodeEditor lang={lang} value="sample code" />);
    expect(screen.getByRole('textbox')).toHaveTextContent('sample code');
  },
);
