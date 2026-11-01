import Footer from './Footer';
import Header from './Header';
import Navigation from './Navigation';
import Topbar from './Topbar';
import CatalogMessage from './CatalogMessage';

export default function PageShell({ children, categorias, marcas, erroCatalogo }) {
  return (
    <div data-loja="leyde">
      <Topbar />
      <Header />
      <Navigation categorias={categorias} marcas={marcas} />
      {erroCatalogo ? <CatalogMessage erro>Não foi possível carregar as marcas e categorias. Tente novamente em instantes.</CatalogMessage> : null}
      {children}
      <Footer categorias={categorias} />
    </div>
  );
}
