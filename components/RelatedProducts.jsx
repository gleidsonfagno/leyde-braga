import ProductCard from './ProductCard';
import { obterProdutosRelacionados } from '../lib/related-products';

export default async function RelatedProducts({ produto }) {
  const produtos = await obterProdutosRelacionados(produto);
  if (!produtos.length) return null;

  return (
    <section className="secao produtos-relacionados" aria-labelledby="produtos-relacionados-titulo">
      <div className="secao-titulo">
        <span className="script">você também pode gostar</span>
        <h2 id="produtos-relacionados-titulo">Produtos relacionados</h2>
      </div>
      <div className="grid-prod">
        {produtos.map((item) => <ProductCard key={item.slug} produto={item} />)}
      </div>
    </section>
  );
}
