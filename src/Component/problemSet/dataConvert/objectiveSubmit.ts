import { message } from 'antd';

const objectiveSubmit = (value: any) => {
  const choice0: any[] = Array.isArray(value?.content?.choice) ? value.content.choice : [];
  if (choice0.length === 0) {
    message.error('选项不能为空');
    return null;
  }
  for (let i = 0; i < choice0.length; i++) {
    if (!choice0[i]?.content || choice0[i].content.length === 0) {
      message.error('选项不能为空');
      return null;
    }
  }
  const answers: any[] = Array.isArray(value?.answer) ? value.answer : [];
  if (value.type === 1 && answers.length === 1) {
    message.error('多选题应该有两个及以上答案');
    return null;
  }
  if (value.type === 0 && answers.length !== 1) {
    message.error('单选题只能有一个答案');
    return null;
  }

  let choice: string[] = [];
  for (let i = 0; i < choice0.length; i++) {
    choice.push(choice0[i].content);
  }
  return { ...value, content: { ...value.content, choice } };
};

export default objectiveSubmit;
