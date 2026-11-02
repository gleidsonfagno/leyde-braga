import { catalogVitrineApi } from './catalog-api.js';

export async function obterProdutosRelacionados(produto, cliente = catalogVitrineApi) {
  if (!produto?.categoria) return [];
  try {
    const catalogo = await cliente.produtos({ categoria: produto.categoria, pageSize: 5 });
    const vistos = new Set([produto.slug]);
    return catalogo.produtos.filter((item) => {
      if (item.categoria !== produto.categoria || vistos.has(item.slug)) return false;
      vistos.add(item.slug);
      return true;
    }).slice(0, 4);
  } catch {
    // Recomendações são opcionais e não impedem a leitura do produto principal.
    return [];
  }
}
