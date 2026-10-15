import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Checkbox, Collapse, Input, Space } from 'antd';

export type CustomCaseItem = {
  key: string;
  input: string;
  expectedOutput?: string;
};

export interface CustomCaseListProps {
  cases: CustomCaseItem[];
  onChange: (cases: CustomCaseItem[]) => void;
  maxCases?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * 自定义输入用例列表（代码区下方、可折叠）。单条 input/expected 由后端限长。
 */
const CustomCaseList: React.FC<CustomCaseListProps> = ({
  cases,
  onChange,
  maxCases = 10,
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation();
  const updateAt = (index: number, patch: Partial<CustomCaseItem>) => {
    const next = cases.map((one, i) => (i === index ? { ...one, ...patch } : one));
    onChange(next);
  };

  return (
    <Collapse
      defaultActiveKey={['cases']}
      activeKey={open === undefined ? undefined : open ? ['cases'] : []}
      onChange={(keys) => onOpenChange?.(keys.includes('cases'))}
      items={[
        {
          key: 'cases',
          label: t('answerIde.cases'),
          children: (
            <Space direction="vertical" style={{ width: '100%' }}>
              {cases.map((one, index) => (
                <Space key={one.key} direction="vertical" style={{ width: '100%' }}>
                  <div>{t('answerIde.case', { index: index + 1 })}</div>
                  <Input.TextArea
                    aria-label={t('answerIde.inputLabel', { index: index + 1 })}
                    rows={3}
                    placeholder={t('answerIde.inputPlaceholder')}
                    value={one.input}
                    onChange={(e) => updateAt(index, { input: e.target.value })}
                  />
                  <Checkbox
                    checked={one.expectedOutput !== undefined}
                    onChange={(e) =>
                      updateAt(index, { expectedOutput: e.target.checked ? '' : undefined })
                    }
                  >
                    {t('answerIde.compareExpected')}
                  </Checkbox>
                  {one.expectedOutput !== undefined && (
                    <Input.TextArea
                      aria-label={t('answerIde.expectedLabel', { index: index + 1 })}
                      rows={2}
                      placeholder={t('answerIde.expectedPlaceholder')}
                      value={one.expectedOutput ?? ''}
                      onChange={(e) => updateAt(index, { expectedOutput: e.target.value })}
                    />
                  )}
                  <Button
                    size="small"
                    onClick={() => onChange(cases.filter((_, i) => i !== index))}
                  >
                    {t('answerIde.delete')}
                  </Button>
                </Space>
              ))}
              <Button
                type="dashed"
                disabled={cases.length >= maxCases}
                onClick={() =>
                  onChange([...cases, { key: `c${Date.now()}-${cases.length}`, input: '' }])
                }
              >
                {t('answerIde.add')}
              </Button>
            </Space>
          ),
        },
      ]}
    />
  );
};

export default CustomCaseList;
