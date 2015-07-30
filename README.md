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

Detalhes http://pad.jardim.in/p/video-publisher