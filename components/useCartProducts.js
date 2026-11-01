'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { carregarProdutosCarrinho, itensDoCarrinho } from '../lib/cart';

export function useCartProducts(cart, ready) {
  const chave = JSON.stringify([...new Set(cart.map((item) => item.slug))].sort());
  const [estado, setEstado] = useState({ chave: null, produtos: [], erro: '' });
  const [tentativa, setTentativa] = useState(0);
  const recarregar = useCallback(() => setTentativa((valor) => valor + 1), []);

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    setEstado({ chave: null, produtos: [], erro: '' });
    const itens = JSON.parse(chave).map((slug) => ({ slug, qtd: 1 }));
    carregarProdutosCarrinho(itens, controller.signal).then((produtos) => {
      if (!controller.signal.aborted) setEstado({ chave, produtos, erro: '' });
    }).catch(() => {
      if (!controller.signal.aborted) setEstado({ chave, produtos: [], erro: 'Não foi possível atualizar os produtos do carrinho. Tente novamente.' });
    });
    return () => controller.abort();
  }, [chave, ready, tentativa]);

  const revalidar = async () => {
    const produtos = await carregarProdutosCarrinho(cart, AbortSignal.timeout(20000));
    setEstado({ chave, produtos, erro: '' });
    return itensDoCarrinho(cart, produtos);
  };
  const linhas = useMemo(() => estado.chave === chave ? itensDoCarrinho(cart, estado.produtos) : [], [cart, chave, estado]);
  return {
    linhas, loading: !ready || estado.chave !== chave,
    error: estado.chave === chave ? estado.erro : '', recarregar, revalidar,
    indisponiveis: estado.chave === chave && !estado.erro ? cart.length - linhas.length : 0,
  };
}
