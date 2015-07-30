//Carrega os modulos do APIario
var models = require('../../models');
//Chama o jobs do módulo
var jobs = require('./models/jobs');

module.exports = function(args) {
	//curl -d 'input=/mnt/colmeia/upload/55848166771b1695560ede4e/26520-7r7rl.mp4&output=/mnt/colmeia/upload/55848166771b1695560ede4e/26520-7r7rl/26520-7r7rl-x264-400k.mp4&preset=x264-400k' http://colmeia:jbk401@localhost:3000/api/jobs
	var __constructor = function (args) {
		// Verifica a existência dos 3 argumentos
		if (args.length < 3 )
			throw('Empty arguments');
		var app = args[0];
		var middleware = args[1];
		var config = args[2];
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
			presets.forEach(function(preset, index) {
				console.log(preset.name);
			});
		});	
	}

	/**
	 * Método para retornar os Presets configurados no Codem-Schedule
	 * @return json
	 **/
	var __presets = function(args, call) {
		var request = require('request')
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
	var __jobs = function(args, call) {

	}

	var run = function() {
		setTimeout( function(){
			fs.unlink(path, function(err) {
			if (err) console.log(err);
			console.log('file successfully deleted');
		});
		}, 60 * 1000);
	}

	return __constructor.call(this, arguments);
}