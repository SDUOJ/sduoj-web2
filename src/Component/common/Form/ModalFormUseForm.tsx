import React, { Dispatch, useCallback, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { withRouter } from 'react-router';
import { Button, Form, message, Modal } from 'antd';
import type { ButtonProps } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { ck, isValueEmpty } from '../../../Utils/empty';
import { useForm } from 'antd/es/form/Form';
import { ProFormInstance, StepsForm } from '@ant-design/pro-components';
import { EditorDocumentIdentityContext } from '../Editor';

interface subFormType {
  component: any;
  label: string;
}

interface ModalFormProps {
  // 表单类型
  type: 'create' | 'update' | 'batchUpdate';
  // 初始化数据，必须包含 initData 或 dataLoader 之一
  initData?: { [key: string]: {} };
  dataLoader?: () => Promise<any>; // 异步数据加载
  dataSubmitter: (data: any) => Promise<any>;
  afterSubmit?: () => any; // 提交完成之后的回调
  updateAppendProps?: { [key: string]: any };

  title: string; // 弹窗标题
  TableName?: string; // 若有需要更新的表格，其名称
  className?: any; // 类名
  subForm: subFormType[]; // 子表单信息
  btnProps?: any;
  layout?: any;
  onClose?: any; // 关闭时进行回调
}

interface StepsFormModalProps {
  title: React.ReactNode;
  className?: string;
  width?: number;
  open: boolean;
  onCancel: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
}

const StepsFormModal = ({
  title,
  className,
  width,
  open,
  onCancel,
  footer,
  children,
}: StepsFormModalProps) => (
  <Modal
    destroyOnHidden
    title={title}
    className={className}
    open={open}
    maskClosable={false}
    width={width ?? 1200}
    style={{ minWidth: width === undefined ? undefined : `min(${width}px, calc(100vw - 32px))` }}
    onCancel={onCancel}
    footer={footer}
  >
    {children}
  </Modal>
);

const renderStepsFormModal = (
  config: Omit<StepsFormModalProps, 'children' | 'footer'>,
  dom: React.ReactNode,
  submitter: React.ReactNode,
) => (
  <StepsFormModal {...config} footer={submitter}>
    {dom}
  </StepsFormModal>
);

const ModalForm = (props: ModalFormProps & any) => {
  const { t } = useTranslation();
  const { formName, addManageInitData } = props;
  const subFormCount = props.subForm.length;

  const [form] = useForm();
  const formMapRef = useRef<React.MutableRefObject<ProFormInstance<any> | undefined>[]>([]);
  const [formVis, setFormVis] = useState<boolean>(false);
  const [saveInitData, setSaveInitData] = useState();
  const [current, setCurrent] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const loadIdRef = useRef(0);
  const modalInstanceId = React.useId();
  const editorDocumentIdentity = React.useMemo(() => {
    if (props.editorDocumentIdentity !== undefined) return props.editorDocumentIdentity;
    const scope = props.formName ?? props.TableName ?? 'form';
    const recordIdentity = Object.entries(props.updateAppendProps ?? {})
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${String(value)}`)
      .join('&');
    return `modal:${scope}:${props.type}:${recordIdentity || `new:${modalInstanceId}`}`;
  }, [
    props.TableName,
    props.editorDocumentIdentity,
    props.formName,
    props.type,
    props.updateAppendProps,
    modalInstanceId,
  ]);

  const BtnTypeMap: { [key: string]: ButtonProps['type'] } = {
    create: 'primary',
    update: 'link',
    fork: 'link',
    batchUpdate: 'primary',
  };

  const loadData = () => {
    const loadId = ++loadIdRef.current;
    if (props.type === 'update' || props.type === 'fork') {
      // 若初始化信息为空，则调用数据加载器进行异步数据加载
      if (props.initData === undefined) {
        const hied = message.loading({
          content: t('Loading'),
          duration: 0,
        });
        if (props.dataLoader === undefined) {
          hied();
          message.error(t('dataLoaderNotDefined'));
          return;
        }
        props.dataLoader &&
          props
            .dataLoader()
            .then((data: any) => {
              if (loadId !== loadIdRef.current) return;
              // console.log("dataLoaderData", data)
              setSaveInitData(data);
              // if (props.subForm.length !== 1) {
              // } else form.setFieldsValue(data)
              setFormVis(true);
            })
            .catch(() => {
              // The request layer presents errors.
            })
            .finally(() => {
              hied();
            });
      } else {
        // 否则直接进行数据加载
        // console.log("initData",props.initData)
        setSaveInitData(props.initData);
        setFormVis(true);
      }
    } else if (props.type === 'create') {
      if (props.initData !== undefined) {
        setSaveInitData(props.initData);
      }
      setFormVis(true);
    } else {
      setFormVis(true);
    }
  };

  const applyInitialValues = useCallback(
    (initialValues: any) => {
      if (isValueEmpty(initialValues)) return;
      if (subFormCount === 1) form.setFieldsValue(initialValues);
      formMapRef.current.forEach((formInstanceRef) => {
        formInstanceRef.current?.setFieldsValue(initialValues);
      });
    },
    [form, subFormCount],
  );

  // 表单实例在提交后的 commit 阶段就绪，直接注入初始值，避免依赖定时器。
  useEffect(() => {
    if (formVis) applyInitialValues(saveInitData);
    if (!formVis) {
      setCurrent(0);
      formMapRef.current.forEach((formInstanceRef) => {
        formInstanceRef.current?.resetFields();
      });
      formName && addManageInitData(formName, undefined);
    }
  }, [formVis, saveInitData, form, applyInitialValues, formName, addManageInitData]);

  useEffect(
    () => () => {
      loadIdRef.current += 1;
    },
    [],
  );

  useEffect(() => {
    formName && addManageInitData(formName, saveInitData);
  }, [formName, addManageInitData, saveInitData]);

  // 提交数据
  const submitData = (values: any) => {
    const submit = (value: any) => {
      // console.log("inner", value)
      setSubmitting(true);
      // 在提交表单数据之前，追加数据
      props.updateAppendProps && Object.assign(value, props.updateAppendProps);
      props
        .dataSubmitter(value)
        .then((res: any) => {
          // 当数据绑定表格时，更新表格数据
          props.TableName && props.addTableVersion(props.TableName);
          props.afterSubmit && props.afterSubmit(res);
          props.onClose && props.onClose();
          setFormVis(false);
          message.success(t('success'));
        })
        .catch(() => {
          // 请求层已统一弹出错误提示，这里阻断未捕获异常
        })
        .finally(() => {
          setSubmitting(false);
        });
    };

    if (props.subForm.length === 1) {
      // 只有一页的表单，需要手动进行验证
      // console.log(form)
      form
        .validateFields()
        .then((value) => {
          submit(value);
        })
        .catch(() => {
          message.error(t('FormIncomplete'));
        });
    } else submit(values);
  };

  const getAllStepValues = () => {
    const mergedValues: { [key: string]: any } = {};
    formMapRef.current.forEach((formInstanceRef) => {
      const values = formInstanceRef.current?.getFieldsValue?.(true);
      if (values && typeof values === 'object') {
        Object.assign(mergedValues, values);
      }
    });
    return mergedValues;
  };

  return (
    <>
      <Button
        {...props.btnProps}
        type={ck(props.btnType, BtnTypeMap[props.type])}
        onClick={loadData}
        style={
          props.type === 'fork' || props.type === 'update' || props.btnType === 'link'
            ? {
                paddingLeft: 5,
                paddingRight: 5,
              }
            : undefined
        }
      >
        {(() => {
          if (props.btnIcon !== false) {
            if (props.type === 'create') return <PlusOutlined />;
            if (props.type === 'batchUpdate') return <EditOutlined />;
          }
        })()}
        {(() => {
          if (props.btnName !== undefined) return props.btnName;
          switch (props.type) {
            case 'create':
              return t('create');
            case 'update':
              return t('Edit');
            case 'fork':
              return t('Fork');
            default:
              return t('updateBatch');
          }
        })()}
      </Button>
      <EditorDocumentIdentityContext.Provider value={editorDocumentIdentity}>
        {props.subForm.length === 1 && (
          <Modal
            width={props.width}
            style={{
              minWidth:
                props.width === undefined ? undefined : `min(${props.width}px, calc(100vw - 32px))`,
            }}
            destroyOnHidden={true}
            title={props.title}
            className={props.className}
            open={formVis}
            maskClosable={false}
            onCancel={() => {
              loadIdRef.current += 1;
              props.onClose && props.onClose();
              setFormVis(false);
            }}
            footer={[
              <Button type="primary" key="submit" onClick={submitData} loading={submitting}>
                {t('Submit')}
              </Button>,
            ]}
          >
            <Form
              form={form}
              layout={props.layout ?? 'vertical'}
              initialValues={props.initData}
              scrollToFirstError
              preserve={false}
            >
              {props.subForm[0].component}
            </Form>
          </Modal>
        )}
        {props.subForm.length !== 1 && (
          <StepsForm
            current={current}
            onCurrentChange={(currentPage: number) => {
              setCurrent(currentPage);
            }}
            formMapRef={formMapRef}
            onFinish={async (values) => {
              submitData(values);
            }}
            submitter={{
              submitButtonProps: {
                loading: submitting,
              },
            }}
            stepsFormRender={renderStepsFormModal.bind(null, {
              title: props.title,
              className: props.className,
              open: formVis,
              width: props.width,
              onCancel: () => {
                loadIdRef.current += 1;
                props.onClose && props.onClose();
                setFormVis(false);
              },
            })}
          >
            {props.subForm.map((item: any, index: number) => {
              const stepComponent = React.isValidElement(item.component)
                ? React.cloneElement(item.component as React.ReactElement<any>, {
                    getAllStepValues,
                  })
                : item.component;
              return (
                <StepsForm.StepForm
                  key={item.label || index}
                  layout={props.layout ?? 'vertical'}
                  name={'step' + index}
                  title={item.label}
                  onFinish={async () => {
                    return true;
                  }}
                  onInit={(_, stepForm) => {
                    if (!isValueEmpty(saveInitData)) stepForm.setFieldsValue(saveInitData);
                  }}
                >
                  {stepComponent}
                </StepsForm.StepForm>
              );
            })}
          </StepsForm>
        )}
      </EditorDocumentIdentityContext.Provider>
    </>
  );
};

const mapStateToProps = () => {
  return {};
};

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
  addTableVersion: (name: string) => dispatch({ type: 'addTableVersion', name: name }),
  addManageInitData: (key: string, data: any) =>
    dispatch({ type: 'addManageInitData', key: key, data: data }),
});

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(ModalForm));
