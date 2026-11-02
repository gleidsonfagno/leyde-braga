'use client';

import Link from './CatalogLink';
import { useCart } from './CartContext';
import { useToast } from './ToastContext';
import { formatarBRL } from '../lib/money';
import { estoqueLabel } from '../lib/catalog';
import ProductImage from './ProductImage';

export default function ProductCard({ produto }) {
  const { adicionar } = useCart();
  const { showToast } = useToast();
  const estoque = estoqueLabel(produto);
  const indisponivel = produto.disponibilidade === 'indisponivel';
  const preco = formatarBRL(produto.preco);

  const handleAdd = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (adicionar(produto.slug, 1)) {
      showToast('Adicionado ao carrinho');
    }
  };

  return (
    <article className="card" data-od-id={`card-${produto.slug}`}>
      <Link prefetch={false} className="card-img" href={`/produto?p=${produto.slug}`}>
        <ProductImage loading="lazy" src={produto.imagem} alt={produto.imagens[0]?.alt || produto.nome} />
      </Link>
      <span className={`est ${estoque.cls}`}>{estoque.txt}</span>
      <h3>
        <Link prefetch={false} href={`/produto?p=${produto.slug}`}>{produto.nome}</Link>
      </h3>
      <span className="marca">{produto.marca}</span>
      <div className="preco">
        {preco}
      </div>
      <div className="btns">
        {indisponivel ? (
          <button className="btn block" disabled>
            Esgotado
          </button>
        ) : (
          <button className="btn solid block" data-add-carrinho={produto.slug} data-od-id={`add-${produto.slug}`} onClick={handleAdd}>
            Adicionar
          </button>
        )}
      </div>
    </article>
  );
}
