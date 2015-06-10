//Define o ambiente padrão
var nodeEnv = process.env.NODE_ENV || 'production';
//Configurações
var config = {
  production: require('./production'),
  development: require('./development')
};

module.exports = config[nodeEnv];
