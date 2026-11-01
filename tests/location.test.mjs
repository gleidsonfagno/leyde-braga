import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarLocalizacao, mapaLocalizacao, solicitarLocalizacao } from '../lib/location.js';
import { montarMensagemPedido } from '../lib/order.js';

const position = { coords: { latitude: 0, longitude: 0, accuracy: 12.2 }, timestamp: Date.UTC(2026, 10, 1) };

test('captura somente os dados necessários, aceita zero e produz um link de mapa fixo seguro', () => {
  const ponto = criarLocalizacao(position);
  assert.deepEqual(ponto, { latitude: 0, longitude: 0, precisaoMetros: 13, capturadaEm: '2026-11-01T00:00:00.000Z' });
  const url = new URL(mapaLocalizacao(ponto));
  assert.equal(url.origin, 'https://www.google.com');
  assert.equal(url.searchParams.get('api'), '1');
  assert.equal(url.searchParams.get('query'), '0,0');
  for (const coords of [{ latitude: NaN, longitude: 0 }, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: 181 }, { latitude: '0', longitude: 0 }]) {
    assert.equal(mapaLocalizacao(coords), null);
    assert.throws(() => criarLocalizacao({ ...position, coords: { ...coords, accuracy: 10 } }));
  }
});

test('solicitação usa posição nova, precisão alta e timeout; ambiente inseguro não consulta GPS', async () => {
  let chamadas = 0;
  const geolocation = { getCurrentPosition(success, error, options) {
    chamadas++;
    assert.deepEqual(options, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
    success(position);
  } };
  assert.equal((await solicitarLocalizacao({ geolocation, secureContext: true })).latitude, 0);
  await assert.rejects(solicitarLocalizacao({ geolocation, secureContext: false }), /conexão segura/);
  assert.equal(chamadas, 1);
  await assert.rejects(solicitarLocalizacao({ secureContext: true }), /não oferece localização/);
});

test('permissão negada, indisponibilidade e timeout preservam a opção de digitar endereço', async () => {
  for (const code of [1, 2, 3, 99]) {
    await assert.rejects(solicitarLocalizacao({ secureContext: true, geolocation: { getCurrentPosition(success, error) { error({ code, message: 'detalhe interno' }); } } }), (error) => /endereço/.test(error.message) && !error.message.includes('detalhe interno'));
  }
});

test('mensagem inclui mapa somente com ponto válido, sem alegar localização contínua', () => {
  const pedido = { numero: 1, itens: [], endereco: { localizacao: criarLocalizacao(position) } };
  const mensagem = montarMensagemPedido(pedido);
  assert.match(mensagem, /Localização para entrega \(ponto capturado\): https:\/\/www.google.com/);
  assert.equal(mensagem.includes('tempo real'), false);
  assert.equal(montarMensagemPedido({ ...pedido, endereco: {} }).includes('maps'), false);
});
