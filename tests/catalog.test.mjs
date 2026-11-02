import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adaptarProduto, filtrosDoCatalogo, categoriaHref } from '../lib/catalog.js';
import { criarClienteCatalogo, CatalogApiError } from '../lib/catalog-api.js';
import { normalizarCarrinho, itensDoCarrinho } from '../lib/cart.js';
import { somarValores, multiplicarPreco, formatarBRL, subtotalCarrinho } from '../lib/money.js';
import { montarMensagemPedido } from '../lib/order.js';

const produto = {
  id: 'produto-real', code: 'LB-1', slug: 'produto-real', name: 'Produto real', description: 'Descrição atual', price: '0.10',
  brand: { id: 'marca', name: 'O Boticário', slug: 'o-boticario', active: true },
  category: { id: 'categoria', name: 'Perfumes', slug: 'perfumes', active: true },
  images: [
    { id: 'b', url: 'https://example.com/segunda.jpg', alt: 'Segunda', order: 2, productId: 'privado' },
    { id: 'a', url: 'https://example.com/primeira.jpg', alt: 'Primeira', order: 0 },
    { id: 'x', url: 'javascript:alert(1)', alt: '', order: 0 },
  ],
  cost: '0.01', stock: 999, active: true, createdAt: 'privado', passwordHash: 'segredo',
};

test('campos privados são descartados, imagens seguras ordenadas e preço decimal preservado', () => {
  const mapped = adaptarProduto(produto);
  const json = JSON.stringify(mapped);
  for (const field of ['cost', 'stock', 'active', 'createdAt', 'passwordHash', 'productId']) assert.equal(json.includes(`"${field}"`), false);
  assert.equal(mapped.preco, '0.10');
  assert.equal(mapped.imagem, 'https://example.com/primeira.jpg');
  assert.equal(mapped.imagens.length, 2);
  assert.equal(mapped.disponibilidade, 'sob-consulta');
  assert.equal(adaptarProduto({ ...produto, images: [] }).imagem, '/assets/images/product-placeholder.svg');
  assert.throws(() => adaptarProduto({ ...produto, price: 0.1 }));
});

test('transporta paginação/busca/filtros reais sem cookies, cache ou campos extras', async () => {
  const client = criarClienteCatalogo({ baseUrl: 'https://api.example.com/api/v1', fetchImpl: async (url, init) => {
    assert.equal(url.pathname, '/api/v1/products');
    assert.equal(url.searchParams.get('q'), 'colônia & creme');
    assert.equal(url.searchParams.get('brand'), 'o-boticario');
    assert.equal(url.searchParams.get('category'), 'perfumes');
    assert.equal(url.searchParams.get('page'), '2');
    assert.equal(init.credentials, 'omit');
    assert.equal(init.cache, 'no-store');
    assert.deepEqual(init.headers, { Accept: 'application/json' });
    return Response.json({ data: [produto], pagination: { page: 2, pageSize: 20, total: 21 } });
  } });
  const result = await client.produtos({ q: 'colônia & creme', marca: 'o-boticario', categoria: 'perfumes', page: 2 });
  assert.equal(result.paginacao.total, 21);
  assert.equal(result.produtos[0].nome, 'Produto real');
});

test('404 de produto é diferente de indisponibilidade e não há fallback fictício', async () => {
  let calls = 0;
  const missing = criarClienteCatalogo({ fetchImpl: async () => { calls++; return new Response('', { status: 404 }); } });
  assert.equal(await missing.produto('inexistente'), null);
  assert.equal(await missing.produto('../admin/products'), null);
  assert.equal(calls, 1);
  for (const fetchImpl of [async () => new Response('SQL e credenciais internos', { status: 500 }), async () => { throw new Error('segredo'); }, async () => Response.json({ data: produto })]) {
    const client = criarClienteCatalogo({ fetchImpl });
    await assert.rejects(client.produtos(), (error) => error instanceof CatalogApiError && !/SQL|segredo/.test(error.message));
  }
});

test('listas de marcas/categorias vêm da API e rejeitam respostas inválidas', async () => {
  const client = criarClienteCatalogo({ fetchImpl: async (url) => Response.json({ data: [url.pathname.endsWith('brands') ? produto.brand : produto.category] }) });
  const taxonomias = await client.taxonomias();
  assert.equal(taxonomias.marcas[0].slug, 'o-boticario');
  assert.equal(taxonomias.categorias[0].slug, 'perfumes');
  assert.equal('active' in taxonomias.marcas[0], false);
});

test('cliente de conferência mantém produtos sem cache; taxonomias têm cache próprio', async () => {
  const consultas = [];
  const client = criarClienteCatalogo({ fetchImpl: async (url, init) => {
    consultas.push({ caminho: url.pathname, init });
    if (url.pathname.endsWith('brands')) return Response.json({ data: [produto.brand] });
    if (url.pathname.endsWith('categories')) return Response.json({ data: [produto.category] });
    if (url.pathname.endsWith('/produto-real')) return Response.json({ data: produto });
    return Response.json({ data: [produto], pagination: { page: 1, pageSize: 20, total: 1 } });
  } });
  await client.taxonomias();
  await client.produtos();
  await client.produto('produto-real');
  assert.equal(consultas.length, 4);
  for (const { caminho, init } of consultas) {
    assert.equal(init.credentials, 'omit');
    if (caminho.endsWith('brands') || caminho.endsWith('categories')) {
      assert.equal(init.cache, 'force-cache');
      assert.deepEqual(init.next, { revalidate: 60 });
    } else {
      assert.equal(init.cache, 'no-store');
      assert.equal(init.next, undefined);
    }
  }
});

