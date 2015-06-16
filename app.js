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
    ,fs = require('fs')
    ,Attachments = models.Attachments;

//Domínios habilitados pelo Access Control Allow Origin
var allowedDomains = [
    'http://colmeia.teste'
];
//Chama o node-corls e seta os domínios habilitados
var CORS = require('./node-cors/node-cors.js')(allowedDomains);
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
  //Seta o CORS na configuração
  app.use(CORS);
  app.use(express.bodyParser({ 
    keepExtensions: true, 
    //pasta do upload
    uploadDir: __dirname + '/tmp'
    //Limite de upload
    //limit: '2mb'
  }));
  app.use(express.methodOverride());  
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

//Envio dos vídeos, verifica se está autenticado anteriormente
app.post('/upload', middleware.requiresUser, function(req, res) {
  //Busca o usuário logado pelo seu userId(email)
  User.findOne({ email: req.oauth.bearerToken.userId}, function(err, user) {
    //Pega o Id do usuário logado pelo Auth
    var id = user._id;
    //Nome do arquivo após o upload
    var oldFile = req.files.myFile.path;
    //Pega o nome do arquivo
    var nome = oldFile.split("/");  
    nome = nome[nome.length - 1];
    //Move este arquivo para a pasta do usuário 
    var newFile = './tmp/' + id + '/' + nome; 
    //Verifica a existência da pasta e cria a pasta do usuário com o seu Id
    fs.exists('./tmp/' + id, function(exists) {      
        if (!exists) fs.mkdir('./tmp/' + id);
    });         
    //Move o arquivo para a pasta destino
    fs.readFile(oldFile , function(err, data) {
        fs.writeFile(newFile, data, function(err) {
            //Apaga o arquivo temporário
            fs.unlink(oldFile, function(){            
              if(err) throw err;
              //Instancia o Attachments com os dados para salvar
              var anexo = new Attachments({
                file: newFile,
                originalFilename: req.files.myFile.name,
                user: user._id
              });
              //Salva os dados
              anexo.save(function(e){
                if(e == null) res.send("File uploaded to: " + newFile);
              });                
            });
        }); 
    });  
  }); 
});

app.use(app.oauth.errorHandler());
//Habilita caso queira cadastrar usuários
//app.post('/v1/users', routes.users.create);
//Retorna os dados do usuário em JSON
app.get('/me', middleware.requiresUser, routes.users.show);
//Verifica autenticação
app.get('/logged', middleware.requiresUser, function(req,res){
  //Retorna verdadeiro caso esteja logado
  res.send("true");
});
//Criando a sessão de autenticação
app.post('/session', routes.session.create);
//Mostra a tela de login
app.get('/session', routes.session.show);

var http = require('http');
http.createServer(app).listen(app.get('port'), function(){
  console.log('APIario rodando na porta:', app.get('port'));
});