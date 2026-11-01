import Link from 'next/link';
import { notFound } from 'next/navigation';
import { policies, POLICY_DATE } from '../lib/policies';
import { whatsappLink } from '../lib/config';
import { PrivacyDataControls, PrivacySettingsButton } from './PrivacyControls';

export default function InformationPage({ pagina }) {
  const page = Object.hasOwn(policies, pagina) ? policies[pagina] : null;
  if (!page) notFound();
  return <main className="container policy-page">
    <div className="breadcrumb"><Link prefetch={false} href="/">Início</Link> / {page.title}</div>
    <h1 className="pagina-titulo">{page.title}</h1>
    <p className="policy-date">Atualização: {POLICY_DATE}</p>
    <p>{page.intro}</p>
    {page.sections.map(([title, paragraphs]) => <section key={title}><h2>{title}</h2>{paragraphs.map((text) => <p key={text}>{text}</p>)}</section>)}
    {pagina === 'cookies' ? <PrivacySettingsButton /> : null}
    {pagina === 'privacidade' ? <PrivacyDataControls /> : null}
    <p><a href={whatsappLink('Olá! Gostaria de falar sobre as políticas e o atendimento da LEYDE BRAGA.')} target="_blank" rel="noopener noreferrer">Falar com a loja pelo WhatsApp</a></p>
  </main>;
}
