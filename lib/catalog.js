import { normalizeText } from './text.js';

export const IMAGEM_PADRAO = '/assets/images/product-placeholder.svg';
export const slugValido = (slug) => typeof slug === 'string' && slug.length <= 160 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);

export function adaptarTaxonomia(item) {
  if (!item || typeof item.id !== 'string' || typeof item.name !== 'string' || !slugValido(item.slug)) {
    throw new Error('Resposta de catálogo inválida.');
  }
  return { id: item.id, nome: item.name, slug: item.slug };
}

export function adaptarProduto(item) {
  if (!item || typeof item.id !== 'string' || !slugValido(item.slug) || typeof item.name !== 'string'
    || typeof item.price !== 'string' || !/^\d+\.\d{2}$/.test(item.price) || !Array.isArray(item.images)) {
    throw new Error('Resposta de produto inválida.');
  }
  const marca = adaptarTaxonomia(item.brand);
  const categoria = adaptarTaxonomia(item.category);
  const imagens = item.images.filter((imagem) => {
    try { return new URL(imagem.url).protocol === 'https:'; } catch { return false; }
  }).map((imagem) => ({
    id: String(imagem.id), url: imagem.url, alt: typeof imagem.alt === 'string' ? imagem.alt : item.name,
    ordem: Number.isInteger(imagem.order) ? imagem.order : 0,
  })).sort((a, b) => a.ordem - b.ordem || a.id.localeCompare(b.id));

  // Lista explícita: nunca repassar custo, estoque ou campos administrativos ao navegador.
  return {
    id: item.id, codigo: typeof item.code === 'string' ? item.code : '', slug: item.slug,
    nome: item.name, descricao: typeof item.description === 'string' ? item.description : '',
    marca: marca.nome, marcaSlug: marca.slug, categoria: categoria.slug, categoriaNome: categoria.nome,
    preco: item.price, imagem: imagens[0]?.url || IMAGEM_PADRAO, imagens,
    disponibilidade: 'sob-consulta',
  };
}

export function estoqueLabel() {
  // O contrato público não divulga estoque. Não presumir disponibilidade ou quantidade.
  return { txt: 'Consulte disponibilidade', cls: '' };
}

const grupos = [
  { slugs: ['perfumes', 'perfumaria'], imagem: 'cat-perfumaria.jpg' },
  { slugs: ['cuidados-corporais', 'corpo-e-banho', 'hidratante-corporal'], imagem: 'cat-corpo.jpg' },
  { slugs: ['cuidados-capilares', 'cabelos'], imagem: 'cat-cabelos.jpg' },
  { slugs: ['maquiagem', 'batom'], imagem: 'cat-maquiagem.jpg' },
];

export function categoriasPrincipais(categorias) {
  const selecionadas = grupos.map((grupo) => {
    const categoria = grupo.slugs.map((slug) => categorias.find((item) => item.slug === slug)).find(Boolean);
    return categoria ? { ...categoria, imagem: `/assets/images/banners/${grupo.imagem}` } : null;
  }).filter(Boolean);
  for (const categoria of categorias) {
    if (selecionadas.length >= 4) break;
    if (!selecionadas.some((item) => item.slug === categoria.slug)) {
      selecionadas.push({ ...categoria, imagem: '/assets/images/banners/cat-perfumaria.jpg' });
    }
  }
  return selecionadas;
}

const textoUnico = (valor) => typeof valor === 'string' ? valor : '';
const slugDoTexto = (valor) => normalizeText(valor).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function filtrosDoCatalogo(params, { categorias, marcas }) {
  const resolver = (valor, itens) => {
    const texto = textoUnico(valor);
    return itens.find((item) => item.slug === texto || item.id === texto || normalizeText(item.nome) === normalizeText(texto))?.slug || slugDoTexto(texto);
  };
  let categoria = resolver(params.cat, categorias);
  const grupoAntigo = grupos.find((grupo) => grupo.slugs.includes(categoria));
  if (grupoAntigo && !categorias.some((item) => item.slug === categoria)) {
    categoria = grupoAntigo.slugs.find((slug) => categorias.some((item) => item.slug === slug)) || categoria;
  }
  const pagina = Number(params.page);
  return {
    categoria: categoria.slice(0, 160), marca: resolver(params.marca, marcas).slice(0, 160),
    q: textoUnico(params.q).trim().slice(0, 200),
    page: Number.isInteger(pagina) && pagina >= 1 && pagina <= 100000 ? pagina : 1,
  };
}

export function categoriaHref(categoria = '', marca = '', q = '', page = 1) {
  const params = new URLSearchParams();
  if (categoria) params.set('cat', categoria);
  if (marca) params.set('marca', marca);
  if (q) params.set('q', q);
  if (page > 1) params.set('page', String(page));
  return `/categoria${params.size ? `?${params}` : ''}`;
}
