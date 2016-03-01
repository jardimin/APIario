//Carrega os modulos do APIario
var models = require('../../models');
//Chama o jobs do módulo
var jobs = require('./models/jobs');
var path = require('path');
var request = require('request');
var ec2 = require("ec2");

/**
 * Método que inicia os jobs
 * @params anexo Aquivo anexo
 * @params config Configurações do módulo
 **/
var init = function (anexo, config) {
	//Verifica se a configuração está setada
	if (config.schedule == undefined)
		throw('Empty codem schedule');
	if (config.user == undefined)
		throw('Empty user');
	if (config.password == undefined)
		throw('Empty password');
	if (config.callback == undefined)
		throw('Empty password');
    //Configurações da AWS key, secret e zona
	ec2 = ec2({ 
		key: config.awskey, 
		secret: config.awssecret,
		endpoint: config.awszone
	});
	//Levanta a instância e manda rodar pela imagem
	ec2("RunInstances", {
	  "ImageId": config.awsimageid,
	  "KeyName": config.awskeyname,
	  "InstanceType": config.awsinstance,
	  "MinCount": 1, 
	  "MaxCount": 1
	}, running);
	//Verifica se está rodando a instância
	var reservationId, instanceId;
	function running (error, response) {
		if (error) throw error;
		reservationId = response.reservationId
		instanceId = response.instancesSet[0].instanceId;
		describe();
	}
	//Pega os detalhes das instâncias que estão rodando
	function describe () {
		ec2("DescribeInstances", {}, starting);
	}
	//Verifica se foi startado
	function starting (error, response) {
		if (error) throw error;
		var reservation, instance;
		reservation = response.reservationSet.filter(function (reservation) {
			return reservation.reservationId == reservationId;
		})[0];
		instance = reservation.instancesSet.filter(function (instance) {
			return instance.instanceId == instanceId;
		})[0];
		if (instance.instanceState.name == "running") ready();
		else setTimeout(describe, 2500);
	}

	//Ao rodar a instância
	function ready () {
		console.log("Instância rodando ID: " + instanceId);
		//Salva a instância que vai tratar do arquivo
		anexo.instancia = instanceId;
		anexo.save(function(){
			//Busca os presets no Codem-Schedule
			__presets(config,function(data){
				var presets = JSON.parse(data);
				//Loop em cada preset para criar o job
				presets.forEach(function(preset, index) {
					//Criando os jobs no schedule
					__jobs(config, anexo.file, preset.name, function(data){
						var obj = JSON.parse(data);
						//Salvando o job na base
						var job = new jobs({
							attachments: anexo._id,
							schedule: [obj]
						});
						//Salva os dados
						job.save(function(e){
							//Caso tenha algum erro retora o erro
							if(e) throw(e);
						}); 			
					});

				});
			});	
		});
	}
}

/**
 * Método para retornar os Presets configurados no Codem-Schedule
 * @return json
 **/
var __presets = function(config, call) {
	request(
	{ 
		method: 'GET',
		uri: config.schedule + '/api/presets.json',
		auth: {
			user: config.user,
			pass: config.password,
			sendImmediately: false
		},
		gzip: true
	}
	, function (error, response, body) {
		if(error) throw(error);
		call(body);
	});
}

/**
 * Método para criar os jobs usando os presets configurados no Codem-Schedule
 * @return json
 **/
var __jobs = function(config, file, preset, call) {
	//Cria o output baseado no nome do arquivo e preset	
	var output = path.dirname(file) + '/' + preset + '-' + path.basename(file);
	request(
	{ 
		method: 'POST',
		uri: config.schedule + '/api/jobs.json',
		form: {
			preset: preset,
			input: file,
			output: output,
			notify: config.notify
		},
		auth: {
			user: config.user,
			pass: config.password,
			sendImmediately: false
		},
		gzip: true
	}
	, function (error, response, body) {
		if(error) throw(error);
		call(body);
	});
}

module.exports.init = init;
module.exports.presets = __presets;
