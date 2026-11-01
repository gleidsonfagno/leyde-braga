import { slugValido } from './catalog.js';

export function itensDoCarrinho(cart, produtos) {
  return cart
    .map((item) => {
      const produto = produtos.find((produto) => produto.slug === item.slug);
      return produto && Number.isSafeInteger(item.qtd) && item.qtd > 0 ? { produto, qtd: item.qtd } : null;
    })
    .filter(Boolean);
}

export function normalizarCarrinho(cart) {
  if (!Array.isArray(cart)) return [];
  const itens = new Map();
  for (const item of cart) {
    if (!item || !slugValido(item.slug) || !Number.isSafeInteger(item.qtd) || item.qtd <= 0) continue;
    if (!itens.has(item.slug) && itens.size >= 100) continue;
    itens.set(item.slug, Math.min(99, (itens.get(item.slug) || 0) + item.qtd));
  }
  return Array.from(itens, ([slug, qtd]) => ({ slug, qtd }));
}

export async function carregarProdutosCarrinho(cart, signal) {
  const params = new URLSearchParams();
  for (const item of normalizarCarrinho(cart)) params.append('slug', item.slug);
  if (!params.size) return [];
  const timeout = AbortSignal.timeout(20000);
  const response = await fetch(`/api/catalog?${params}`, { cache: 'no-store', credentials: 'omit', signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  if (!response.ok) throw new Error('Não foi possível atualizar os produtos do carrinho. Tente novamente.');
  const result = await response.json();
  if (!Array.isArray(result.data)) throw new Error('Resposta de catálogo inválida.');
  return result.data;
}
