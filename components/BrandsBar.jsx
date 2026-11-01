'use client';

import Link from 'next/link';

const logoMarca = {
  natura: 'natura',
  hinode: 'hinode',
  'o boticário': 'boticario',
  'mary kay': 'marykay',
};

export default function BrandsBar({ marcas }) {
  const handleFallback = (event) => {
    const img = event.currentTarget;
    const nome = img.getAttribute('data-nome') || img.alt || '';
    const link = img.parentElement;
    if (!link) return;
    const fallback = document.createElement('span');
    fallback.className = 'marca-fallback';
    fallback.textContent = nome;
    link.replaceChild(fallback, img);
  };

  return (
    <section className="marcas" data-od-id="marcas">
      <div className="container" id="marcas-linha">
        {marcas.map((marca) => {
          const logo = logoMarca[marca.nome.toLowerCase()];
          return (
            <Link prefetch={false}
              key={marca.id}
              href={`/categoria?marca=${encodeURIComponent(marca.slug)}`}
              data-od-id={`marca-${marca.slug}`}
              aria-label={`Filtrar por marca: ${marca.nome}`}
              title={marca.nome}
            >
              {logo ? <img
                className="marca-logo"
                src={`/assets/images/marcas/${logo}.svg`}
                alt={marca.nome}
                data-nome={marca.nome}
                loading="lazy"
                onError={handleFallback}
              /> : <span className="marca-fallback">{marca.nome}</span>}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
