'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LEYDE, whatsappLink } from '../lib/config';
import { estoqueLabel } from '../lib/catalog';
import { formatarBRL } from '../lib/money';
import ProductImage from './ProductImage';
import { useCart } from './CartContext';
import { useToast } from './ToastContext';

export default function ProductDetailClient({ produto }) {
  const router = useRouter();
  const { adicionar } = useCart();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('descricao');
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState(produto?.imagem || '');

  useEffect(() => {
    if (produto) {
      document.title = `${produto.nome} — LEYDE BRAGA`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.content = produto.descricao;
      setMainImage(produto.imagem);
    }
  }, [produto]);

  const estoque = useMemo(() => (produto ? estoqueLabel(produto) : null), [produto]);
  const indisponivel = produto?.disponibilidade === 'indisponivel';
  const preco = produto ? formatarBRL(produto.preco) : '';

  if (!produto) {
    return (
      <main className="container" id="produto-main" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
        Produto não encontrado. <Link prefetch={false} href="/">Voltar à loja</Link>
      </main>
    );
  }

  const handleAddToCart = () => {
    if (adicionar(produto.slug, quantity)) {
      showToast('Adicionado ao carrinho');
    }
  };

  const handleBuyNow = () => {
    if (adicionar(produto.slug, quantity)) {
      router.push('/carrinho');
    }
  };

  const specs = [['Código', produto.codigo], ['Marca', produto.marca], ['Categoria', produto.categoriaNome]];

  return (
    <main className="container" id="produto-main">
      <div className="breadcrumb">
        <Link prefetch={false} href="/">Início</Link>
        {produto.categoria ? (
          <>
            {' / '}
            <Link prefetch={false} href={`/categoria?cat=${encodeURIComponent(produto.categoria)}`}>{produto.categoriaNome}</Link>
          </>
        ) : null}
        {' / '}
        {produto.nome}
      </div>

      <div className="produto">
        <div className="produto-galeria">
          <div className="galeria-main">
            <ProductImage id="galeria-img" src={mainImage} alt={produto.imagens.find((imagem) => imagem.url === mainImage)?.alt || produto.nome} />
          </div>
          <div className="galeria-minis">
            {produto.imagens.map((imagem) => <button key={imagem.id} type="button" aria-label={`Ver ${imagem.alt || produto.nome}`} onClick={() => setMainImage(imagem.url)} style={{ border: 0, background: 'transparent' }}>
              <ProductImage className={mainImage === imagem.url ? 'ativo' : ''} src={imagem.url} alt="" />
            </button>)}
          </div>
        </div>

        <div className="produto-info">
          <p className="p-marca">{produto.marca}</p>
          <h1>{produto.nome}</h1>
          {estoque ? <p className={`p-est ${estoque.cls}`}>{estoque.txt}</p> : null}
          <p className="p-preco">{preco}</p>
          <p className="p-resumo" style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '12px' }}>
            {produto.descricao}
          </p>

          {!indisponivel ? (
            <div className="qtd-linha">
              <label htmlFor="q-input">Quantidade</label>
              <div className="qtd-stepper">
                <button type="button" id="q-menos" aria-label="Diminuir quantidade" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  −
                </button>
                <input
                  id="q-input"
                  type="number"
                  value={quantity}
                  min="1"
                  max="99"
                  onChange={(event) => setQuantity(Math.min(99, Math.max(1, parseInt(event.target.value, 10) || 1)))}
                />
                <button type="button" id="q-mais" aria-label="Aumentar quantidade" onClick={() => setQuantity(Math.min(99, quantity + 1))}>
                  +
                </button>
              </div>
            </div>
          ) : null}

          <div className="p-botoes">
            {indisponivel ? (
              <button className="btn block" disabled style={{ justifyContent: 'center' }}>
                Produto indisponível
              </button>
            ) : (
              <>
                <button className="btn solid block" id="btn-comprar" onClick={handleBuyNow}>
                  Comprar agora
                </button>
                <button className="btn block" id="btn-carrinho" onClick={handleAddToCart}>
                  Adicionar ao carrinho
                </button>
              </>
            )}
          </div>

          <p style={{ fontSize: '12px', color: 'var(--muted-2)' }}>
            Entrega em {LEYDE.cidade} — {LEYDE.uf}. Dúvidas?{' '}
            <a href={whatsappLink(`Olá! Tenho dúvidas sobre o produto ${produto.nome}.`)} target="_blank" rel="noopener noreferrer">
              Fale no WhatsApp
            </a>
            .
          </p>
        </div>
      </div>

      <section className="p-abas">
        <div className="p-aba-titulos">
          <button aria-expanded={activeTab === 'descricao'} aria-controls="painel-descricao" className={activeTab === 'descricao' ? 'ativo' : ''} data-aba="descricao" onClick={() => setActiveTab('descricao')}>
            Descrição
          </button>
          <button aria-expanded={activeTab === 'espec'} aria-controls="painel-especificacoes" className={activeTab === 'espec' ? 'ativo' : ''} data-aba="espec" onClick={() => setActiveTab('espec')}>
            Especificações
          </button>
        </div>

        <div className="p-aba" id="painel-descricao" data-painel="descricao" hidden={activeTab !== 'descricao'}>
          {produto.descricao}
        </div>
        <div className="p-aba" id="painel-especificacoes" data-painel="espec" hidden={activeTab !== 'espec'}>
          <table>
            <tbody>
              {specs.map(([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
