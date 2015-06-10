var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//Definição do esquema
var OAuthAuthCodeSchema = new Schema({
  authCode: { type: String, required: true, unique: true },
  clientId: String,
  userId: { type: String, required: true },
  expires: Date
});

//Define qual coleção da base e o esquema
mongoose.model('oauth_authcodes', OAuthAuthCodeSchema);
var OAuthAuthCodeModel = mongoose.model('oauth_authcodes');

//Retorna o código de autenticação
module.exports.getAuthCode = function(authCode, callback) {
  OAuthAuthCodeModel.findOne({ authCode: authCode }, callback);
};

//Salva o código de autenticação
module.exports.saveAuthCode = function(code, clientId, expires, userId, callback) {
  var fields = {
    clientId: clientId,
    userId: userId,
    expires: expires
  };
  OAuthAuthCodeModel.update({ authCode: code }, fields, { upsert: true }, function(err) {
    if (err) console.error(err);
    callback(err);
  });
};
