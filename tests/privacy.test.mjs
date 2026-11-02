import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CONSENT_DAYS, criarPreferencias, lerPreferencias, permiteEstatisticas, providerId } from '../lib/privacy.js';
import { criarTracking } from '../lib/tracking.js';
import { lerPedidoLocal, ORDER_RETENTION_DAYS } from '../lib/order-storage.js';

const now = Date.parse('2026-11-01T12:00:00Z');
const id = 'G-TEST12345';
const provider = providerId(id);

test('estatísticas exigem escolha válida, específica e não vencida; sinais de privacidade prevalecem', () => {
  assert.equal(permiteEstatisticas(null, { id, now }), false);
  assert.equal(permiteEstatisticas(criarPreferencias(false, provider, now), { id, now }), false);
  const aceita = criarPreferencias(true, provider, now);
  assert.equal(permiteEstatisticas(aceita, { id, now }), true);
  assert.equal(permiteEstatisticas(aceita, { id, now, privacySignal: true }), false);
  assert.equal(permiteEstatisticas(aceita, { id: 'G-OUTRO123', now }), false);
  assert.equal(permiteEstatisticas(aceita, { id, now: now + CONSENT_DAYS * 86400000 }), false);
  assert.equal(lerPreferencias(JSON.stringify({ ...aceita, version: 0 }), provider, now), null);
  assert.equal(lerPreferencias('{inválido', provider, now), null);
  assert.equal(lerPreferencias(JSON.stringify({ ...aceita, updatedAt: now + 1 }), provider, now), null);
  assert.equal(criarPreferencias(true, 'nenhum', now).analytics, false);
});

function ambiente() {
  const scripts = [];
  const cookiesRemovidos = [];
  const win = { location: { origin: 'https://loja.example.com', hostname: 'loja.example.com', pathname: '/categoria', search: '?q=telefone-privado' } };
  const doc = {
    head: { appendChild(script) { scripts.push(script); } },
    createElement() { return { dataset: {}, remove() { this.removed = true; } }; },
    get cookie() { return '_ga=123; _ga_TEST12345=abc; cookie_necessario=1'; },
    set cookie(value) { cookiesRemovidos.push(value); },
  };
  return { win, doc, scripts, cookiesRemovidos };
}

test('rastreador não carrega antes de autorizar e para de registrar ao revogar', () => {
  const env = ambiente();
  const tracker = criarTracking({ ...env, id });
  tracker.pagina();
  assert.equal(env.scripts.length, 0);
  tracker.ativar(false);
  assert.equal(env.scripts.length, 0);
  tracker.ativar(true);
  assert.equal(env.scripts.length, 1);
  assert.equal(env.scripts[0].src, `https://www.googletagmanager.com/gtag/js?id=${id}`);
  tracker.pagina();
  const event = Array.from(env.win.dataLayer.at(-1));
  assert.equal(event[0], 'event');
  assert.equal(event[2].page_location, 'https://loja.example.com/categoria');
  assert.equal(event[2].page_referrer, '');
  assert.equal(JSON.stringify(env.win.dataLayer).includes('telefone-privado'), false);
  const quantidade = env.win.dataLayer.length;
  tracker.desativar();
  tracker.pagina();
  assert.equal(env.win.dataLayer.length, quantidade);
  assert.equal(env.win[`ga-disable-${id}`], true);
  assert.equal(env.scripts[0].removed, true);
  assert.ok(env.cookiesRemovidos.some((value) => value.startsWith('_ga=; Max-Age=0')));
  assert.equal(env.cookiesRemovidos.some((value) => value.startsWith('cookie_necessario=')), false);
});

test('sem ferramenta válida, nenhum script externo é inserido mesmo com escolha adulterada', () => {
  for (const invalido of ['', 'https://tracker.example.com', 'G-abc<script>']) {
    const env = ambiente();
    criarTracking({ ...env, id: invalido }).ativar(true);
    assert.equal(env.scripts.length, 0);
  }
});

test('pedido local expira em 30 dias, lida com corrupção e armazenamento bloqueado', () => {
  let raw = JSON.stringify({ data: new Date(now).toISOString(), nome: 'Pessoa de teste' });
  let removido = false;
  const storage = { getItem: () => raw, removeItem: () => { removido = true; raw = null; } };
  assert.equal(lerPedidoLocal(storage, now).nome, 'Pessoa de teste');
  assert.equal(lerPedidoLocal(storage, now + ORDER_RETENTION_DAYS * 86400000), null);
  assert.equal(removido, true);
  raw = '{inválido';
  assert.equal(lerPedidoLocal(storage, now), null);
  assert.equal(lerPedidoLocal({ getItem() { throw new Error('bloqueado'); }, removeItem() { throw new Error('bloqueado'); } }, now), null);
});

const luminancia = (hex) => {
  const rgb = hex.match(/[a-f\d]{2}/gi).map((canal) => parseInt(canal, 16) / 255).map((canal) => canal <= 0.04045 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
};
const contraste = (a, b) => (Math.max(luminancia(a), luminancia(b)) + 0.05) / (Math.min(luminancia(a), luminancia(b)) + 0.05);

test('textos e títulos mantêm os contrastes mínimos nos fundos utilizados', async () => {
  const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');
  for (const token of ['muted-2', 'accent-2', 'success', 'danger']) {
    const hex = css.match(new RegExp(`--${token}: (#[a-f0-9]{6})`))[1];
    for (const fundo of ['#ffffff', '#f5f5f5', '#f2f4f5']) assert.ok(contraste(hex, fundo) >= 4.5, `${token} sobre ${fundo}`);
  }
  assert.ok(contraste('#005fcc', '#ffffff') >= 3);
  for (const fundo of ['#ffffff', '#f5f5f5']) assert.ok(contraste('#000000', fundo) >= 4.5);
  const titulo = css.match(/--title-gold: (#[a-f0-9]{6})/)[1];
  for (const fundo of ['#ffffff', '#fffcf7', '#f3eee4', '#faf7f1']) assert.ok(contraste(titulo, fundo) >= 3, `Título grande sobre ${fundo}`);
});
