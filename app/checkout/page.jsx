'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useCart } from '../../components/CartContext';
import { useCartProducts } from '../../components/useCartProducts';
import { LEYDE, whatsappLink } from '../../lib/config';
import { montarMensagemPedido } from '../../lib/order';
import { centavos, formatarBRL, multiplicarPreco, subtotalCarrinho } from '../../lib/money';
import { normalizeText } from '../../lib/text';
import DeliveryLocation from '../../components/DeliveryLocation';
import { calcularFrete, mensagemFrete, resumoFrete, totalComFrete, textoTotalPedido } from '../../lib/delivery';
import { descricaoParcelas, descreverPagamento, dividirParcelas, ehCartaoCredito, parcelasDoPagamento } from '../../lib/payment';

function paymentIcon(label) {
  const key = normalizeText(label).replace(/[^a-z0-9]/g, '');
  if (key.includes('pix')) {
    return (
      <svg viewBox="0 0 512 512" aria-hidden="true">
        <defs>
          <linearGradient id="pg-pix-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#32bcad" />
            <stop offset="1" stopColor="#12294a" />
          </linearGradient>
        </defs>
        <path
          fill="url(#pg-pix-g)"
          d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 488.6C280.3 518.1 231.1 518.1 200.8 488.6L103.3 391.2H112.6C132.6 391.2 151.5 383.4 165.7 369.2L242.4 292.5zM262.5 218.9C256.1 224.4 247.9 224.5 242.4 218.9L165.7 142.2C151.5 127.1 132.6 120.2 112.6 120.2H103.3L200.7 22.76C231.1-7.586 280.3-7.586 310.6 22.76L407.8 119.9H392.6C372.6 119.9 353.7 127.7 339.5 141.9L262.5 218.9zM112.6 142.7C126.4 142.7 139.1 148.3 149.7 158.1L226.4 234.8C233.6 241.1 243 245.6 252.5 245.6C261.9 245.6 271.3 241.1 278.5 234.8L355.5 157.8C365.3 148.1 378.8 142.5 392.6 142.5H430.3L488.6 200.8C518.9 231.1 518.9 280.3 488.6 310.6L430.3 368.9H392.6C378.8 368.9 365.3 363.3 355.5 353.5L278.5 276.5C264.6 262.6 240.3 262.6 226.4 276.6L149.7 353.2C139.1 363 126.4 368.6 112.6 368.6H80.78L22.76 310.6C-7.586 280.3-7.586 231.1 22.76 200.8L80.78 142.7H112.6z"
        />
      </svg>
    );
  }
  if (key.includes('cartao')) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4.75" width="20" height="14.5" rx="2.5" />
        <path d="M2 9.5h20" />
        <path d="M6 15h4" />
      </svg>
    );
  }
  if (key.includes('dinheiro')) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.5" y="5.75" width="19" height="12.5" rx="2" />
        <circle cx="12" cy="12" r="2.75" />
        <path d="M6 9.2h.01M18 14.8h.01" />
      </svg>
    );
  }
  if (key.includes('boleto')) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.5" y="4" width="19" height="16" rx="2" />
        <path d="M3.5 9h17" />
        <path d="M6 12v4.5M8.4 12v4.5M10.8 12v3M13.2 12v4.5M15.6 12v3M18 12v4.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v8M8.5 10.5h6" />
    </svg>
  );
}

