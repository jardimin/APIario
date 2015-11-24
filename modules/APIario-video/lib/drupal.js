var request = require('request');
var models = require('./../../../models');
var configGeral = require('./../../../config');
var config = require('./../../../config').video;
var path = require('path');
var video = require('../index');
var knox = require('knox');
var sys = require('sys');
var fs = require('fs');

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
          ath: ath,
          s3: {
            key: config.s3key,
            secret: config.s3secret,
            bucket: config.s3bucket
          }
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
  //Cria o formulário para envio das informações
  //Verifica se o pub(publicar) está ativado
  if(options.pub == true) {
    sendS3(options, function(urlVideo) {
      callback({ status: 1, apiario_status: options.status, apiario_url_video: urlVideo });
    });
  } else callback({ apiario_status: options.status });
}

var sendM3U8 = function(options, s3urls, callback) {
  var original = options.ath.file;
  /*
  var m3u8 = '#EXTM3U';
  s3urls.forEach(function(url, index){
    if(url.indexOf('400k') >= 0) {
      m3u8 = m3u8 + '#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=457458,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"';
      m3u8 = m3u8 + 'http://colmeia.aovivonaweb.tv:8090/55c54ffc6801a6a869443e52/x264-400k-31483-zovdig.mp4/index-v1-a1.m3u8';

  });
  
  m3u8 = m3u8 + '#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=925086,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"';
  m3u8 = m3u8 + 'http://colmeia.aovivonaweb.tv:8090/55c54ffc6801a6a869443e52/x264-1M-31483-zovdig.mp4/index-v1-a1.m3u8';
  m3u8 = m3u8 + '#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=1992375,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"';
  m3u8 = m3u8 + 'http://colmeia.aovivonaweb.tv:8090/55c54ffc6801a6a869443e52/x264-2M-31483-zovdig.mp4/index-v1-a1.m3u8';
  */
  console.log('chegou');
  s3urls.forEach(function(url, index){
    console.log(url);
  });
  /*var client = knox.createClient(options.s3);  
  client.putFile(arquivo, '/' + options.idUser + '/' + file,{ 'x-amz-acl': 'public-read' }, function(err, res){
    if (200 == res.statusCode) {
      s3urls.push(res.req.url);
    } else {
      console.log(err);
    }
  });*/
}
/**
 * Envia os arquivos locais tratados pelo codem schedule para a Amazon S3
 * @param option json
 * @param callback function retorno dos dados para envio
 **/
var sendS3 = function(options, callback) {
  //Seta as variáveis
  var name = '';
  var init = '';  
  var client = knox.createClient(options.s3);
  var arquivos = new Array();
  var s3urls = new Array();
  //Busca os presets para capturar os nomes 
  video.presets(config, function(data){
    var presets = JSON.parse(data);

    var file = path.basename(options.ath.file);
    //Loop em cada preset para criar o job
    presets.forEach(function(preset, index) {
      //Pega os tamanhos do vídeo
      name = preset.name.split('-')[1];
      //Nome Inicial
      init = preset.name.split('-')[0];
      arquivos.push(configGeral.upload + options.idUser + '/' + init + '-' + name + '-' + file);
    });

    //Da um loop na variável arquivos para pegar os nomes dos arquivos montados
    arquivos.forEach(function(arquivo, index){
      //Verifica se o arquivo existe
      fs.exists(arquivo, function (exists) {
        if(exists){
          //Retorna o nome do arquivo
          var file = path.basename(arquivo);
          //Envia para o S3
          client.putFile(arquivo, '/' + options.idUser + '/' + file,{ 'x-amz-acl': 'public-read' }, function(err, res){
            if (200 == res.statusCode) {
              //Deleta o arquivo da máquina local
              fs.unlink(arquivo, function (err) {
                if (err) throw err;
                //Adiciona a url a array s3urls
                s3urls.push(res.req.url);                
                if (s3urls.length == arquivos.length) {
                  sendM3U8(options, s3urls,function(){

                  });
                }                
                console.log('Arquivo deletado com sucesso: ' + arquivo);
              });
              
              
            } else if(err) throw(err);
          });   
        }
      });
    });
  });

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