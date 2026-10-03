import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { __RouterContext } from 'react-router';
import { useTranslation } from 'react-i18next';
import { UrlPrefix } from '../../../Config/constValue';

const items = [
  ['aiNavTasks', `${UrlPrefix}/workspace`],
  ['aiNavAccount', `${UrlPrefix}/account/assistant`],
  ['aiNavProblemBank', `${UrlPrefix}/manage/problemSet/problem_group`],
  ['aiNavKnowledgeBase', `${UrlPrefix}/courses/knowledge`],
  ['aiNavGrading', `${UrlPrefix}/manage/problemSet/grading`],
  ['aiNavExams', `${UrlPrefix}/manage/problemSet/exams`],
  ['aiNavPlagiarism', `${UrlPrefix}/manage/problemSet/plagiarism`],
  ['aiNavAuthoring', `${UrlPrefix}/manage/intelligent`],
  ['aiNavInterviews', `${UrlPrefix}/practice/interviews`],
] as const;

export default function AIWorkspaceNav() {
  const router = useContext(__RouterContext);
  const { t } = useTranslation();
  const pathname = router?.location?.pathname;
  return (
    <nav className="ai-workspace-nav" aria-label={t('aiNavLabel')}>
      {items.map(([labelKey, path]) =>
        router ? (
          <Link key={path} className={pathname === path ? 'active' : undefined} to={path}>
            {t(labelKey)}
          </Link>
        ) : (
          <a key={path} className={pathname === path ? 'active' : undefined} href={path}>
            {t(labelKey)}
          </a>
        ),
      )}
    </nav>
  );
}
