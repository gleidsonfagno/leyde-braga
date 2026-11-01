import Link from 'next/link';
import { LEYDE, whatsappLink } from '../lib/config';
import { categoriasPrincipais } from '../lib/catalog';
import { policyLinks } from '../lib/policies';
import { PrivacySettingsButton } from './PrivacyControls';

export default function Footer({ categorias }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-foot">
      <div className="container">
        <div>
          <div className="foot-logo">{LEYDE.nomeLoja}</div>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.7)', maxWidth: '260px' }}>
            Cosméticos e perfumaria de marcas selecionadas. Entregas em {LEYDE.cidade} — {LEYDE.uf}.
          </p>
          <p style={{ fontSize: '13px', marginTop: '10px' }}>WhatsApp: {LEYDE.whatsappExibicao}</p>
          <p style={{ fontSize: '13px' }}>Instagram: @{LEYDE.instagram}</p>
        </div>
        <div>
          <h4>Categorias</h4>
          <ul>
            {categoriasPrincipais(categorias).map((categoria) => (
              <li key={categoria.id}>
                <Link prefetch={false} href={`/categoria?cat=${categoria.slug}`}>{categoria.nome}</Link>
              </li>
            ))}
            <li><Link prefetch={false} href="/categoria">Todas as categorias</Link></li>
          </ul>
        </div>
        <div>
          <h4>Atendimento</h4>
          <ul>
            {LEYDE.horario.map((item) => (
              <li key={item.dias}>
                {item.dias}: {item.horas}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Sobre</h4>
          <ul>
            <li>
              <Link prefetch={false} href="/termos-de-uso">Como comprar</Link>
            </li>
            {policyLinks.map((page) => <li key={page.href}><Link prefetch={false} href={page.href}>{page.title}</Link></li>)}
            <li><PrivacySettingsButton /></li>
            <li>
              <a href={whatsappLink('Olá! Gostaria de saber mais sobre a loja.')} target="_blank" rel="noopener noreferrer">
                Fale conosco
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="foot-bottom">
        <div className="container">
          {currentYear} © {LEYDE.nomeLoja} — {LEYDE.cidade}/{LEYDE.uf}
          <p>Catálogo de consultores independentes. Marcas e imagens de produtos pertencem a seus respectivos titulares.</p>
        </div>
      </div>
    </footer>
  );
}
