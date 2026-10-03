import { createContext, Dispatch, useEffect, useId, useMemo, useRef, useState } from 'react';
// 按需引入 vditor 样式，避免主入口全局引入
import 'vditor/dist/index.css';
import { fileUpload } from '../../Utils/fileUpload';
import { Button, message, notification, Space } from 'antd';
import ClipboardJS from 'clipboard';
import { connect } from 'react-redux';
import { useTranslation, withTranslation } from 'react-i18next';
import { withRouter } from 'react-router';
import { ConfigState } from '../../Type/IConfig';
import apiAddress from '../../Utils/API/apiAddress';
import cApi from '../../Utils/API/c-api';
import { isValueEmpty } from '../../Utils/empty';
import { contracts } from '../../Config/validation/contracts';
import { constraintError } from '../../Config/validation/constraints';
import saveIcon from '../../Assert/img/save.svg';
import { UserState } from '../../Type/Iuser';

export interface EditorProps {
  value?: string;
  height?: number;
  save?: unknown;
  id?: string;
  documentIdentity?: string | number;
  fieldIdentity?: string | number;
  userIdentity?: string | number;
  currentUserIdentity?: string | number;
  langCode?: string;
  onChange?: (value: string) => void;
  location?: { pathname?: string };
}

export const EditorDocumentIdentityContext = createContext<string | number | undefined>(undefined);
type VditorInstance = import('vditor').default;

const identityPart = (value: string | number) => encodeURIComponent(String(value));

export const buildEditorCacheId = (
  userIdentity: string | number,
  documentIdentity: string | number,
  fieldIdentity: string | number,
) =>
  `sduoj:vditor:draft:v1:${identityPart(userIdentity)}:${identityPart(documentIdentity)}:${identityPart(fieldIdentity)}`;

const hashIdentity = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

export const CopiedButton = (props: any) => {
  const { t } = useTranslation();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const textRef = useRef(props.text);
  textRef.current = props.text;

  useEffect(() => {
    if (!buttonRef.current) return;
    const clipboard = new ClipboardJS(buttonRef.current, {
      text: () => textRef.current,
    });
    clipboard.on('success', () => {
      message.success(t('ReplicationSuccess'));
    });
    return () => clipboard.destroy();
  }, [t]);

  return (
    <Button ref={buttonRef} size={'small'}>
      {props.btnText}
    </Button>
  );
};

