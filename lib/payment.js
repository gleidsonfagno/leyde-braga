import { centavos, decimal, formatarBRL } from './money.js';
import { normalizeText } from './text.js';

export const MAX_PARCELAS_CARTAO = 2;
export const ehCartaoCredito = (forma) => normalizeText(forma).trim() === 'cartao de credito';

export function parcelasDoPagamento(forma, valor = 1) {
  if (!ehCartaoCredito(forma)) return 1;
  if (!['1', '2'].includes(String(valor))) throw new Error('Escolha 1x ou 2x no cartão de crédito.');
  return Number(valor);
}

export function dividirParcelas(total, parcelas) {
  if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > MAX_PARCELAS_CARTAO) throw new Error('O cartão de crédito permite no máximo 2x.');
  const valor = centavos(total);
  if (parcelas > 1 && valor < BigInt(parcelas)) throw new Error('Este valor não permite duas parcelas. Selecione 1x.');
  const base = valor / BigInt(parcelas);
  const resto = valor % BigInt(parcelas);
  return Array.from({ length: parcelas }, (_, indice) => decimal(base + (BigInt(indice) < resto ? 1n : 0n)));
}

export function descricaoParcelas(total, parcelas) {
  if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > MAX_PARCELAS_CARTAO) throw new Error('Escolha 1x ou 2x.');
  if (total == null) return `${parcelas}x — valores a confirmar após o frete`;
  const valores = dividirParcelas(total, parcelas);
  if (valores.every((valor) => valor === valores[0])) return `${parcelas}x de ${formatarBRL(valores[0])}`;
  return `${parcelas}x: ${valores.map(formatarBRL).join(' + ')}`;
}

export function descreverPagamento(pedido) {
  const forma = pedido.pagamento || 'a combinar';
  if (!ehCartaoCredito(forma)) return forma;
  return `${forma} — ${descricaoParcelas(pedido.total, parcelasDoPagamento(forma, pedido.parcelas))}`;
}
