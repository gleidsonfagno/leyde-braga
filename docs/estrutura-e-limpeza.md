# Auditoria da estrutura e limpeza

Data: 31/10/2026.

## Escopo

Limpeza de recursos comprovadamente sem uso, mantendo o catálogo de exemplo, as rotas, a apresentação e o fluxo de compra pelo WhatsApp. Nenhum backend ou painel administrativo foi implementado.

A divisão existente entre `app/`, `components/`, `lib/` e `public/` foi mantida. A organização foi documentada no README; não houve mudança de URLs ou movimentação dos componentes visuais.

## Critérios da auditoria

- Conferência das importações e referências dos arquivos de `app/`, `components/` e `lib/`.
- Conferência dos caminhos de assets no código, metadados, CSS e SVGs utilizados, incluindo referências indiretas.
- Conferência manual dos caminhos dinâmicos: os quatro logos são montados pelo componente `BrandsBar`, e as imagens dos produtos vêm do catálogo.
- Comparação por SHA-256 para identificar arquivos duplicados e verificar a integridade dos recursos preservados.
- Preservação de configurações, dependências necessárias ao Next.js e arquivos de lock.

## Recursos estáticos removidos

De 224 arquivos públicos, 192 não eram referenciados pela aplicação: 171 imagens, respostas de rastreamento e outros arquivos de captura, além de 21 fontes sem declaração de uso. A remoção corresponde a 27.142.768 bytes (aproximadamente 25,9 MiB) no checkout. Isso não representa uma redução equivalente no JavaScript enviado ao navegador.

| Origem | Arquivos removidos |
| --- | ---: |
| Fontes não utilizadas em `assets/fonts/amakha.vtexassets.com` | 21 |
| Imagens em `amakha.vtexassets.com` | 61 |
| Imagens em `amakha.vteximg.com.br` | 2 |
| Arquivos em `hinodeonlineio.vtexassets.com` | 62 |
| Arquivos em `hinodeonlineio.vteximg.com.br` | 14 |
| Respostas em Bing, Clarity, Facebook, Pinterest e Google | 24 |
| Arquivos em `icons.pn.vg`, `io.vtex.com.br`, `pushnews.cachefly.net`, `storecomponents.vtexassets.com`, `www.amakhaparis.com.br` e `www.gstatic.com` | 8 |
| **Total** | **192** |

Foram removidos também os 17 diretórios de imagens que ficaram vazios. Os nomes dos domínios, sozinhos, não determinaram a remoção: as sete fontes utilizadas continuam no diretório de origem.

As duplicações binárias incluíam respostas vazias, pixels de rastreamento, ícones e cópias do logo Hinode. A versão utilizada do logo permanece em `public/assets/images/marcas/hinode.svg`.

Permanecem 32 arquivos públicos: 12 fotos de produtos, sete banners de início/categorias, quatro logos, um favicon, sete fontes e um CSS. Seus conteúdos foram preservados.

## Código removido ou centralizado

- Removido o `useEffect` de `Header` que apenas procurava um formulário e retornava sem realizar qualquer operação. A busca continua no `onSubmit` existente.
- Removido o import não utilizado de `useMemo` no checkout.
- Removido o import não utilizado de `LEYDE` na confirmação.
- Removida a função exportada `produtosDaCategoria`, sem importações ou chamadas no projeto. A página de categoria já implementa a combinação de categoria, marca e busca.
- Centralizada em `lib/cart.js`, na função `itensDoCarrinho`, a lógica idêntica de resolver produtos e filtrar itens inexistentes, indisponíveis ou com quantidade não positiva. Carrinho e checkout utilizam essa mesma função, mantendo seus ciclos de atualização anteriores.

## Itens preservados

- Todos os 14 componentes são utilizados; nenhum componente foi excluído.
- As três dependências diretas são necessárias: `next`, `react` e `react-dom`. Não houve alteração no manifesto ou lockfile.
- Os 12 objetos do catálogo, incluindo preços, descrições, disponibilidade e slugs, foram preservados.
- `next.config.mjs`, `.gitignore`, os scripts de build e os recursos necessários à hospedagem foram preservados.
- Os estilos, fontes utilizadas, classes, marcação JSX e regras responsivas não foram alterados. Declarações semelhantes de CSS foram mantidas porque a cascata e as media queries podem ajustar o resultado final.
- `node_modules/` e `.next/` são diretórios gerados e já ignorados pelo Git. Não foram tratados como arquivos de origem descartáveis.
- Não foram encontrados arquivos temporários versionados adicionais; respostas de captura sem uso foram tratadas na limpeza de assets.

## Verificação

- `npm run build` concluído com sucesso antes e depois da limpeza, incluindo a geração das páginas e os rastros de build.
- 28 URLs responderam com HTTP 200 e mantiveram o mesmo HTML de conteúdo antes e depois: início, carrinho, checkout, confirmação, catálogo, busca, filtros por quatro categorias e quatro marcas, os 12 produtos e um produto inexistente. A comparação desconsiderou scripts e links gerados pelo build.
- Os 32 arquivos públicos preservados responderam com HTTP 200 e os mesmos hashes SHA-256.
- Os 12 produtos foram comparados integralmente com o catálogo anterior à limpeza.
- Verificados os casos de carrinho vazio, produtos válidos/inexistentes/indisponíveis, quantidades não positivas, últimas unidades e ausência de mutação do carrinho de entrada.
- Rota inexistente e exemplo de asset removido responderam com HTTP 404.
- `git diff --check` sem erros de whitespace.

As verificações usaram o servidor de produção local e testes temporários, sem novas dependências ou arquivos de teste no projeto. Não foi executado um teste interativo de ponta a ponta em navegador nem realizado envio de pedido pelo WhatsApp.
