<!DOCTYPE html>
<html>
<head>
	<title>Upload</title>
	<link rel="stylesheet" href="/stylesheets/bootstrap.min.css">
	<link rel="stylesheet" href="/stylesheets/style.css">	
</head>
<body>
	<div class="container">
		<div class="row">
			<div class="span12">
				<form method="post" action="/">
					<legend>Upload Videos</legend>
					<input type="hidden" name="access_token" value="<?php echo $_GET['access_token'] ?>" id="access_token">
					<input type="file" name="myFile" id="myFile">
					<p></p>
					<div class="form-actions">
						<input type="submit" value="Enviar" class="btn btn-primary">
					</div>
				</form>
			</div>
		</div>
		<hr>
		<div class="row">
			<div class="span12">
				<div class="progress progress-striped active hide">
					<div style="width: 0%" class="bar"></div>
				</div>
			</div>
		</div>
		<div class="row">
			<div class="span12">
				<div class="alert hide">
					<button type="button" data-dismiss="alert" class="close">x</button>
					<span>
						<strong class="message"></strong>
					</span>
				</div>
			</div>
		</div>
	</div>
	<script src="/javascripts/jquery-1.9.1.min.js"></script>
	<script src="/javascripts/bootstrap.min.js"></script>
	<script>
		$(function() {
		  
		  var showInfo = function(message) {
		    $('div.progress').hide();
		    $('strong.message').text(message);
		    $('div.alert').show();
		  };
		  
		  $('input[type="submit"]').on('click', function(evt) {
		    evt.preventDefault();
		    $('div.progress').show();
		    var formData = new FormData();
		    var file = document.getElementById('myFile').files[0];
		    formData.append('myFile', file);
		    
		    var xhr = new XMLHttpRequest();
		    
		    xhr.open('post', 'http://colmeia.aovivonaweb.tv/upload', true);
		    //Access token para autenticação com a API
		    xhr.setRequestHeader('Authorization','Bearer ' + $('#access_token').val());
		    xhr.upload.onprogress = function(e) {
		      if (e.lengthComputable) {
		        var percentage = (e.loaded / e.total) * 100;		        
		        $('div.progress div.bar').css('width', percentage + '%');
		      }
		    };
		    
		    xhr.onerror = function(e) {
		    console.log(e);
		      showInfo('Ocorreu um erro ao enviar o formulário. Talvez o seu arquivo é muito grande');
		    };
		    
		    xhr.onload = function() {
		      showInfo(this.statusText);
		    };
		    
		    xhr.send(formData);
		    
		  });
		  
		});

	</script>
</body>
</html>
