const problemSetSubmit = (data: any) => {
  const config = data?.config && typeof data.config === 'object' ? data.config : {};
  const result = { ...data, config: { ...config } };
  for (let x in result.config) {
    if (x !== 'practiceScoreCalculate' && x !== 'practiceTimeSetting') {
      if (result.config[x] === null) {
        result.config[x] = 0;
      }
    }
  }
  return result;
};

export default problemSetSubmit;
