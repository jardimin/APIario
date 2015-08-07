//Carrega os modulos do APIario
var models = require('../../models');
//Chama o jobs do módulo
var jobs = require('./models/jobs');
var path = require('path');
var request = require('request');

module.exports = function(args) {
	/**
	 * Construtor do módulo
	 * @params args Argumentos enviados anexo e config
	 **/
	var __constructor = function (args) {
		// Verifica a existência dos 2 argumentos
		if (args.length < 2 )
			throw('Empty arguments');
		var anexo = args[0];
		var config = args[1];

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
	var __presets = function(args, call) {
		request(
		{ 
			method: 'GET',
			uri: args.schedule + '/api/presets.json',
			auth: {
				user: args.user,
				pass: args.password,
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
	var __jobs = function(args, file, preset, call) {
		//Cria o output baseado no nome do arquivo e preset	
		var output = path.dirname(file) + '/' + preset + '-' + path.basename(file);
		request(
		{ 
			method: 'POST',
			uri: args.schedule + '/api/jobs.json',
			form: {
				preset: preset,
				input: file,
				output: output,
				notify: args.notify
			},
			auth: {
				user: args.user,
				pass: args.password,
				sendImmediately: false
			},
			gzip: true
		}
		, function (error, response, body) {
			if(error) throw(error);
			call(body);
		});
	}

	/*var run = function() {
		setTimeout( function(){
			fs.unlink(path, function(err) {
			if (err) console.log(err);
			console.log('file successfully deleted');
		});
		}, 60 * 1000);
	}*/

	return __constructor.call(this, arguments);
}