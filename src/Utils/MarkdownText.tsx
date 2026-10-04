import { MarkdownPreview } from './MarkdownPreview';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isValueEmpty } from './empty';

const MarkdownText = (props: any) => {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  const generation = useRef(0);

  useEffect(() => {
    const currentGeneration = ++generation.current;
    const controller = new AbortController();
    setFailed(false);
    const target = document.getElementById(props.id);
    if (!target || isValueEmpty(props.text)) {
      if (target) target.replaceChildren();
      return () => undefined;
    }
    target.replaceChildren();
    Promise.resolve(MarkdownPreview(props.text, props.id, { signal: controller.signal })).catch(
      () => {
        if (generation.current === currentGeneration && target.isConnected) {
          target.replaceChildren();
          setFailed(true);
        }
      },
    );
    return () => {
      generation.current += 1;
      controller.abort();
    };
  }, [props.id, props.text]);

  return (
    <>
      {failed && <div role="alert">{t('MarkdownPreviewFailed')}</div>}
      <div id={props.id} style={{ overflowY: 'hidden' }}></div>
    </>
  );
};

export default MarkdownText;
