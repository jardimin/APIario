var app = require('./../app');
var assert = require('assert');
var request = require('supertest');
var models = require('./../models');

describe('Web sign in', function() {
  var cookies;
  before(function(done) {
    request(app)
      .post('/session')
      .send({
        email: 'contato@haarieh.com',
        password: 'Beavis'
      })
      .end(function(err, res) {
        cookies = res.headers['set-cookie'];
        done(err);
      });
  });

  it('should permit access to the secret area when signed in', function(done) {
    request(app)
      .post('/upload')
      .set('Cookie', cookies)
      .expect(200, done);
  });
});
