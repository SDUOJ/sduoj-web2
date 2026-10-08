import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DeprecatedJavaExam from '../../Pages/Exam/DeprecatedJavaExam';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

it('renders a retirement notice and migration links without mounting legacy exam pages', () => {
  render(
    <MemoryRouter>
      <DeprecatedJavaExam />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: 'DeprecatedJavaExamTitle' })).toBeVisible();
  expect(screen.getByRole('alert')).toHaveTextContent('DeprecatedJavaExamDescription');
  expect(screen.getByRole('link', { name: 'OpenAutolabExams' })).toHaveAttribute(
    'href',
    '/v2/manage/problemSet/exams',
  );
  expect(screen.getByRole('link', { name: 'ReturnToHome' })).toHaveAttribute('href', '/v2/home');
});
