var app = require('./app');
var models = require('./models');
var bcrypt = require('bcrypt');

//Para criptografar a senha
hashPassword = function(password) {
  var salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}
//Criação do um usuário com sua página de retorno, a página de retorno sempre será verificada
models.User.create({
  email: 'suporte@haarieh.com', //Login do usuário
  hashed_password: hashPassword('Beavis') //Senha do usuário
}, function() {
  models.OAuthClientsModel.create({
    clientId: '28471984739287473', //Mantenha o mesmo clientID
    clientSecret: '3947839820', //Pode ser alterado dependendo do cliente
    redirectUri: 'http://colmeia.teste/php/index.php' //URL de retorno que também vai ser usado para informar que o vídeo está pronto
  }, function() {
    process.exit();
  });
});
