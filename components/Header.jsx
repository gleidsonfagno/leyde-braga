'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LEYDE } from '../lib/config';
import { useCart } from './CartContext';

export default function Header() {
  const { quantidade } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (event) => {
    event.preventDefault();
    const value = searchQuery.trim();
    if (value) {
      router.push(`/categoria?q=${encodeURIComponent(value)}`);
    }
  };

  return (
    <header className="site-head">
      <div className="head-row container">
        <div className="logo">
          <Link prefetch={false} href="/" aria-label={`Flor da Manhã — ${LEYDE.nomeLoja}`}>
            FLOR DA MANHÃ
            <small>{LEYDE.nomeLoja}</small>
          </Link>
        </div>
        <form className="search" id="form-busca" onSubmit={handleSearch} role="search">
          <input
            type="search"
            name="q"
            placeholder="O que você procura?"
            autoComplete="off"
            aria-label="Buscar produtos"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <button type="submit" aria-label="Buscar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </form>
        <div className="head-actions">
          <a
            className="act"
            href={`https://www.instagram.com/${LEYDE.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
              <circle cx="12" cy="12" r="4.2" />
              <circle cx="17.6" cy="6.4" r="1.3" />
            </svg>
            <span className="act-txt">Insta</span>
          </a>
          <Link prefetch={false} className="act minicart" href="/carrinho" aria-label="Meu carrinho">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 4h2l2.4 12.4a1.6 1.6 0 0 0 1.6 1.3h8.9a1.6 1.6 0 0 0 1.6-1.3L21 8H6" />
              <circle cx="10" cy="21" r="1" />
              <circle cx="17" cy="21" r="1" />
            </svg>
            <span data-carrinho-qtd style={{ display: quantidade ? '' : 'none' }}>
              {quantidade}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
