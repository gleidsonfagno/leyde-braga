import assert from 'node:assert/strict';
import { policies } from '../lib/policies.js';
import { LEYDE } from '../lib/config.js';

const origin = process.env.STOREFRONT_URL || 'http://127.0.0.1:3137';
assert.equal(LEYDE.cepOrigemEntrega, undefined, 'A configuração pública não deve exportar a referência residencial');
for (const [slug, policy] of Object.entries(policies)) {
  const response = await fetch(`${origin}/${slug}`, { signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, slug);
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(response.headers.get('permissions-policy').includes('geolocation=(self)'));
  const html = await response.text();
  assert.ok(html.includes(policy.title), slug);
}
for (const path of ['/pagina-que-nao-existe-qa', '/constructor', '/assets/images/banners/hero-1.jpg']) {
  const response = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(30000) });
  await response.text();
  assert.equal(response.status, 404, path);
}
console.log(JSON.stringify({ result: 'passed', pages: Object.keys(policies).length, checks: ['politicas-publicas', 'headers-privacidade', 'sem-endereco-na-configuracao-publica', 'pagina-inexistente', 'banner-antigo-removido'] }));
