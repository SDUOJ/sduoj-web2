import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Input, Tooltip } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CaretRightOutlined,
  CloseOutlined,
  PauseOutlined,
  ReloadOutlined,
  StepForwardOutlined,
  BorderOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { debugMessage, IdeDebugController } from './useIdeDebug';
import type { DebugInspection, DebugVariable } from './useDebugInspection';
import { parseDebugInstruction } from './debugCommands';
import './debug.css';

export function DebugToolbar({
  debug,
  restart,
  busy,
}: {
  debug: IdeDebugController;
  restart: () => void;
  busy: boolean;
}) {
  const { t } = useTranslation();
  if (!debug.active) return null;
  const actions = [
    {
      label: debug.session?.state === 'running' ? 'pause' : 'continue',
      key: debug.session?.state === 'running' ? 'F6' : 'F5',
      icon: debug.session?.state === 'running' ? <PauseOutlined /> : <CaretRightOutlined />,
      disabled: debug.session?.state !== 'running' && (!debug.canInspect || busy),
      run: () =>
        debug.session?.state === 'running'
          ? debug.control('pause')
          : debug.execute('continue', { threadId: debug.threadId }),
    },
    {
      label: 'next',
      key: 'F10',
      icon: <StepForwardOutlined />,
      disabled: !debug.canInspect || busy,
      run: () => debug.execute('next', { threadId: debug.threadId }),
    },
    {
      label: 'stepIn',
      key: 'F11',
      icon: <ArrowDownOutlined />,
      disabled: !debug.canInspect || busy,
      run: () => debug.execute('stepIn', { threadId: debug.threadId }),
    },
    {
      label: 'stepOut',
      key: 'Shift+F11',
      icon: <ArrowUpOutlined />,
      disabled: !debug.canInspect || busy,
      run: () => debug.execute('stepOut', { threadId: debug.threadId }),
    },
    {
      label: 'restart',
      key: 'Ctrl/⌘+Shift+F5',
      icon: <ReloadOutlined />,
      disabled: debug.sending,
      run: restart,
    },
    {
      label: 'stop',
      key: 'Shift+F5',
      icon: <BorderOutlined />,
      disabled: false,
      run: () => debug.control('stop'),
    },
  ];
  return (
    <div className="ide-debug-toolbar" role="toolbar" aria-label={t('answerIde.debug.toolbar')}>
      <span className="ide-debug-toolbar-grip" aria-hidden>
        ⠿
      </span>
      {actions.map((action) => (
        <Tooltip
          key={action.label}
          title={`${t('answerIde.debug.' + action.label)} (${action.key})`}
        >
          <Button
            type="text"
            size="small"
            aria-label={t('answerIde.debug.' + action.label)}
            disabled={action.disabled}
            icon={action.icon}
            onClick={() => void action.run()}
          />
        </Tooltip>
      ))}
    </div>
  );
}

