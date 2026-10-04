import { getDescription } from './ExamUtils';

it('returns an empty description for missing exam information', () => {
  expect(getDescription(undefined)).toBe('');
});

it('describes duration and same-day exam time', () => {
  const start = new Date(2026, 0, 4, 9, 30).getTime();
  const end = start + 2 * 60 * 60 * 1000 + 15 * 60 * 1000;
  const description = getDescription({ startTime: start, endTime: end });

  expect(description).toContain('考试时长：2时15分');
  expect(description).toContain('考试时间：');
  expect(description).toContain('09:30 - 11:45');
});

it('includes the end date when an exam crosses midnight', () => {
  const start = new Date(2026, 0, 4, 23, 30).getTime();
  const end = new Date(2026, 0, 5, 1, 0).getTime();
  const description = getDescription({ startTime: start, endTime: end });

  expect(description).toContain('考试时长：1时30分');
  expect(description).toContain('23:30 - ');
  expect(description).toContain('01:00');
});
