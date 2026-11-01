import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularFrete, resumoFrete, totalComFrete } from '../lib/delivery.js';
import { montarMensagemPedido } from '../lib/order.js';

const endereco = { cidade: 'Altamira', estado: 'PA', bairro: '' };

test('os cinco bairros autorizados e seus nomes equivalentes têm entrega grátis', () => {
  for (const bairro of ['Ayrton Senna', 'Ayrton Senna 1', 'Ayrton Senna II', 'Ayrton Senna 2', 'Casa Nova', 'São Joaquim', 'Sao Joaquin', ' Bairro   Liberdade ']) {
    const frete = calcularFrete({ ...endereco, bairro });
    assert.equal(frete.tipo, 'gratis', bairro);
    assert.equal(frete.valor, '0.00');
    assert.equal(totalComFrete('369.70', frete), '369.70');
    assert.equal(resumoFrete(frete), 'Grátis');
  }
});

test('bairro não cadastrado recebe estimativa, nunca taxa fechada nem total inventado', () => {
  for (const bairro of ['Centro', 'Liberdade Nova', 'Ayrton Senna III']) {
    const frete = calcularFrete({ ...endereco, bairro });
    assert.equal(frete.tipo, 'estimativa');
    assert.equal(frete.minimo, '5.00');
    assert.equal(frete.valor, null);
    assert.equal(totalComFrete('369.70', frete), null);
    assert.match(resumoFrete(frete), /A partir de R\$\s5,00 \(a confirmar\)/);
  }
});

test('bairro igual em outra cidade ou estado não recebe gratuidade de Altamira', () => {
  for (const local of [{ cidade: 'Belém', estado: 'PA' }, { cidade: 'Altamira', estado: 'AM' }, { cidade: '', estado: '' }]) {
    const frete = calcularFrete({ ...local, bairro: 'Liberdade' });
    assert.equal(frete.tipo, 'fora-area');
    assert.equal(frete.valor, null);
    assert.equal(frete.minimo, null);
  }
  assert.equal(calcularFrete(endereco).tipo, 'aguardando');
});

test('uma taxa expressamente cadastrada soma centavos com precisão', () => {
  const configuracao = { cidade: 'Altamira', uf: 'PA', bairrosEntrega: [{ nome: 'Bairro de teste', valor: '5.10' }], entregaMinimaEstimada: '5.00' };
  const frete = calcularFrete({ ...endereco, bairro: 'Bairro de teste' }, configuracao);
  assert.equal(frete.tipo, 'fixo');
  assert.equal(totalComFrete('0.20', frete), '5.30');
});

test('WhatsApp recebe grátis e total conhecido ou estimativa e subtotal a confirmar', () => {
  const gratis = calcularFrete({ ...endereco, bairro: 'Liberdade' });
  const estimativa = calcularFrete({ ...endereco, bairro: 'Centro' });
  const base = { numero: 1, itens: [], subtotal: '369.70' };
  const mensagemGratis = montarMensagemPedido({ ...base, frete: gratis, entrega: gratis.valor, total: totalComFrete(base.subtotal, gratis) });
  assert.match(mensagemGratis, /Entrega: Grátis/);
  assert.match(mensagemGratis, /Total: R\$\s369,70/);
  const mensagemEstimada = montarMensagemPedido({ ...base, frete: estimativa, entrega: null, total: null });
  assert.match(mensagemEstimada, /Entrega: A partir de R\$\s5,00 \(a confirmar\)/);
  assert.match(mensagemEstimada, /Total: R\$\s369,70 \+ frete a confirmar/);
});
