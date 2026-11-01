'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { categoriasPrincipais } from '../lib/catalog';

export default function Navigation({ categorias, marcas }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (event) => {
    if (event.target.closest('.dropdown a')) return;
    setIsOpen((value) => !value);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen((value) => !value);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <nav className="site-nav" aria-label="Categorias" ref={dropdownRef}>
      <div className="container">
        <Link prefetch={false} href="/">Início</Link>
        {categoriasPrincipais(categorias).map((categoria) => (
          <Link prefetch={false} key={categoria.id} href={`/categoria?cat=${categoria.slug}`}>
            {categoria.nome}
          </Link>
        ))}
        <Link prefetch={false} href="/categoria">Todos os produtos</Link>
        <span
          className={`has-sub ${isOpen ? 'aberto' : ''}`}
          role="button"
          tabIndex={0}
          aria-haspopup="true"
          aria-expanded={isOpen}
          onClick={toggleDropdown}
          onKeyDown={handleKeyDown}
        >
          Marcas
          <span className="dropdown">
            {marcas.map((marca) => (
              <Link prefetch={false}
                key={marca.id}
                href={`/categoria?marca=${encodeURIComponent(marca.slug)}`}
                onClick={() => setIsOpen(false)}
              >
                {marca.nome}
              </Link>
            ))}
          </span>
        </span>
      </div>
    </nav>
  );
}
