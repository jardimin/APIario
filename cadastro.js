var app = require('./app');
var models = require('./models');
var bcrypt = require('bcrypt');

//Para criptografar a senha
hashPassword = function(password) {
  var salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}
//Criação dé um usuário com sua página de retorno, a página de retorno sempre será verificada
models.User.create({
  email: 'suporte@haarieh.com',
  hashed_password: hashPassword('Beavis')
}, function() {
  models.OAuthClientsModel.create({
    clientId: '28471984739287473',
    clientSecret: '3947839820',
    redirectUri: 'http://localhost/teste/index.php'
  }, function() {
    process.exit();
  });
});
