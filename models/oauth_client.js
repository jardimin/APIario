var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//Lista dos clients id autorizados
var authorizedClientIds = new Array();
//Define o esquema
var OAuthClientsSchema = new Schema({
  clientId: String,
  clientSecret: String,
  redirectUri: String,
  drupal: {
    key: String,
    secret: String
  }
});

//Retorna o client
OAuthClientsSchema.static('getClient', function(clientId, clientSecret, callback) {
  var params = { clientId: clientId };
  if (clientSecret != null) params.clientSecret = clientSecret;
  OAuthClientsModel.findOne(params, callback);
});

OAuthClientsSchema.static('grantTypeAllowed', function(clientId, grantType, callback) {
	OAuthClientsModel.find({}, function(err, clients) {
		if (err) throw err;
		if (!clients) throw 'Nenhum ClientId cadastrado, precisa cadastrar um usuário';
		clients.forEach(function(client, key){
			authorizedClientIds.push(client.clientId);
		});
	});
  	if (grantType === 'password' || grantType === 'authorization_code') 
    	return callback(false, authorizedClientIds.indexOf(clientId) >= 0);
  	callback(false, true);
});

mongoose.model('oauth_clients', OAuthClientsSchema);
var OAuthClientsModel = mongoose.model('oauth_clients');
module.exports = OAuthClientsModel;
