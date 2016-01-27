var Utils = require('./../lib/utils');
var jobs = require('./../models/jobs');
var models = require('./../../../models');
var config = require('./../../../config');
var video = require('../index.js');
var request = require('request');
var drupal = require('../lib/drupal');
//Variável global para verificar se foi concluído os arquivos para evitar reenvio
global.notifys3 = new Array();

/**
 * Rota que recebe a notificação do codem-schedule sobre os vídeos
 * Essa função funciona somente local, hosts externos são negados
 **/
exports.notify = function(req, res, next) {
  console.log(global.notifys3);
  //Recebe os Ips da máquina local
  var ips = Utils.getIPAddresses();
  //Pega o ip da origem
  var origin = req.headers['x-forwarded-for'] ||
     req.connection.remoteAddress ||
     req.socket.remoteAddress ||
     req.connection.socket.remoteAddress;
  //Verifica se o POST foi dado da máquina local
  if(ips.indexOf(origin) > -1) {
    //Busca o jobs na base interna
    jobs.findOne({ "schedule.id": req.body.id}, function (err, job) {
      
      //Se o jobs estiver pronto
      if(req.body.state == 'success') {
        //Busca a quantidade de presets
        video.presets(config.video,function(data){
          //Faz a contagem dos presets
          var presets = JSON.parse(data).length;
          //Faz a contagem dos vídeos baseado no job
          jobs.count({"schedule.state": 'success', "attachments": job.attachments},function(err,count){
            //Caso a quantidade de presets for a quantidade de vídeos com sucesso os Vídeos estão prontos
            if(presets == count) {
              if (global.notifys3.indexOf(job.attachments.toString()) < 0) { 
                //Seta a variável global com o id do anexo informando que está concluído
                global.notifys3.push(job.attachments.toString());              
                //Envia os arquivos para o S3 e altera os dados no drupal
                drupal.drupal(job.attachments, 'Concluído com sucesso!', true , function(){});
                console.log('Concluído os vídeos');
              }
            }
          });          
        });
      }
      drupal.drupal(job.attachments, req.body.state, false, function(){});
      //Encerrando a instância em caso de erro
      if(req.body.state == 'failed' || req.body.state == 'on_hold') {
        //Busca o anexo
        models.Attachments.findOne({ "_id": job.attachments}, function (err, ath) {
          //Encerrando a instância
          drupal.endStance(ath.instancia);
        });
      }
      //Salva o schedule novamente com novo status e mensagens
      job.schedule = req.body;
      job.save();
      res.send('Sucesso!');
    });
  } else res.status(403).send('Não autorizado');
};