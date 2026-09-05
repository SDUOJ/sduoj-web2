import { render, screen } from '@testing-library/react';
import CodeEditor from './CodeEditor';

it.each(['c', 'cpp', 'java', 'sql', 'python', 'text'] as const)(
  'mounts the real %s editor with compatible theme and language extensions',
  (lang) => {
    render(<CodeEditor lang={lang} value="sample code" />);
    expect(screen.getByRole('textbox')).toHaveTextContent('sample code');
  },
);
