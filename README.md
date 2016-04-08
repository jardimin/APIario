# APIario

Api para comunicação com os sistemas do jardim.in

## Instalação

Para cadastrar um usuário use "node cadastro.js" e insira os dados solicitados na tela. Para cadastrar o usuário é necessário:

 * `Email` -- Email que o usuário vai se logar
 * `Senha` -- Senha do usuário
 * `URL de redirecionamento` -- URL de redirecionamento

Após o cadastro vai ser fornecido o ClientID e ClientSecret automaticamente pelo sistema.

Caso esteja usando o Módulo do Drupal a URL fica da seguinte forma:

http://sitedodrupal/admin/config/apiario/settings

O aplicativo APIario e o codem-schedule serão iniciado junto com o nginx usando passenger. Para saber como está os processos usa-se "passenger-status". O codem-schedule deverá usar autenticação htpasswd.

Os Presets no codem-schedule devem ser cadastrados da seguinte forma "x264-tamanho":
 * x264-1M
 * x264-2M
 * x264-400k

A APIario retorna a URL baseado no módulo kaltura do nginx: https://github.com/kaltura/nginx-vod-module

Ex:
 * http://colmeia.aovivonaweb.tv:8090/55c54ffc6801a6a869443e52/x264-,400k,1M,2M,-31483-zovdig.mp4.urlset/master.m3u8

x264-,tamanho1,tamanho2,tamanho3

Detalhes http://pad.jardim.in/p/video-publisher

##Detalhe

O IP no hosts do colmeia.aovivonaweb.tv deve estar com IP interno na Amazon para que as notificações funcionem, as notificações não aceitam ips externos por questões de segurança.