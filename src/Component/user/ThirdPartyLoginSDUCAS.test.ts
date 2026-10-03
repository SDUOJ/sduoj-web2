import { buildSduCasLoginUrl } from './ThirdPartyLoginSDUCAS';

it('encodes the complete CAS service callback', () => {
  const loginUrl = new URL(buildSduCasLoginUrl('https://front.example.test/v2?ignored=1'));
  const service = new URL(loginUrl.searchParams.get('service') ?? '');

  expect(loginUrl.origin).toBe('https://pass.sdu.edu.cn');
  expect(service.origin).toBe('https://front.example.test');
  expect(service.pathname).toBe('/v2/thirdPartyLogin');
  expect(service.searchParams.get('thirdParty')).toBe('SDUCAS');
});
