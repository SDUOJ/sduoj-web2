import React, { Dispatch, useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Button, Form, message, Modal, Select, Space, Tooltip, Upload } from 'antd';
import { JudgeTemplateAllType } from '../../Type/IProblem';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { UploadOutlined } from '@ant-design/icons';
import CodeEditor from '../common/CodeEditor';
import { withRouter } from 'react-router-dom';
import { TopSubmissionInfoType } from '../../Type/ISubmission';
import { JudgeTemplate2lang } from '../../Utils/JudgeTemplate2lang';
import { fileUploadWithoutMD5 } from '../../Utils/fileUpload';
import { UserState } from '../../Type/Iuser';
import { functionTemplate } from '../../Type/types';
import { isValueEmpty } from '../../Utils/empty';
import { contracts } from '../../Config/validation/contracts';
import { constraintRules, constraintError } from '../../Config/validation/constraints';

export interface SubmitPropsType {
  API: any; // API 接口函数
  title: string; // 对话框的标题
  TopSubmissionInfo: TopSubmissionInfoType; // 当前提交的题目信息
  LeftSubmitCount?: number; // 剩余提交次数
  JudgeTemplates: JudgeTemplateAllType[]; // 评测模板
  FuncTemplates: any;
}

export const Submit = (props: SubmitPropsType & any) => {
  const [form] = Form.useForm();
  const submissionGeneration = useRef(0);
  const uploadGeneration = useRef(0);
  const uploadAbortController = useRef<AbortController>();

  const [SubmitModalVis, setSubmitModalVis] = useState<boolean>(false);
  const [SubmitDisable, setSubmitDisable] = useState<boolean>(false);
  const [judgeTemplateId, setJudgeTemplateId] = useState<number | undefined>();
  const [zipFileId, setZipFileId] = useState<string | undefined>();
  const [zipUploadPending, setZipUploadPending] = useState(false);

  const cancelZipUpload = useCallback(() => {
    uploadGeneration.current += 1;
    uploadAbortController.current?.abort();
    uploadAbortController.current = undefined;
    setZipUploadPending(false);
    setZipFileId(undefined);
  }, []);

  useEffect(() => {
    if (SubmitModalVis) {
      cancelZipUpload();
      form.resetFields();
      const value: any = localStorage.getItem('SDUOJ-Last-Submit-JT');
      if (!isValueEmpty(value) && props.JudgeTemplates !== undefined) {
        const id = props.JudgeTemplates.findIndex((val: any) => val.id === value);
        if (id !== -1) {
          form.setFieldValue('JudgeTemplate', value);
          setJudgeTemplateId(id);
        }
      }
    }
  }, [cancelZipUpload, form, props.JudgeTemplates, props.name, SubmitModalVis]);

  useEffect(
    () => () => {
      submissionGeneration.current += 1;
      uploadGeneration.current += 1;
      uploadAbortController.current?.abort();
    },
    [],
  );

  const closeSubmitForm = () => {
    submissionGeneration.current += 1;
    cancelZipUpload();
    setSubmitDisable(false);
    setSubmitModalVis(false);
  };

  const CodeSubmit = async () => {
    let value: any;
    try {
      value = await form.validateFields();
    } catch {
      return;
    }

    const generation = ++submissionGeneration.current;
    setSubmitDisable(true);
    const hide = message.info(props.t('inQueueForSubmission,PleaseBePatient'), 0);
    try {
      // if (props.FuncTemplates !== undefined) {
      //     let fid = props.FuncTemplates.findIndex((v: any) => {
      //         return v.judgeTemplateId === value.JudgeTemplate
      //     })
      //     if (fid !== -1) {
      //         const funcTemplate: functionTemplate = props.FuncTemplates[fid]
      //         if (funcTemplate.functionTemplate !== undefined)
      //             value.code = funcTemplate.functionTemplate + value.code
      //     }
      // }
      const data = await props.API(value.JudgeTemplate, value.code, zipFileId);
      if (generation !== submissionGeneration.current) return;
      props.setTopSubmission(data, props.TopSubmissionInfo);
      setSubmitModalVis(false);
      props.setSubmissionModalVis(true);
      props.SubmissionListName !== undefined && props.addTableVersion(props.SubmissionListName);
      localStorage.setItem('SDUOJ-Last-Submit-JT', value.JudgeTemplate);
    } catch {
      // The request layer presents the failure; keep the form open for retry.
    } finally {
      hide?.();
      if (generation === submissionGeneration.current) setSubmitDisable(false);
    }
  };

  const SubmitButton = (
    <Button
      type={'primary'}
      onClick={() => {
        if (!props.isLogin) message.error(props.t('PleaseLogin'));
        else setSubmitModalVis(true);
      }}
      disabled={props.LeftSubmitCount !== undefined && props.LeftSubmitCount <= 0}
    >
      {props.t('Submit')}
    </Button>
  );
  const selectedTemplate =
    judgeTemplateId === undefined ? undefined : props.JudgeTemplates?.[judgeTemplateId];
  const requiresZipUpload = selectedTemplate?.acceptFileExtensions?.some(
    (extension: string) => extension === 'zip' || extension === '.zip',
  );
  // console.log("props.LeftSubmitCount", props.LeftSubmitCount)
  return (
    <>
      {!isNaN(props.LeftSubmitCount) && props.LeftSubmitCount !== undefined && (
        <Badge
          count={
            <Tooltip placement="topLeft" title={props.t('numberOfRemainingSubmissions')}>
              <span className={'Badge-Tooltip-Program'}>{props.LeftSubmitCount}</span>
            </Tooltip>
          }
        >
          {SubmitButton}
        </Badge>
      )}
      {(isNaN(props.LeftSubmitCount) || props.LeftSubmitCount === undefined) && SubmitButton}

      <Modal
        title={props.title}
        open={SubmitModalVis}
        destroyOnHidden={true}
        onCancel={closeSubmitForm}
        width={1200}
        footer={[
          <Space key="actions" size={25}>
            {props.LeftSubmitCount !== undefined && !isNaN(props.LeftSubmitCount) && (
              <div
                style={{
                  color: 'red',
                  fontSize: '15px',
                  marginBottom: '10px',
                  margin: '0px auto',
                }}
              >
                {props.t('numberOfRemainingSubmissions')}:{props.LeftSubmitCount}
              </div>
            )}
            <Button
              key="submit"
              type="primary"
              onClick={CodeSubmit}
              disabled={
                (!isNaN(props.LeftSubmitCount) &&
                  props.LeftSubmitCount !== undefined &&
                  props.LeftSubmitCount <= 0) ||
                SubmitDisable ||
                zipUploadPending ||
                (requiresZipUpload && zipFileId === undefined)
              }
            >
              {props.t('Submit')}
            </Button>
            <Button key="back" onClick={closeSubmitForm}>
              {props.t('no')}
            </Button>
          </Space>,
        ]}
      >
        <Form
          form={form}
          onFinish={async () => {
            CodeSubmit();
          }}
          layout={'vertical'}
          preserve={false}
        >
          <Form.Item
            name={'JudgeTemplate'}
            label={props.t('template')}
            rules={[{ required: true }]}
          >
            <Select
              allowClear
              options={props.JudgeTemplates?.map((template: JudgeTemplateAllType) => ({
                value: template.id,
                label: template.title,
              }))}
              onChange={(value) => {
                cancelZipUpload();
                const id = props.JudgeTemplates.findIndex((val: any) => val.id === value);
                setJudgeTemplateId(id >= 0 ? id : undefined);
              }}
            />
          </Form.Item>
          {(() => {
            const jtId = judgeTemplateId;
            if (
              jtId !== undefined &&
              props.JudgeTemplates !== undefined &&
              props.JudgeTemplates[jtId] !== undefined
            ) {
              let accept = '',
                num = 0;
              for (const x of props.JudgeTemplates[jtId].acceptFileExtensions) {
                if (num !== 0) accept += ',';
                if (x[0] === '.') accept += x;
                else accept += '.' + x;
                num += 1;
              }
              if (
                props.JudgeTemplates[jtId].acceptFileExtensions.findIndex(
                  (value: string) => value === 'zip' || value === '.zip',
                ) === -1
              ) {
                // 正常的代码提交形式
                const tid = props.JudgeTemplates[jtId].id;
                let fid;
                if (
                  props.FuncTemplates !== undefined &&
                  (fid = props.FuncTemplates.findIndex((value: any) => {
                    return value.judgeTemplateId === tid;
                  })) !== -1
                ) {
                  const funcTemplate: functionTemplate = props.FuncTemplates[fid];
                  form.setFieldsValue({
                    ...form.getFieldsValue(),
                    code: funcTemplate.initialTemplate,
                  });
                  return (
                    <>
                      {funcTemplate.isShowFunctionTemplate === 1 && (
                        <Form.Item label={props.t('startingCode')}>
                          <pre>
                            {props.t(
                              'theStartCodeIsInReadOnlyModeAndWillBeInsertedAboveTheAnswerCodeBeforeCompilation',
                            )}
                          </pre>
                          <CodeEditor
                            lang={JudgeTemplate2lang(jtId)}
                            value={funcTemplate.functionTemplate}
                            readOnly={true}
                          />
                        </Form.Item>
                      )}
                      <Form.Item
                        label={props.t('answerCode')}
                        name={'code'}
                        rules={constraintRules(contracts.submission.code)}
                      >
                        <CodeEditor lang={JudgeTemplate2lang(jtId)} />
                      </Form.Item>
                    </>
                  );
                } else {
                  return (
                    <>
                      <Form.Item label={props.t('file')}>
                        <Upload
                          multiple={false}
                          accept={accept}
                          customRequest={(obj: any) => {
                            obj.onSuccess(() => {});
                          }}
                          listType={'text'}
                          beforeUpload={(file: any) => {
                            const fileReader = new FileReader();
                            fileReader.readAsText(file);
                            fileReader.onload = (event) => {
                              try {
                                const str = event.target?.result as string;
                                const error = constraintError(contracts.submission.code, str);
                                if (error) {
                                  message.error(error);
                                  return;
                                }
                                form.setFieldsValue({
                                  ...form.getFieldsValue(),
                                  code: str,
                                });
                              } catch (e) {
                                message.error(props.t('fileParsingFailed!'));
                              }
                            };
                          }}
                        >
                          <Button icon={<UploadOutlined />}>{props.t('upload')}</Button>
                        </Upload>
                      </Form.Item>

                      <Form.Item
                        label={props.t('Code')}
                        name={'code'}
                        rules={constraintRules(contracts.submission.code)}
                      >
                        <CodeEditor lang={JudgeTemplate2lang(jtId)} />
                      </Form.Item>
                    </>
                  );
                }
              } else {
                // 自定义 JudgeTemplate 的提交
                return (
                  <Form.Item label={props.t('file')}>
                    <Upload
                      multiple={false}
                      accept={accept}
                      customRequest={(obj: any) => {
                        const generation = ++uploadGeneration.current;
                        uploadAbortController.current?.abort();
                        const controller = new AbortController();
                        uploadAbortController.current = controller;
                        setZipFileId(undefined);
                        setZipUploadPending(true);
                        fileUploadWithoutMD5(obj.file as File, undefined, {
                          signal: controller.signal,
                        })
                          .then((value: any) => {
                            if (generation !== uploadGeneration.current) return;
                            setZipFileId(value.id);
                            obj.onSuccess?.(value);
                          })
                          .catch((error: Error) => {
                            if (generation !== uploadGeneration.current) return;
                            if (!controller.signal.aborted) {
                              message.error(
                                props.t('fileUploadFailed', {
                                  defaultValue: 'File upload failed',
                                }),
                              );
                            }
                            obj.onError?.(error);
                          })
                          .finally(() => {
                            if (generation === uploadGeneration.current) {
                              uploadAbortController.current = undefined;
                              setZipUploadPending(false);
                            }
                          });
                        return {
                          abort: () => {
                            if (generation === uploadGeneration.current) cancelZipUpload();
                            else controller.abort();
                          },
                        };
                      }}
                      onRemove={() => {
                        cancelZipUpload();
                        return true;
                      }}
                      listType={'text'}
                    >
                      <Button icon={<UploadOutlined />}>{props.t('upload')}</Button>
                    </Upload>
                  </Form.Item>
                );
              }
            }
            return undefined;
          })()}
        </Form>
      </Modal>
    </>
  );
};

const mapStateToProps = (state: any) => {
  const State: UserState = state.UserReducer;
  return {
    isLogin: State.isLogin,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
  addTableVersion: (name: string) => dispatch({ type: 'addTableVersion', name: name }),
  setTopSubmission: (submissionID: string, submissionInfo: TopSubmissionInfoType) =>
    dispatch({
      type: 'setTopSubmission',
      submissionID: submissionID,
      submissionInfo: submissionInfo,
    }),
  setSubmissionModalVis: (data: boolean) => dispatch({ type: 'setSubmissionModalVis', data: data }),
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(withRouter(Submit)));
