import { test } from 'node:test';
import assert from 'node:assert/strict';
import { descricaoParcelas, descreverPagamento, dividirParcelas, parcelasDoPagamento } from '../lib/payment.js';
import { centavos } from '../lib/money.js';
import { montarMensagemPedido } from '../lib/order.js';

test('cartão aceita somente 1x ou 2x; outros meios não herdam parcelamento', () => {
  assert.equal(parcelasDoPagamento('Cartão de crédito', '1'), 1);
  assert.equal(parcelasDoPagamento('Cartão de crédito', '2'), 2);
  for (const valor of ['3', '0', '2.5', '2e0', '', 'abc', -1]) assert.throws(() => parcelasDoPagamento('Cartão de crédito', valor));
  assert.equal(parcelasDoPagamento('Pix', 2), 1);
  assert.equal(descreverPagamento({ pagamento: 'Pix', parcelas: 2, total: '100.00' }), 'Pix');
  assert.throws(() => dividirParcelas('100.00', 3));
});

test('duas parcelas de um total par fecham exatamente o valor do pedido', () => {
  assert.deepEqual(dividirParcelas('369.70', 2), ['184.85', '184.85']);
  assert.match(descricaoParcelas('369.70', 2), /^2x de R\$\s184,85$/);
  assert.deepEqual(dividirParcelas('369.70', 1), ['369.70']);
});

test('centavo ímpar é distribuído, sem arredondar nem aumentar o total', () => {
  const parcelas = dividirParcelas('369.71', 2);
  assert.deepEqual(parcelas, ['184.86', '184.85']);
  assert.equal(parcelas.reduce((total, parcela) => total + centavos(parcela), 0n), centavos('369.71'));
  assert.match(descricaoParcelas('369.71', 2), /184,86 \+ R\$\s184,85/);
  assert.throws(() => dividirParcelas('0.01', 2));
  assert.deepEqual(dividirParcelas('0.00', 1), ['0.00']);
});

test('frete pendente não gera parcelas de um total desconhecido', () => {
  const descricao = descreverPagamento({ pagamento: 'Cartão de crédito', parcelas: 2, total: null });
  assert.equal(descricao, 'Cartão de crédito — 2x — valores a confirmar após o frete');
  assert.equal(descricao.includes('R$'), false);
});

test('mensagem WhatsApp preserva escolha de 2x e inclui parcelas do total com frete', () => {
  const mensagem = montarMensagemPedido({ numero: 1, itens: [], subtotal: '100.00', entrega: '5.00', total: '105.00', pagamento: 'Cartão de crédito', parcelas: 2 });
  assert.match(mensagem, /Pagamento: Cartão de crédito — 2x de R\$\s52,50/);
  assert.match(descreverPagamento({ pagamento: 'Cartão de crédito', total: '105.00' }), /1x de R\$\s105,00/);
});