export function DebugStatus({ debug }: { debug: IdeDebugController }) {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    if (!debug.active || !debug.session?.hardExpiresAt) {
      setRemaining('');
      return;
    }
    const scene = debug.session;
    const update = () => {
      const seconds = Math.max(
        0,
        Math.ceil((Math.min(scene.hardExpiresAt!, scene.idleExpiresAt) - Date.now()) / 1000),
      );
      setRemaining(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [debug.active, debug.session]);
  return (
    <span className="ide-debug-status" role="status">
      {t(
        'answerIde.debug.state.' +
          (debug.session?.ticket ? 'queued' : (debug.session?.state ?? 'ready')),
      )}
      {remaining && ` · ${remaining}`}
    </span>
  );
}

export function DebugSidebar({
  debug,
  inspection,
}: {
  debug: IdeDebugController;
  inspection: DebugInspection;
}) {
  const { t } = useTranslation();
  const [watchText, setWatchText] = useState('');
  const [addingWatch, setAddingWatch] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  useEffect(() => setExpanded({}), [debug.session?.stopId]);
  const renderVariables = (entries: DebugVariable[], parent: number[] = []) => (
    <ul className="ide-debug-variable-tree">
      {entries.map((variable, index) => {
        if (variable.name.toLowerCase() === 'special variables') return null;
        const path = [...parent, index];
        return (
          <li key={index}>
            <div className="ide-debug-variable-row">
              {variable.variablesReference > 0 && path.length <= 3 ? (
                <Button
                  type="text"
                  size="small"
                  aria-label={t('answerIde.debug.expand', { name: variable.name })}
                  disabled={!debug.canInspect || inspection.busy}
                  onClick={() => {
                    const key = path.join('.');
                    setExpanded((old) => ({ ...old, [key]: !old[key] }));
                    if (!variable.children) inspection.expand(variable, path);
                  }}
                  icon={<CaretRightOutlined rotate={expanded[path.join('.')] ? 90 : 0} />}
                />
              ) : (
                <span className="ide-debug-tree-spacer" />
              )}
              <span className="ide-debug-variable-name">{variable.name}</span>
              <span className="ide-debug-variable-value" title={variable.value}>
                : {variable.value}
              </span>
            </div>
            {variable.children &&
              expanded[path.join('.')] &&
              renderVariables(variable.children, path)}
          </li>
        );
      })}
    </ul>
  );
  const error = debug.session?.commands.slice(-1)[0]?.error;
  return (
    <aside className="ide-debug-sidebar" aria-label={t('answerIde.debug.view')}>
      <header>
        <strong>{t('answerIde.debug.view')}</strong>
      </header>
      <DebugStatus debug={debug} />
      {debug.notice && (
        <Alert
          type={debug.noticeType ?? 'info'}
          role={debug.noticeType === 'error' ? 'alert' : undefined}
          message={debug.notice}
          showIcon
        />
      )}
      {error && debug.active && <Alert type="info" message={debugMessage(error)} showIcon />}
      {debug.sourceChanged && <Alert type="info" message={t('answerIde.debug.sourceChanged')} />}
      {debug.session?.ticket && (
        <Button size="small" onClick={() => void debug.cancel()}>
          {t('answerIde.debug.cancelWait')}
        </Button>
      )}
      <details open>
        <summary>{t('answerIde.debug.variables')}</summary>
        {inspection.variables.length ? (
          renderVariables(inspection.variables)
        ) : (
          <p>{t('answerIde.debug.noVariables')}</p>
        )}
      </details>
      <details open>
        <summary>
          监视{' '}
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            aria-label="添加监视"
            onClick={(e) => {
              e.preventDefault();
              setAddingWatch(true);
            }}
          />
        </summary>
        {addingWatch && (
          <Input
            autoFocus
            aria-label="监视变量路径"
            value={watchText}
            maxLength={128}
            placeholder="value / user.name / arr[0]"
            onChange={(e) => setWatchText(e.target.value)}
            onPressEnter={() => {
              if (inspection.addWatch(watchText.trim())) {
                setWatchText('');
                setAddingWatch(false);
              }
            }}
          />
        )}
        {(debug.watchExpressions ?? []).map((expression) => (
          <div className="ide-debug-watch" key={expression}>
            <span title={expression}>
              {expression}: {inspection.watches?.[expression] ?? '—'}
            </span>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              aria-label={`删除监视 ${expression}`}
              onClick={() => inspection.removeWatch(expression)}
            />
          </div>
        ))}
      </details>
      <details open>
        <summary>{t('answerIde.debug.callStack')}</summary>
        <div className="ide-debug-stack">
          {inspection.frames.map((frame) => (
            <button
              key={frame.id}
              className={inspection.frame?.id === frame.id ? 'selected' : ''}
              disabled={!debug.canInspect || inspection.busy}
              onClick={() => inspection.select(frame)}
            >
              <span>{frame.name}</span>
              <span>{frame.line}</span>
            </button>
          ))}
        </div>
      </details>
    </aside>
  );
}

export function DebugConsole({
  debug,
  inspection,
  kind,
  input,
  setInput,
}: {
  debug: IdeDebugController;
  inspection: DebugInspection;
  kind: 'stdin' | 'commands';
  input: string;
  setInput: (text: string) => void;
}) {
  const { t } = useTranslation();
  const [commandText, setCommandText] = useState('');
  const history = debug.commandHistory;
  const setHistory = debug.setCommandHistory;
  const pending = useRef(new Set<string>());
  const output = useRef<HTMLPreElement>(null);
  const append = (text: string) => setHistory((old) => (old + text + '\n').slice(-65536));
  useEffect(() => {
    for (const command of debug.session?.commands ?? []) {
      if (
        !pending.current.has(command.commandId) ||
        !['completed', 'failed', 'unknown'].includes(command.status)
      )
        continue;
      pending.current.delete(command.commandId);
      if (command.error) append(debugMessage(command.error));
      else if (command.operation === 'stackTrace')
        append(
          ((command.result?.stackFrames ?? []) as { name: string; line: number }[])
            .map((f, i) => `#${i} ${f.name}:${f.line}`)
            .join('\n'),
        );
      else append(t('answerIde.debug.commandDone'));
    }
    // Append only results of explicitly typed commands, once per command ID.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debug.session?.commands]);
  useEffect(() => {
    if (output.current) output.current.scrollTop = output.current.scrollHeight;
  }, [history, debug.output]);
  const runCommand = async () => {
    const text = commandText.trim();
    if (!text) return;
    setCommandText('');
    append(`(debug) ${text}`);
    const command = parseDebugInstruction(text);
    if (command.kind === 'invalid') {
      append(t('answerIde.debug.unsupported'));
      return;
    }
    if (command.kind === 'control') {
      await debug.control(command.action);
      return;
    }
    if (command.kind === 'local') {
      if (command.action === 'help')
        append(
          'continue (c) · next (n) · step (s) · finish · break N · clear N · delete · backtrace (bt) · info locals · info breakpoints · interrupt · quit · clear',
        );
      if (command.action === 'clear') setHistory('');
      if (command.action === 'breakpoints')
        append(debug.breakpoints.join(', ') || t('answerIde.debug.noBreakpoints'));
      if (command.action === 'locals') {
        inspection.refresh();
        append(
          inspection.variables.map((v) => `${v.name} = ${v.value}`).join('\n') ||
            t('answerIde.debug.noVariables'),
        );
      }
      if (command.action === 'delete') await debug.updateBreakpoints([]);
      return;
    }
    if (command.kind === 'break') {
      await debug.updateBreakpoints(
        command.remove
          ? debug.breakpoints.filter((n) => n !== command.line)
          : [...debug.breakpoints, command.line],
      );
      return;
    }
    if (!debug.canInspect || inspection.busy) {
      append(t('answerIde.debug.waitStop'));
      return;
    }
    const id = await debug.execute(command.operation, { threadId: debug.threadId });
    if (id) pending.current.add(id);
  };
  const sendInput = async () => {
    const id = await debug.writeInput(input + '\n');
    if (id) setInput('');
  };
  return (
    <section
      className="ide-debug-terminal"
      aria-label={t(
        'answerIde.debug.' + (kind === 'stdin' ? 'programTerminal' : 'commandTerminal'),
      )}
    >
      <div className="ide-debug-terminal-header">
        <span>
          {t('answerIde.debug.' + (kind === 'stdin' ? 'programTerminal' : 'commandTerminal'))}
        </span>
        <Button
          type="text"
          size="small"
          aria-label={t('answerIde.debug.clearOutput')}
          onClick={() => (kind === 'stdin' ? debug.clearOutput() : setHistory(''))}
          icon={<CloseOutlined />}
        />
      </div>
      <pre ref={output} role="log" aria-live="polite">
        {kind === 'stdin' ? debug.output : history}
      </pre>
      {kind === 'stdin' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendInput();
          }}
        >
          <span aria-hidden>❯</span>
          <Input.TextArea
            autoSize={{ minRows: 1, maxRows: 4 }}
            aria-label={t('answerIde.debug.input')}
            value={input}
            maxLength={65535}
            placeholder={t('answerIde.debug.' + (debug.active ? 'inputHint' : 'initialInput'))}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey && !e.nativeEvent.isComposing && debug.active) {
                e.preventDefault();
                void sendInput();
              }
            }}
          />
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runCommand();
          }}
        >
          <span aria-hidden>(debug)</span>
          <Input.TextArea
            autoSize={{ minRows: 1, maxRows: 4 }}
            onPressEnter={(e) => {
              if (!e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void runCommand();
              }
            }}
            aria-label={t('answerIde.debug.command')}
            value={commandText}
            maxLength={256}
            placeholder={t('answerIde.debug.commandHint')}
            onChange={(e) => setCommandText(e.target.value)}
          />
        </form>
      )}
      <small>{t('answerIde.debug.' + (kind === 'stdin' ? 'inputNote' : 'commandNote'))}</small>
    </section>
  );
}
