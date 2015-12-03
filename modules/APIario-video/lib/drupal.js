var request = require('request');
var models = require('./../../../models');
var configGeral = require('./../../../config');
var config = require('./../../../config').video;
var path = require('path');
var video = require('../index');
var knox = require('knox');
var sys = require('sys');
var fs = require('fs');
var ec2 = require("ec2");


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
      if(pub) {
        //Configurações da AWS key, secret e zona
        ec2 = ec2({ 
          key: config.awskey, 
          secret: config.awssecret,
          endpoint: config.awszone
        });        
        //Encerra a instancia que tratou os vídeos na Amazon
        ec2("TerminateInstances", {InstanceId: ath.instancia}, function(error,response){
          console.log('Encerrando a instancia: ' + ath.instancia);
        });
      }
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
            key: config.awskey,
            secret: config.awssecret,
            bucket: config.awsbucket
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

/**
 * Função para retornar todos os arquivos de um diretório
 * @param dir
 * @param files_
 **/
var getFiles = function(dir, files_){
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files){
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()){
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}

/**
 * Cria o arquivo m3u8 relacionados com os presets
 * @param presets
 * @param file
 **/
var createM3U8 = function(presets, file, callback) {
  //Cria o nome do arquivo com m3u8
  var m3u8File = path.basename(file, path.extname(file)) + '.m3u8';
  //Pega o nome do arquivo com a extenção
  var nameEx = path.basename(file);
  //Chama o módulo para criar o m3u8
  var writer = require('m3u').httpLiveStreamingWriter();
  //Loop nos presets
  presets.forEach(function(preset, index) {
    //Cria o nome do arquivo
    var name = preset.name + '-' + m3u8File;
    writer.playlist(name, {
      bandwidth: config.bandwidth[preset.name],
      programId: 1,
      codecs: ['avc1.640028', 'mp4a.40.2'],
      resolution: '1920x1080',
    });
    if (index === presets.length - 1) {
      var m3u8 = writer.toString();
      var folder = path.dirname(file);
      fs.writeFile(folder + '/' + m3u8File, m3u8, function(err) {
        if(err) return console.log(err);
        callback();
      });
    }
  });
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
    createM3U8(presets,options.ath.file, function(){
      var client = knox.createClient(options.s3);
      var folder = path.dirname(options.ath.file);
      var files = getFiles(folder);
      var enviados = new Array();
      var nameFile = path.basename(options.ath.file, path.extname(options.ath.file));

      files.forEach(function(file, index){
        var nome = path.basename(file);
        //Envia para o S3
        client.putFile(file, '/' + options.idUser + '/' + nameFile + '/' + nome,{ 'x-amz-acl': 'public-read' }, function(err, res){
          if (200 == res.statusCode) {
            //Deleta o arquivo da máquina local
            fs.unlink(file, function (err) {
              if (err) throw err;
              //Adiciona a url a array enviados
              enviados.push(res.req.url); 
              console.log(res.req.url);
              if (enviados.length == files.length) {
                console.log('Concluído o envio dos arquivos')
              }
            });
          } else if(err) throw(err);
        }); 
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