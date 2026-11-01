import { catalogApi } from '../../../lib/catalog-api';
import { slugValido } from '../../../lib/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const slugs = [...new Set(new URL(request.url).searchParams.getAll('slug'))];
  const headers = { 'Cache-Control': 'no-store' };
  if (!slugs.length || slugs.length > 100 || slugs.some((slug) => !slugValido(slug))) {
    return Response.json({ error: 'Itens de carrinho inválidos.' }, { status: 400, headers });
  }
  try {
    // Apenas consultas públicas, sem cookies ou acesso a rotas administrativas.
    const produtos = [];
    for (let inicio = 0; inicio < slugs.length; inicio += 5) {
      produtos.push(...await Promise.all(slugs.slice(inicio, inicio + 5).map((slug) => catalogApi.produto(slug))));
    }
    return Response.json({ data: produtos.filter(Boolean) }, { headers });
  } catch {
    return Response.json({ error: 'Não foi possível atualizar o catálogo.' }, { status: 502, headers });
  }
}
