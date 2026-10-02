import { Link, useLocation } from 'react-router-dom';
import { UrlPrefix } from '../../../Config/constValue';

const items = [
  ['任务与创作', `${UrlPrefix}/workspace`],
  ['账户与管理', `${UrlPrefix}/account/assistant`],
  ['AI 题库', `${UrlPrefix}/manage/problemSet/problem_group`],
  ['课程知识库', `${UrlPrefix}/courses/knowledge`],
  ['主观题批阅', `${UrlPrefix}/manage/problemSet/grading`],
  ['考试与考务', `${UrlPrefix}/manage/problemSet/exams`],
  ['代码查重', `${UrlPrefix}/manage/problemSet/plagiarism`],
  ['程序题创作', `${UrlPrefix}/manage/intelligent`],
  ['实验验收', `${UrlPrefix}/practice/interviews`],
] as const;

export default function AIWorkspaceNav() {
  const location = useLocation();
  return (
    <nav className="ai-workspace-nav" aria-label="AI 工作区">
      {items.map(([label, path]) => (
        <Link key={path} className={location.pathname === path ? 'active' : undefined} to={path}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
