'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../components/CartContext';
import { useCartProducts } from '../../components/useCartProducts';
import { formatarBRL, multiplicarPreco, subtotalCarrinho } from '../../lib/money';
import ProductImage from '../../components/ProductImage';

export default function CarrinhoPage() {
  const { cart, mudarQtd, remover, salvar, ready } = useCart();
  const router = useRouter();

  const { linhas, loading, error, recarregar, indisponiveis } = useCartProducts(cart, ready);

  const subtotal = subtotalCarrinho(linhas);
  const temValores = linhas.every((linha) => linha.produto.preco != null);

  const handleFinalizar = () => {
    salvar(linhas.map((linha) => ({ slug: linha.produto.slug, qtd: linha.qtd })));
    router.push('/checkout');
  };

  if (error) return <main className="container"><h1 className="pagina-titulo">Meu carrinho</h1><p role="alert">{error}</p><button className="btn" onClick={recarregar}>Tentar novamente</button></main>;

  if (loading) {
    return (
      <main className="container">
        <h1 className="pagina-titulo">Meu carrinho</h1>
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--muted)' }}>
          Carregando carrinho...
        </div>
      </main>
    );
  }

  if (!linhas.length) {
    return (
      <main className="container">
        <div className="breadcrumb">
          <Link prefetch={false} href="/">Início</Link> / Carrinho
        </div>
        <h1 className="pagina-titulo">Meu carrinho</h1>
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--muted)' }}>
          <p style={{ fontSize: '18px', marginBottom: '8px' }}>Seu carrinho está vazio.</p>
          {indisponiveis > 0 ? <p>Os itens anteriores não estão mais no catálogo público. Escolha os produtos atuais da loja.</p> : null}
          <Link prefetch={false} className="btn solid" href="/">
            Continuar comprando
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="breadcrumb">
        <Link prefetch={false} href="/">Início</Link> / Carrinho
      </div>
      <h1 className="pagina-titulo">Meu carrinho</h1>
      {indisponiveis > 0 ? <p role="status">Alguns itens não estão mais no catálogo público e não serão incluídos no pedido.</p> : null}

      <div className="pg-layout">
        <div id="carrinho-itens">
          <table className="tabela-carrinho">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Preço</th>
                <th>Quantidade</th>
                <th>Total</th>
                <th><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {linhas.map(({ produto, qtd }) => {
                const total = formatarBRL(multiplicarPreco(produto.preco, qtd));
                return (
                  <tr key={produto.slug}>
                    <td>
                      <div className="ci">
                        <Link prefetch={false} href={`/produto?p=${produto.slug}`}>
                          <ProductImage src={produto.imagem} alt={produto.nome} />
                        </Link>
                        <div>
                          <Link prefetch={false} href={`/produto?p=${produto.slug}`} style={{ fontWeight: 500 }}>
                            {produto.nome}
                          </Link>
                          <div style={{ color: 'var(--muted-2)', fontSize: '11px', marginTop: '2px' }}>{produto.marca}</div>
                        </div>
                      </div>
                    </td>
                    <td>{formatarBRL(produto.preco)}</td>
                    <td>
                      <div className="qtd-stepper" style={{ height: '34px' }}>
                        <button type="button" aria-label={`Diminuir quantidade de ${produto.nome}`} style={{ height: '34px', width: '30px' }} onClick={() => mudarQtd(produto.slug, qtd - 1)}>
                          −
                        </button>
                        <input
                          type="number"
                          aria-label={`Quantidade de ${produto.nome}`}
                          value={qtd}
                          min="1"
                          max="99"
                          onChange={(event) => mudarQtd(produto.slug, parseInt(event.target.value, 10) || 1)}
                          style={{ height: '34px', width: '40px' }}
                        />
                        <button type="button" aria-label={`Aumentar quantidade de ${produto.nome}`} style={{ height: '34px', width: '30px' }} onClick={() => mudarQtd(produto.slug, qtd + 1)}>
                          +
                        </button>
                      </div>
                    </td>
                    <td>{total}</td>
                    <td>
                      <button className="rem" aria-label={`Remover ${produto.nome} do carrinho`} onClick={() => remover(produto.slug)}>
                        Remover
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <aside className="resumo" id="carrinho-resumo">
          <h3>Resumo do pedido</h3>
          <div className="linha">
            <span>Subtotal</span>
            <span>{temValores ? formatarBRL(subtotal) : 'a definir'}</span>
          </div>
          <div className="linha">
            <span>Entrega</span>
            <span>no checkout</span>
          </div>
          <div className="linha total">
            <span>Total</span>
            <span>{temValores ? formatarBRL(subtotal) : 'a definir'}</span>
          </div>
          <button className="btn solid block" id="btn-finalizar" onClick={handleFinalizar}>
            Finalizar pedido
          </button>
          <div className="aviso">
            Entrega e formas de pagamento são definidas no próximo passo. Pedidos são confirmados pelo WhatsApp.
          </div>
        </aside>
      </div>
    </main>
  );
}
