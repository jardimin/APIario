//Carrega os modulos do APIario
var models = require('../../models');
//Chama o jobs do módulo
var jobs = require('./models/jobs');
var path = require('path');
var request = require('request');

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
