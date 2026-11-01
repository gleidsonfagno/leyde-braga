import Link from 'next/link';
import { categoriasPrincipais } from '../lib/catalog';

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
          {categoriasPrincipais(categorias).map((categoria) => (
            <Link prefetch={false}
              key={categoria.id}
              className={`cat-tile original-category tema-${categoria.tema}`}
              data-od-id={`categoria-${categoria.id}`}
              href={`/categoria?cat=${categoria.slug}`}
            >
              <span className="category-monogram" aria-hidden="true">LB</span>
              <span className="cat-nome">{categoria.nome}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
