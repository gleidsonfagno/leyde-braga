'use client';

import Link from 'next/link';
import { useState } from 'react';
import ProductImage from './ProductImage';

export default function Hero({ produtos }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const active = currentSlide < produtos.length ? currentSlide : 0;
  if (!produtos.length) return null;
  return <section className="hero container" aria-label="Destaques do catálogo" aria-roledescription="carrossel">
    <div className="hero-window"><div className="hero-track" style={{ transform: `translateX(-${active * 100}%)` }}>
      {produtos.map((produto, index) => {
        return <div key={produto.slug} className="hero-slide" aria-hidden={index !== active} inert={index !== active ? true : undefined}>
          <Link prefetch={false} className="catalog-banner" href={`/produto?p=${produto.slug}`} tabIndex={index === active ? 0 : -1}>
            <span className="banner-copy">
              <span className="banner-eyebrow">LEYDE BRAGA · BELEZA & PERFUMARIA</span>
              <span className="banner-title">Uma fragrância para cada momento</span>
              <span className="banner-detail">{produto.nome}</span>
              <span className="banner-brand">{produto.marca}</span>
              <span className="banner-cta">Conhecer perfume →</span>
            </span>
            <span className="banner-product"><ProductImage src={produto.imagem} alt={produto.alt} loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'low'} /></span>
          </Link>
        </div>;
      })}
    </div></div>
    <div className="hero-dots">
      {produtos.length > 1 ? produtos.map((produto, index) => <button key={produto.slug} type="button" aria-label={`Mostrar destaque ${index + 1}: ${produto.nome}`} aria-pressed={index === active} className={index === active ? 'ativo' : ''} onClick={() => setCurrentSlide(index)} />) : null}
    </div>
  </section>;
}
