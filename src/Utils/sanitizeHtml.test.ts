import { sanitizeHtml } from './sanitizeHtml';

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

it('rejects file and data URL protocols from resource attributes', () => {
  const html = sanitizeHtml(
    '<a href="file:///tmp/a">file</a><img src="data:text/html,evil" xlink:href="javascript:evil">',
  );
  expect(html).not.toMatch(/file:|data:|xlink:href/i);
  expect(html).toContain('>file</a>');
});
