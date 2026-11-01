'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { normalizarCarrinho } from '../lib/cart';

const CART_KEY = 'leyde_carrinho';
const CartContext = createContext(null);

function totalQuantidade(items) {
  return items.reduce((sum, item) => sum + (Number(item.qtd) || 0), 0);
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CART_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCart(normalizarCarrinho(parsed));
        }
      }
    } catch {
      setCart([]);
    }
    setReady(true);
  }, []);

  const persist = useCallback((nextCart) => {
    const normalized = normalizarCarrinho(nextCart);
    setCart(normalized);
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem(CART_KEY, JSON.stringify(normalized)); }
      catch { /* Carrinho continua utilizável na sessão quando o armazenamento é bloqueado. */ }
    }
  }, []);

  const adicionar = useCallback(
    (slug, qtd = 1) => {
      const amount = Math.max(1, parseInt(qtd, 10) || 1);
      const nextCart = [...cart];
      const item = nextCart.find((entry) => entry.slug === slug);
      if (item) {
        item.qtd += amount;
      } else {
        nextCart.push({ slug, qtd: amount });
      }
      persist(nextCart);
      return true;
    },
    [cart, persist],
  );

  const remover = useCallback(
    (slug) => {
      persist(cart.filter((entry) => entry.slug !== slug));
    },
    [cart, persist],
  );

  const mudarQtd = useCallback(
    (slug, qtd) => {
      const amount = parseInt(qtd, 10) || 1;
      if (amount < 1) {
        remover(slug);
        return;
      }
      const nextCart = [...cart];
      const item = nextCart.find((entry) => entry.slug === slug);
      if (item) {
        item.qtd = amount;
        persist(nextCart);
      }
    },
    [cart, persist, remover],
  );

  const limpar = useCallback(() => {
    persist([]);
  }, [persist]);

  const value = useMemo(
    () => ({
      cart,
      ready,
      quantidade: totalQuantidade(cart),
      adicionar,
      remover,
      mudarQtd,
      limpar,
      salvar: persist,
    }),
    [cart, ready, adicionar, remover, mudarQtd, limpar, persist],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart deve ser usado dentro de CartProvider');
  }
  return ctx;
}
