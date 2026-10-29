export type DebugInstruction =
  | { kind: 'operation'; operation: string; arguments?: Record<string, unknown> }
  | { kind: 'break'; line: number; remove?: boolean }
  | { kind: 'local'; action: 'help' | 'breakpoints' | 'locals' | 'clear' | 'delete' }
  | { kind: 'control'; action: 'stop' | 'pause' }
  | { kind: 'invalid' };
/** Parse a finite command language. Never forward text to GDB, a shell or evaluate. */
export function parseDebugInstruction(text: string): DebugInstruction {
  const value = text.trim();
  const operations: Record<string, string> = {
    c: 'continue',
    continue: 'continue',
    n: 'next',
    next: 'next',
    s: 'stepIn',
    step: 'stepIn',
    finish: 'stepOut',
    bt: 'stackTrace',
    backtrace: 'stackTrace',
  };
  if (Object.prototype.hasOwnProperty.call(operations, value))
    return { kind: 'operation', operation: operations[value] };
  if (['q', 'quit'].includes(value)) return { kind: 'control', action: 'stop' };
  if (value === 'interrupt') return { kind: 'control', action: 'pause' };
  const local: Record<string, 'help' | 'breakpoints' | 'locals' | 'clear' | 'delete'> = {
    help: 'help',
    'info breakpoints': 'breakpoints',
    'info locals': 'locals',
    clear: 'clear',
    delete: 'delete',
  };
  if (Object.prototype.hasOwnProperty.call(local, value))
    return { kind: 'local', action: local[value] };
  const match = /^(b|break|clear) ([1-9][0-9]{0,5})$/.exec(value);
  if (match && Number(match[2]) <= 100000)
    return { kind: 'break', line: Number(match[2]), remove: match[1] === 'clear' };
  return { kind: 'invalid' };
}
