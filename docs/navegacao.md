# Navegação e carregamento

## Visual restaurado

As listas de categorias e marcas voltaram ao formato de links anterior ao commit `472ccc0`. O menu superior, as cores, as fontes, os produtos e os URLs dos filtros foram preservados.

## Ajustes de desempenho

- Marcas e categorias públicas usam o Data Cache do Next.js com revalidação de 60 segundos. Foi confirmada a criação de apenas duas entradas de cache: `/brands` e `/categories`, ambas HTTP 200. A revalidação ocorre após o intervalo; a infraestrutura pode continuar servindo a última resposta válida durante a atualização ou uma falha da API.
- Páginas de exibição usam `catalogVitrineApi`, com revalidação pública de 15 segundos para listagens e detalhes. Pesquisas digitadas usam `no-store`. Carrinho e checkout mantêm `catalogApi` separado, sem cache, para a conferência atual dos produtos e preços antes de montar o pedido. Na exibição, alterações podem aparecer após a revalidação; em falha da API, o Next pode conservar a última resposta válida. O cache não é uma garantia de atualização em até 15 segundos.
- O layout usa `revalidate = 0`, que mantém as páginas dinâmicas e permite o cache explícito das taxonomias. O antigo `force-dynamic` desabilitava esse cache.
- No início, produtos e taxonomias são consultados em paralelo.
- `app/loading.jsx` permite preparar a estrutura de carregamento no menu principal. Uma fronteira de Suspense por combinação de filtros também sinaliza a troca de categoria, marca, busca ou página. `CatalogLink` habilita a preparação parcial de uma rota ao apontar ou receber foco, usando o comportamento padrão de rotas dinâmicas com loading do Next.js 15. Não habilita prefetch completo de todos os produtos visíveis, nem armazenamento global de páginas por cinco minutos. A primeira consulta ainda depende da API.
- O cliente de exibição limita cada tentativa a oito segundos e mantém uma única repetição para falhas transitórias. O cliente de conferência permanece com o timeout original de 15 segundos. Uma falha completa ainda pode exigir uma nova tentativa do visitante; encurtar o timeout não corrige indisponibilidade do servidor.
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

## Diagnóstico posterior: troca de categorias e abertura de produtos

O usuário identificou lentidão nessas duas operações. Antes do cache de exibição, a página inicial levou 1.628 ms para baixar todo o HTML, e as listagens da API levaram 907–986 ms. Três fotos de perfumes tinham aproximadamente 7–12 KB e foram baixadas em 280–304 ms. Em uma medição específica, `/products?category=perfumes` levou 3.543 ms; o detalhe do Quasar, consultado em seguida, levou 341 ms. As respectivas páginas locais, com a API já aquecida, levaram 358 ms e 189 ms. Isso confirma oscilação na espera da API; não comprova se a origem exata é inicialização da função, banco ou rede.

Foi introduzido cache curto apenas para exibição e preparação de rota por intenção. Testes protegem a separação entre esse cache, pesquisas e a leitura atual de preços no fluxo de pedido. Os links e o visual foram preservados. Nenhuma mudança foi feita na API administrativa ou no banco de produção.

Após a mudança, duas leituras consecutivas com cache disponível levaram 141/69 ms na categoria Perfumes e 58/39 ms no detalhe do Quasar. Medições de download completo do HTML local em modo de produção, sem incluir a renderização no navegador; não representam tempo garantido para o primeiro acesso ou produção. Build e 33 testes aprovados. A integração de leitura passou com 58 produtos, oito marcas e 16 categorias, incluindo filtros, paginação, busca, detalhe, carrinho, campos privados e entradas inválidas.

Referências: [configuração de revalidação do Next.js 15](https://nextjs.org/docs/15/app/api-reference/file-conventions/route-segment-config), [carregamento e streaming](https://nextjs.org/docs/15/app/api-reference/file-conventions/loading), [prefetch parcial](https://nextjs.org/docs/15/app/guides/prefetching).
