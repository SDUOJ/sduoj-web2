const groupSubmit = (value: any) => {
  if (value?.type !== 2) return { ...value };
  const problems = Array.isArray(value.problemInfo) ? value.problemInfo : [];
  return {
    ...value,
    problemInfo: problems.map((problem: any) => {
      const pid = problem?.pid;
      const numeric =
        typeof pid === 'number'
          ? pid
          : typeof pid === 'string' && pid.includes('-')
            ? parseInt(pid.split('-')[1], 10)
            : Number(pid);
      return {
        ...problem,
        pid: Number.isFinite(numeric) ? numeric : pid,
      };
    }),
  };
};

export default groupSubmit;
