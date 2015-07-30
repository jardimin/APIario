var models = require('./../models');

var fixtures = {
  clients: [{
    clientId: '28471984739287473',
    clientSecret: '3947839822',
    redirectUri: 'http://live-tanonimo.gotpantheon.com/admin/config/apiario/settings'
  }],

  users: [{
    email: 'contato@haarieh.com',
    hashed_password: '$2a$10$KnjWPhLbHm5NXU3hxOf.YOAC1ReMgqxgwLJ2j4dyOHTxS7LFpZnCu'
  }]
};

function insertData(model, fixture, cb) {
  var o = new model(fixture);
  o.save(cb);
}

var connection = models.mongoose.connection;

before(function(cb) {
  connection.on('open', function() {
    connection.db.dropDatabase(function() {
      insertData(models.User, fixtures.users[0], function() {
        insertData(models.OAuthClientsModel, fixtures.clients[0], cb);
      });
    });
  });
});
