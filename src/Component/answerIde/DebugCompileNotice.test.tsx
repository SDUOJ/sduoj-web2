import { render, screen } from '@testing-library/react';
import { DebugSidebar } from './DebugPanel';
import type { IdeDebugController } from './useIdeDebug';
import type { DebugInspection } from './useDebugInspection';
import i18n from '../../Config/i18n';

beforeEach(async () => {
  await i18n.changeLanguage('zh');
});

test.each(['编译失败，请检查程序和编译输出。', '编译超时，请检查程序后重新调试。'])(
  'renders %s as a visible error alert after the scene ends',
  (notice) => {
    const debug = {
      available: true,
      active: false,
      notice,
      noticeType: 'error',
      session: { state: 'failed', commands: [] },
      watchExpressions: [],
    } as unknown as IdeDebugController;
    const inspection = { variables: [], frames: [], watches: {} } as unknown as DebugInspection;
    render(<DebugSidebar debug={debug} inspection={inspection} />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('ant-alert-error');
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent(notice);
  },
);
