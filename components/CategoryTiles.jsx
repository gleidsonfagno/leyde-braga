import Link from 'next/link';
import ProductImage from './ProductImage';

export default function CategoryTiles({ categorias }) {
  if (!categorias.length) return null;
  return (
    <section className="secao" id="categorias" data-od-id="categorias">
      <div className="container">
        <div className="secao-titulo">
          <span className="script">nossas categorias</span>
          <h2>O que você procura</h2>
        </div>
        <div className="grid-cat" id="grid-categorias">
          {categorias.map((categoria) => (
            <Link prefetch={false}
              key={categoria.id}
              className="cat-tile product-category"
              data-od-id={`categoria-${categoria.id}`}
              href={`/categoria?cat=${categoria.categoriaDestino}`}
            >
              <span className="category-photo">{categoria.imagem ? <ProductImage loading="lazy" src={categoria.imagem} alt="" /> : <span className="category-no-photo">Foto ainda não disponível</span>}</span>
              <span className="cat-nome">{categoria.nome}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
