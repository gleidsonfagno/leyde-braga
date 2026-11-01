# Navegação e carregamento

## Visual restaurado

As listas de categorias e marcas voltaram ao formato de links anterior ao commit `472ccc0`. O menu superior, as cores, as fontes, os produtos e os URLs dos filtros foram preservados.

## Ajustes de desempenho

- Marcas e categorias públicas usam o Data Cache do Next.js com revalidação de 60 segundos. Foi confirmada a criação de apenas duas entradas de cache: `/brands` e `/categories`, ambas HTTP 200. A revalidação ocorre após o intervalo; a infraestrutura pode continuar servindo a última resposta válida durante a atualização ou uma falha da API.
- Produtos, preços, detalhes e consultas do carrinho continuam com `no-store`. O checkout mantém a conferência dos preços antes de montar o pedido.
- O layout usa `revalidate = 0`, que mantém as páginas dinâmicas e permite o cache explícito das taxonomias. O antigo `force-dynamic` desabilitava esse cache.
- No início, produtos e taxonomias são consultados em paralelo.
- `app/loading.jsx` permite preparar a estrutura de carregamento no menu principal. Uma fronteira de Suspense por combinação de filtros também sinaliza a troca de categoria, marca, busca ou página. Os links de produtos e filtros continuam sem prefetch automático para evitar antecipar dezenas de consultas.
- Nenhuma dependência, credencial ou alteração na API administrativa foi adicionada.

## Verificação local em 01/11/2026

Build de produção e 23 testes unitários aprovados. A integração de leitura conferiu os 28 produtos, sete marcas, 16 categorias, paginação, filtros, busca, detalhes, carrinho e campos privados. No navegador, Perfumes mostrou 16 itens; combinado com O Boticário, mostrou cinco. O estado de carregamento apareceu nas transições, e não houve erro de console.

Tempos de leitura completa do HTML, medidos com `Invoke-WebRequest` na mesma sequência de URLs:

| Leitura | Antes | Depois |
| --- | ---: | ---: |
| Cuidados corporais, primeiro acesso | 3.125 ms | 16.187 ms |
| Perfumes, acesso seguinte | 544 ms | 378 ms |
| Cuidados corporais, acesso seguinte | 495 ms | 246 ms |

São amostras locais, sem garantia de desempenho em produção. As leituras seguintes ficaram mais rápidas, mas o primeiro acesso apresentou um pico de espera cuja causa exata não foi comprovada. Uma consulta direta posterior à API levou de 509 a 835 ms nos três endpoints públicos verificados. O cache reduz chamadas repetidas; ele não elimina a dependência da rede/API para carregar produtos. Nenhum produto nem pedido de produção foi alterado durante a verificação.

Referências: [configuração de revalidação do Next.js 15](https://nextjs.org/docs/15/app/api-reference/file-conventions/route-segment-config), [carregamento e streaming](https://nextjs.org/docs/15/app/api-reference/file-conventions/loading), [prefetch parcial](https://nextjs.org/docs/15/app/guides/prefetching).
