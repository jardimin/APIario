module.exports = function() {
	//curl -d 'input=/mnt/colmeia/upload/55848166771b1695560ede4e/26520-7r7rl.mp4&output=/mnt/colmeia/upload/55848166771b1695560ede4e/26520-7r7rl/26520-7r7rl-x264-400k.mp4&preset=x264-400k' http://colmeia:jbk401@localhost:3000/api/jobs

	var __constructor = function (args) {
		// Verifica a existência das configurações
		if (args.length == 0 )
			throw('Empty arguments');
		if (args[0].input == undefined)
			throw('Empty input');
		if (args[0].output == undefined)
			throw('Empty output');
		if (args[0].schedule == undefined)
			throw('Empty codem schedule');
		if (args[0].user == undefined)
			throw('Empty user');
		if (args[0].password == undefined)
			throw('Empty password');
		if (args[0].callback == undefined)
			throw('Empty password');
		//Vídeo a ser tratado
		var input = args[0].input;
		//Caminho do vídeo depois de tratado 
		var output = args[0].output;
		//Url do code-schedule
		var schedule = args[0].schedule;
		//Usuário de autenticação do schedule
		var user = args[0].user;
		//Senha de autenticação do schedule
		var password = args[0].password;
		//Url de retorno para avisar o status do processamento do schedule
		var callback = args[0].callback;
		//Busca os presets no Codem-Schedule
		__presets(args[0],function(data){
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