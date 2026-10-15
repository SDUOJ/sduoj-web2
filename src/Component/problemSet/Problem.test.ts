import { installProblemGuards } from './problemGuards';

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
  const afterF12 = new KeyboardEvent('keydown', { key: 'F12', cancelable: true });
  window.dispatchEvent(afterF12);
  expect(afterF12.defaultPrevented).toBe(false);
});

it('blocks statement selection and editor context menus while allowing editing selections', () => {
  const statement = document.createElement('p');
  const editor = document.createElement('div');
  editor.className = 'monaco-editor';
  const source = document.createElement('span');
  editor.append(source);
  const input = document.createElement('textarea');
  document.body.append(statement, editor, input);
  const cleanup = installProblemGuards();
  try {
    const menu = jest.fn();
    editor.addEventListener('contextmenu', menu);
    const context = new MouseEvent('contextmenu', { cancelable: true, bubbles: true });
    source.dispatchEvent(context);
    expect(context.defaultPrevented).toBe(true);
    expect(menu).not.toHaveBeenCalled();
    const select = () => new Event('selectstart', { cancelable: true, bubbles: true });
    expect(statement.dispatchEvent(select())).toBe(false);
    expect(source.dispatchEvent(select())).toBe(true);
    expect(input.dispatchEvent(select())).toBe(true);
    cleanup();
    expect(statement.dispatchEvent(select())).toBe(true);
  } finally {
    cleanup();
    statement.remove();
    editor.remove();
    input.remove();
  }
});
