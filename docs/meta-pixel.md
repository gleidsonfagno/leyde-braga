# Pixel da Meta

Pixel informado pela loja: `1784326125895756`. O ID é público; não é um token de acesso. O valor padrão fica em `lib/privacy.js`; `NEXT_PUBLIC_META_PIXEL_ID` pode substituí-lo, e vazio desativa o recurso. Não foi adicionada API de Conversões, token, correspondência avançada, evento de compra ou dependência de terceiros ao projeto.

O SDK oficial (`https://connect.facebook.net/en_US/fbevents.js`) é inserido no head somente após consentimento de publicidade. A escolha é separada do Google Analytics. A versão do consentimento mudou para 2, invalidando escolhas antigas, vencidas ou referentes a outro Pixel. GPC e Do Not Track bloqueiam as opções de rastreamento.

O código configura `autoConfig` e `smartSetup` como false antes de inicializar o Pixel. Emite apenas `trackSingle` / `PageView` para o ID configurado, sem dados de formulário. A navegação do Next.js considera caminho e parâmetros para registrar uma visualização por transição, sem repetir o mesmo endereço por rerender. Não há imagem noscript, preload ou preconnect que faça conexão antes de uma escolha.

Somente início, categoria e produto são elegíveis. Checkout, confirmação, carrinho, páginas institucionais, busca livre (`q`) e URLs com parâmetros não reconhecidos ficam fora do rastreamento. São aceitos slugs do catálogo, página numérica e identificadores de campanhas com formato limitado. O SDK recebe a URL da página elegível e dados técnicos/cookies próprios; não se trata de navegação anônima. Rejeitar ou revogar envia consent/revoke se o SDK já tiver iniciado, descarta eventos ainda na fila e apaga _fbp/_fbc acessíveis. Não remove dados já recebidos pela Meta nem cookies de outros domínios. Depois de carregado, o SDK pode continuar presente na página, sob revogação.

Os testes simulam a API do SDK para verificar ausência de carga antes da autorização, escolhas separadas, renovação, revogação, deduplicação e exclusão de páginas com formulário. Não enviam eventos de teste para a conta real. A referência usada foi o código base fornecido pela loja e o SDK oficial da Meta, cujo tratamento de autoConfig, smartSetup, consent e trackSingle foi conferido. A documentação web da Meta retornou HTTP 429 durante a consulta.

Verificação local: build de produção e 45 testes aprovados; sete páginas de políticas e seus cabeçalhos conferidos. No navegador, o Pixel não foi carregado antes da escolha, ao apenas marcar a opção sem salvar, após recusar e depois de recarregar com a recusa salva. A opção de publicidade foi conferida separadamente de estatísticas, sem erros de console observados.

Para conferir a recepção: no Gerenciador de Eventos da Meta, selecione este Pixel, abra Eventos de teste, visite o catálogo e autorize publicidade nas preferências. Confira PageView. Recuse opcionais em outra sessão para confirmar ausência de carregamento; revogue pela opção do rodapé para interromper novas visualizações. Bloqueadores podem impedir o envio. Não foi confirmada a recepção no painel da Meta por automação.

Na configuração da Meta enviada pela loja, “Incluir automaticamente informações mais detalhadas de páginas e produtos” estava ativado. Mantenha esse recurso, eventos automáticos e correspondência avançada automática desativados no painel para corresponder à integração manual; essas opções da conta não foram alteradas por este código.
