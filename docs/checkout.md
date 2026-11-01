# Evolução do checkout

## 1. Localização para entrega

O botão **Usar minha localização** solicita a permissão do navegador somente ao ser acionado pelo cliente. O endereço continua obrigatório e pode ser preenchido sem conceder a permissão. A captura exige HTTPS ou um contexto local seguro e usa `getCurrentPosition` com alta precisão, sem reutilizar uma posição antiga e com timeout de 15 segundos.

O cliente pode conferir o ponto em um link do Google Maps, atualizar ou remover a captura. Alterar rua, número, bairro ou CEP invalida o ponto anterior, evitando enviá-lo junto de outro endereço. Ao confirmar o pedido, latitude, longitude, precisão e horário ficam no pedido local, e a mensagem para o WhatsApp inclui o link do ponto. Não há iframe nem consulta automática ao Google Maps com essas coordenadas.

É uma captura pontual, não rastreamento contínuo. Para compartilhar localização em tempo real, o cliente usa o recurso próprio do WhatsApp na conversa com a loja. Nenhuma chave do Google Maps é necessária para gerar o link.

Os testes usam posições sintéticas e cobrem coordenadas inválidas, permissão negada, ausência de suporte, timeout e geração da mensagem. Eles não acessam o GPS real nem enviam pedidos.

Referências: [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition), [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started).

## 2. Frete de Altamira

Conforme orientação da loja, Ayrton Senna (incluindo I/1), Ayrton Senna II/2, Casa Nova, São Joaquim e Liberdade têm entrega grátis. A configuração está em `LEYDE.bairrosEntrega`, em `lib/config.js`, com valores decimais e equivalências de nomes. O campo sugere esses bairros, mas permite digitar outros. A regra exige cidade Altamira e estado PA; não libera gratuidade para um bairro de mesmo nome em outra cidade.

Para os outros bairros de Altamira, a loja informou apenas uma referência inicial: **a partir de R$ 5,00, a confirmar pelo WhatsApp**. Essa estimativa aparece no resumo e na mensagem, sem ser somada como se fosse uma taxa final. Para bairros grátis, o total já é calculado. Taxas exatas poderão ser adicionadas à tabela quando definidas pela loja. Endereços fora de Altamira/PA permanecem sob consulta.

O CEP de origem informado é `68375-368`. Não foi inventado um número de imóvel, ponto GPS da loja ou preço por quilômetro. Sem esses parâmetros, não há cotação por distância equivalente à de aplicativos de corrida. O ponto capturado do cliente ajuda a loja a localizar a entrega, mas não estabelece por si só uma tarifa.

O frete é derivado do endereço atual do formulário, sem um estado de cálculo que possa ficar desatualizado ao trocar bairro/cidade. As mensagens de pedido e confirmação usam a mesma descrição. Os testes cobrem os bairros autorizados, aliases, homônimos fora da cidade, estimativas e somas de centavos.
