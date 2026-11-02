import CategoryTiles from '../components/CategoryTiles';
import Hero from '../components/Hero';
import Shelf from '../components/Shelf';
import Link from 'next/link';
import CatalogMessage from '../components/CatalogMessage';
import { catalogApi, obterTaxonomias } from '../lib/catalog-api';
import { apresentacaoCatalogo } from '../lib/catalog-presentation';

export default async function HomePage() {
  const [taxonomias, catalogo] = await Promise.all([
    obterTaxonomias(),
    catalogApi.produtos({ pageSize: 100 }).catch(() => null),
  ]);
  const apresentacao = apresentacaoCatalogo(taxonomias.categorias, catalogo?.produtos || []);
  const vitrine = catalogo?.produtos.slice(0, 12) || [];

  return (
    <main>
      <h1 className="sr-only">Catálogo LEYDE BRAGA — perfumaria e cosméticos</h1>
      <Hero produtos={apresentacao.destaques} />
      <CategoryTiles categorias={apresentacao.categorias} />
      {!catalogo ? <CatalogMessage erro /> : !catalogo.produtos.length ? <CatalogMessage /> : <>
        <Shelf titulo="Produtos em destaque" subtitulo="da nossa loja" produtos={vitrine.slice(0, 6)} />
        <Shelf titulo="Complete sua rotina" subtitulo="mais da loja" produtos={vitrine.slice(6)} />
        <div className="container" style={{ textAlign: 'center', paddingBottom: '30px' }}>
          <Link prefetch={false} className="btn" href="/categoria">Ver todos os produtos</Link>
        </div>
      </>}
    </main>
  );
}
