export const LEYDE = {
  nomeLoja: 'LEYDE BRAGA',
  cidade: 'Altamira',
  uf: 'PA',
  instagram: 'flor_da_manha_leydebraga',
  whatsapp: '559491653467',
  whatsappExibicao: '(94) 9165-3467',
  horario: [
    { dias: 'Segunda a Sexta', horas: '08h às 18h' },
    { dias: 'Sábado', horas: '08h às 14h' },
    { dias: 'Domingo', horas: 'Fechado' },
  ],
  categorias: [
    { id: 'perfumaria', nome: 'Perfumaria', desc: 'Fragrâncias exclusivas para ele e para ela.' },
    { id: 'corpo-e-banho', nome: 'Corpo & Banho', desc: 'Hidratantes e cuidados corporais.' },
    { id: 'cabelos', nome: 'Cabelos', desc: 'Shampoos e tratamento para seus fios.' },
    { id: 'maquiagem', nome: 'Maquiagem', desc: 'Beleza com acabamento sofisticado.' },
  ],
  marcas: ['Natura', 'Hinode', 'O Boticário', 'Mary Kay'],
  bairrosEntrega: [
    { nome: 'Ayrton Senna', valor: '0.00', aliases: ['Ayrton Senna I', 'Ayrton Senna 1', 'Airton Senna', 'Ayrton Sena', 'Ayton Seena'] },
    { nome: 'Ayrton Senna II', valor: '0.00', aliases: ['Ayrton Senna 2', 'Airton Senna 2', 'Ayrton Sena 2', 'Aytoin Sena 2'] },
    { nome: 'Casa Nova', valor: '0.00', aliases: ['Casanova'] },
    { nome: 'São Joaquim', valor: '0.00', aliases: ['São Joaquin', 'Sao Joaquin'] },
    { nome: 'Liberdade', valor: '0.00' },
  ],
  entregaMinimaEstimada: '5.00',
  formasPagamento: ['Pix', 'Dinheiro', 'Cartão de crédito', 'Boleto'],
  prefixoPedido: 'LB',
};

export function whatsappLink(texto) {
  const phone = String(LEYDE.whatsapp || '').replace(/\D/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(texto || '')}`;
}

export function categoriaDe(id) {
  return (LEYDE.categorias || []).find((categoria) => categoria.id === id) || null;
}
