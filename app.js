//Declaração de variáveis
var express = require('express')
    ,routes = require('./routes')
    ,config = require('./config')
    ,path = require('path')
    ,models = require('./models')
    ,middleware = require('./middleware')
    ,app = express()
    ,oauthserver = require('node-oauth2-server')
    ,User = models.User;

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

app.locals.title = 'APIario';
app.locals.pretty = true;

app.configure('development', 'production', function() {
  app.use(express.logger('dev'));
});

app.use(express.bodyParser());
app.use(express.methodOverride());
//Configuração do OAuth2
app.oauth = oauthserver({
  model: models.oauth,
  grants: ['password', 'authorization_code', 'refresh_token'],
  debug: true
});

//Define as rotas
app.use(app.router);
//Define a pasta pública
app.use(express.static(path.join(__dirname, 'public')));

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

app.get('/', middleware.loadUser, routes.index);

app.all('/oauth/token', app.oauth.grant());

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

// Pegar autorização
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

//Envio dos vídeos, verifica se está autenticado anteriormente
app.post('/upload', middleware.requiresUser, function(req, res) {
  res.send('Envio dos arquivos');
});

app.use(app.oauth.errorHandler());
app.post('/v1/users', routes.users.create);
app.get('/account', middleware.requiresUser, routes.users.show);
app.post('/session', routes.session.create);
app.get('/session', routes.session.show);

var http = require('http');
http.createServer(app).listen(app.get('port'), function(){
  console.log('APIario rodando na porta:', app.get('port'));
});




