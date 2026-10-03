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
  expect(getVditorResourceUrls(publicUrl)).toEqual({
    cdn,
    emojiPath: `${cdn}/dist/images/emoji`,
    themePath: `${cdn}/dist/css/content-theme`,
  });
});

it('defaults to the build PUBLIC_URL instead of an API/front-end origin', () => {
  const previousPublicUrl = process.env.PUBLIC_URL;
  process.env.PUBLIC_URL = '/v2/';
  try {
    expect(getVditorResourceUrls().cdn).toBe('/v2/vditor');
  } finally {
    if (previousPublicUrl === undefined) delete process.env.PUBLIC_URL;
    else process.env.PUBLIC_URL = previousPublicUrl;
  }
});
