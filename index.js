var express = require('express')
var sys = require('sys')
var fs = require('fs')
var exec = require('child_process').exec
var multer  = require('multer')
var bodyParser = require('body-parser')
var app = express()
var done = false
var jardim_key = '0Pl#58ME>AD13~<-$b0eR.jbMo73)TFeEajndFJT(L/9Z6t7>1V4/5wcn2FrpLA'

function puts(error, stdout, stderr) { sys.puts(stdout) }

app.use(multer({ dest: './uploads/',
  rename: function (fieldname, filename, req, res) {
    return filename+'_original';
  },
  onFileUploadStart: function (file, req, res) {
    console.log(file.originalname + ' is starting ...')
  },
  onFileUploadComplete: function (file, req, res) {
    console.log(file.fieldname + ' uploaded to  ' + file.path)
    done=true;
  }
}));

app.use(bodyParser.json());

app.get('/', function (req, res) {
  exec("ls -la", puts);
  res.send('Hello World!')
})

app.post('/upload', function (req, res) {

  if (req.headers.key && req.headers.key === 'jardim') {
    if (done==true) {
      console.log(req.body)
      exec("mkdir ./uploads/" + req.body.id + "/" + req.body.post, puts);
      res.send('OK')
    }
  } 
  
})

app.post('/transcode', function (req, res) {
  console.log(req.headers)
  res.send(req.body)
})  

var server = app.listen(3000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)

})

// Esse é o comando de curl que eu tava usando para testar
// curl -i -H "key: jardim" -F id=1234567890 -F post=post1 -F nome_origem=aovivonaweb -F origem=http://aovivonaweb.tv -F upload=@/media/dados/fundo.mp4 http://0.0.0.0:3000/upload