//Declaração de variáveis
var express = require('express')
    ,routes = require('./routes')
    ,config = require('./config')
    ,path = require('path')
    ,models = require('./models')
    ,middleware = require('./middleware')
    ,app = express()
    ,oauthserver = require('node-oauth2-server')
    ,User = models.User
    ,url = require('url')
    ,Attachments = models.Attachments;

//Título do Aplicativo
app.locals.title = 'APIario';
app.locals.pretty = true;
//Configurações
app.configure('development', 'production', function() {
  //Define o ambiente padrão
  app.set('env', process.env.NODE_ENV || 'development');
  //Porta
  app.set('port', process.env.PORT || 3001);
  //Devine a pasta das views
  app.set('views', path.join(__dirname, 'views'));
  //Usa o Jade
  app.set('view engine', 'jade');
  app.use(express.cookieParser('ncie0fnft6wjfmgtjz8i'));
  app.use(express.cookieSession());  
  app.use(express.logger('dev'));
  app.use(express.bodyParser({ 
    keepExtensions: true, 
    //pasta do upload
    uploadDir: __dirname + '/tmp'
    //Limite de upload
    //limit: '2mb'
  }));
  app.use(express.methodOverride());  
});


//Domínios habilitados pelo Access Control Allow Origin
//Retornados pelos Redirects cadastrados
app.all('/*', function(req, res, next) {
  //Não permite cache para qualquer tipo de ação
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  //Pega a origem
  var origem = req.get('origin');
  //Verifica se existe uma origem
  if (typeof origem != 'undefined') {
    //Verifica se a url de origem possui cadastro nos clients
    models.OAuthClientsModel.find({redirectUri: new RegExp(origem, "i")}, function(err, clients){
      //Caso aconteça erro aborta
      if (err) throw err;
      //Caso exista um cadastro habilita para permitir a URL
      if (clients) {
        clients.forEach(function(client, key){
            //Pega o host
            var host = url.parse(client.redirectUri).host;
            //Pega o protocolo
            var protocol = url.parse(client.redirectUri).protocol;
            //Monta o domínio com http
            var dominio = protocol + '//' + host;
            //Seta no header permitindo o domínio
            res.header("Access-Control-Allow-Origin", dominio);
            res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
            res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Length, X-Requested-With");
            next();  
        });
      } else next();
    });
  } else next();
});

//Configuração do OAuth2
app.oauth = oauthserver({
  //Define o model
  model: models.oauth,
  //Formatos suportados pelo OAuth2
  grants: ['password', 'authorization_code', 'refresh_token'],
  debug: true
});

//Define as rotas
app.use(app.router);
//Define a pasta pública
app.use(express.static(path.join(__dirname, 'public')));
//Tratamento de erros
app.use(function(err, req, res, next) {
  if (middleware.isValidationError(err)) {
    res.status(400);
    res.send(err.errors);
  } else {
    res.status(err.code || 500);
    res.send('Error');
  }
});

if ('development' === app.get('env')) app.use(express.errorHandler());
//Mostra a tela de boas vindas
app.get('/', middleware.loadUser, routes.index);
//Retorna o access token ou refresh token
app.all('/oauth/token', app.oauth.grant());
//Usado para solicitar autorização para utilizar a API
app.get('/oauth/authorise', function(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/session?redirect=' + req.path + '&client_id=' +
      req.query.client_id + '&redirect_uri=' + req.query.redirect_uri);
  }
  res.render('authorise', {
    client_id: req.query.client_id,
    redirect_uri: req.query.redirect_uri
  });
});

// Pegar autorização e retorna o código
app.post('/oauth/authorise', function(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/session?redirect=' + req.path + 'client_id=' +
      req.query.client_id +'&redirect_uri=' + req.query.redirect_uri);
  }
  next();
}, app.oauth.authCodeGrant(function(req, next) {
  // The first param should to indicate an error
  // The second param should a bool to indicate if the user did authorise the app
  // The third param should for the user/uid (only used for passing to saveAuthCode)
  next(null, req.body.allow === 'yes', req.session.userId, null);
}));
//Uploads de arquivos qualquer
app.post('/upload', middleware.requiresUser, routes.uploads.send);

app.use(app.oauth.errorHandler());
//Habilita caso queira cadastrar usuários
//app.post('/v1/users', routes.users.create);
//Retorna os dados do usuário em JSON
app.get('/me', middleware.requiresUser, routes.users.show);
app.get('/account', middleware.requiresUser, routes.users.account);
//Verifica autenticação
app.get('/logged', middleware.requiresUser, function(req,res){
  //Retorna verdadeiro caso esteja logado
  res.send("true");
});
//Criando a sessão de autenticação
app.post('/session', routes.session.create);
//Mostra a tela de login
app.get('/session', routes.session.show);

//Carregando Módulos
var video = require('./modules/APIario-video')(app, middleware, config.video);

var http = require('http');
http.createServer(app).listen(app.get('port'), function(){
  console.log('APIario rodando na porta:', app.get('port'));
});