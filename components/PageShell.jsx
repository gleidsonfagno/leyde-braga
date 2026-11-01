import Footer from './Footer';
import Header from './Header';
import Navigation from './Navigation';
import Topbar from './Topbar';
import CatalogMessage from './CatalogMessage';

export default function PageShell({ children, categorias, marcas, erroCatalogo }) {
  return (
    <div data-loja="leyde">
      <a className="skip-link" href="#conteudo-principal">Ir para o conteúdo</a>
      <Topbar />
      <Header />
      <Navigation categorias={categorias} marcas={marcas} />
      {erroCatalogo ? <CatalogMessage erro>Não foi possível carregar as marcas e categorias. Tente novamente em instantes.</CatalogMessage> : null}
      <div id="conteudo-principal" tabIndex={-1}>{children}</div>
      <Footer categorias={categorias} />
    </div>
  );
}
