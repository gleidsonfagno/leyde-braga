import assert from 'node:assert/strict';

const storefront = process.env.STOREFRONT_URL || 'http://127.0.0.1:3137';
const api = process.env.CATALOG_API_URL || 'https://leyde-braga-admin.vercel.app/api/v1';
const get = async (url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, url);
  return response;
};
const list = await (await get(`${api}/products?pageSize=20`)).json();
const brands = await (await get(`${api}/brands`)).json();
const categories = await (await get(`${api}/categories`)).json();
const html = await (await get(`${storefront}/categoria`)).text();
assert.ok(html.includes(`${list.pagination.total} produtos`));
assert.equal((html.match(/<article\b/g) || []).length, list.data.length);
for (const product of list.data) assert.ok(html.includes(product.slug), product.slug);
for (const product of list.data) assert.equal(typeof product.inStock, 'boolean', 'API pública fornece disponibilidade');
assert.equal(html.includes('Consulte disponibilidade'), false);
for (const brand of brands.data) assert.ok(html.includes(`marca=${brand.slug}`), brand.slug);
for (const category of categories.data) assert.ok(html.includes(`cat=${category.slug}`), category.slug);

if (list.pagination.total > 20) {
  const page = await (await get(`${api}/products?pageSize=20&page=2`)).json();
  const second = await (await get(`${storefront}/categoria?page=2`)).text();
  assert.equal((second.match(/<article\b/g) || []).length, page.data.length);
  for (const product of page.data) assert.ok(second.includes(product.slug));
}

if (list.data.length) {
  const product = list.data[0];
  const detail = await (await get(`${storefront}/produto?p=${product.slug}`)).text();
  assert.ok(detail.includes(product.name));
  assert.equal(detail.includes('class="p-parcela"'), false, 'Detalhe sem bloco de parcelamento');
  assert.ok(detail.includes(product.inStock ? 'Em estoque' : 'Produto esgotado'));
  if (product.inStock) {
    assert.ok(detail.includes('Quantidade desejada'));
    assert.ok(detail.includes('aria-describedby="quantidade-ajuda"'));
  } else {
    assert.equal(detail.includes('id="btn-comprar"'), false);
  }
  const filteredUrl = new URL('/categoria', storefront);
  filteredUrl.searchParams.set('q', product.code);
  filteredUrl.searchParams.set('marca', product.brand.slug);
  filteredUrl.searchParams.set('cat', product.category.slug);
  const filtered = await (await get(filteredUrl)).text();
  assert.ok(filtered.includes(product.slug));
  const response = await get(`${storefront}/api/catalog?slug=${product.slug}&slug=produto-inexistente-qa&slug=${product.slug}`);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const cart = await response.json();
  assert.equal(cart.data.length, 1);
  assert.equal(cart.data[0].preco, product.price);
  assert.equal(cart.data[0].disponibilidade, product.inStock ? 'disponivel' : 'indisponivel');
  for (const field of ['cost', 'stock', 'active', 'passwordHash', 'createdAt']) {
    assert.equal(JSON.stringify(cart).includes(`"${field}":`), false);
  }
}

const candidatoRelacionado = list.data.find((item) => list.data.some((outro) => outro.slug !== item.slug && outro.category.slug === item.category.slug));
if (candidatoRelacionado) {
  const categoria = candidatoRelacionado.category.slug;
  const alternativas = await (await get(`${api}/products?category=${encodeURIComponent(categoria)}&pageSize=5`)).json();
  const relacionados = alternativas.data.filter((item) => item.slug !== candidatoRelacionado.slug).slice(0, 4);
  const detalhe = await (await get(`${storefront}/produto?p=${candidatoRelacionado.slug}`)).text();
  assert.ok(relacionados.length > 0);
  assert.ok(detalhe.includes('Produtos relacionados'));
  assert.equal((detalhe.match(/<article\b/g) || []).length, relacionados.length);
  assert.equal(detalhe.includes(`data-od-id="card-${candidatoRelacionado.slug}"`), false);
  for (const item of relacionados) {
    assert.equal(item.category.slug, categoria);
    assert.ok(detalhe.includes(`data-od-id="card-${item.slug}"`));
  }
  assert.equal(detalhe.includes('class="p-parcela"'), false);
}

const empty = await (await get(`${storefront}/categoria?q=produto-inexistente-qa-999999`)).text();
assert.ok(empty.includes('Nenhum produto encontrado'));
const missing = await (await get(`${storefront}/produto?p=produto-inexistente-qa-999999`)).text();
assert.ok(missing.includes('Produto não encontrado'));
assert.equal((await fetch(`${storefront}/api/catalog?slug=../admin/products`)).status, 400);
assert.equal((await fetch(`${storefront}/api/catalog`, { method: 'POST' })).status, 405);

console.log(JSON.stringify({ result: 'passed', storefront, products: list.pagination.total, brands: brands.data.length, categories: categories.data.length, checks: ['catalogo-real', 'paginacao', 'busca-e-filtros', 'detalhe-sem-parcelamento', 'disponibilidade-real', ...(candidatoRelacionado ? ['produtos-relacionados'] : []), 'carrinho', 'campos-privados', 'produto-inexistente', 'busca-vazia', 'entrada-invalida', 'somente-leitura'] }, null, 2));
