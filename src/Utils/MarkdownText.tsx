import { MarkdownPreview } from './MarkdownPreview';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isValueEmpty } from './empty';

let previewSequence = 0;

const MarkdownText = (props: any) => {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  const generation = useRef(0);
  const retainedScope = useRef<string | undefined>(undefined);

  useEffect(() => {
    const currentGeneration = ++generation.current;
    const controller = new AbortController();
    setFailed(false);
    const target = document.getElementById(props.id);
    if (!target || isValueEmpty(props.text)) {
      if (target) target.replaceChildren();
      return () => undefined;
    }
    if (!props.retainScope || retainedScope.current !== props.retainScope) target.replaceChildren();
    retainedScope.current = props.retainScope;
    // Keep the last completed preview in layout while the next generation loads.
    // The renderer needs a connected element for its asynchronous code/math helpers.
    const staging = document.createElement('div');
    do {
      staging.id = `${props.id}-pending-${++previewSequence}`;
    } while (document.getElementById(staging.id));
    staging.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;';
    staging.style.width = `${target.clientWidth}px`;
    staging.setAttribute('aria-hidden', 'true');
    target.appendChild(staging);
    let committed = false;
    Promise.resolve(MarkdownPreview(props.text, staging.id, { signal: controller.signal }))
      .then(() => {
        if (
          controller.signal.aborted ||
          generation.current !== currentGeneration ||
          !target.isConnected
        )
          return;
        staging.removeAttribute('id');
        staging.removeAttribute('style');
        staging.removeAttribute('aria-hidden');
        target.replaceChildren(staging);
        committed = true;
      })
      .catch(() => {
        if (generation.current === currentGeneration && target.isConnected) {
          target.replaceChildren();
          setFailed(true);
        }
      });
    return () => {
      generation.current += 1;
      controller.abort();
      if (!committed) staging.remove();
    };
  }, [props.id, props.text, props.retainScope]);

  return (
    <>
      {failed && <div role="alert">{t('MarkdownPreviewFailed')}</div>}
      <div id={props.id} style={{ overflowY: 'hidden' }}></div>
    </>
  );
};

export default MarkdownText;
