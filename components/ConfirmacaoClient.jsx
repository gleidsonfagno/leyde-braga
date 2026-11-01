'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { whatsappLink } from '../lib/config';
import { formatarBRL, multiplicarPreco } from '../lib/money';
import { formatarNumeroPedido, montarMensagemPedido } from '../lib/order';
import { mapaLocalizacao } from '../lib/location';
import { textoFretePedido, textoTotalPedido } from '../lib/delivery';
import { descreverPagamento } from '../lib/payment';
import { lerPedidoLocal } from '../lib/order-storage';

export default function ConfirmacaoClient({ pedidoQuery }) {
  const [pedido, setPedido] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try { setPedido(lerPedidoLocal(window.localStorage)); }
    catch { setPedido(null); }
    setLoaded(true);
  }, []);

  const numeroDisplay = useMemo(() => {
    const number = pedido?.numero || pedidoQuery;
    return formatarNumeroPedido(number);
  }, [pedido, pedidoQuery]);

  const resumoItens = pedido?.itens || [];
  const mapa = mapaLocalizacao(pedido?.endereco?.localizacao);

  const mensagem = useMemo(() => {
    if (!pedido) return 'Olá! Gostaria de confirmar meu pedido.';
    return montarMensagemPedido(pedido);
  }, [pedido]);

  if (!loaded) {
    return (
      <main className="container">
        <h1 className="pagina-titulo">Pedido confirmado</h1>
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--muted)' }}>
          Carregando confirmação...
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="breadcrumb">
        <Link prefetch={false} href="/">Início</Link> / Pedido confirmado
      </div>
      <h1 className="pagina-titulo">Pedido confirmado</h1>

      <div className="confirmacao">
        <div className="confirmacao-box">
          <p className="confirmacao-numero">{numeroDisplay}</p>
          <h2>Seu pedido foi salvo com sucesso.</h2>
          <p>Agora finalize o contato no WhatsApp para combinarmos entrega, pagamento e detalhes do pedido.</p>
          <a className="btn solid" href={whatsappLink(mensagem)} target="_blank" rel="noopener noreferrer">
            Abrir WhatsApp
          </a>
        </div>

        {pedido ? (
          <aside className="resumo">
            <h3>Resumo do pedido</h3>
            {mapa ? <p><a href={mapa} target="_blank" rel="noopener noreferrer">Ver ponto de entrega no mapa</a></p> : null}
            {resumoItens.map((item) => (
              <div key={item.slug} className="linha">
                <span>
                  {item.nome.slice(0, 40)} × {item.qtd}
                </span>
                <span>{item.preco != null ? formatarBRL(multiplicarPreco(item.preco, item.qtd)) : '—'}</span>
              </div>
            ))}
            <div className="linha">
              <span>Subtotal</span>
              <span>{pedido.subtotal ? formatarBRL(pedido.subtotal) : 'a definir'}</span>
            </div>
            <div className="linha">
              <span>Entrega</span>
              <span>{textoFretePedido(pedido)}</span>
            </div>
            <div className="linha total">
              <span>Total</span>
              <span>{textoTotalPedido(pedido)}</span>
            </div>
            <div className="linha"><span>Pagamento</span><span style={{ textAlign: 'right', maxWidth: '65%' }}>{descreverPagamento(pedido)}</span></div>
          </aside>
        ) : (
          <div className="confirmacao-box">
            <p>Não encontramos os detalhes do pedido nesta sessão.</p>
          </div>
        )}
      </div>
    </main>
  );
}
