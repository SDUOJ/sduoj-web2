import { getVditorResourceUrls } from './vditorResources';

it.each([
  ['', '/vditor'],
  ['/', '/vditor'],
  ['/v2', '/v2/vditor'],
  ['/v2/', '/v2/vditor'],
  ['/preview/sduoj///', '/preview/sduoj/vditor'],
  ['https://static.example.org/v2/', 'https://static.example.org/v2/vditor'],
  ['.', './vditor'],
])('uses the public asset prefix %s for every Vditor resource', (publicUrl, cdn) => {
  expect(getVditorResourceUrls(publicUrl, 'development')).toEqual({
    cdn: `${cdn}/development`,
    emojiPath: `${cdn}/development/dist/images/emoji`,
    themePath: `${cdn}/development/dist/css/content-theme`,
  });
});

it('defaults to the build PUBLIC_URL instead of an API/front-end origin', () => {
  const previousPublicUrl = process.env.PUBLIC_URL;
  process.env.PUBLIC_URL = '/v2/';
  try {
    expect(getVditorResourceUrls().cdn).toBe('/v2/vditor/development');
  } finally {
    if (previousPublicUrl === undefined) delete process.env.PUBLIC_URL;
    else process.env.PUBLIC_URL = previousPublicUrl;
  }
});

it('separates cached resources across content revisions and restores rollback URLs', () => {
  const oldRevision = 'a'.repeat(64);
  const newRevision = 'b'.repeat(64);
  const previous = getVditorResourceUrls('/v2/', oldRevision);
  expect(getVditorResourceUrls('/v2/', newRevision).cdn).not.toBe(previous.cdn);
  expect(getVditorResourceUrls('/v2/', oldRevision)).toEqual(previous);
  expect(getVditorResourceUrls('/v2-pre/', newRevision).cdn).toBe(`/v2-pre/vditor/${newRevision}`);
});

it.each(['../escape', 'wrong/version', 'https://evil.example', ''])(
  'rejects invalid content revisions: %s',
  (revision) => {
    expect(() => getVditorResourceUrls('/v2/', revision)).toThrow(
      'Invalid Vditor resource revision',
    );
  },
);
