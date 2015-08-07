var User = require('./../models').User;
var Utils = require('./../lib/utils');
var Attachments = require('./../models').Attachments;
var jobs = require('./../modules/APIario-video/models/jobs');
var errors = require('./../errors');
var config = require('./../config');
var fs = require('fs');


/**
 * Rota para mostrar os dados do usuário
 **/
module.exports.send = function(req, res, next) {
  //Busca o usuário logado pelo seu userId(email)
  User.findOne({ email: req.oauth.bearerToken.userId}, function(err, user) {
    //Pega o Id do usuário logado pelo Auth
    var id = user._id;
    //Nome do arquivo após o upload
    var oldFile = req.files.video.path;
    //Pega o nome do arquivo
    var nome = oldFile.split("/");  
    nome = nome[nome.length - 1];
    //Move este arquivo para a pasta do usuário 
    var newFile = config.upload + id + '/' + nome; 
    //Verifica a existência da pasta e cria a pasta do usuário com o seu Id
    fs.exists(config.upload + id, function(exists) {      
        if (!exists) fs.mkdir(config.upload + id);
    });         
    //Move o arquivo para a pasta destino
    fs.readFile(oldFile , function(err, data) {
        fs.writeFile(newFile, data, function(err) {
            //Apaga o arquivo temporário
            fs.unlink(oldFile, function(err){            
              if(err) throw err;
              //Instancia o Attachments com os dados para salvar
              var anexo = new Attachments({
                file: newFile,
                originalFilename: req.files.video.name,
                user: user._id
              });
              //Salva os dados
              anexo.save(function(e){
                if(e == null) {
                  //Carregando módulo do vídeo e criando job
                  var video = require('../modules/APIario-video')(anexo, config.video);
                  //Retorna o id do anexo salvo
                  res.json({id: anexo.id});
                }
              });                
            });
        }); 
    });  
  }); 
};

/**
 * Rota que recebe a notificação do codem-schedule sobre os vídeos
 * Essa função funciona somente local, hosts externos não deve funcionar
 **/
module.exports.notify = function(req, res, next) {
  //Recebe os Ips da máquina local
  var ips = Utils.getIPAddresses();
  //Verifica se o POST foi dado da máquina local
  if(ips.indexOf(req.headers['x-forwarded-for']) > -1) {
    //Transforma o retorno em objeto
    var post = JSON.parse(req.body);
    //Busca o jobs na base interna
    jobs.findOne({ "schedule.id": post.id}, function (err, job){
      //Salva o schedule novamente com novo status e mensagens
      job.schedule = post;
      job.save();
      next();
    });
  } else res.send('Não autorizado!');
};