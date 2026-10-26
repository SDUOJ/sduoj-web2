import i18n from '../../Config/i18n';
beforeEach(async () => {
  await i18n.changeLanguage('zh');
});
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import CustomCaseList, { CustomCaseItem } from './CustomCaseList';
it('keeps omitted and empty expected output distinct', () => {
  function View() {
    const [cases, setCases] = useState<CustomCaseItem[]>([{ key: '1', input: '' }]);
    return (
      <>
        <CustomCaseList cases={cases} onChange={setCases} />
        <output data-testid="data">{JSON.stringify(cases)}</output>
      </>
    );
  }
  render(<View />);
  expect(screen.queryByLabelText('用例 1 期望输出')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox'));
  expect(screen.getByLabelText('用例 1 期望输出')).toHaveValue('');
  expect(screen.getByTestId('data')).toHaveTextContent('"expectedOutput":""');
  fireEvent.click(screen.getByRole('checkbox'));
  expect(screen.getByTestId('data')).not.toHaveTextContent('expectedOutput');
});
