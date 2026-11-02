# Integração da vitrine com o catálogo real

Verificação realizada em 01/11/2026.

## Fluxo implementado

O visitante acessa a vitrine, que consulta a API pública do projeto administrativo no servidor, adapta somente os campos permitidos e renderiza os produtos reais. O carrinho guarda slugs e quantidades e consulta os produtos atuais por uma rota pública de leitura na própria vitrine. Antes de abrir o WhatsApp, o checkout confere novamente os itens e preços.

API utilizada: `https://leyde-braga-admin.vercel.app/api/v1`.

- Início, busca, filtros, paginação, marcas, categorias, detalhes e imagens consomem a API real.
- O catálogo tinha 28 produtos públicos, sete marcas ativas e 16 categorias ativas no momento da verificação. Esses números não estão fixados na aplicação.
- A navegação principal mantém quatro categorias de apresentação; o catálogo disponibiliza todos os filtros retornados pela API.
- As duas vitrines da página inicial mostram os primeiros 12 produtos da listagem da API. Não é atribuído um campo de destaque inexistente no backend.
- Composição, modo de uso e estoque não são simulados. O contrato público atual não fornece esses campos. O parcelamento em até 2x foi autorizado pela loja e é escolhido somente no checkout, conforme `docs/checkout.md`.
- O detalhe mostra até quatro produtos relacionados da mesma categoria, excluindo o produto atual e duplicações. Uma única consulta de até cinco produtos usa o cache de exibição. A seção carrega separadamente em Suspense, sem aguardar as recomendações para apresentar o produto principal. Sem alternativas ou em falha da consulta, a seção fica oculta.
- O catálogo de exemplo permanece em `lib/products.js` como referência histórica, sem importação pela aplicação ou fallback automático.
- CSS, fontes, banners e configurações de imagem foram preservados. Imagens de produtos vêm das URLs da API, com alternativa visual neutra quando ausentes ou indisponíveis.
- Pedidos e atendimento seguem pelo WhatsApp. Não foi criada uma rota de pedidos nem um processamento de pagamento.

## Verificação

| Fronteira | Resultado |
| --- | --- |
| Compilação da vitrine | `npm run build` concluído com sucesso. |
| Validação, adaptação e valores monetários | Oito testes unitários aprovados em `npm test`. |
| API real → páginas da vitrine | `npm run test:integration` aprovado após a correção da API. Conferidos os produtos das duas páginas, todas as marcas e categorias, filtros combinados e detalhe. |
| Navegador → carrinho → checkout | Produto real adicionado; duas unidades de R$ 89,90 resultaram em R$ 179,80. Checkout carregou os mesmos itens e bloqueou a confirmação com campos obrigatórios vazios. |
| Detalhe e imagens | Produto Quasar carregado com imagem válida, preço, descrição e especificações públicas. Sem erros de console nessa verificação. |
| Campos privados e falhas | Testes confirmaram descarte de custo, estoque e campos administrativos; entradas inválidas e produtos inexistentes são tratados sem dados fictícios. |
| Consultas simultâneas | Cinco leituras públicas concorrentes retornaram HTTP 200 após o ajuste da API. |

Nenhum pedido foi enviado pelo WhatsApp e nenhum registro de produção foi criado, modificado ou excluído pelos testes.

## Ajuste necessário na API administrativa

Durante a integração, a API retornou HTTP 500 intermitente. Os logs da implantação anterior registraram erros Prisma `P2028` nas listagens. O projeto utilizava um pool de uma conexão e transações nas consultas de paginação.

No repositório `E:\Leyde\admin`, o pool passou a permitir até cinco conexões compartilhadas, com gerenciamento de conexões ociosas por `attachDatabasePool` da Vercel. As listagens passaram a realizar as leituras sem abrir uma transação; a contagem pode variar se um registro mudar entre as consultas. Nenhum esquema, credencial ou regra de autorização foi alterado.

A correção foi enviada no commit `ccde81cb81c789e49284f3c5a021990295dc7f9c`. A implantação de produção correspondente ficou `READY`, e as leituras reais foram verificadas novamente. Na API, passaram 30 testes unitários, a verificação de tipos e o build. A suíte de integração que cria fixtures em PostgreSQL dedicado foi ignorada porque `TEST_DATABASE_URL` não estava disponível; não foi apontada para o banco de produção.

## Publicação da vitrine

A integração da vitrine está versionada neste repositório. O push e a publicação da vitrine ainda estão pendentes. Para colocá-la no domínio público, envie os commits e publique pelo fluxo habitual da Vercel. O destino padrão da API já é o de produção; `CATALOG_API_URL` permite selecionar outro ambiente, sem fornecer segredos administrativos à vitrine.
