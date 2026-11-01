import ProductDetailClient from '../../components/ProductDetailClient';
import { catalogApi } from '../../lib/catalog-api';
import CatalogMessage from '../../components/CatalogMessage';

export default async function ProdutoPage({ searchParams }) {
  const params = await searchParams;
  let produto;
  try { produto = await catalogApi.produto(params?.p || ''); }
  catch { return <main><CatalogMessage erro /></main>; }
  return <ProductDetailClient produto={produto} key={produto?.slug || 'inexistente'} />;
}
