import { ReactNode, useState } from 'react';
import { Button, Tabs, Tag } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';
import { JudgeTemplateAllType, ProblemDescription } from '../../Type/IProblem';

type ProblemInfo = {
  timeLimit?: number;
  memoryLimit?: number;
  source?: string;
  judgeTemplates?: JudgeTemplateAllType[];
  problemDescriptionDTO?: { id: string | number };
  problemDescriptionListDTOList?: ProblemDescription[];
};

export function IdeDescriptionTabs({
  problemInfo,
  actions,
}: {
  problemInfo: ProblemInfo;
  actions?: ReactNode;
}) {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const descriptions = problemInfo.problemDescriptionListDTOList ?? [];
  return descriptions.length > 1 ? (
    <Tabs
      className="ide-description-tabs"
      tabBarExtraContent={{ right: actions }}
      aria-label={t('Description')}
      activeKey={String(problemInfo.problemDescriptionDTO?.id ?? descriptions[0].id)}
      items={descriptions.map((description) => ({
        key: String(description.id),
        label: description.title,
      }))}
      onChange={(id) => {
        const search = new URLSearchParams(location.search);
        search.set('descriptionId', id);
        history.push({
          pathname: location.pathname,
          search: `?${search.toString()}`,
          hash: location.hash,
        });
      }}
    />
  ) : actions ? (
    <div className="ide-description-actions">{actions}</div>
  ) : null;
}

const languageColor = (title: string) => {
  if (/c\+\+/i.test(title)) return 'cyan';
  if (/python|pypy/i.test(title)) return 'green';
  if (/java/i.test(title)) return 'orange';
  if (/rust/i.test(title)) return 'volcano';
  return 'geekblue';
};

export default function IdeProblemInfo({ problemInfo }: { problemInfo: ProblemInfo }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const templates = problemInfo.judgeTemplates ?? [];
  const canCollapse = templates.length > 3;
  const visibleTemplates = canCollapse && !expanded ? templates.slice(0, 3) : templates;
  return (
    <div className="ide-problem-tags" aria-label={t('answerIde.problemInfo')}>
      <div className="ide-limit-tags">
        {problemInfo.timeLimit != null && (
          <Tag color="blue">
            {t('TimeLimit')}: {problemInfo.timeLimit} ms
          </Tag>
        )}
        {problemInfo.memoryLimit != null && (
          <Tag color="purple">
            {t('MemoryLimit')}: {Math.floor(problemInfo.memoryLimit / 1024)} MB
          </Tag>
        )}
      </div>
      {templates.length > 0 && (
        <div className="ide-language-tags" aria-label={t('answerIde.supportedLanguages')}>
          <span className="ide-metadata-label">{t('answerIde.supportedLanguages')}</span>
          {visibleTemplates.map((template) => (
            <Tag key={template.id} color={languageColor(template.title)}>
              {template.title}
            </Tag>
          ))}
          {canCollapse && (
            <Button
              type="link"
              size="small"
              className="ide-languages-toggle"
              aria-expanded={expanded}
              icon={expanded ? <UpOutlined aria-hidden /> : <DownOutlined aria-hidden />}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded
                ? t('answerIde.collapseLanguages')
                : t('answerIde.expandLanguages', { count: templates.length - 3 })}
            </Button>
          )}
        </div>
      )}
      {problemInfo.source && (
        <div className="ide-source-tags">
          <Tag color="gold">
            {t('source')}: {problemInfo.source}
          </Tag>
        </div>
      )}
    </div>
  );
}
