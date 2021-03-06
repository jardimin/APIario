//Declaração de variáveis
var express = require('express')
    ,routes = require('./routes')
    ,routesVideo = require('./modules/APIario-video/routes')
    ,config = require('./config')
    ,path = require('path')
    ,models = require('./models')
    ,middleware = require('./middleware')
    ,app = express()
    ,oauthserver = require('node-oauth2-server')
    ,User = models.User
    ,url = require('url')
    ,crypto = require('crypto')
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
  app.use(cookieSession({
    maxAge: 60 * 60 * 24
  }));
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


/**
 * Função para retornar o domínio com o seu protocolo
 * @param value String URL 
 * @return String
 **/
var getDominio = function(value) {
  //Pega o host
  var host = url.parse(value).host;
  //Pega o protocolo
  var protocol = url.parse(value).protocol;
  //Monta o domínio com http
  return protocol + '//' + host;  
}

//Domínios habilitados pelo Access Control Allow Origin
//Retornados pelos Redirects cadastrados
var dominios = new Array();
models.OAuthClientsModel.find({}, function(err, clients) {
  //Caso aconteça erro aborta
  if (err) throw err;
  //Caso exista um cadastro habilita para permitir a URL
  if (clients.length > 0) {
    clients.forEach(function(client, key){
        var dominio = getDominio(client.redirectUri);
        //Seta no header permitindo o domínio
        dominios.push(dominio);
     });
  }
});

//Faz a checagem se o domínio encontra-se habilitado
app.all('*', function(req, res, next) {
  var origem = req.get('origin');
  if(dominios.indexOf(origem) > -1) {
    res.header("Access-Control-Allow-Origin", origem);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "token, origin, content-type, accept, authorization, X-Requested-With");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Max-Age", "1209600");    
    next();
  } else next();
});


//Configuração do OAuth2
app.oauth = oauthserver({
  //Define o model
  model: models.oauth,
  //Formatos suportados pelo OAuth2
  grants: ['password', 'authorization_code', 'refresh_token'],
  accessTokenLifetime: 60 * 60 * 24,
  debug: true
});

//Define as rotas
app.use(app.router);
//Define a pasta pública
app.use(express.static(path.join(__dirname, 'public')));
//Tratamento de erros
app.use(function(err, req, res, next) {
  if (middleware.isValidationError(err)) {
    console.log(err);
    res.status(400);
    res.send(err.errors);
  } else {
    console.log(err);
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
  var dominio = getDominio(req.query.redirect_uri)      
  //Verifica se é drupal
  if (typeof req.query.drupal != "undefined") {
    //Descriptografa key e secret
    //Chave e IV mesmo enviado
    var decipher=crypto.createDecipheriv('aes-256-cbc','47264967364586938365849622647588','8672646567572920');
    decipher.setAutoPadding(false);     
    var cipherHexText256=req.query.drupal; 
    var dec = decipher.update(cipherHexText256,'hex','utf8');
    dec += decipher.final('utf8');
    var drupal = dec.split("|");
    //Busca o usuário logado
    models.User.findOne({email:req.session.userId}, function(err, user) {
      //Seta o drupal key e secret
      user.drupal.key = drupal[1];
      user.drupal.secret = drupal[2];
      user.drupal.callback = dominio;
      //Salva
      user.save();
    });
  }
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

//Notificações da codem-schedule 
app.post('/notify', routesVideo.notify);

var http = require('http');
http.createServer(app).listen(app.get('port'), function(){
  console.log('APIario rodando na porta:', app.get('port'));
});