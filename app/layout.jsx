import './globals.css';
import PageShell from '../components/PageShell';
import Providers from './providers';
import { obterTaxonomias } from '../lib/catalog-api';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'LEYDE BRAGA — Perfumaria e Cosméticos em Altamira/PA',
  description:
    'Loja de perfumaria e cosméticos em Altamira — PA. Natura, Hinode, O Boticário e Mary Kay. Entregas locais e pedidos pelo WhatsApp.',
  icons: {
    icon: '/assets/images/favicon.svg',
  },
};

export default async function RootLayout({ children }) {
  const { categorias, marcas, erro } = await obterTaxonomias();
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          <PageShell categorias={categorias} marcas={marcas} erroCatalogo={erro}>{children}</PageShell>
        </Providers>
      </body>
    </html>
  );
}
