import { test } from 'node:test';
import assert from 'node:assert/strict';
import { obterProdutosRelacionados } from '../lib/related-products.js';

const atual = { slug: 'perfume-atual', categoria: 'perfumes' };
const perfume = (slug) => ({ slug, categoria: 'perfumes' });

test('relacionados consultam a categoria atual, excluem o próprio produto e limitam a quatro', async () => {
  const cliente = { produtos: async (filtros) => {
    assert.deepEqual(filtros, { categoria: 'perfumes', pageSize: 5 });
    return { produtos: [atual, ...['a', 'b', 'c', 'd', 'e'].map(perfume)] };
  } };
  assert.deepEqual((await obterProdutosRelacionados(atual, cliente)).map((item) => item.slug), ['a', 'b', 'c', 'd']);
});

test('relacionados não repetem itens nem incluem produtos de outra categoria', async () => {
  const cliente = { produtos: async () => ({ produtos: [perfume('a'), perfume('a'), { slug: 'creme', categoria: 'corpo' }, perfume('b')] }) };
  assert.deepEqual((await obterProdutosRelacionados(atual, cliente)).map((item) => item.slug), ['a', 'b']);
});

test('ausência de categoria, alternativas ou falha da API não impede a página principal', async () => {
  let chamadas = 0;
  const falha = { produtos: async () => { chamadas++; throw new Error('Indisponível'); } };
  assert.deepEqual(await obterProdutosRelacionados(null, falha), []);
  assert.deepEqual(await obterProdutosRelacionados({ slug: 'sem-categoria' }, falha), []);
  assert.equal(chamadas, 0);
  assert.deepEqual(await obterProdutosRelacionados(atual, falha), []);
  assert.deepEqual(await obterProdutosRelacionados(atual, { produtos: async () => ({ produtos: [atual] }) }), []);
});
