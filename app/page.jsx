import BrandsBar from '../components/BrandsBar';
import CategoryTiles from '../components/CategoryTiles';
import Hero from '../components/Hero';
import Shelf from '../components/Shelf';
import Link from 'next/link';
import CatalogMessage from '../components/CatalogMessage';
import { catalogApi, obterTaxonomias } from '../lib/catalog-api';

export default async function HomePage() {
  const taxonomias = await obterTaxonomias();
  let catalogo;
  try { catalogo = await catalogApi.produtos({ pageSize: 12 }); } catch { /* Estado de erro visível abaixo. */ }

  return (
    <main>
      <Hero categorias={taxonomias.categorias} />
      <CategoryTiles categorias={taxonomias.categorias} />
      {!catalogo ? <CatalogMessage erro /> : !catalogo.produtos.length ? <CatalogMessage /> : <>
        <Shelf titulo="Produtos em destaque" subtitulo="da nossa loja" produtos={catalogo.produtos.slice(0, 6)} />
        <Shelf titulo="Complete sua rotina" subtitulo="mais da loja" produtos={catalogo.produtos.slice(6)} />
        <div className="container" style={{ textAlign: 'center', paddingBottom: '30px' }}>
          <Link prefetch={false} className="btn" href="/categoria">Ver todos os produtos</Link>
        </div>
      </>}
      <BrandsBar marcas={taxonomias.marcas} />
    </main>
  );
}
