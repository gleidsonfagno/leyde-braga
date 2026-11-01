# Leyde Braga

Loja de perfumaria e cosméticos construída com Next.js App Router, React e JavaScript/JSX. O catálogo vem da API pública do projeto administrativo e a finalização dos pedidos acontece pelo WhatsApp.

## Desenvolvimento

```sh
npm ci
cp .env.example .env.local
npm run dev
```

No PowerShell, use `Copy-Item .env.example .env.local`. A API de produção já é o destino padrão. Para outra instalação, configure `CATALOG_API_URL` com o prefixo completo `/api/v1`. Se executar as duas aplicações localmente, use portas diferentes, por exemplo vitrine em 3000 e API em 3001.

## Build de produção

```sh
npm run build
npm run start
```

## Estrutura

```text
app/                       Páginas, layout global, estilos e provedores
  api/catalog/             Consulta pública dos produtos presentes no carrinho
components/                Componentes visuais e contextos de carrinho e toast
lib/
  catalog-api.js           Cliente HTTP da API pública, sem cookies administrativos
  catalog.js               Adaptação explícita dos dados públicos para a vitrine
  cart.js                  Normalização e resolução dos itens do carrinho
  config.js                Contatos, atendimento, entrega e pagamentos locais
  money.js                 Cálculos em centavos com BigInt e exibição em reais
  order.js                 Formatação do número e da mensagem de pedido
  products.js              Referência histórica dos 12 exemplos, fora da aplicação
  text.js                  Normalização de texto para busca e filtros
public/assets/
  css/loja.css             Estilos e regras responsivas da loja
  fonts/                   Fontes locais utilizadas por app/globals.css
  images/
    banners/               Banners principais e imagens das categorias
    marcas/                Logos, com caminhos montados em BrandsBar
    prod/                  Imagens dos 12 produtos de exemplo
    favicon.svg            Ícone da loja
docs/                      Documentação da estrutura e da limpeza
next.config.mjs            Configuração do Next.js
```

## Funcionamento atual

- Rotas: `/`, `/categoria`, `/produto`, `/carrinho`, `/checkout` e `/confirmacao`.
- Filtros e busca usam `/categoria?cat=...`, `?marca=...` e `?q=...`; produtos usam `/produto?p=slug`.
- Início, catálogo, busca, filtros e detalhe consomem produtos, marcas, categorias e imagens reais da API. A listagem tem paginação de 20 produtos; o início mostra os primeiros 12 e oferece acesso ao catálogo completo.
- Categorias e marcas usam os slugs da API. Links antigos com nomes de marcas e as categorias de apresentação anteriores são normalizados quando existe correspondência.
- O carrinho guarda somente slugs e quantidades no `localStorage`; preços e detalhes são consultados novamente na API. Itens removidos ou desativados deixam de compor o pedido.
- O último pedido ainda é salvo no `localStorage`, apenas no navegador utilizado. Antes de montar a mensagem, o checkout revalida os produtos; alterações de preço ou retirada de itens exigem nova confirmação.
- O checkout consulta o ViaCEP e prepara a mensagem de pedido para o WhatsApp.
- O backend e o painel estão no repositório separado `leyde-braga-admin`. A API atual não fornece pedidos, taxas de entrega, formas de pagamento nem dados institucionais; esses recursos mantêm o fluxo/configuração local.
- O estoque não faz parte da resposta pública: a vitrine mostra “Consulte disponibilidade”. Composição e modo de uso não são inventados quando ausentes da API. O checkout permite 1x ou 2x no cartão, conforme a regra da loja, e calcula os valores somente quando o frete é conhecido. A galeria exibe todas as referências de imagens retornadas.
- O arquivo de exemplos não é importado pela aplicação e não serve como fallback quando a API falha. Falhas exibem mensagem e opção de tentar novamente, diferentes de uma busca sem resultados.

## Integração e segurança

A URL padrão é `https://leyde-braga-admin.vercel.app/api/v1`. Configure `CATALOG_API_URL` somente no servidor; não inclua usuário/senha na URL. Nenhuma credencial do PostgreSQL, `AUTH_SECRET` ou sessão administrativa é necessária na vitrine.

As páginas consultam a API no servidor e usam `cache: 'no-store'`. Os links não fazem prefetch automático, evitando consultas especulativas ao catálogo para cada produto e filtro visível. Falhas transitórias de transporte ou HTTP 5xx permitem somente uma repetição da leitura; 404, outras falhas 4xx e respostas incompatíveis não são repetidos. O navegador consulta `/api/catalog?slug=...` na própria origem para atualizar o carrinho. Essa rota é somente leitura, valida slugs, limita o lote a 100 produtos, consulta no máximo cinco simultaneamente e retorna apenas os campos públicos explicitamente adaptados. Ela não acessa rotas administrativas nem encaminha cookies.

Esse fluxo não depende de CORS entre o navegador e a API externa. Para consumidores diretos da API, o projeto administrativo deve manter o domínio exato da vitrine em `CORS_ORIGINS`. A vitrine nunca envia cookies administrativos.

Preços permanecem strings decimais. Somas, multiplicações e divisão em parcelas usam centavos inteiros com `BigInt`; os resultados salvos e serializados continuam strings. O frete é grátis nos cinco bairros autorizados de Altamira; para os demais, a estimativa a partir de R$ 5,00 exige confirmação e não fecha o total. O checkout também oferece captura opcional de localização para ajudar na entrega.

## Testes

```sh
npm test
npm run build
# Com a vitrine já em execução em http://127.0.0.1:3137:
# npm run start -- --hostname 127.0.0.1 --port 3137
npm run test:integration
```

O teste de integração realiza somente leituras. `STOREFRONT_URL` e `CATALOG_API_URL` permitem testar outros endereços. Ele confere o catálogo real, paginação, todas as categorias e marcas, busca combinada com filtros, detalhe, atualização do carrinho, exclusão de campos privados e entradas inválidas. `npm test` cobre também falhas de transporte, respostas incompatíveis, carrinhos antigos/adulterados e cálculos decimais exatos.

## Vercel

O projeto mantém o build padrão do Next.js (`npm run build`) e a configuração de imagens em `next.config.mjs`. Não há configuração `vercel.json` específica no repositório. As rotas atuais são preservadas, inclusive as renderizadas no servidor.

Na Vercel, configure `CATALOG_API_URL` para cada ambiente que precisar de outra API e faça uma nova implantação da vitrine após publicar as mudanças deste repositório. Sem override, utiliza-se a API de produção indicada acima. O build não consulta o PostgreSQL, importa produtos nem exige segredos administrativos. As páginas são renderizadas dinamicamente para refletir o catálogo atualizado.

`node_modules/`, `.next/`, arquivos de ambiente locais e logs de gerenciadores de pacotes são ignorados pelo Git. Não versionar credenciais.

O resultado da auditoria está em [docs/estrutura-e-limpeza.md](docs/estrutura-e-limpeza.md).

O resultado da integração está em [docs/integracao-api.md](docs/integracao-api.md).

As funções de localização, entrega e pagamento do checkout estão documentadas em [docs/checkout.md](docs/checkout.md).
