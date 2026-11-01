'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { categoriasPrincipais } from '../lib/catalog';

export default function Navigation({ categorias, marcas }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  useEffect(() => {
    const close = (event) => { if (!dropdownRef.current?.contains(event.target)) setIsOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  return <nav className="site-nav" aria-label="Categorias">
    <div className="container">
      <Link href="/">Início</Link>
      {categoriasPrincipais(categorias).map((categoria) => <Link key={categoria.id} href={`/categoria?cat=${categoria.slug}`}>{categoria.nome}</Link>)}
      <Link href="/categoria">Todos os produtos</Link>
      <div className={`has-sub ${isOpen ? 'aberto' : ''}`} ref={dropdownRef}
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false); }}
        onKeyDown={(event) => { if (event.key === 'Escape') { setIsOpen(false); triggerRef.current?.focus(); } }}>
        <button type="button" ref={triggerRef} className="nav-brands-trigger" aria-expanded={isOpen} aria-controls="menu-marcas" onClick={() => setIsOpen((value) => !value)}>Marcas</button>
        <div className="dropdown" id="menu-marcas" hidden={!isOpen}>
          {marcas.map((marca) => <Link prefetch={false} key={marca.id} href={`/categoria?marca=${encodeURIComponent(marca.slug)}`} onClick={() => setIsOpen(false)}>{marca.nome}</Link>)}
        </div>
      </div>
    </div>
  </nav>;
}
