var User = require('./../models').User;
var Attachments = require('./../models').Attachments;
var errors = require('./../errors');
var config = require('./../config');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
//Módulo para tratamento dos arquivos
var video = require('../modules/APIario-video');



var createFolders = function(folderClient, folderFiles){
  fs.exists(folderClient, function(exists) {

  });
}
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
    //var nome = oldFile.split("/");  
    //nome = nome[nome.length - 1];
    var nome = path.basename(oldFile);
    var pastaFile = path.basename(oldFile, path.extname(oldFile));
    //Move este arquivo para a pasta do usuário 
    var newFile = config.upload + id + '/' + pastaFile + '/'+ nome; 
    var folder = config.upload + id + '/' + pastaFile;

    mkdirp(folder, function (err) {
      if (err) throw err;
      fs.chmod(config.upload + id, '0777', function() {
        fs.chmod(folder, '0777', function(){        
          //Move o arquivo para a pasta destino
          fs.rename(oldFile,newFile, function(err){
            if(err) throw err;
            //Permissão de escrita no arquivo
            fs.chmod(newFile, '0777');
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
  }); 
};
