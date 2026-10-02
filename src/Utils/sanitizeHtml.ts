const allowedTags = new Set([
  'a',
  'abbr',
  'b',
  'br',
  'code',
  'div',
  'em',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'u',
  'ul',
]);

const unsafeProtocol = /^(?:javascript|vbscript|data|file):/i;
const urlAttributes = new Set(['href', 'src']);
const allowedAttributes = new Set([
  'alt',
  'class',
  'height',
  'href',
  'id',
  'rel',
  'src',
  'target',
  'title',
  'width',
]);
const controlCharacters = new RegExp(
  `[${String.fromCharCode(0)}-${String.fromCharCode(31)}${String.fromCharCode(127)}-${String.fromCharCode(159)}]`,
  'g',
);

const isSafeUrl = (value: string) => {
  const normalized = value.trim().replace(controlCharacters, '');
  return normalized === '' || !unsafeProtocol.test(normalized);
};

/** Sanitize server-provided rich text before inserting it into the document. */
export function sanitizeHtml(input: unknown): string {
  if (typeof input !== 'string' || input.length === 0) {
    return typeof input === 'string' ? input : '';
  }
  if (typeof DOMParser === 'undefined') {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const parsed = new DOMParser().parseFromString(`<div>${input}</div>`, 'text/html');
  const root = parsed.body.firstElementChild;
  if (root === null) return '';

  root.querySelectorAll('*').forEach((element) => {
    if (!allowedTags.has(element.tagName.toLowerCase())) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      if (
        !allowedAttributes.has(name) ||
        (urlAttributes.has(name) && !isSafeUrl(attribute.value))
      ) {
        element.removeAttribute(attribute.name);
      }
    });

    if (element.tagName.toLowerCase() === 'a' && element.getAttribute('target') === '_blank') {
      element.setAttribute('rel', 'noopener noreferrer');
    }
  });

  return root.innerHTML;
}
