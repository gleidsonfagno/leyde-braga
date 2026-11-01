export function centavos(valor) {
  const texto = String(valor ?? '0');
  if (!/^\d+(?:\.\d{1,2})?$/.test(texto)) throw new Error('Valor monetário inválido.');
  const [inteiro, fracao = ''] = texto.split('.');
  return BigInt(inteiro) * 100n + BigInt(fracao.padEnd(2, '0'));
}

export function decimal(valorEmCentavos) {
  return `${valorEmCentavos / 100n}.${String(valorEmCentavos % 100n).padStart(2, '0')}`;
}

export function somarValores(...valores) {
  return decimal(valores.reduce((total, valor) => total + centavos(valor), 0n));
}

export function multiplicarPreco(preco, quantidade) {
  if (!Number.isSafeInteger(quantidade) || quantidade < 0) throw new Error('Quantidade inválida.');
  return decimal(centavos(preco) * BigInt(quantidade));
}

export function subtotalCarrinho(linhas) {
  return somarValores(...linhas.map(({ produto, qtd }) => multiplicarPreco(produto.preco, qtd)));
}

export function formatarBRL(valor) {
  const [inteiro, fracao] = decimal(centavos(valor)).split('.');
  return `R$\u00a0${inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${fracao}`;
}
