import { Button, Input, Select, Tabs } from 'antd';
import { PREDEFINED_CHECKERS, SPJ_Code, SPJ_Config } from '../../../../Config/constValue';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import CodeEditor from '../../../common/CodeEditor';
import { useSelector } from 'react-redux';
import PublicAutoSettings from './PublicAutoSettings';
import type { CheckerConfig } from '../../../../Type/publicAuto';

type LanguageTemplate = { id: string | number; title: string; type: number };
const BodyChecker = (props: {
  value?: CheckerConfig;
  onChange?: (value: CheckerConfig) => void;
  languageTemplates?: LanguageTemplate[];
}) => {
  const { t } = useTranslation();
  const id = useId().replace(/:/g, '');
  const problem = useSelector((state: any) => state.ManageReducer.manageInitData?.ProblemInfo);
  const config = props.value ?? problem?.checkerConfig ?? { source: 'lcmp.cpp', spj: null };
  const custom = config.spj != null;
  const checkerName = (name: string) => t(`judgeSetup.checkers.${name.replace('.cpp', '')}`);
  const change = (patch: Partial<CheckerConfig>) =>
    props.onChange?.({
      ...config,
      ...patch,
      ...(config.publicCasePolicy
        ? { publicCasePolicy: { ...config.publicCasePolicy, autoAddEnabled: false } }
        : {}),
    });
  return (
    <>
      <section className="judge-section">
        <h3>{t('judgeSetup.output')}</h3>
        <p className="judge-hint">{t('judgeSetup.outputHint')}</p>
        <label className="judge-field-label" htmlFor={id}>
          {t('judgeSetup.outputChecker')}
        </label>
        <Select
          id={id}
          aria-label={t('judgeSetup.outputChecker')}
          style={{ width: '100%' }}
          value={custom ? '@' : config.source}
          options={[
            ...PREDEFINED_CHECKERS.map((item) => ({
              value: item.name,
              label: `${checkerName(item.name)} · ${item.name}`,
            })),
            { value: '@', label: t('judgeSetup.customChecker') },
          ]}
          onChange={(value) =>
            change(
              value === '@' ? { source: SPJ_Code, spj: SPJ_Config } : { source: value, spj: null },
            )
          }
        />
        {custom && (
          <div className="judge-custom-checker">
            <div className="judge-option-row">
              <span className="judge-hint">{t('judgeSetup.customCheckerHint')}</span>
              <Button size="small" onClick={() => change({ source: SPJ_Code, spj: SPJ_Config })}>
                {t('judgeSetup.resetChecker')}
              </Button>
            </div>
            <Tabs
              items={[
                {
                  key: 'source',
                  label: t('judgeSetup.checkerSource'),
                  children: (
                    <CodeEditor
                      lang="cpp"
                      height="260px"
                      value={config.source}
                      onChange={(source: string) => change({ source })}
                    />
                  ),
                },
                {
                  key: 'config',
                  label: t('judgeSetup.executionConfig'),
                  children: (
                    <Input.TextArea
                      className="judge-config-code"
                      aria-label={t('judgeSetup.executionConfig')}
                      autoSize={{ minRows: 8, maxRows: 14 }}
                      value={config.spj ?? ''}
                      onChange={(e) => change({ spj: e.target.value })}
                    />
                  ),
                },
              ]}
            />
          </div>
        )}
      </section>
      <PublicAutoSettings
        value={config}
        onChange={(value) => props.onChange?.(value)}
        problem={problem}
        languageTemplates={props.languageTemplates}
      />
    </>
  );
};
export default BodyChecker;
