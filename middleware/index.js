var models = require('./../models');
var User = models.User;

/**
 * Verifica se está autenticado ou se está autorizado pelo OAuth2
 * @access public
 */
requiresUser = function(req, res, next) {
  if (req.session.userId) {
    req.user = { id: req.session.userId }
    next();
  } else {
    res.app.oauth.authorise()(req, res, next);
  }
}

/**
 * Carrega o usuário pelo email
 * @access public
 */
loadUser = function(req, res, next) {
  User.findOne({ email: req.session.userId}, function(err, user) {
    if (err) return next(err);
    res.locals.user = user;
    next();
  });
}

/**
 * Valida o erro
 * @access public
 */
isValidationError = function(err) {
  return err && err.name === 'ValidationError';
}

/**
 * Estilo do retorno do erro
 * @access public
 */
notFoundHandler = function(req, res, next) {
  res.status(404);
  res.format({
    html: function() {
      res.render('404', { url: req.url });
    },
    json: function() {
      res.send({ error: 'Página não encontrada' });
    }
  });
}

module.exports.requiresUser = requiresUser;
module.exports.loadUser = loadUser;
module.exports.isValidationError = isValidationError;
module.exports.notFoundHandler = notFoundHandler;