export default function CheckoutPage() {
  const { cart, limpar, ready } = useCart();
  const { linhas, loading, error, recarregar, revalidar, indisponiveis } = useCartProducts(cart, ready);
  const [cepErro, setCepErro] = useState('');
  const cepConsulta = useRef(0);
  const [formData, setFormData] = useState({
    nome: '',
    whatsapp: '',
    cep: '',
    estado: 'PA',
    cidade: 'Altamira',
    bairro: '',
    rua: '',
    numero: '',
    complemento: '',
    pagamento: LEYDE.formasPagamento[0] || '',
    parcelas: '1',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [localizacao, setLocalizacao] = useState(null);
  const formRef = useRef(null);
  const accessibleField = (name) => ({ 'aria-invalid': Boolean(errors[name]), 'aria-describedby': errors[name] ? `erro-${name}` : undefined });

  const frete = calcularFrete(formData);
  const subtotal = subtotalCarrinho(linhas);
  const temPrecos = linhas.every((linha) => linha.produto.preco != null);
  const total = temPrecos ? totalComFrete(subtotal, frete) : null;
  const cartaoCredito = ehCartaoCredito(formData.pagamento);
  const permiteDuasParcelas = total == null || centavos(total) >= 2n;
  let pagamentoResumo;
  try { pagamentoResumo = descreverPagamento({ pagamento: formData.pagamento, parcelas: formData.parcelas, total }); }
  catch { pagamentoResumo = 'Selecione uma opção válida de 1x ou 2x.'; }

  const buscarCEP = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    const consulta = ++cepConsulta.current;
    setCepErro('');
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: AbortSignal.timeout(10000) });
      const data = await response.json();
      if (consulta !== cepConsulta.current) return;
      if (!data.erro) {
        setLocalizacao(null);
        setFormData((previous) => ({
          ...previous,
          rua: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || 'Altamira',
          estado: data.uf || 'PA',
        }));
      } else {
        setCepErro('CEP não encontrado. Preencha o endereço manualmente.');
      }
    } catch {
      if (consulta === cepConsulta.current) setCepErro('Não foi possível consultar o CEP agora. Preencha manualmente.');
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.nome.trim()) nextErrors.nome = 'Informe seu nome.';
    if (!formData.whatsapp.trim()) nextErrors.whatsapp = 'Informe seu WhatsApp.';
    if (formData.cep.replace(/\D/g, '').length !== 8) nextErrors.cep = 'Informe um CEP com 8 dígitos.';
    if (!formData.rua.trim()) nextErrors.rua = 'Informe a rua.';
    if (!formData.numero.trim()) nextErrors.numero = 'Informe o número.';
    if (!formData.bairro.trim()) nextErrors.bairro = 'Informe o bairro.';
    if (!formData.pagamento) nextErrors.pagamento = 'Selecione uma forma de pagamento.';
    try {
      const parcelas = parcelasDoPagamento(formData.pagamento, formData.parcelas);
      if (cartaoCredito && total != null) dividirParcelas(total, parcelas);
    } catch (error) { nextErrors.parcelas = error.message; }
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) formRef.current?.elements.namedItem(firstError)?.focus?.();
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'cep') { cepConsulta.current++; setCepErro(''); }
    if (['cep', 'bairro', 'rua', 'numero', 'cidade', 'estado'].includes(name)) setLocalizacao(null);
    setFormData((previous) => ({ ...previous, [name]: value, ...(name === 'pagamento' ? { parcelas: '1' } : {}) }));
    if (errors[name]) {
      setErrors((previous) => ({ ...previous, [name]: '' }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    try {
      const atuais = await revalidar();
      const assinatura = (itens) => JSON.stringify(itens.map(({ produto, qtd }) => [produto.id, produto.preco, qtd]));
      if (assinatura(atuais) !== assinatura(linhas)) {
        setErrors({ catalogo: 'O catálogo foi atualizado. Confira os itens e valores e confirme novamente.' });
        setSubmitting(false);
        return;
      }
    } catch {
      setErrors({ catalogo: 'Não foi possível conferir os preços atuais. Tente novamente antes de confirmar.' });
      setSubmitting(false);
      return;
    }

    let previous = 0;
    try { previous = parseInt(window.localStorage.getItem('leyde_pedido_contador') || '0', 10) || 0; } catch { /* Atendimento pode continuar sem persistência. */ }
    const nextOrder = previous + 1;

    const pedido = {
      numero: nextOrder,
      nome: formData.nome.trim(),
      whatsapp: formData.whatsapp.trim(),
      endereco: {
        cep: formData.cep.trim(),
        estado: formData.estado,
        cidade: formData.cidade,
        bairro: formData.bairro.trim(),
        rua: formData.rua.trim(),
        numero: formData.numero.trim(),
        complemento: formData.complemento.trim(),
        ...(localizacao ? { localizacao } : {}),
      },
      pagamento: formData.pagamento || 'a combinar',
      parcelas: parcelasDoPagamento(formData.pagamento, formData.parcelas),
      entrega: frete.valor,
      frete,
      itens: linhas.map((linha) => ({ slug: linha.produto.slug, nome: linha.produto.nome, qtd: linha.qtd, preco: linha.produto.preco })),
      subtotal,
      total,
      data: new Date().toISOString(),
    };

    try {
      window.localStorage.setItem('leyde_pedido', JSON.stringify(pedido));
      window.localStorage.setItem('leyde_pedido_contador', String(nextOrder));
    } catch { /* A mensagem segue diretamente para o WhatsApp; não depende do armazenamento local. */ }
    limpar();
    window.location.href = whatsappLink(montarMensagemPedido(pedido));
  };

  if (error) return <main className="container"><h1 className="pagina-titulo">Finalizar pedido</h1><p role="alert">{error}</p><button className="btn" onClick={recarregar}>Tentar novamente</button></main>;

  if (!linhas.length || loading) {
    if (loading) {
      return (
        <main className="container">
          <h1 className="pagina-titulo">Finalizar pedido</h1>
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--muted)' }}>
            Carregando checkout...
          </div>
        </main>
      );
    }

    return (
      <main className="container">
        <div className="breadcrumb">
          <Link prefetch={false} href="/">Início</Link> / <Link prefetch={false} href="/carrinho">Carrinho</Link> / Finalizar pedido
        </div>
        <h1 className="pagina-titulo">Finalizar pedido</h1>
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--muted)' }}>
          <p style={{ fontSize: '18px', marginBottom: '8px' }}>Seu carrinho está vazio.</p>
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
        <Link prefetch={false} href="/">Início</Link> / <Link prefetch={false} href="/carrinho">Carrinho</Link> / Finalizar pedido
      </div>
      <h1 className="pagina-titulo">Finalizar pedido</h1>

      {indisponiveis > 0 ? <p role="status">Alguns itens estão esgotados ou fora do catálogo e não serão incluídos no pedido.</p> : null}
      {errors.catalogo ? <p role="alert">{errors.catalogo}</p> : null}
      {Object.keys(errors).some((key) => key !== 'catalogo') ? <p role="alert">Revise os campos indicados. O pedido ainda não foi enviado.</p> : null}
      <p className="checkout-privacy">Ao confirmar, seus dados serão usados para preparar a mensagem no WhatsApp. Revise antes de enviar. <Link prefetch={false} href="/privacidade">Como seus dados são tratados</Link> · <Link prefetch={false} href="/termos-de-uso">Condições do catálogo</Link></p>
      <form ref={formRef} id="form-checkout" onSubmit={handleSubmit} noValidate>
        <fieldset disabled={submitting} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <div className="pg-layout">
          <div>
            <section style={{ marginBottom: '26px' }}>
              <h2 className="pg-titulo">1. Seus dados</h2>
              <div className="form-grupo">
                <label htmlFor="f-nome">Nome completo *</label>
                <input id="f-nome" name="nome" required autoComplete="name" {...accessibleField('nome')} placeholder="Como podemos te chamar?" value={formData.nome} onChange={handleChange} />
                {errors.nome ? <p id="erro-nome" className="form-erro">{errors.nome}</p> : null}
              </div>
              <div className="form-grupo">
                <label htmlFor="f-whatsapp">WhatsApp *</label>
                <input
                  id="f-whatsapp"
                  name="whatsapp"
                  autoComplete="tel"
                  {...accessibleField('whatsapp')}
                  required
                  inputMode="tel"
                  placeholder="(94) 91234-5678"
                  value={formData.whatsapp}
                  onChange={handleChange}
                />
                {errors.whatsapp ? <p id="erro-whatsapp" className="form-erro">{errors.whatsapp}</p> : null}
              </div>
            </section>

            <section style={{ marginBottom: '26px' }}>
              <h2 className="pg-titulo">2. Endereço (Altamira — PA)</h2>
              <div className="form-col-3">
                <div className="form-grupo">
                  <label htmlFor="f-cep">CEP *</label>
                  <input
                    id="f-cep"
                    name="cep"
                    autoComplete="postal-code"
                    {...accessibleField('cep')}
                    required
                    inputMode="numeric"
                    placeholder="00000-000"
                    value={formData.cep}
                    onChange={handleChange}
                    onBlur={buscarCEP}
                  />
                  {errors.cep ? <p id="erro-cep" className="form-erro">{errors.cep}</p> : null}
                  {cepErro ? <p role="status">{cepErro}</p> : null}
                </div>
                <div className="form-grupo">
                  <label htmlFor="f-estado">Estado</label>
                  <input id="f-estado" name="estado" value={formData.estado} readOnly style={{ background: 'var(--surface)' }} />
                </div>
                <div className="form-grupo">
                  <label htmlFor="f-cidade">Cidade</label>
                  <input id="f-cidade" name="cidade" value={formData.cidade} readOnly style={{ background: 'var(--surface)' }} />
                </div>
              </div>
              <div className="form-grupo">
                <label htmlFor="f-bairro">Bairro *</label>
                <input id="f-bairro" name="bairro" required {...accessibleField('bairro')} list="bairros-entrega" placeholder="Digite ou escolha seu bairro" value={formData.bairro} onChange={handleChange} />
                <datalist id="bairros-entrega">{LEYDE.bairrosEntrega.map((bairro) => <option key={bairro.nome} value={bairro.nome} />)}</datalist>
                {errors.bairro ? <p id="erro-bairro" className="form-erro">{errors.bairro}</p> : null}
              </div>
              <div className="form-col">
                <div className="form-grupo">
                  <label htmlFor="f-rua">Rua *</label>
                  <input id="f-rua" name="rua" required autoComplete="address-line1" {...accessibleField('rua')} placeholder="Nome da rua" value={formData.rua} onChange={handleChange} />
                  {errors.rua ? <p id="erro-rua" className="form-erro">{errors.rua}</p> : null}
                </div>
                <div className="form-grupo">
                  <label htmlFor="f-numero">Número *</label>
                  <input id="f-numero" name="numero" required {...accessibleField('numero')} placeholder="Nº" value={formData.numero} onChange={handleChange} />
                  {errors.numero ? <p id="erro-numero" className="form-erro">{errors.numero}</p> : null}
                </div>
              </div>
              <div className="form-grupo">
                <label htmlFor="f-complemento">Complemento</label>
                <input
                  id="f-complemento"
                  name="complemento"
                  placeholder="Apto, bloco, referência..."
                  value={formData.complemento}
                  onChange={handleChange}
                />
              </div>
              <p id="entrega-msg" role="status" style={{ fontSize: '13px', color: frete.tipo === 'gratis' ? 'var(--success)' : 'var(--muted)', marginTop: '4px' }}>
                {mensagemFrete(frete)}
              </p>
              <DeliveryLocation
                key={[formData.cep, formData.bairro, formData.rua, formData.numero, formData.cidade, formData.estado].join('|')}
                value={localizacao}
                onChange={setLocalizacao}
              />
            </section>

            <section>
              <h2 className="pg-titulo" id="titulo-pagamento">3. Forma de pagamento</h2>
              <div id="pagamento-area">
                <div className="pagamento-opcoes" id="pag-opcoes" role="radiogroup" aria-labelledby="titulo-pagamento">
                  {LEYDE.formasPagamento.map((forma) => (
                    <label key={forma}>
                      <input
                        type="radio"
                        name="pagamento"
                        value={forma}
                        checked={formData.pagamento === forma}
                        onChange={handleChange}
                      />
                      <span className="pg-ico">{paymentIcon(forma)}</span>
                      <span>{forma}</span>
                    </label>
                  ))}
                </div>
                {errors.pagamento ? <p className="form-erro">{errors.pagamento}</p> : null}
                {cartaoCredito ? <div className="form-grupo" style={{ marginTop: '16px' }}>
                  <label htmlFor="f-parcelas">Parcelamento no cartão de crédito</label>
                  <select id="f-parcelas" name="parcelas" value={formData.parcelas} onChange={handleChange} aria-invalid={Boolean(errors.parcelas)} aria-describedby={`parcelas-ajuda${errors.parcelas ? ' erro-parcelas' : ''}`}>
                    <option value="1">{descricaoParcelas(total, 1)}</option>
                    <option value="2" disabled={!permiteDuasParcelas}>{permiteDuasParcelas ? descricaoParcelas(total, 2) : '2x indisponível para este valor'}</option>
                  </select>
                  <p id="parcelas-ajuda" style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '8px' }}>
                    Escolha 1x ou no máximo 2x. {total == null ? 'O valor de cada parcela depende da confirmação do frete.' : 'As parcelas incluem o frete informado acima.'}
                  </p>
                  {errors.parcelas ? <p id="erro-parcelas" className="form-erro">{errors.parcelas}</p> : null}
                </div> : null}
              </div>
            </section>
          </div>

          <aside className="resumo">
            <h3>Resumo do pedido</h3>
            <div id="resumo-linhas">
              {linhas.map((linha) => (
                <div key={linha.produto.slug} className="linha">
                  <span>
                    {linha.produto.nome.slice(0, 40)} × {linha.qtd}
                  </span>
                  <span>{formatarBRL(multiplicarPreco(linha.produto.preco, linha.qtd))}</span>
                </div>
              ))}
            </div>
            <div className="linha" id="linha-subtotal">
              <span>Subtotal</span>
              <span id="r-subtotal">{temPrecos ? formatarBRL(subtotal) : 'a definir'}</span>
            </div>
            <div className="linha" id="linha-entrega">
              <span>Entrega</span>
              <span id="r-entrega">{resumoFrete(frete)}</span>
            </div>
            <div className="linha total">
              <span>Total</span>
              <span id="r-total">{textoTotalPedido({ total, subtotal })}</span>
            </div>
            <div className="linha"><span>Pagamento</span><span id="r-pagamento" style={{ textAlign: 'right', maxWidth: '65%' }}>{pagamentoResumo}</span></div>
            <button type="submit" className="btn solid block" id="btn-confirmar" disabled={submitting}>
              {submitting ? 'Processando...' : 'Confirmar pedido'}
            </button>
            <div className="aviso">Ao confirmar, você será encaminhado ao WhatsApp para finalizar a compra.</div>
          </aside>
        </div>
        </fieldset>
      </form>
    </main>
  );
}
