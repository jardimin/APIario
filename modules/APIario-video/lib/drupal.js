var request = require('request');
var models = require('./../../../models');
var config = require('./../../../config').video;
var path = require('path');
var video = require('../index');


/**
 * Método construtor onde busca o usuário através do anexo e captura o key e secret
 * busca o UID e seta o status
 * @param apiario_codigo String
 * @param status String
 * @param pub boolean
 * @param callback function
 **/
var drupal = function(apiario_codigo, status, pub, callback) {
  models.Attachments.findOne({ "_id": apiario_codigo}, function (err, ath) {
    var file = ath.file;
    models.User.findOne({"_id": ath.user}, function (err2, user){
      var idUser = user._id;
      //Seta o key do usuário do drupal
      var key = user.drupal.key;
      //Seta o secret do usuário do drupal
      var secret = user.drupal.secret;
      //URL de alteração dos status do Drupal
      var uri = user.drupal.callback;
      //Configura as opções do getUid
      var options = {
        uri: uri,
        key: key,
        secret: secret,
        apiario_codigo: apiario_codigo
      };
      getUid(options,function(uid) {
        //Configura as opções do setStatus
        var options = {
          uri: uri, 
          key: key,
          secret: secret,
          status: status,
          pub: pub,
          uid: uid,
          idUser: idUser,
          file: file
        };
        setStatus(options, function(){
          callback();
        });      
      })
    });
  });
}

/**
 * Retorna a UID do node através do código do anexo
 * @param options json
 * @param callback function
 */
var getUid = function(options, callback) {
  //Envia as informações pelo request
  request(
  {
    method: 'GET',
    uri: options.uri + '/api/entity_node?fields=nid&parameters[apiario_codigo]=' + String(options.apiario_codigo),
    oauth: { 
      consumer_key: String(options.key),
      consumer_secret: String(options.secret),
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

/**
 * Cria o Form de retorno e também a URL do vídeo baseado nos presets
 * @param options json
 * @param callback function
 **/
var getForm = function(options, callback) {
  //Seta as variáveis
  var name = '';
  var init = '';
  //Cria o formulário para envio das informações
  //Verifica se o pub(publicar) está ativado
  if(options.pub == true) {
    //Busca os presets para capturar os nomes 
    video.presets(config, function(data){
      var presets = JSON.parse(data);
      //Loop em cada preset para criar o job
      presets.forEach(function(preset, index) {
        //Pega os tamanhos do vídeo
        name = name + preset.name.split('-')[1] + ',';
        //Nome Inicial
        init = preset.name.split('-')[0];
      });
      //URL de exemplo
      //http://colmeia.aovivonaweb.tv:8090/55c54ffc6801a6a869443e52/x264-,400k,1M,2M,-31483-zovdig.mp4.urlset/master.m3u8
      var file = path.basename(options.file);
      //Cria a url do vídeo
      var urlVideo = config.urlVideo + '/' + options.idUser + '/'+ init +'-,'+ name +'-' + file + '.urlset/master.m3u8';
      //Retorna
      callback({ status: 1, apiario_status: options.status, apiario_url_video: urlVideo });
    });
  } else callback({ apiario_status: options.status });
}

/**
 * Seta o status no Drupal usando o key e secret enviado pelo Drupal
 * @param options json
 * @param callback function
 **/
var setStatus = function(options, callback) {
  getForm(options, function(form){
    //Envia as informações para alteração do status
    request(
    { 
      method: 'PUT',
      uri: options.uri + '/api/entity_node/'+options.uid+'.json',
      form: form,
      oauth: { 
        consumer_key: String(options.key),
        consumer_secret: String(options.secret),
        signature_method : 'PLAINTEXT'
      },
      gzip: true
    }
    , function (error, response, data) {
      if(error) throw(error);
      if(response.statusCode == 200) callback();
    });
  });
}

module.exports.drupal = drupal;