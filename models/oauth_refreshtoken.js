var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//Define o esquema
var OAuthRefreshTokensSchema = new Schema({
  refreshToken: { type: String, required: true, unique: true },
  clientId: String,
  userId: { type: String, required: true },
  expires: Date
});
//Define qual coleção da base e o esquema
mongoose.model('oauth_refreshtokens', OAuthRefreshTokensSchema);
var OAuthRefreshTokensModel = mongoose.model('oauth_refreshtokens');

//Salva o refresh token
module.exports.saveRefreshToken = function(token, clientId, expires, userId, callback) {
  if (userId.id) userId = userId.id;
  var refreshToken = new OAuthRefreshTokensModel({
    refreshToken: token,
    clientId: clientId,
    userId: userId,
    expires: expires
  });
  refreshToken.save(callback);
};

//Retorna o refresh token
module.exports.getRefreshToken = function(refreshToken, callback) {
  OAuthRefreshTokensModel.findOne({ refreshToken: refreshToken }, function(err, token) {
    // node-oauth2-server defaults to .user or { id: userId }, but { id: userId} doesn't work
    // This is in node-oauth2-server/lib/grant.js on line 256
    if (token) token.user = token.userId;
    callback(err, token);
  });
};
