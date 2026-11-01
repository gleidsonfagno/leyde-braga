import { LEYDE } from './config.js';
import { formatarBRL, multiplicarPreco } from './money.js';
import { mapaLocalizacao } from './location.js';
import { textoFretePedido, textoTotalPedido } from './delivery.js';
import { descreverPagamento } from './payment.js';

export function formatarNumeroPedido(numero) {
  if (!numero) return `${LEYDE.prefixoPedido}000`;
  return `${LEYDE.prefixoPedido}${String(numero).padStart(3, '0')}`;
}

export function montarMensagemPedido(pedido) {
  if (!pedido) {
    return 'Olá! Gostaria de finalizar meu pedido.';
  }

  const numeroDisplay = formatarNumeroPedido(pedido.numero);
  const mapa = mapaLocalizacao(pedido.endereco?.localizacao);
  const linhas = [
    `Pedido ${numeroDisplay}`,
    `Cliente: ${pedido.nome || ''}`,
    `WhatsApp: ${pedido.whatsapp || ''}`,
    '',
    'Itens:',
    ...(pedido.itens || []).map((item) => {
      const totalItem = item.preco != null ? formatarBRL(multiplicarPreco(item.preco, item.qtd)) : 'a definir';
      return `- ${item.nome} x${item.qtd} (${totalItem})`;
    }),
    '',
    `Subtotal: ${pedido.subtotal ? formatarBRL(pedido.subtotal) : 'a definir'}`,
    `Entrega: ${textoFretePedido(pedido)}`,
    `Total: ${textoTotalPedido(pedido)}`,
    '',
    'Endereço:',
    `${pedido.endereco?.rua || ''}, ${pedido.endereco?.numero || ''}`,
    `${pedido.endereco?.bairro || ''} - ${pedido.endereco?.cidade || ''}/${pedido.endereco?.estado || ''}`,
    pedido.endereco?.complemento ? `Complemento: ${pedido.endereco.complemento}` : null,
    pedido.endereco?.cep ? `CEP: ${pedido.endereco.cep}` : null,
    mapa ? `Localização para entrega (ponto capturado): ${mapa}` : null,
    '',
    `Pagamento: ${descreverPagamento(pedido)}`,
  ].filter(Boolean);

  return linhas.join('\n');
}
