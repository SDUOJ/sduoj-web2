import { installProblemGuards } from './Problem';

it('removes problem-page browser guards when leaving the route', () => {
  const cleanup = installProblemGuards();
  const contextMenu = new MouseEvent('contextmenu', { cancelable: true });
  const devTools = new KeyboardEvent('keydown', { key: 'F12', cancelable: true });
  document.dispatchEvent(contextMenu);
  window.dispatchEvent(devTools);
  expect(contextMenu.defaultPrevented).toBe(true);
  expect(devTools.defaultPrevented).toBe(true);

  cleanup();
  const afterNavigation = new MouseEvent('contextmenu', { cancelable: true });
  document.dispatchEvent(afterNavigation);
  expect(afterNavigation.defaultPrevented).toBe(false);
});
