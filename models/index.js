//Chama a configuração
var config = require('./../config');
//Chama o mongoose
var mongoose = require('mongoose');
//Seta a configuração do banco de dados mongo
mongoose.connect(config.db, {});

module.exports.oauth = require('./oauth');
module.exports.User = require('./user');
module.exports.Attachments = require('./attachments');
module.exports.OAuthClientsModel = require('./oauth_client');
module.exports.mongoose = mongoose;
