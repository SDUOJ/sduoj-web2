const groupGet = (value: any) => {
  if (value.type !== 2) return { ...value };
  return {
    ...value,
    problemInfo: value.problemInfo.map((problem: any, id: number) => ({
      ...problem,
      pid: 'SDUOJ-' + problem.pid,
      desId: problem.desId.toString(),
      id,
    })),
  };
};

export default groupGet;
