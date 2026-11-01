import { cache } from 'react';
import { adaptarProduto, adaptarTaxonomia, slugValido } from './catalog.js';

export class CatalogApiError extends Error {
  constructor() { super('Não foi possível carregar o catálogo. Tente novamente em instantes.'); }
}

export function criarClienteCatalogo({
  baseUrl = process.env.CATALOG_API_URL || 'https://leyde-braga-admin.vercel.app/api/v1',
  fetchImpl = fetch,
  timeout = 15000,
} = {}) {
  const base = new URL(baseUrl.replace(/\/$/, '') + '/');
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) {
    throw new Error('CATALOG_API_URL inválida.');
  }

  async function consultar(caminho, query, permitir404 = false) {
    const url = new URL(caminho, base);
    for (const [chave, valor] of Object.entries(query || {})) {
      if (valor !== '' && valor != null) url.searchParams.set(chave, String(valor));
    }
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      let response;
      try {
        response = await fetchImpl(url, {
          method: 'GET', headers: { Accept: 'application/json' }, credentials: 'omit',
          cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(timeout),
        });
      } catch {
        if (tentativa === 0) continue;
        throw new CatalogApiError();
      }
      if (response.status === 404 && permitir404) return null;
      if (tentativa === 0 && response.status >= 500) continue;
      if (!response.ok) throw new CatalogApiError();
      try { return await response.json(); } catch { throw new CatalogApiError(); }
    }
    throw new CatalogApiError();
  }

  return {
    async produtos({ page = 1, pageSize = 20, q = '', marca = '', categoria = '' } = {}) {
      const result = await consultar('products', { page, pageSize, q, brand: marca, category: categoria });
      try {
        const { pagination } = result;
        if (!Array.isArray(result.data) || !Number.isSafeInteger(pagination?.total) || pagination.total < 0
          || pagination.page !== page || pagination.pageSize !== pageSize) throw new Error();
        return { produtos: result.data.map(adaptarProduto), paginacao: { page, pageSize, total: pagination.total } };
      } catch { throw new CatalogApiError(); }
    },
    async produto(slug) {
      if (!slugValido(slug)) return null;
      const result = await consultar(`products/${encodeURIComponent(slug)}`, null, true);
      if (!result) return null;
      try { return adaptarProduto(result.data); } catch { throw new CatalogApiError(); }
    },
    async taxonomias() {
      const [marcas, categorias] = await Promise.all([consultar('brands'), consultar('categories')]);
      try {
        return { marcas: marcas.data.map(adaptarTaxonomia), categorias: categorias.data.map(adaptarTaxonomia) };
      } catch { throw new CatalogApiError(); }
    },
  };
}

export const catalogApi = criarClienteCatalogo();
export const obterTaxonomias = cache(async () => {
  try { return { ...await catalogApi.taxonomias(), erro: false }; }
  catch { return { marcas: [], categorias: [], erro: true }; }
});
