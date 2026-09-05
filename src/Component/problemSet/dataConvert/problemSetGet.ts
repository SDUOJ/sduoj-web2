const problemSetGet = (data: any) => {
  if (data.groupInfo === undefined) return { ...data };
  return { ...data, groupInfo: data.groupInfo.map((group: any, id: number) => ({ ...group, id })) };
};

export default problemSetGet;
