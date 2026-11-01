import { LEYDE } from './config.js';
import { centavos, formatarBRL, somarValores } from './money.js';
import { normalizeText } from './text.js';

const normalizar = (valor) => normalizeText(valor).trim().replace(/^bairro\s+/, '').replace(/\s+/g, ' ');

export function calcularFrete(endereco, configuracao = LEYDE) {
  const bairro = normalizar(endereco.bairro);
  if (!bairro) return { tipo: 'aguardando', bairro: '', valor: null, minimo: null };
  if (normalizar(endereco.cidade) !== normalizar(configuracao.cidade)
    || normalizar(endereco.estado) !== normalizar(configuracao.uf)) {
    return { tipo: 'fora-area', bairro: String(endereco.bairro).trim(), valor: null, minimo: null };
  }
  const regra = configuracao.bairrosEntrega.find((regra) => [regra.nome, ...(regra.aliases || [])].some((nome) => normalizar(nome) === bairro));
  if (regra) {
    const valor = somarValores(regra.valor);
    return { tipo: centavos(valor) === 0n ? 'gratis' : 'fixo', bairro: regra.nome, valor, minimo: null };
  }
  return { tipo: 'estimativa', bairro: String(endereco.bairro).trim(), valor: null, minimo: somarValores(configuracao.entregaMinimaEstimada) };
}

export function resumoFrete(frete) {
  if (frete.valor != null) return centavos(frete.valor) === 0n ? 'Grátis' : formatarBRL(frete.valor);
  if (frete.minimo != null) return `A partir de ${formatarBRL(frete.minimo)} (a confirmar)`;
  return 'A combinar';
}

export function mensagemFrete(frete) {
  if (frete.tipo === 'aguardando') return 'Informe o bairro para consultar a entrega.';
  if (frete.tipo === 'fora-area') return 'O cálculo automático atende Altamira/PA. Para este endereço, combine a entrega com a loja.';
  if (frete.tipo === 'gratis') return `Entrega grátis em ${frete.bairro}. Confira o endereço antes de confirmar.`;
  if (frete.tipo === 'fixo') return `Entrega em ${frete.bairro}: ${formatarBRL(frete.valor)}.`;
  return `Entrega em ${frete.bairro}: a partir de ${formatarBRL(frete.minimo)}. A taxa final será confirmada pelo WhatsApp; não é uma cobrança fechada.`;
}

export function totalComFrete(subtotal, frete) {
  return frete.valor == null ? null : somarValores(subtotal, frete.valor);
}

export function textoTotalPedido(pedido) {
  if (pedido.total != null) return formatarBRL(pedido.total);
  if (pedido.subtotal != null) return `${formatarBRL(pedido.subtotal)} + frete a confirmar`;
  return 'a definir';
}

export function textoFretePedido(pedido) {
  if (pedido.frete) return resumoFrete(pedido.frete);
  if (pedido.entrega == null) return 'a combinar';
  return centavos(pedido.entrega) === 0n ? 'Grátis' : formatarBRL(pedido.entrega);
}
