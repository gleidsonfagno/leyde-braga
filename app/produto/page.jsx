import { Suspense } from 'react';
import ProductDetailClient from '../../components/ProductDetailClient';
import RelatedProducts from '../../components/RelatedProducts';
import { catalogVitrineApi } from '../../lib/catalog-api';
import CatalogMessage from '../../components/CatalogMessage';

export default async function ProdutoPage({ searchParams }) {
  const params = await searchParams;
  let produto;
  try { produto = await catalogVitrineApi.produto(params?.p || ''); }
  catch { return <main><CatalogMessage erro /></main>; }
  return <ProductDetailClient produto={produto} key={produto?.slug || 'inexistente'}>
    {produto ? <Suspense fallback={null}><RelatedProducts produto={produto} /></Suspense> : null}
  </ProductDetailClient>;
}
