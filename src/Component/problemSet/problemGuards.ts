import { useEffect } from 'react';

export const installProblemGuards = () => {
  const preventContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    // Stop editor-specific menus as well as the browser's menu.
    event.stopPropagation();
  };
  const preventDevTools = (event: KeyboardEvent) => {
    if (event.key === 'F12') event.preventDefault();
  };
  const preventSelection = (event: Event) => {
    const element = event.target instanceof Element ? event.target : null;
    if (element?.closest('input, textarea, [contenteditable="true"], .monaco-editor')) return;
    event.preventDefault();
  };
  document.addEventListener('contextmenu', preventContextMenu, true);
  document.addEventListener('selectstart', preventSelection);
  window.addEventListener('keydown', preventDevTools);
  return () => {
    document.removeEventListener('contextmenu', preventContextMenu, true);
    document.removeEventListener('selectstart', preventSelection);
    window.removeEventListener('keydown', preventDevTools);
  };
};

export function useProblemGuards(enabled = true) {
  useEffect(() => (enabled ? installProblemGuards() : undefined), [enabled]);
}
