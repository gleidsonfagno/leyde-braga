'use client';

import Link from 'next/link';
import { useState } from 'react';
import { categoriasPrincipais } from '../lib/catalog';

const slides = [
  { id: 'hero-perfumaria', tema: 'perfumaria', titulo: 'Uma fragrância para cada momento', detalhe: 'Conheça nossa seleção de perfumes', destino: 0 },
  { id: 'hero-corpo-banho', tema: 'corpo', titulo: 'Seu momento de cuidado', detalhe: 'Descubra cuidados para o corpo e banho', destino: 1 },
  { id: 'hero-maquiagem', tema: 'maquiagem', titulo: 'Beleza do seu jeito', detalhe: 'Explore os produtos de maquiagem', destino: 3 },
];

export default function Hero({ categorias }) {
  const principais = categoriasPrincipais(categorias);
  const [currentSlide, setCurrentSlide] = useState(0);
  return <section className="hero container" aria-label="Destaques do catálogo" aria-roledescription="carrossel">
    <div className="hero-window"><div className="hero-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
      {slides.map((slide, index) => {
        const destino = principais[slide.destino];
        return <div key={slide.id} className="hero-slide" aria-hidden={index !== currentSlide} inert={index !== currentSlide ? true : undefined}>
          <Link prefetch={false} className={`original-banner tema-${slide.tema}`} href={destino ? `/categoria?cat=${destino.slug}` : '/categoria'} tabIndex={index === currentSlide ? 0 : -1}>
            <span className="banner-eyebrow">LEYDE BRAGA · BELEZA & PERFUMARIA</span>
            <span className="banner-title">{slide.titulo}</span>
            <span className="banner-detail">{slide.detalhe}</span>
            <span className="banner-cta">Ver produtos →</span>
          </Link>
        </div>;
      })}
    </div></div>
    <div className="hero-dots">
      {slides.map((slide, index) => <button key={slide.id} type="button" aria-label={`Mostrar destaque ${index + 1}: ${slide.detalhe}`} aria-pressed={index === currentSlide} className={index === currentSlide ? 'ativo' : ''} onClick={() => setCurrentSlide(index)} />)}
    </div>
  </section>;
}
