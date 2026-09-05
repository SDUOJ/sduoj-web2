const problemSetSubmit = (data: any) => {
  const result = { ...data, config: { ...data.config } };
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
