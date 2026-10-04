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
