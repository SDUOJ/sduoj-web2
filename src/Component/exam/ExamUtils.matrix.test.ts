import { getDescription } from './ExamUtils';

// Local wall-clock fixtures keep the assertions independent of the runner timezone.
describe('exam description adapter', () => {
  it.each([[undefined], [null], [{}], [{ startTime: '2026-10-05T09:00:00' }]])(
    'returns empty for incomplete exam info %#',
    (info) => {
      expect(getDescription(info)).toBe('');
    },
  );

  it('formats a same-day exam window with duration', () => {
    const description = getDescription({
      startTime: '2026-10-05T09:00:00',
      endTime: '2026-10-05T11:00:00',
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
      startTime: '2026-10-05T22:00:00',
      endTime: '2026-10-06T02:00:00',
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
      startTime: '2026-10-05T09:00:00',
      endTime: '2026-10-05T09:00:00',
    });
    expect(description).toContain('考试时长：0秒');
    expect(description).toContain('09:00 - 09:00');
  });

  it('accepts unix millisecond timestamps as well as ISO strings', () => {
    const start = Date.parse('2026-10-05T09:00:00');
    const end = Date.parse('2026-10-05T10:30:00');
    const description = getDescription({ startTime: start, endTime: end });
    expect(description).toContain('考试时长：');
    expect(description).toContain('1时30分');
    expect(description).toContain('09:00 - 10:30');
  });
});
