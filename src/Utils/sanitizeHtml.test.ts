import { MAX_RICH_TEXT_CHARACTERS, sanitizeHtml } from './sanitizeHtml';

it('keeps ordinary copyright markup while removing executable content', () => {
  const html = sanitizeHtml(
    '<p onclick="alert(1)">SDUOJ <a href="https://example.com" target="_blank">home</a></p>' +
      '<img src="javascript:alert(2)" onerror="alert(3)">' +
      '<script>window.__xss = true</script><iframe src="https://evil.invalid"></iframe>',
  );

  expect(html).toContain('SDUOJ');
  expect(html).toContain('href="https://example.com"');
  expect(html).toContain('rel="noopener noreferrer"');
  expect(html).not.toMatch(/onclick|onerror|javascript:|<script|<iframe/i);
});

it.each([
  '<a href="java&#x09;script:alert(1)">link</a>',
  '<svg><a xlink:href="javascript:alert(1)"><text>svg</text></a></svg>',
  '<math><mtext><img src="x" onerror="alert(1)"></mtext></math>',
  '<form><input autofocus onfocus="alert(1)"><button formaction="javascript:alert(1)">x</button></form>',
  '<style>@import "https://evil.invalid"</style><p style="background:url(javascript:alert(1))">text</p>',
])('keeps adversarial rich text inert: %s', (input) => {
  const target = document.createElement('div');
  target.innerHTML = sanitizeHtml(input);
  expect(
    target.querySelector(
      'svg, math, style, form, input, button, [onerror], [onfocus], [xlink\\:href], [style]',
    ),
  ).toBeNull();
  expect(target.querySelector('a')?.getAttribute('href') ?? '').not.toMatch(/javascript:/i);
});

it('rejects oversized server rich text before parsing it', () => {
  expect(sanitizeHtml('x'.repeat(MAX_RICH_TEXT_CHARACTERS + 1))).toBe('');
});

it('rejects file and data URL protocols from resource attributes', () => {
  const html = sanitizeHtml(
    '<a href="file:///tmp/a">file</a><img src="data:text/html,evil" xlink:href="javascript:evil">',
  );
  expect(html).not.toMatch(/file:|data:|xlink:href/i);
  expect(html).toContain('>file</a>');
});

it('preserves the configured footer columns and headings with a restricted formatting profile', () => {
  const html = sanitizeHtml(
    '<hr style="max-width:1500px;width:100%;margin:0 auto;height:1px;border:none">' +
      '<div style="display:flex;max-width:1500px;width:100%;margin:0 auto">' +
      '<div style="max-width:36%"><h2 style="margin-bottom:0">SDUOJ</h2></div>' +
      '<div style="max-width:17%;margin-left:auto"><font color="green" size="4">Judger</font></div></div>',
    { footerFormatting: true },
  );
  const root = document.createElement('div');
  root.innerHTML = html;
  expect(root.querySelector('hr')?.style.maxWidth).toBe('1500px');
  expect(root.querySelector('div')?.style.display).toBe('flex');
  expect(root.querySelector('h2')?.textContent).toBe('SDUOJ');
  expect(root.querySelector('font')?.getAttribute('color')).toBe('green');
  expect(root.querySelector('font')?.getAttribute('size')).toBe('4');
});

it('keeps footer formatting from admitting executable markup or unsafe CSS', () => {
  const html = sanitizeHtml(
    '<div onclick="alert(1)" style="display:flex;position:fixed;z-index:99999;background-image:url(https://example.test/track);color:red">' +
      '<img src="javascript:alert(1)" onerror="alert(1)"><a href="javascript:alert(1)">link</a>' +
      '<font color="url(https://example.test/track)" size="99">text</font></div>',
    { footerFormatting: true },
  );
  expect(html).toContain('display: flex');
  expect(html).toContain('color: red');
  expect(html).not.toMatch(/onclick|onerror|javascript:|position|z-index|url\(|size=/i);
  expect(sanitizeHtml('<div style="display:flex">content</div>')).not.toContain('style=');
});
