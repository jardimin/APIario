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
  User.findOne({ email: req.session.userId}, function(err, user) {
    if (err) return next(err);
    if (!user) return next(new errors.NotFound('User not found'));
    res.render('account', { user: user });
  });
};
