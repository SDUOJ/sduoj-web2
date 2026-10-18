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

const footerTags = new Set(['hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'font']);
const footerStyleProperties = new Set([
  'display',
  'color',
  'background-color',
  'width',
  'max-width',
  'height',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'border',
  'font-size',
  'font-weight',
  'text-align',
  'text-decoration',
]);

function retainFooterStyle(element: Element): void {
  const declarations = (element as HTMLElement).style;
  const safe: Array<[string, string]> = [];
  for (const property of Array.from(declarations)) {
    const value = declarations.getPropertyValue(property);
    if (
      footerStyleProperties.has(property) &&
      (/^[a-zA-Z0-9#.,% -]+$/.test(value) || /^rgba?\([0-9.,%\s]+\)$/i.test(value))
    ) {
      safe.push([property, value]);
    }
  }
  element.removeAttribute('style');
  for (const [property, value] of safe) declarations.setProperty(property, value);
}

export const MAX_RICH_TEXT_CHARACTERS = 1024 * 1024;

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

export const isSafeHtmlUrl = (value: string) => {
  const normalized = value.trim().replace(controlCharacters, '');
  return normalized === '' || !unsafeProtocol.test(normalized);
};

/** Sanitize server-provided rich text before inserting it into the document. */
export function sanitizeHtml(input: unknown, options: { footerFormatting?: boolean } = {}): string {
  if (typeof input === 'string' && input.length > MAX_RICH_TEXT_CHARACTERS) return '';
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
    const tag = element.tagName.toLowerCase();
    if (!allowedTags.has(tag) && !(options.footerFormatting && footerTags.has(tag))) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      if (options.footerFormatting && name === 'style') {
        retainFooterStyle(element);
        return;
      }
      if (
        options.footerFormatting &&
        tag === 'font' &&
        ((name === 'color' && /^[a-zA-Z]+$|^#[0-9a-fA-F]{3,8}$/.test(attribute.value)) ||
          (name === 'size' && /^[1-7]$/.test(attribute.value)))
      )
        return;
      if (
        !allowedAttributes.has(name) ||
        (urlAttributes.has(name) && !isSafeHtmlUrl(attribute.value))
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
