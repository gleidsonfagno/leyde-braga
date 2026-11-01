import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apresentacaoCatalogo } from '../lib/catalog-presentation.js';
import { IMAGEM_PADRAO } from '../lib/catalog.js';

const categorias = ['perfumes', 'cuidados-corporais', 'cuidados-capilares', 'maquiagem'].map((slug) => ({ id: slug, slug, nome: slug }));
const produto = (slug, categoria, foto = true) => ({ slug, categoria, nome: `Produto ${slug}`, marca: 'Marca', imagem: foto ? `https://example.com/${slug}.jpg` : IMAGEM_PADRAO, imagens: foto ? [{ url: `https://example.com/${slug}.jpg`, alt: `Foto ${slug}` }] : [], cost: 'privado' });

test('banner usa somente perfumes reais com foto, limita a três e não repassa campos privados', () => {
  const produtos = [produto('sem-foto', 'perfumes', false), produto('creme', 'hidratante-corporal'), ...['a', 'b', 'c', 'd'].map((slug) => produto(slug, 'perfumes'))];
  const result = apresentacaoCatalogo(categorias, produtos);
  assert.deepEqual(result.destaques.map((item) => item.slug), ['a', 'b', 'c']);
  assert.equal(result.destaques[0].alt, 'Foto a');
  assert.equal(JSON.stringify(result.destaques).includes('privado'), false);
});

test('cada categoria usa foto relacionada e aponta para a categoria real do produto', () => {
  const result = apresentacaoCatalogo(categorias, [produto('perfume', 'perfumes'), produto('creme', 'hidratante-corporal'), produto('leave-in', 'cuidados-capilares'), produto('batom', 'maquiagem', false)]);
  const corpo = result.categorias.find((item) => item.tema === 'corpo');
  assert.equal(corpo.imagem, 'https://example.com/creme.jpg');
  assert.equal(corpo.categoriaDestino, 'hidratante-corporal');
  assert.equal(result.categorias.find((item) => item.tema === 'cabelos').produtoNome, 'Produto leave-in');
  const maquiagem = result.categorias.find((item) => item.tema === 'maquiagem');
  assert.equal(maquiagem.imagem, null);
  assert.equal(maquiagem.categoriaDestino, 'maquiagem');
});

test('catálogo sem fotos não inventa destaques nem usa um perfume em outra categoria', () => {
  const result = apresentacaoCatalogo(categorias, [produto('perfume', 'perfumes', false)]);
  assert.deepEqual(result.destaques, []);
  assert.ok(result.categorias.every((item) => item.imagem === null));
});