test('cliente de exibição usa 15 segundos e mantém pesquisas sem cache', async () => {
  const consultas = [];
  const client = criarClienteCatalogo({ cachePublico: 15, fetchImpl: async (url, init) => {
    consultas.push({ url, init });
    return url.pathname.endsWith('/produto-real') ? Response.json({ data: produto }) : Response.json({ data: [produto], pagination: { page: 1, pageSize: 20, total: 1 } });
  } });
  await client.produtos({ categoria: 'perfumes' });
  await client.produto('produto-real');
  await client.produtos({ q: 'busca digitada' });
  for (const consulta of consultas.slice(0, 2)) {
    assert.equal(consulta.init.cache, 'force-cache');
    assert.deepEqual(consulta.init.next, { revalidate: 15 });
    assert.equal(consulta.init.credentials, 'omit');
  }
  assert.equal(consultas[2].init.cache, 'no-store');
  assert.equal(consultas[2].init.next, undefined);
});

test('conferência de produto lê uma alteração de preço sem reutilizar a exibição', async () => {
  let precoAtual = '10.00';
  let leituras = 0;
  const client = criarClienteCatalogo({ fetchImpl: async (_, init) => {
    assert.equal(init.cache, 'no-store');
    leituras++;
    return Response.json({ data: { ...produto, price: precoAtual } });
  } });
  assert.equal((await client.produto('produto-real')).preco, '10.00');
  precoAtual = '12.50';
  assert.equal((await client.produto('produto-real')).preco, '12.50');
  assert.equal(leituras, 2);
});

test('uma falha transitória de leitura é repetida uma vez, sem repetir 404 ou entradas inválidas', async () => {
  let tentativas = 0;
  const client = criarClienteCatalogo({ fetchImpl: async () => {
    tentativas++;
    return tentativas === 1 ? new Response('', { status: 503 }) : Response.json({ data: produto });
  } });
  assert.equal((await client.produto('produto-real')).slug, 'produto-real');
  assert.equal(tentativas, 2);
  let erros = 0;
  const falha = criarClienteCatalogo({ fetchImpl: async () => { erros++; return new Response('', { status: 500 }); } });
  await assert.rejects(falha.produto('produto-real'), CatalogApiError);
  assert.equal(erros, 2);
});

test('links antigos resolvem para slugs reais, paginação preserva filtros e busca é limitada', () => {
  const taxonomias = { marcas: [{ id: 'm', nome: 'O Boticário', slug: 'o-boticario' }], categorias: [{ id: 'c', nome: 'Perfumes', slug: 'perfumes' }] };
  assert.deepEqual(filtrosDoCatalogo({ cat: 'perfumaria', marca: 'O Boticário', q: ' Malbec ', page: '2' }, taxonomias), { categoria: 'perfumes', marca: 'o-boticario', q: 'Malbec', page: 2 });
  const href = new URL(categoriaHref('perfumes', 'o-boticario', 'a & b', 2), 'https://loja.example.com');
  assert.equal(href.searchParams.get('q'), 'a & b');
  assert.equal(href.searchParams.get('page'), '2');
  const filtros = filtrosDoCatalogo({ page: '-1', q: 'x'.repeat(300), cat: ['perfumes'] }, taxonomias);
  assert.equal(filtros.page, 1);
  assert.equal(filtros.q.length, 200);
  assert.equal(filtros.categoria, '');
});

test('carrinho antigo ou adulterado é normalizado e produtos removidos não entram no pedido', () => {
  const input = [{ slug: 'produto-real', qtd: 2 }, { slug: 'produto-real', qtd: 3 }, { slug: '../admin', qtd: 1 }, { slug: 'inexistente', qtd: 1 }, { slug: 'fracionado', qtd: 1.5 }, null];
  const original = JSON.stringify(input);
  const cart = normalizarCarrinho(input);
  assert.deepEqual(cart, [{ slug: 'produto-real', qtd: 5 }, { slug: 'inexistente', qtd: 1 }]);
  assert.equal(JSON.stringify(input), original);
  assert.equal(itensDoCarrinho(cart, [adaptarProduto(produto)]).length, 1);
  assert.deepEqual(itensDoCarrinho(cart, []), []);
  assert.equal(normalizarCarrinho([{ slug: 'produto-real', qtd: 100000 }])[0].qtd, 99);
});

test('valores monetários, subtotal e mensagem WhatsApp não fazem contas em ponto flutuante', () => {
  assert.equal(somarValores('0.10', '0.20'), '0.30');
  assert.equal(multiplicarPreco('19.99', 3), '59.97');
  assert.equal(somarValores('9999999999.99', '0.01'), '10000000000.00');
  assert.equal(formatarBRL('1234.56'), 'R$\u00a01.234,56');
  assert.equal(subtotalCarrinho([{ produto: adaptarProduto(produto), qtd: 3 }]), '0.30');
  assert.throws(() => multiplicarPreco('1.00', 1.5));
  const mensagem = montarMensagemPedido({ numero: 1, itens: [{ nome: 'Produto real', preco: '0.10', qtd: 3 }], subtotal: '0.30', entrega: null, total: null });
  assert.match(mensagem, /0,30/);
  assert.match(mensagem, /Entrega: a combinar/);
  assert.match(mensagem, /Total: R\$\s0,30 \+ frete a confirmar/);
});
