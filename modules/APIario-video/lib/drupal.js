var request = require('request');
var models = require('./../../../models');
var configGeral = require('./../../../config');
var config = require('./../../../config').video;
var path = require('path');
var video = require('../index');
var sys = require('sys');
var fs = require('fs-extra');
var ec2 = require("ec2");
var s3 = require("s3");


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
      //Ao publicar encessar a instância
      if(pub) {
        //Encerrando a instância
        endStance(ath.instancia);
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
            maxAsyncS3: 20,
            s3RetryCount: 3,
            s3RetryDelay: 1000,
            multipartUploadThreshold: 20971520,
            multipartUploadSize: 15728640,
            s3Options: {
              accessKeyId: config.awskey,
              secretAccessKey: config.awssecret,
              region: config.awszone,
              ACL: "public-read"
            },
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
    sendS3(options, function(retorno) {
      callback({ status: 1, apiario_status: options.status, apiario_url_video: retorno.urlVideo, apiario_url_thumb: retorno.urlThumb});
      console.log('Retorno para o Drupal');
      console.log('Concluído!');
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
 * @callback retorno
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
        callback(m3u8File);
      });
    }
  });
}

/**
 * Busca no S3 os arquivos enviados para retornar a URL
 * @param arquivo
 * @param options opcoes gerais configuradas anteriormente
 * @param nameFile nome do arquivo s3
 * @param callback retorno 
 **/
var getUrlsS3 = function(arquivo, options, nameFile, callback) {
  var client = s3.createClient(options.s3);
  //Prepara para listar
  var listar = client.listObjects({
    s3Params: {
      Bucket: config.awsbucket,
      Prefix: options.idUser +"/" + nameFile + "/"
    },
  });
  //Ao retornar o conteúdo
  listar.on('data', function(data) {
    data.Contents.forEach(function(file, index, arr) {
      if (file.Key.indexOf(arquivo) > 0) {
        //Encerra o loop
        arr.length = 0;
        //Retorna o arquivo
        callback(file.Key);
      }
    });
  });  
}

/**
 * Envia os arquivos locais tratados pelo codem schedule para a Amazon S3
 * @param option json
 * @param callback function retorno dos dados para envio
 **/
var sendS3 = function(options, callback) {
  console.log('Organizando os arquivos...');
  organizar(options, function(m3u8File, nameFile) {
    var client = s3.createClient(options.s3);
    var params = {
      localDir: "/mnt/colmeia/upload/"+options.idUser+"/",
      deleteRemoved: false,
      s3Params: {
        Bucket: config.awsbucket,
        Prefix: options.idUser + '/',
        ACL: "public-read" 
      },
    };
    console.log('Enviando os arquivos para S3....');
    //Inicia o uploader com os parametros configurados
    var uploader = client.uploadDir(params);
    //Quando acontecer um erro no envio exibe a mensagem
    uploader.on('error', function(err) {
      console.error("Erro ao enviar arquivos para S3:", err.stack);
    });
    //Processo do envio
    uploader.on('progress', function() {
      //console.log("Enviando...", uploader.progressAmount, uploader.progressTotal);
    });
    //Fim do envio do arquivo para o S3
    uploader.on('end', function() {
      console.log('Envio concluído.');
      //Pega o nome do arquivo m3u8 para retorno
      getUrlsS3(m3u8File, options, nameFile,function(m3u8){
        //Pega o nome do arquivo png para retorno
        getUrlsS3('.png', options, nameFile,function(png){
          //Retorno com a URL do vídeo para o Drupal
          var urlVideo = s3.getPublicUrlHttp(config.awsbucket,'') + m3u8;
          var urlThumb = s3.getPublicUrlHttp(config.awsbucket,'') + png;
          console.log('URL do vídeo: ' + urlVideo);
          console.log('Excluindo os arquivos localmente...');
          //Exclui os arquivos
          fs.emptyDir("/mnt/colmeia/upload/"+options.idUser+"/" + nameFile + "/");
          //Retorna o callback
          callback({urlVideo: urlVideo, urlThumb: urlThumb});  
        });
      });
    });    
  });
}

/**
 * Organiza os arquivos antes de fazer o envio para o S3
 * @param option json
 * @param callback function retorno dos dados para envio
 **/
