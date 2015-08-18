var Utils = require('./../lib/utils');
var jobs = require('./../models/jobs');
var config = require('./../../../config');
var video = require('../index.js');
/**
 * Rota que recebe a notificação do codem-schedule sobre os vídeos
 * Essa função funciona somente local, hosts externos são negados
 **/
exports.notify = function(req, res, next) {
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
    jobs.findOne({ "schedule.id": req.body.id}, function (err, job){
      //Se o jobs estiver pronto
      if(req.body.state == 'success') {
        //Busca a quantidade de presets
        video.presets(config.video,function(data){
          //Faz a contagem dos presets
          var presets = JSON.parse(data).length;
          //Faz a contagem dos vídeos baseado no job
          jobs.count({"schedule.state": 'success', "attachments": job.attachments},function(err,count){
            //Caso a quantidade de presets for a quantidade de vídeos com sucesso os Vídeos estão prontos
            if(presets == count) console.log('Concluído os vídeos');
          });          
        });
      }
      //Salva o schedule novamente com novo status e mensagens
      job.schedule = req.body;
      job.save();
      res.send('Sucesso!');
    });
  } else res.status(403).send('Não autorizado');
};