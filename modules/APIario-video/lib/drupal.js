var request = require('request');
var config = require('./../../../config');
var models = require('./../../../models');
var jobs = require('./../models/jobs');

var uri = 'http://anonimo.novo/api';
var key = 'ohkWHAEu3mU6vitWjfoykvG3NDsk3Atg';
var secret = 'gSFGZLMYL4SJbVCRNXm9Yu4rMuX5cuLW';

models.Attachments.findOne({ "_id": '55d20af7c139212c31fe0c89'})
.populate('user')
.exec(function (err, value) {   
  console.log(value);

});


request(
{ 
  method: 'GET',
  uri: 'http://anonimo.novo/api/entity_node?fields=nid&parameters[apiario_codigo]=55e513928b6bdbeb0fad035e',
  /*form: {
    status: 1,
    apiario_status: 'Novamente'
  },*/
  oauth: { 
    consumer_key: key,
    consumer_secret: secret,
    signature_method : 'PLAINTEXT'
  },
  gzip: true
}
, function (error, response, data) {
  if(error) throw(error);
  if(data != '["No entities found."]') {
    var nodes = JSON.parse(data);
    //Loop para pegar o código do vídeo
    nodes.forEach(function(node, index) {
      console.log(node.nid);
    });    
  }
 

});