'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { categoriasPrincipais } from '../lib/catalog';

const slides = [
  {
    id: 'hero-perfumaria',
    image: '/assets/images/banners/hero-1.jpg',
    alt: 'Perfumaria',
  },
  {
    id: 'hero-corpo-banho',
    image: '/assets/images/banners/hero-2.jpg',
    alt: 'Corpo e Banho',
  },
  {
    id: 'hero-maquiagem',
    image: '/assets/images/banners/hero-3.jpg',
    alt: 'Maquiagem',
  },
];

export default function Hero({ categorias }) {
  const principais = categoriasPrincipais(categorias);
  const destinos = [principais[0], principais[1], principais.find((item) => /maquiagem|batom/.test(item.slug))];
  const [currentSlide, setCurrentSlide] = useState(0);
  const timerRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return undefined;

    const stop = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };

    const play = () => {
      stop();
      timerRef.current = setInterval(() => {
        setCurrentSlide((previous) => (previous + 1) % slides.length);
      }, 5200);
    };

    play();

    const node = rootRef.current;
    if (node) {
      node.addEventListener('mouseenter', stop);
      node.addEventListener('mouseleave', play);
    }

    return () => {
      stop();
      if (node) {
        node.removeEventListener('mouseenter', stop);
        node.removeEventListener('mouseleave', play);
      }
    };
  }, []);

  return (
    <section className="hero container" id="hero" ref={rootRef} data-od-id="hero">
      <div className="hero-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
        {slides.map((slide, index) => (
          <div key={slide.id} className="hero-slide">
            <Link prefetch={false} href={destinos[index] ? `/categoria?cat=${destinos[index].slug}` : '/categoria'} data-od-id={slide.id}>
              <img src={slide.image} alt={slide.alt} fetchPriority={index === 0 ? 'high' : 'auto'} />
            </Link>
          </div>
        ))}
      </div>
      <div className="hero-dots">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Ir para slide ${index + 1}`}
            className={index === currentSlide ? 'ativo' : ''}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </section>
  );
}
