var request = require('request');
var config = require('./../../../config');
var models = require('./../../../models');

var getUid = function(options, callback) {
  request(
  {
    method: 'GET',
    uri: options.uri + '/api/entity_node?fields=nid&parameters[apiario_codigo]=' + options.apiario_codigo,
    oauth: { 
      consumer_key: options.key,
      consumer_secret: options.secret,
      signature_method : 'PLAINTEXT'
    },
    gzip: true
  }
  , function (error, response, data) {
    if(error) throw(error);
    if(response.statusCode == 200) {
      if(data != '["No entities found."]') {
        var nodes = JSON.parse(data);
        //Loop para pegar o código do vídeo
        nodes.forEach(function(node, index) {
          callback(node.nid);
        });    
      }
    }
  });
}

var setStatus = function(options, callback) {
  if(options.pub == true)
    var form = { status: 1, apiario_status: options.status }    
  else
    var form = { apiario_status: options.status }
  request(
  { 
    method: 'PUT',
    uri: options.uri + '/api/entity_node/'+options.uid+'.json',
    form: form,
    oauth: { 
      consumer_key: options.key,
      consumer_secret: options.secret,
      signature_method : 'PLAINTEXT'
    },
    gzip: true
  }
  , function (error, response, data) {
    if(error) throw(error);
    if(response.statusCode == 200) callback();
  });
}

var drupal = function(apiario_codigo, status, pub, callback) {
  console.log('Codigo:' + apiario_codigo);
  console.log('Status:' + status);
  console.log('Pub:' + pub);
  models.Attachments.findOne({ "_id": apiario_codigo}, function (err, ath) {  
    models.User.findOne({"_id": ath.user}, function (err2, user){
      var key = user.drupal.key;
      var secret = user.drupal.secret;
      var uri = user.drupal.callback;
      var options = {
        uri: uri,
        keu: key,
        secret: secret,
        apiario_codigo: apiario_codigo
      };
      getUid(options,function(uid) {
        var options = {
          uri: uri, 
          key: key,
          secret: secret,
          status: status,
          pub: pub,
          uid: uid
        };
        setStatus(options, function(){
          callback();
        });      
      })
    });
  });
}
module.exports.drupal = drupal;