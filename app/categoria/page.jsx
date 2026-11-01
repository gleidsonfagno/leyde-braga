import Link from 'next/link';
import ProductCard from '../../components/ProductCard';
import { catalogApi, obterTaxonomias } from '../../lib/catalog-api';
import { categoriaHref as buildHref, filtrosDoCatalogo } from '../../lib/catalog';
import CatalogMessage from '../../components/CatalogMessage';

function Chip({ href, label, active }) {
  return (
    <Link prefetch={false} className={`chip${active ? ' ativo' : ''}`} href={href}>
      {label}
    </Link>
  );
}

export default async function CategoriaPage({ searchParams }) {
  const taxonomias = await obterTaxonomias();
  const filtros = filtrosDoCatalogo(await searchParams || {}, taxonomias);
  const { categoria: catAtual, marca: marcaAtual, q, page } = filtros;
  let catalogo;
  try { catalogo = await catalogApi.produtos(filtros); } catch { /* Falha não é catálogo vazio. */ }
  const lista = catalogo?.produtos || [];
  const total = catalogo?.paginacao.total || 0;
  const paginas = Math.max(1, Math.ceil(total / 20));

  const titulo = catAtual
    ? taxonomias.categorias.find((categoria) => categoria.slug === catAtual)?.nome || 'Categorias'
    : marcaAtual
      ? taxonomias.marcas.find((marca) => marca.slug === marcaAtual)?.nome || marcaAtual
      : q
        ? `Resultados para "${q}"`
        : 'Categorias';

  return (
    <main className="container">
      <div className="breadcrumb">
        <Link prefetch={false} href="/">Início</Link> / <span id="crumb-atual">{titulo}</span>
      </div>

      <h1 className="pagina-titulo" id="pagina-titulo">
        {titulo}
      </h1>

      <div className="filtros" id="filtros-cat">
        <Chip href={buildHref('', marcaAtual, q)} label="Todas" active={!catAtual && !marcaAtual && !q} />
        {taxonomias.categorias.map((categoria) => (
          <Chip
            key={categoria.id}
            href={buildHref(categoria.slug, marcaAtual, q)}
            label={categoria.nome}
            active={catAtual === categoria.slug}
          />
        ))}
      </div>

      <div className="filtros" id="filtros-marca">
        <Chip href={buildHref(catAtual, '', q)} label="Todas as marcas" active={!marcaAtual} />
        {taxonomias.marcas.map((marca) => (
          <Chip
            key={marca.id}
            href={buildHref(catAtual, marca.slug, q)}
            label={marca.nome}
            active={marcaAtual === marca.slug}
          />
        ))}
      </div>

      <div id="contador" style={{ fontSize: '13px', color: 'var(--muted-2)', marginBottom: '14px' }}>
        {catalogo ? `${total} ${total === 1 ? 'produto' : 'produtos'}` : 'Catálogo temporariamente indisponível'}
      </div>

      {!catalogo ? <CatalogMessage erro /> : lista.length > 0 ? (
        <div className="grid-prod" id="grid-produtos">
          {lista.map((produto) => (
            <ProductCard key={produto.slug} produto={produto} />
          ))}
        </div>
      ) : (
        <div id="vazio" style={{ display: 'block', textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
          Nenhum produto encontrado para este filtro.
        </div>
      )}
      {catalogo && total > 20 ? <nav className="filtros" aria-label="Paginação de produtos" style={{ marginTop: '24px', alignItems: 'center' }}>
        {page > 1 ? <Link prefetch={false} className="btn" href={buildHref(catAtual, marcaAtual, q, page - 1)}>Anterior</Link> : null}
        <span>Página {page} de {paginas}</span>
        {page < paginas ? <Link prefetch={false} className="btn" href={buildHref(catAtual, marcaAtual, q, page + 1)}>Próxima</Link> : null}
      </nav> : null}
    </main>
  );
}
