import { Dispatch, useEffect, useRef, useState } from 'react';
// 按需引入 vditor 样式，避免主入口全局引入
import 'vditor/dist/index.css';
import Vditor from 'vditor';
import { fileUpload } from '../../Utils/fileUpload';
import { Button, message, notification, Space } from 'antd';
import ClipboardJS from 'clipboard';
import { connect } from 'react-redux';
import { useTranslation, withTranslation } from 'react-i18next';
import { withRouter } from 'react-router';
import { ConfigState } from '../../Type/IConfig';
import apiAddress from '../../Utils/API/apiAddress';
import { isValueEmpty } from '../../Utils/empty';
import { contracts } from '../../Config/validation/contracts';
import { constraintError } from '../../Config/validation/constraints';

export interface EditorProps {
  value: string;
  height?: number;
  save: any;
  id?: any;
}

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
  const [vditors, setVditors] = useState<any>(undefined);
  const [finishRender, setFinishRender] = useState(false);
  const { t } = useTranslation();
  const onChangeRef = useRef(props.onChange);
  onChangeRef.current = props.onChange;

  const setEditor = () => {
    const vditor0 = new Vditor(props.id ?? 'vditor', {
      height: props.height === undefined ? 800 : props.height,
      mode: 'ir', //及时渲染模式
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
          icon: `<img style="height: 16px" src='https://img.58cdn.com.cn/escstatic/docs/imgUpload/idocs/save.svg' alt="save"/>`,
          click() {
            onChangeRef.current?.(vditor0.getValue());
          },
        },
      ],
      after() {
        vditor0.setValue(props.value === undefined ? '' : props.value);
        setFinishRender(true);
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

            const path =
              apiAddress().CLIENT_SERVER + '/api/filesys/download/' + value.id + '/' + name;

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

          fileUpload(files, callback);
        },
      },
    });
    setVditors(vditor0);
    return vditor0;
  };

  useEffect(() => {
    if (isValueEmpty(props.langCode)) return;
    const editor = setEditor();
    return () => editor.destroy();
  }, [props.langCode]);

  useEffect(() => {
    if (finishRender && vditors !== undefined && vditors.getValue() !== props.value) {
      vditors.setValue(props.value ?? '');
    }
  }, [vditors, props.value, finishRender]);

  return (
    <>
      <div id={props.id ?? 'vditor'} className="vditor" />
    </>
  );
};

const mapStateToProps = (state: any) => {
  const CState: ConfigState = state.ConfigReducer;
  return {
    langCode: CState.langCode,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(withRouter(Editor)));
