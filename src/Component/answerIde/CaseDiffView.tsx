import { Alert, Collapse } from 'antd';
import { useTranslation } from 'react-i18next';

type DiffLine = { kind: 'same' | 'expected' | 'actual'; text: string };
const boundedLines = (text: string) => text.slice(0, 10000).split('\n').slice(0, 200);
/** Line LCS is bounded to 200×200, even for adversarial output. */
export function outputDiff(expected: string, actual: string): DiffLine[] {
  const left = boundedLines(expected);
  const right = boundedLines(actual);
  const lengths = Array.from({ length: left.length + 1 }, () => new Uint16Array(right.length + 1));
  for (let i = left.length - 1; i >= 0; i--)
    for (let j = right.length - 1; j >= 0; j--)
      lengths[i][j] =
        left[i] === right[j]
          ? lengths[i + 1][j + 1] + 1
          : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
  const rows: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length || j < right.length) {
    if (i < left.length && j < right.length && left[i] === right[j]) {
      rows.push({ kind: 'same', text: left[i++] });
      j++;
    } else if (i < left.length && (j === right.length || lengths[i + 1][j] >= lengths[i][j + 1])) {
      rows.push({ kind: 'expected', text: left[i++] });
    } else rows.push({ kind: 'actual', text: right[j++] });
  }
  return rows;
}
export default function CaseDiffView(props: {
  expected: string;
  actual: string;
  truncated?: boolean;
}) {
  const { t } = useTranslation();
  const limited = [props.expected, props.actual].some(
    (text) => text.length > 10000 || text.split('\n').length > 200,
  );
  return (
    <Collapse
      items={[
        {
          key: 'diff',
          label: t('answerIde.diff'),
          children: (
            <>
              <p>{t('answerIde.diffLegend')}</p>
              {props.truncated && <Alert type="warning" message={t('answerIde.diffPrefix')} />}
              {limited && <Alert type="info" message={t('answerIde.diffLimit')} />}
              {props.expected === props.actual && <p>{t('answerIde.equal')}</p>}
              <pre
                aria-label={t('answerIde.diff')}
                style={{
                  maxHeight: 300,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                }}
              >
                {outputDiff(props.expected, props.actual).map((row, index) => (
                  <div
                    key={index}
                    style={{
                      background:
                        row.kind === 'expected'
                          ? '#fff1f0'
                          : row.kind === 'actual'
                            ? '#f6ffed'
                            : undefined,
                    }}
                  >
                    {row.kind === 'expected' ? '−' : row.kind === 'actual' ? '+' : ' '}{' '}
                    {row.text.replace(/ /g, '·').replace(/\t/g, '⇥').replace(/\r/g, '␍')}
                  </div>
                ))}
              </pre>
            </>
          ),
        },
      ]}
    />
  );
}
