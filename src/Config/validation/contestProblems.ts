/** Contest statistics require one entry per problem code, regardless of its alias. */
export function contestProblemsError(problems: unknown): string | undefined {
  if (!Array.isArray(problems)) return;
  const positions = new Map<string, number[]>();
  problems.forEach((problem, index) => {
    if (typeof problem?.problemCode !== 'string') return;
    const code = problem.problemCode.trim().toUpperCase();
    if (!code) return;
    positions.set(code, [...(positions.get(code) ?? []), index + 1]);
  });
  const duplicates = Array.from(positions)
    .filter(([, rows]) => rows.length > 1)
    .map(([code, rows]) => `${code}（第 ${rows.join('、')} 行）`);
  if (duplicates.length)
    return `比赛题目不能重复：${duplicates.join('；')}。请删除重复题目后再提交。`;
}
