import Link from 'next/link';

export default function BrandsBar({ marcas }) {
  return <section className="marcas" aria-label="Marcas disponíveis">
    <div className="container" id="marcas-linha">
      {marcas.map((marca) => <Link prefetch={false} key={marca.id} href={`/categoria?marca=${encodeURIComponent(marca.slug)}`} aria-label={`Filtrar por marca: ${marca.nome}`}>
        <span className="marca-fallback">{marca.nome}</span>
      </Link>)}
    </div>
  </section>;
}
