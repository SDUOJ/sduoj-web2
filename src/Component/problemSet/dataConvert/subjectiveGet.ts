import { isValueEmpty } from '../../../Utils/empty';

const subjectiveGet = (data: any) => {
  const config = { ...data.config };
  if (!isValueEmpty(config.fileList))
    config.fileList = config.fileList.map((file: any, id: number) => ({ ...file, id }));
  if (!isValueEmpty(config.judgeConfig))
    config.judgeConfig = config.judgeConfig.map((judge: any, id: number) => ({ ...judge, id }));
  return { ...data, config };
};

export default subjectiveGet;
