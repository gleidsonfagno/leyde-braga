import { categoriasPrincipais, IMAGEM_PADRAO } from './catalog.js';

const relacionados = {
  corpo: ['cuidados-corporais', 'corpo-e-banho', 'hidratante-corporal', 'hidratantes-corporais', 'hidratante-corporal-refil', 'oleos-corporais', 'sabonetes', 'desodorantes'],
  perfumaria: ['perfumes', 'perfumaria'],
  cabelos: ['cuidados-capilares', 'cabelos'],
  maquiagem: ['maquiagem', 'batom'],
};
const temFoto = (produto) => produto.imagem && produto.imagem !== IMAGEM_PADRAO && produto.imagens?.length > 0;

export function apresentacaoCatalogo(categorias, produtos) {
  const fotos = produtos.filter(temFoto);
  const destaques = fotos.filter((produto) => relacionados.perfumaria.includes(produto.categoria)).slice(0, 3).map((produto) => ({
    slug: produto.slug, nome: produto.nome, marca: produto.marca, imagem: produto.imagem,
    alt: produto.imagens.find((imagem) => imagem.url === produto.imagem)?.alt || produto.nome,
  }));
  const tiles = categoriasPrincipais(categorias).map((categoria) => {
    const slugs = relacionados[categoria.tema] || [categoria.slug];
    const produto = fotos.find((item) => item.categoria === categoria.slug) || fotos.find((item) => slugs.includes(item.categoria));
    return { ...categoria, imagem: produto?.imagem || null, produtoNome: produto?.nome || '', categoriaDestino: produto?.categoria || categoria.slug };
  });
  return { destaques, categorias: tiles };
}
