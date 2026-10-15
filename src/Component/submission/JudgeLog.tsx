import { CodeOutlined } from '@ant-design/icons';
import './judgeLog.css';

export default function JudgeLog({
  title,
  log,
  error = false,
}: {
  title: string;
  log: string;
  error?: boolean;
}) {
  return (
    <section className={`judge-log${error ? ' judge-log-error' : ''}`} aria-label={title}>
      <div className="judge-log-heading">
        <CodeOutlined aria-hidden />
        <strong>{title}</strong>
      </div>
      <pre>{log}</pre>
    </section>
  );
}
