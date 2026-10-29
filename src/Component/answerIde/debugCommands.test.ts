import { parseDebugInstruction } from './debugCommands';
test.each([
  '__proto__',
  'constructor',
  'shell id',
  '!id',
  'python import os',
  'source /etc/passwd',
  'call system("id")',
  'print value++',
  'continue\nquit',
  'next;quit',
  'break -1',
  'break 100001',
])('rejects commands outside the finite protocol: %s', (text) => {
  expect(parseDebugInstruction(text)).toEqual({ kind: 'invalid' });
});
test('maps familiar commands to language-independent operations and source lines', () => {
  expect(parseDebugInstruction(' n ')).toEqual({ kind: 'operation', operation: 'next' });
  expect(parseDebugInstruction('bt')).toEqual({ kind: 'operation', operation: 'stackTrace' });
  expect(parseDebugInstruction('break 17')).toEqual({ kind: 'break', line: 17, remove: false });
  expect(parseDebugInstruction('clear 17')).toEqual({ kind: 'break', line: 17, remove: true });
  expect(parseDebugInstruction('quit')).toEqual({ kind: 'control', action: 'stop' });
});
