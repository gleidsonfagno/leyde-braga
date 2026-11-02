'use client';

import Link from 'next/link';
import { useState } from 'react';

const logos = {
  avon: 'avon.svg', eudora: 'eudora.png', hinode: 'hinode.svg',
  'mary-kay': 'marykay.svg', natura: 'natura.svg', 'o-boticario': 'boticario.svg',
  romanel: 'rommanel.png', rommanel: 'rommanel.png',
};

function BrandLogo({ marca }) {
  const [failed, setFailed] = useState(false);
  const logo = logos[marca.slug];
  return logo && !failed
    ? <img className="marca-logo" src={`/assets/images/marcas/${logo}`} alt={marca.nome} width="132" height="42" loading="lazy" decoding="async" onError={() => setFailed(true)} />
    : <span className="marca-fallback">{marca.nome}</span>;
}

export default function BrandsBar({ marcas }) {
  return <section className="marcas" aria-label="Marcas disponíveis">
    <div className="container" id="marcas-linha">
      {marcas.filter((marca) => Object.hasOwn(logos, marca.slug)).map((marca) => <Link prefetch={false} key={marca.id} href={`/categoria?marca=${encodeURIComponent(marca.slug)}`} aria-label={`Filtrar por marca: ${marca.nome}`}>
        <BrandLogo marca={marca} />
      </Link>)}
    </div>
  </section>;
}
