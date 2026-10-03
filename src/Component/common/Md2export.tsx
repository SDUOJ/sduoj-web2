import { Dispatch, useCallback, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { withRouter } from 'react-router';
import { ConfigState } from '../../Type/IConfig';
import { isValueEmpty } from '../../Utils/empty';
import { Button, Modal } from 'antd';
import { getVditorResourceUrls } from '../../Utils/vditorResources';

export const MD2export = (props: any) => {
  const [vis, setVis] = useState<boolean>(false);
  const [VditorConstructor, setVditorConstructor] = useState<typeof import('vditor').default>();
  const editorRef = useRef<InstanceType<typeof import('vditor').default>>();
  const { height, id, langCode, value } = props;

  useEffect(() => {
    if (isValueEmpty(langCode) || !vis) return;
    let active = true;
    void import('vditor').then(({ default: constructor }) => {
      if (active) setVditorConstructor(() => constructor);
    });
    return () => {
      active = false;
    };
  }, [langCode, vis]);

  const setEditor = useCallback(() => {
    if (!VditorConstructor) return undefined;
    const { cdn, emojiPath, themePath } = getVditorResourceUrls();
    const vditor0 = new VditorConstructor(id ?? 'vditor-export', {
      height: height === undefined ? 800 : height,
      mode: 'ir',
      placeholder: '',
      lang: langCode,
      cdn,
      outline: {
        enable: true,
        position: 'left',
      },
      hint: {
        emojiPath,
      },
      preview: {
        delay: 500,
        theme: { current: 'light', path: themePath },
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
      toolbar: ['export'],
      after() {
        vditor0.setValue(value);
      },
      blur() {},
    });
    editorRef.current = vditor0;
    return vditor0;
  }, [VditorConstructor, height, id, langCode, value]);

  useEffect(() => {
    if (!isValueEmpty(langCode) && vis && VditorConstructor) {
      const editor = setEditor();
      if (!editor) return;
      return () => {
        editor.destroy();
        if (editorRef.current === editor) editorRef.current = undefined;
      };
    }
  }, [VditorConstructor, langCode, setEditor, vis]);

  useEffect(() => {
    if (vis && editorRef.current && editorRef.current.getValue() !== value)
      editorRef.current.setValue(value ?? '');
  }, [value, vis]);

  return (
    <>
      <Button
        type={'link'}
        onClick={() => {
          setVis(true);
        }}
      >
        {' '}
        {props.t('markdownText')}{' '}
      </Button>

      <Modal
        title={props.t('markdownText')}
        open={vis}
        footer={false}
        width={1200}
        onCancel={() => {
          setVis(false);
        }}
      >
        <div id={props.id ?? 'vditor-export'} className="vditor" />
      </Modal>
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

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withTranslation()(withRouter(MD2export)));
