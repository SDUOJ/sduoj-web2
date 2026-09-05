const groupSubmit = (value: any) => {
  if (value.type !== 2) return { ...value };
  return {
    ...value,
    problemInfo: value.problemInfo.map((problem: any) => ({
      ...problem,
      pid: parseInt(problem.pid.split('-')[1]),
    })),
  };
};

export default groupSubmit;