var organizar = function(options,callback) {
  //Seta as variáveis
  var transcodeEx = new RegExp("(x264-(1M|2M|400k)).*(mp4|mov|flv|avi|webm|3gp)$");
  var streamEx = new RegExp("(x264-(1M|2M|400k)).*(ts|m3u8)$");
  var thumbsEx = new RegExp("(x264-(1M|2M|400k)).*png$");
  var diretorio = '/';  
  //Variável para verificação dos arquivos movidos
  var movido = new Array();
  //Busca os presets para capturar os nomes 
  video.presets(config, function(data){
    var presets = JSON.parse(data);
    //Cria o arquivo m3u8 com base nos arquivos criados pelo codem-transcode
    //Espera o retorno para continuar
    console.log('Criando m3u8...');
    createM3U8(presets,options.ath.file, function(m3u8File){
      //Diretório onde estão os arquivos
      var folder = path.dirname(options.ath.file);
      //Retorna um array com todos os arquivos do diretório
      var files = getFiles(folder);
      //Nome do arquivo sem a extenção
      var nameFile = path.basename(options.ath.file, path.extname(options.ath.file));
      //Loop nos arquivos do diretório
      files.forEach(function(file, index){
        movido[index] = false;
        //Pega o nome do arquivo da pasta com a extenção
        var nome = path.basename(file);
        //Verificação dos nomes dos arquivos
        if(transcodeEx.test(nome)) 
          diretorio = '/transcode/';
        else if(streamEx.test(nome) || (nome == m3u8File))
          diretorio = '/stream/';
        else if(thumbsEx.test(nome))
          diretorio = '/thumbs/';
        else
          diretorio = '/original/';

        if(diretorio != '/') {
          fs.move(file, folder + diretorio + nome, function (err) {
            //Adiciona movido na array
            movido[index] = true;
            if (err) console.error(err);
          });
        }
        //Temino da organização, falta mover os arquivos
        if (index === files.length - 1) {
          console.log('Organização concluída.');       
        }
      }); 

      //Verifica em alguns segundos se moveu todos os arquivos
      var intervalo = setInterval(function(){
        //Verifica moveu todos os arquivos
        if(movido.every(function(element){return element == true})){
          console.log('Arquivos movidos com sucesso!');
          //Para a verificação
          clearInterval(intervalo);
          callback(m3u8File, nameFile);
        } else {
          console.log('Aguardando mover os arquivos...');
        } 
      }, 300);


    });
  });
}

/**
 * Encerra as instâncias caso não tenha nenhum job sendo processado
 * @param instancia codigo da instancia para encerramento
 **/
var endStance = function(instancia) {
  console.log('Verificando se é possível encerrar a instância: ' + instancia);
  //Configurações da AWS key, secret e zona
  ec2 = ec2({ 
    key: config.awskey, 
    secret: config.awssecret,
    endpoint: config.awszone
  });
  //A cada 2 minutos verifica se existe jobs sendo processados
  var intervalo = setInterval(function(){
    //Retorna os jobs processando
    getJobStatusProcessing(function(data){
      //Converte em JSON o retorno
      var jobs = JSON.parse(data);
      //Verifica se a lista está vazia
      if(jobs == 0){
        //Para a verificação
        clearInterval(intervalo);
        //Encerra a instancia que tratou os vídeos na Amazon
        ec2("TerminateInstances", {InstanceId: instancia}, function(error,response){
          console.log('Encerrando a instancia: ' + instancia);
        });            
      } else {
        console.log('Aguardando para encerrar a instância: ' + instancia);
      }            
    });

  }, 120000);   
}

/**
 * Retorna a lista dos jobs sendo processados
 * @param callback function
 **/
var getJobStatusProcessing = function(callback){
  request(
  { 
    method: 'GET',
    uri: config.schedule + '/api/jobs/processing.json',
    auth: {
      user: config.user,
      pass: config.password,
      sendImmediately: false
    },
    gzip: true
  }
  , function (error, response, body) {
    if(error) throw(error);
    callback(body);
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
      if(response.statusCode == 200) {
        console.log('Notificação enviada para o Drupal...');
        callback();
      }
    });
  });
}

module.exports.drupal = drupal;
module.exports.endStance = endStance;