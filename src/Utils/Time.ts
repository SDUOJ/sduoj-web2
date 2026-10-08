import dayjs from 'dayjs';

export function TimeRangeState(start: number | string, end: number | string) {
  const startMs = toMillis(start);
  const endMs = toMillis(end);
  if (startMs > Date.now()) return 'wait';
  if (endMs < Date.now()) return 'end';
  return 'running';
}

/** 支持 Unix 毫秒与 ISO/日期字符串；禁止 parseInt 截断 ISO 串（如 '2026-10-05T…'） */
function toMillis(value: number | string): number {
  if (typeof value === 'number') return value;
  const trimmed = value.trim();
  if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  return dayjs(trimmed).valueOf();
}

export function getDiffSecond(start: number | string, end: number | string) {
  return dayjs(toMillis(end)).diff(dayjs(toMillis(start)), 'second');
}

export function TimeDiff(
  start: number | string,
  end: number | string,
  d: string = '天',
  h: string = '时',
  m: string = '分',
  s: string = '秒',
) {
  const diffSecond: number = getDiffSecond(start, end);
  let res = '';
  if (Math.floor(diffSecond / 3600 / 24) !== 0)
    res += Math.floor(diffSecond / 3600 / 24).toString() + d;
  if (Math.floor((diffSecond % (3600 * 24)) / 3600) !== 0)
    res += Math.floor((diffSecond % (3600 * 24)) / 3600).toString() + h;
  if (Math.floor((diffSecond % 3600) / 60) !== 0)
    res += Math.floor((diffSecond % 3600) / 60).toString() + m;
  if (diffSecond % 60 !== 0) res += (diffSecond % 60).toString() + s;
  if (res === '') res = '0' + s;
  return res;
}

export function unix2Time(time: number | string) {
  return dayjs(toMillis(time)).format('YYYY-MM-DD HH:mm:ss');
}

export function unix2Date(time: number | string) {
  return dayjs(toMillis(time)).format('YYYY-MM-DD');
}
