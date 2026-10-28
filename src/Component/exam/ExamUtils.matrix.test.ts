import { getDescription } from './ExamUtils';

// The adapter renders viewer-local time; fixtures must use the local calendar
// so the same wall-clock assertions hold on UTC CI and Asia/Shanghai laptops.
const localIso = (day: number, hour: number, minute = 0) =>
  new Date(2026, 9, day, hour, minute).toISOString();

describe('exam description adapter', () => {
  it.each([[undefined], [null], [{}], [{ startTime: localIso(5, 9) }]])(
    'returns empty for incomplete exam info %#',
    (info) => {
      expect(getDescription(info)).toBe('');
    },
  );

  it('formats a same-day exam window with duration', () => {
    const description = getDescription({
      startTime: localIso(5, 9),
      endTime: localIso(5, 11),
    });
    expect(description).toContain('考试时长：');
    expect(description).toContain('2时');
    expect(description).toContain('考试时间：');
    expect(description).toContain('09:00 - 11:00');
    // same-day range should not repeat the end date label before end time
    expect(description).not.toMatch(/09:00 - .+11:00/);
  });

  it('includes the end date when the exam crosses midnight', () => {
    const description = getDescription({
      startTime: localIso(5, 22),
      endTime: localIso(6, 2),
    });
    expect(description).toContain('考试时长：');
    expect(description).toContain('4时');
    expect(description).toContain('22:00 - ');
    expect(description).toContain('02:00');
    const timePart = description.split('考试时间：')[1] ?? '';
    expect(timePart).toMatch(/2026/);
    expect((timePart.match(/2026/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it('keeps zero-length exams from throwing', () => {
    const description = getDescription({
      startTime: localIso(5, 9),
      endTime: localIso(5, 9),
    });
    expect(description).toContain('考试时长：0秒');
    expect(description).toContain('09:00 - 09:00');
  });

  it('accepts unix millisecond timestamps as well as ISO strings', () => {
    const start = Date.parse(localIso(5, 9));
    const end = Date.parse(localIso(5, 10, 30));
    const description = getDescription({ startTime: start, endTime: end });
    expect(description).toContain('考试时长：');
    expect(description).toContain('1时30分');
    expect(description).toContain('09:00 - 10:30');
  });
});