// Use unified front server host from apiAddress
const host = apiAddress().FRONT_SERVER;
export const Editor = (props: EditorProps & any) => {
  const [readyVersion, setReadyVersion] = useState(0);
  const [VditorConstructor, setVditorConstructor] = useState<typeof import('vditor').default>();
  const { t } = useTranslation();
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const editorRef = useRef<VditorInstance>();
  const editorElementRef = useRef<HTMLDivElement>(null);
  const initialValueRef = useRef(props.value ?? '');
  const lastExternalValueRef = useRef(initialValueRef.current);
  const onChangeRef = useRef(props.onChange);
  onChangeRef.current = props.onChange;

  const userIdentity = props.userIdentity ?? props.currentUserIdentity;
  const documentIdentity = props.documentIdentity ?? props.location?.pathname ?? props.id;
  const fieldIdentity = props.fieldIdentity ?? props.id ?? 'content';
  const cacheEnabled = userIdentity !== undefined && documentIdentity !== undefined;
  const cacheId = cacheEnabled
    ? buildEditorCacheId(userIdentity, documentIdentity, fieldIdentity)
    : undefined;
  const identityForDom = cacheId ?? `ephemeral:${reactId}:${fieldIdentity}`;
  const domId = useMemo(
    () => `sduoj-editor-${hashIdentity(identityForDom)}-${reactId}`,
    [identityForDom, reactId],
  );

  useEffect(() => {
    let active = true;
    void import('vditor').then(({ default: constructor }) => {
      if (active) setVditorConstructor(() => constructor);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!VditorConstructor || isValueEmpty(props.langCode) || !editorElementRef.current) return;

    const initialExternalValue = initialValueRef.current;
    lastExternalValueRef.current = initialExternalValue;
    let vditor0: InstanceType<typeof VditorConstructor>;
    vditor0 = new VditorConstructor(editorElementRef.current, {
      height: props.height === undefined ? 800 : props.height,
      mode: 'ir', //及时渲染模式
      value: initialExternalValue,
      cache: cacheEnabled ? { enable: true, id: cacheId } : { enable: false },
      placeholder: t('editorPlaceholder'),
      lang: props.langCode,
      cdn: host + '/vditor',
      outline: {
        enable: false,
        position: 'left',
      },
      hint: {
        emojiPath: host + '/vditor/dist/images/emoji',
      },
      preview: {
        delay: 500,
        hljs: {
          lineNumber: false,
        },
        markdown: {
          toc: true,
          mark: true,
          footnotes: true,
          autoSpace: true,
          sanitize: true,
        },
        math: {
          inlineDigit: true,
          engine: 'KaTeX',
        },
      },
      toolbar: [
        'emoji',
        'headings',
        'bold',
        'italic',
        'strike',
        'link',
        '|',
        'list',
        'ordered-list',
        'check',
        'outdent',
        'indent',
        '|',
        'quote',
        'line',
        'code',
        'inline-code',
        'insert-before',
        'insert-after',
        '|',
        'upload',
        'table',
        '|',
        'undo',
        'redo',
        '|',
        'outline',
        'fullscreen',
        'export',
        '|',
        {
          hotkey: '⌘-S',
          name: 'save',
          tipPosition: 's',
          tip: t('Save'),
          className: 'right',
          icon: `<img style="height: 16px" src="${saveIcon}" alt="save"/>`,
          click() {
            onChangeRef.current?.(vditor0.getValue());
          },
        },
      ],
      after() {
        if (editorRef.current === vditor0) {
          setReadyVersion((version) => version + 1);
        }
      },
      blur() {
        onChangeRef.current?.(vditor0.getValue());
      },
      upload: {
        accept: '*/*',
        multiple: false,
        filename(name) {
          return name
            .replaceAll(/[^(a-zA-Z0-9\u4e00-\u9fa5.)]/g, '')
            .replaceAll(/[?\\/:|<>*[\]()$%{}@~]/g, '')
            .replaceAll('/\\s/g', '');
        },
        handler(files: File[]): any {
          const filenameError = constraintError(contracts.file.name, files[0].name);
          if (filenameError) {
            const msg = filenameError;
            message.error(msg);
            return Promise.reject(msg);
          }

          function callback(value: any) {
            let name = files[0] && files[0].name;
            name = name
              .replaceAll(/[^(a-zA-Z0-9\u4e00-\u9fa5.)]/g, '')
              .replaceAll(/[?\\/:|<>*[\]()$%{}@~]/g, '')
              .replaceAll('/\\s/g', '');

            const path = cApi.getFileDownloadUrl(String(value.id), name);

            let suffix = name.substr(name.lastIndexOf('.') + 1).toUpperCase();
            let picSuffix = [
              'BMP',
              'DIB',
              'PCP',
              'DIF',
              'WMF',
              'GIF',
              'JPG',
              'TIF',
              'EPS',
              'PSD',
              'CDR',
              'IFF',
              'TGA',
              'PCD',
              'MPT',
              'PNG',
            ];
            let text = '';
            if (picSuffix.indexOf(suffix) !== -1) {
              if (vditor0 && vditor0.vditor.currentMode === 'wysiwyg') {
                text += `\n <img src="${path}" alt="${name}" style="zoom:100%;" />`;
              } else {
                text += `\n ![${name}](${path})`;
              }
            } else {
              // console.log(vditor0.vditor.currentMode)
              if (vditor0 && vditor0.vditor.currentMode === 'wysiwyg') {
                text += `\n <a href="${path}">${name}</a>`;
              } else {
                text += `\n [${name}](${path})`;
              }
            }
            document.execCommand('insertHTML', false, text);
            notification.open({
              message: t('fileUploadSuccess'),
              description: (
                <>
                  <span>
                    {t('fileNameLabel')}
                    {name}
                  </span>
                  <br />
                  {/*<span>文件地址：{path}</span><br/>*/}
                  <Space>
                    {t('clickToCopy')}
                    <CopiedButton text={path} btnText={t('purePath')} />
                    <CopiedButton text={`[${name}](${path})`} btnText={t('mdLink')} />
                    <CopiedButton text={`![${name}](${path})`} btnText={t('mdImage')} />
                  </Space>
                  <br />
                  <Space>
                    <CopiedButton text={`<a href="${path}">${name}</a>`} btnText={t('htmlLink')} />
                    <CopiedButton
                      text={`<img src="${path}" alt="${name}" style="zoom:100%;" />`}
                      btnText={t('htmlImage')}
                    />
                  </Space>
                </>
              ),
              duration: null,
              type: 'success',
            });
          }

          void fileUpload(files, callback).catch(() => {
            message.error(t('fileUploadFailed', { defaultValue: 'File upload failed' }));
          });
        },
      },
    });
    editorRef.current = vditor0;
    return () => {
      if (editorRef.current === vditor0) editorRef.current = undefined;
      vditor0.destroy();
    };
  }, [VditorConstructor, cacheEnabled, cacheId, props.height, props.langCode, t]);

  useEffect(() => {
    const nextValue = props.value ?? '';
    const editor = editorRef.current;
    if (editor && lastExternalValueRef.current !== nextValue) {
      lastExternalValueRef.current = nextValue;
      if (editor.getValue() !== nextValue) editor.setValue(nextValue);
    }
  }, [props.value, readyVersion]);

  return <div ref={editorElementRef} id={domId} className="vditor" />;
};

const mapStateToProps = (state: any) => {
  const CState: ConfigState = state.ConfigReducer;
  const UState: UserState = state.UserReducer;
  return {
    langCode: CState.langCode,
    currentUserIdentity: UState.userInfo?.userId ?? UState.userInfo?.username,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(withRouter(Editor)));
