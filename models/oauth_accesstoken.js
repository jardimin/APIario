var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//Configuração do esquema
var OAuthAccessTokensSchema = new Schema({
  accessToken: { type: String, required: true, unique: true },
  clientId: String,
  userId: { type: String, required: true },
  expires: Date
});

//Define qual coleção da base e o esquema
mongoose.model('oauth_accesstokens', OAuthAccessTokensSchema);
var OAuthAccessTokensModel = mongoose.model('oauth_accesstokens');

//Retorna o access token
module.exports.getAccessToken = function(bearerToken, callback) {
  OAuthAccessTokensModel.findOne({ accessToken: bearerToken }, callback);
};

//Salva o access token
module.exports.saveAccessToken = function(token, clientId, expires, userId, callback) {
  var fields = {
    clientId: clientId,
    userId: userId,
    expires: expires
  };
  OAuthAccessTokensModel.update({ accessToken: token }, fields, { upsert: true }, function(err) {
    if (err) console.error(err);
    callback(err);
  });
};
