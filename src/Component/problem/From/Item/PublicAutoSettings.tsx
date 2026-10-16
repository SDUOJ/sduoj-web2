import { lazy, Suspense, useEffect, useId, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Collapse,
  Input,
  Radio,
  Select,
  Space,
  Switch,
  Upload,
  message,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { SPJ_Config } from '../../../../Config/constValue';
import type { CheckerConfig, PublicAutoGate } from '../../../../Type/publicAuto';
import mApi from '../../../../Utils/API/m-api';
import MetaTaskProgress from './MetaTaskProgress';
import { fileUpload } from '../../../../Utils/fileUpload';
const Editor = lazy(() => import('../../../answerIde/AnswerEditor'));
const DEFAULT_VALIDATOR =
  '#include "testlib.h"\nint main(int argc, char** argv) {\n  registerValidation(argc, argv);\n  inf.readInt(); inf.readSpace(); inf.readInt(); inf.readEoln(); inf.readEof();\n}\n';
type LanguageTemplate = { id: string | number; title: string; type: number };

export default function PublicAutoSettings(props: {
  value: CheckerConfig;
  onChange: (value: CheckerConfig) => void;
  languageTemplates?: LanguageTemplate[];
  problem?: {
    problemCode?: string;
    checkerConfig?: CheckerConfig;
    publicAutoGate?: PublicAutoGate;
    judgeTemplateListDTOList?: LanguageTemplate[];
  };
}) {
  const { t } = useTranslation();
  const controlId = useId().replace(/:/g, '');
  const [gate, setGate] = useState<PublicAutoGate | undefined>(props.problem?.publicAutoGate);
  const [refreshing, setRefreshing] = useState(false);
  const [standardMode, setStandardMode] = useState<'code' | 'zip' | null>(null);
  const [validatorMode, setValidatorMode] = useState<'code' | 'zip' | null>(null);
  const validatorZipMode =
    validatorMode === null
      ? Boolean(props.value.inputValidator?.zipFileId)
      : validatorMode === 'zip';
  const zipMode =
    standardMode === null
      ? Boolean(props.value.standardProgram?.zipFileId)
      : standardMode === 'zip';
  const config = props.value;
  const latest = useRef({ config, onChange: props.onChange, validatorZipMode, zipMode });
  latest.current = { config, onChange: props.onChange, validatorZipMode, zipMode };
  const mounted = useRef(false);
  const uploadGeneration = useRef({ validator: 0, standard: 0 });
  const validatorEnabled = Boolean(config.inputValidator);
  const standardEnabled = Boolean(config.standardProgram);
  useEffect(() => {
    const generations = uploadGeneration.current;
    mounted.current = true;
    return () => {
      mounted.current = false;
      generations.validator++;
      generations.standard++;
    };
  }, [props.problem?.problemCode]);
  useEffect(() => {
    uploadGeneration.current.validator++;
  }, [validatorZipMode, validatorEnabled]);
  useEffect(() => {
    uploadGeneration.current.standard++;
  }, [zipMode, standardEnabled]);
  const languages = (
    props.languageTemplates ??
    props.problem?.judgeTemplateListDTOList ??
    []
  ).filter((item) => item.type === 0);
  const policy = config.publicCasePolicy ?? { autoAddEnabled: false, maxCount: 20 };
  const frozenFields = (value?: CheckerConfig) =>
    JSON.stringify({
      source: value?.source,
      spj: value?.spj,
      inputValidator: value?.inputValidator,
      standardProgram: value?.standardProgram,
      inputNormalization: value?.publicCasePolicy?.inputNormalization ?? 'raw',
    });
  const dirty = frozenFields(config) !== frozenFields(props.problem?.checkerConfig);
  const eligible = Boolean(gate?.eligible && !dirty);
  const change = (patch: Partial<CheckerConfig>) => {
    const current = latest.current;
    current.onChange({
      ...current.config,
      ...patch,
      publicCasePolicy: {
        ...(current.config.publicCasePolicy ?? { maxCount: 20 }),
        autoAddEnabled: false,
      },
    });
  };
  const saved = Boolean(props.problem?.problemCode);
  const reasons = gate?.failReasons ?? [
    'MISSING_VALIDATOR',
    'MISSING_STANDARD_PROGRAM',
    'INPUT_VALIDATION_NOT_PASSED',
    'STANDARD_CHECK_NOT_PASSED',
  ];
  return (
    <Collapse
      className="judge-optional-panel judge-public-settings"
      items={[
        {
          key: 'auto',
          label: (
            <span className="judge-collapse-title">
              {t('publicAuto.settings')}
              <span className="judge-optional-label">{t('judgeSetup.optional')}</span>
            </span>
          ),
          children: (
            <>
              <p className="judge-hint">{t('judgeSetup.publicHint')}</p>
              <section className="judge-subsection">
                <div className="judge-option-row">
                  <div>
                    <h4>{t('judgeSetup.validator')}</h4>
                    <p className="judge-hint">{t('judgeSetup.validatorHint')}</p>
                  </div>
                  <Switch
                    aria-label={t('publicAuto.validator')}
                    checked={Boolean(config.inputValidator)}
                    onChange={(checked) => {
                      setValidatorMode(null);
                      change({
                        inputValidator: checked
                          ? { source: DEFAULT_VALIDATOR, spj: SPJ_Config }
                          : null,
                      });
                    }}
                  />
                </div>
                {config.inputValidator && (
                  <div className="judge-program-fields">
                    <div role="radiogroup" aria-label={t('publicAuto.validatorMode')}>
                      <Radio.Group
                        name={`${controlId}-validator`}
                        value={validatorZipMode ? 'zip' : 'code'}
                        onChange={(event) => {
                          const zip = event.target.value === 'zip';
                          setValidatorMode(zip ? 'zip' : 'code');
                          change({
                            inputValidator: {
                              ...config.inputValidator!,
                              source: zip ? null : '',
                              zipFileId: null,
                            },
                          });
                        }}
                      >
                        <Radio value="code">{t('publicAuto.singleFile')}</Radio>
                        <Radio value="zip">ZIP</Radio>
                      </Radio.Group>
                    </div>
                    {validatorZipMode ? (
                      <Upload
                        accept=".zip"
                        showUploadList={false}
                        beforeUpload={async (file) => {
                          if (file.size > 5 * 1024 * 1024) {
                            message.error(t('publicAuto.zipLimit'));
                            return false;
                          }
                          const generation = ++uploadGeneration.current.validator;
                          const [uploaded] = await fileUpload([file]);
                          const current = latest.current;
                          if (
                            !mounted.current ||
                            generation !== uploadGeneration.current.validator ||
                            !current.validatorZipMode ||
                            !current.config.inputValidator
                          )
                            return false;
                          change({
                            inputValidator: {
                              ...current.config.inputValidator,
                              source: null,
                              zipFileId: uploaded.id,
                            },
                          });
                          return false;
                        }}
                      >
                        <Button>{t('publicAuto.uploadValidatorZip')}</Button>
                      </Upload>
                    ) : (
                      <div className="judge-program-editor">
                        <Suspense fallback={t('answerIde.loadingEditor')}>
                          <Editor
                            fill
                            language="cpp"
                            value={config.inputValidator.source ?? ''}
                            onChange={(source) =>
                              change({
                                inputValidator: {
                                  ...config.inputValidator!,
                                  source,
                                  zipFileId: null,
                                },
                              })
                            }
                          />
                        </Suspense>
                      </div>
                    )}
                    {config.inputValidator.zipFileId && (
                      <span className="judge-hint">
                        {t('publicAuto.validatorZip')}: {config.inputValidator.zipFileId}
                      </span>
                    )}
                    <Collapse
                      size="small"
                      className="judge-config-panel"
                      items={[
                        {
                          key: 'config',
                          label: t('publicAuto.validatorConfig'),
                          forceRender: true,
                          children: (
                            <Input.TextArea
                              className="judge-config-code"
                              aria-label={t('publicAuto.validatorConfig')}
                              autoSize={{ minRows: 6, maxRows: 12 }}
                              value={config.inputValidator.spj}
                              onChange={(e) =>
                                change({
                                  inputValidator: {
                                    ...config.inputValidator!,
                                    spj: e.target.value,
                                  },
                                })
                              }
                            />
                          ),
                        },
                      ]}
                    />
                  </div>
                )}
              </section>

              <section className="judge-subsection">
                <div className="judge-option-row">
                  <div>
                    <h4>{t('judgeSetup.standard')}</h4>
                    <p className="judge-hint">{t('judgeSetup.standardHint')}</p>
                  </div>
                  <Switch
                    aria-label={t('publicAuto.standard')}
                    checked={Boolean(config.standardProgram)}
                    onChange={(checked) => {
                      setStandardMode(null);
                      change({
                        standardProgram: checked
                          ? { code: '', judgeTemplateId: languages[0]?.id }
                          : null,
                      });
                    }}
                  />
                </div>
                {config.standardProgram && (
                  <div className="judge-program-fields">
                    <div className="judge-field-grid">
                      <div className="judge-field">
                        <label className="judge-field-label" htmlFor={`${controlId}-language`}>
                          {t('publicAuto.language')}
                        </label>
                        <Select
                          id={`${controlId}-language`}
                          aria-label={t('publicAuto.language')}
                          style={{ width: '100%' }}
                          placeholder={t('judgeSetup.chooseLanguagesFirst')}
                          value={config.standardProgram.judgeTemplateId}
                          options={languages.map((item) => ({ value: item.id, label: item.title }))}
                          onChange={(judgeTemplateId) =>
                            change({
                              standardProgram: { ...config.standardProgram!, judgeTemplateId },
                            })
                          }
                        />
                      </div>
                      <div className="judge-field">
                        <span className="judge-field-label">{t('judgeSetup.programFormat')}</span>
                        <div role="radiogroup" aria-label={t('judgeSetup.standardMode')}>
                          <Radio.Group
                            name={`${controlId}-standard`}
                            value={zipMode ? 'zip' : 'code'}
                            onChange={(event) => {
                              const zip = event.target.value === 'zip';
                              setStandardMode(zip ? 'zip' : 'code');
                              change({
                                standardProgram: {
                                  ...config.standardProgram!,
                                  code: zip ? null : '',
                                  zipFileId: null,
                                },
                              });
                            }}
                            options={[
                              { value: 'code', label: t('publicAuto.singleFile') },
                              { value: 'zip', label: 'ZIP (≤5MB)' },
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                    {zipMode ? (
                      <Upload
                        accept=".zip"
                        maxCount={1}
                        beforeUpload={async (file) => {
                          if (file.size > 5 * 1024 * 1024) {
                            message.error(t('publicAuto.zipLimit'));
                            return Upload.LIST_IGNORE;
                          }
                          const generation = ++uploadGeneration.current.standard;
                          const result = await fileUpload([file]);
                          const current = latest.current;
                          if (
                            !mounted.current ||
                            generation !== uploadGeneration.current.standard ||
                            !current.zipMode ||
                            !current.config.standardProgram
                          )
                            return false;
                          change({
                            standardProgram: {
                              ...current.config.standardProgram,
                              code: null,
                              zipFileId: result[0].id,
                            },
                          });
                          return false;
                        }}
                      >
                        <Button>{t('publicAuto.uploadZip')}</Button>
                      </Upload>
                    ) : (
                      <div className="judge-program-editor">
                        <Suspense fallback={t('answerIde.loadingEditor')}>
                          <Editor
                            fill
                            language="text"
                            value={config.standardProgram.code ?? ''}
                            onChange={(code) =>
                              change({
                                standardProgram: {
                                  ...config.standardProgram!,
                                  code,
                                  zipFileId: null,
                                },
                              })
                            }
                          />
                        </Suspense>
                      </div>
                    )}
                    {config.standardProgram.zipFileId && (
                      <span className="judge-hint">ZIP ID: {config.standardProgram.zipFileId}</span>
                    )}
                  </div>
                )}
              </section>

              <section className="judge-subsection">
                <div className="judge-option-row">
                  <div>
                    <h4>{t('publicAuto.autoAdd')}</h4>
                    <p className="judge-hint">{t('judgeSetup.autoAddHint')}</p>
                  </div>
                  <Switch
                    aria-label={t('publicAuto.autoAdd')}
                    disabled={!eligible}
                    checked={policy.autoAddEnabled}
                    onChange={(autoAddEnabled) =>
                      props.onChange({ ...config, publicCasePolicy: { ...policy, autoAddEnabled } })
                    }
                  />
                </div>
                <div className="judge-field-grid">
                  <div className="judge-field">
                    <span className="judge-field-label">{t('publicAuto.inputNormalization')}</span>
                    <Select
                      aria-label={t('publicAuto.inputNormalization')}
                      style={{ width: '100%' }}
                      value={policy.inputNormalization ?? 'raw'}
                      options={[
                        { value: 'raw', label: t('publicAuto.rawInput') },
                        { value: 'trim-lines', label: t('publicAuto.normalizedInput') },
                      ]}
                      onChange={(inputNormalization: 'raw' | 'trim-lines') =>
                        props.onChange({
                          ...config,
                          publicCasePolicy: {
                            ...policy,
                            inputNormalization,
                            autoAddEnabled: false,
                          },
                        })
                      }
                    />
                    <p className="judge-hint">{t('publicAuto.normalizationHint')}</p>
                  </div>
                  <div className="judge-field">
                    <span className="judge-field-label">{t('publicAuto.maxCount')}</span>
                    <Select
                      aria-label={t('publicAuto.maxCount')}
                      style={{ width: '100%' }}
                      value={policy.maxCount}
                      options={[20, 50, 100].map((value) => ({ value, label: value }))}
                      onChange={(maxCount) =>
                        props.onChange({ ...config, publicCasePolicy: { ...policy, maxCount } })
                      }
                    />
                  </div>
                </div>
              </section>

              <section className="judge-subsection judge-self-check">
                <h4>{t('judgeSetup.selfCheck')}</h4>
                <Alert
                  showIcon
                  type={eligible ? 'success' : 'info'}
                  message={t(
                    !saved
                      ? 'judgeSetup.saveBeforeCheck'
                      : eligible
                        ? 'judgeSetup.checkPassed'
                        : 'judgeSetup.checkPending',
                  )}
                  description={
                    !saved
                      ? t('judgeSetup.newProblemHint')
                      : dirty
                        ? t('publicAuto.saveFirst')
                        : eligible
                          ? undefined
                          : reasons.map((reason) => t(`publicAuto.reasons.${reason}`)).join(' · ')
                  }
                />
                <Space wrap size={8}>
                  <Button
                    type="primary"
                    disabled={!saved || dirty || !config.inputValidator || !config.standardProgram}
                    loading={refreshing}
                    onClick={async () => {
                      setRefreshing(true);
                      try {
                        setGate(
                          await mApi.validatePublicAuto({
                            problemCode: props.problem!.problemCode!,
                          }),
                        );
                      } finally {
                        setRefreshing(false);
                      }
                    }}
                  >
                    {t('publicAuto.check')}
                  </Button>
                  <Button
                    loading={refreshing}
                    disabled={!saved || dirty}
                    onClick={async () => {
                      setRefreshing(true);
                      try {
                        setGate(
                          await mApi.publicAutoStatus({ problemCode: props.problem!.problemCode! }),
                        );
                      } finally {
                        setRefreshing(false);
                      }
                    }}
                  >
                    {t('judgeSetup.refreshCheck')}
                  </Button>
                </Space>
                <MetaTaskProgress
                  ids={[
                    ...(gate?.validationTaskIds ??
                      (gate?.validationTaskId ? [gate.validationTaskId] : [])),
                    ...(gate?.standardCheckTaskIds ??
                      (gate?.standardCheckTaskId ? [gate.standardCheckTaskId] : [])),
                  ]}
                  onChange={() => {
                    if (props.problem?.problemCode)
                      void mApi
                        .publicAutoStatus({ problemCode: props.problem.problemCode })
                        .then(setGate);
                  }}
                />
              </section>
            </>
          ),
        },
      ]}
    />
  );
}
