var User = require('./../models').User;
var Attachments = require('./../models').Attachments;
var errors = require('./../errors');
var config = require('./../config');
var fs = require('fs');
//Módulo para tratamento dos arquivos
var video = require('../modules/APIario-video');


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
                  video.init(anexo, config.video);
                  //Retorna o id do anexo salvo
                  res.json({id: anexo.id});
                }
              });                
            });
        }); 
    });  
  }); 
};
