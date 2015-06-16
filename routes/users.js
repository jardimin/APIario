var User = require('./../models').User;
var errors = require('./../errors');
//Rota para criar novo usuário
module.exports.create = function(req, res, next) {
  User.register(req.body.user, function(err, user) {
    if (err) return next(err);
    res.send(user);
  });
};
//Rota para mostrar os dados do usuário
module.exports.show = function(req, res, next) {
  
console.log(req.oauth.bearerToken.userId.toSource());
  User.findOne({ email: req.oauth.bearerToken.userId.id}, function(err, user) {
  	var id = user._id;
  	var email = user.email;
  	res.json({ id: id, email: email });
  });
};
