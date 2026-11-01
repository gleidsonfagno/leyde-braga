# Evolução do checkout

## 1. Localização para entrega

O botão **Usar minha localização** solicita a permissão do navegador somente ao ser acionado pelo cliente. O endereço continua obrigatório e pode ser preenchido sem conceder a permissão. A captura exige HTTPS ou um contexto local seguro e usa `getCurrentPosition` com alta precisão, sem reutilizar uma posição antiga e com timeout de 15 segundos.

O cliente pode conferir o ponto em um link do Google Maps, atualizar ou remover a captura. Alterar rua, número, bairro ou CEP invalida o ponto anterior, evitando enviá-lo junto de outro endereço. Ao confirmar o pedido, latitude, longitude, precisão e horário ficam no pedido local, e a mensagem para o WhatsApp inclui o link do ponto. Não há iframe nem consulta automática ao Google Maps com essas coordenadas.

É uma captura pontual, não rastreamento contínuo. Para compartilhar localização em tempo real, o cliente usa o recurso próprio do WhatsApp na conversa com a loja. Nenhuma chave do Google Maps é necessária para gerar o link.

Os testes usam posições sintéticas e cobrem coordenadas inválidas, permissão negada, ausência de suporte, timeout e geração da mensagem. Eles não acessam o GPS real nem enviam pedidos.

Referências: [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition), [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started).
