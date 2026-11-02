import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarMetaPixel, paginaPermitidaPixel } from '../lib/meta-pixel.js';
import { CONSENT_DAYS, criarPreferencias, lerPreferencias, permiteEstatisticas, permitePublicidade, providerId } from '../lib/privacy.js';

const id = '1784326125895756';
const ga = 'G-TEST12345';
const now = Date.parse('2026-11-02T12:00:00Z');
const provider = providerId(ga, id);

function ambiente(pathname = '/', search = '') {
  const scripts = [];
  const cookies = [];
  const win = { location: { hostname: 'loja.example.com', pathname, search } };
  const doc = {
    head: { appendChild(script) { scripts.push(script); } },
    createElement() { return { dataset: {} }; },
    get cookie() { return '_fbp=abc; _fbc=def; cookie_necessario=1'; },
    set cookie(value) { cookies.push(value); },
  };
  return { win, doc, scripts, cookies };
}

test('consentimento de publicidade é separado de estatísticas e vinculado ao Pixel', () => {
  const stats = criarPreferencias({ analytics: true, marketing: false }, provider, now);
  assert.equal(permiteEstatisticas(stats, { id: ga, pixel: id, now }), true);
  assert.equal(permitePublicidade(stats, { id, analyticsId: ga, now }), false);
  const ads = criarPreferencias({ analytics: false, marketing: true }, provider, now);
  assert.equal(permitePublicidade(ads, { id, analyticsId: ga, now }), true);
  assert.equal(permiteEstatisticas(ads, { id: ga, pixel: id, now }), false);
  assert.equal(permitePublicidade(ads, { id, analyticsId: ga, privacySignal: true, now }), false);
  assert.equal(permitePublicidade(ads, { id: '1784326125895757', analyticsId: ga, now }), false);
  assert.equal(permitePublicidade(ads, { id, analyticsId: ga, now: now + CONSENT_DAYS * 86400000 }), false);
  assert.equal(lerPreferencias(JSON.stringify({ ...ads, version: 1 }), provider, now), null);
  assert.equal(lerPreferencias(JSON.stringify({ ...ads, marketing: 'true' }), provider, now), null);
  assert.equal(criarPreferencias(true, provider, now).marketing, false);
});

test('Pixel não existe nem carrega script antes do consentimento válido', () => {
  for (const invalid of ['', 'https://pixel.example.com', '<script>', 1784326125895756]) {
    const env = ambiente();
    criarMetaPixel({ ...env, id: invalid }).ativar(true);
    assert.equal(env.scripts.length, 0);
    assert.equal(env.win.fbq, undefined);
  }
  const env = ambiente();
  const pixel = criarMetaPixel({ ...env, id });
  pixel.ativar(false);
  pixel.pagina();
  assert.equal(env.scripts.length, 0);
  assert.equal(env.win.fbq, undefined);
});

test('inicializa uma vez em modo manual e envia somente PageView por rota para o Pixel informado', () => {
  const env = ambiente('/produto', '?p=perfume-real');
  const pixel = criarMetaPixel({ ...env, id });
  pixel.ativar(true);
  pixel.pagina();
  pixel.ativar(true);
  pixel.pagina();
  assert.equal(env.scripts.length, 1);
  assert.equal(env.scripts[0].src, 'https://connect.facebook.net/en_US/fbevents.js');
  const comandos = env.win.fbq.queue;
  const init = comandos.findIndex((args) => args[0] === 'init');
  for (const opcao of ['autoConfig', 'smartSetup']) {
    const indice = comandos.findIndex((args) => args[1] === opcao && args[2] === false && args[3] === id);
    assert.ok(indice >= 0 && indice < init, `${opcao} desativada antes da inicialização`);
  }
  assert.deepEqual(comandos[init], ['init', id]);
  assert.deepEqual(comandos.filter((args) => args[0] === 'trackSingle'), [['trackSingle', id, 'PageView']]);
  env.win.location.pathname = '/categoria';
  env.win.location.search = '?cat=perfumes';
  pixel.pagina();
  assert.equal(comandos.filter((args) => args[0] === 'trackSingle').length, 2);
  env.win.location.search = '?cat=maquiagem';
  pixel.pagina();
  pixel.pagina();
  assert.equal(comandos.filter((args) => args[0] === 'trackSingle').length, 3);
});

test('revogar durante o carregamento elimina PageViews pendentes, remove cookies próprios e permite retomar', () => {
  const env = ambiente();
  const pixel = criarMetaPixel({ ...env, id });
  pixel.ativar(true);
  pixel.pagina();
  pixel.desativar();
  pixel.pagina();
  assert.equal(env.win.fbq.queue.some((args) => args[0] === 'trackSingle'), false);
  assert.deepEqual(env.win.fbq.queue.at(-1), ['consent', 'revoke']);
  assert.ok(env.cookies.some((value) => value.startsWith('_fbp=; Max-Age=0')));
  assert.ok(env.cookies.some((value) => value.startsWith('_fbc=; Max-Age=0')));
  assert.equal(env.cookies.some((value) => value.startsWith('cookie_necessario=')), false);
  pixel.ativar(true);
  pixel.pagina();
  assert.equal(env.scripts.length, 1);
  assert.equal(env.win.fbq.queue.filter((args) => args[0] === 'init').length, 1);
  assert.equal(env.win.fbq.queue.filter((args) => args[0] === 'trackSingle').length, 1);
});

test('checkout, confirmação, carrinho, busca e parâmetros não reconhecidos não carregam Pixel', () => {
  for (const [pathname, search] of [['/checkout', ''], ['/confirmacao', ''], ['/carrinho', ''], ['/privacidade', ''], ['/categoria', '?q=telefone-privado'], ['/produto', '?p=perfume&email=pessoa@example.com']]) {
    const env = ambiente(pathname, search);
    const pixel = criarMetaPixel({ ...env, id });
    pixel.ativar(true);
    pixel.pagina();
    assert.equal(env.scripts.length, 0, pathname + search);
  }
  assert.equal(paginaPermitidaPixel({ pathname: '/', search: '?fbclid=IwZXh0bgNhZW0_123' }), true);
});

test('navegação para checkout revoga o SDK já carregado sem emitir evento de compra', () => {
  const env = ambiente();
  const pixel = criarMetaPixel({ ...env, id });
  pixel.ativar(true);
  const enviados = [];
  env.win.fbq.callMethod = (...args) => enviados.push(args);
  pixel.pagina();
  env.win.location.pathname = '/checkout';
  pixel.ativar(true);
  pixel.pagina();
  assert.equal(enviados.filter((args) => args[0] === 'trackSingle').length, 1);
  assert.deepEqual(enviados.at(-1), ['consent', 'revoke']);
  assert.equal(JSON.stringify(enviados).includes('Purchase'), false);
  pixel.desativar();
  pixel.pagina();
  assert.equal(enviados.filter((args) => args[0] === 'trackSingle').length, 1);
});
