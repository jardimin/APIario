#!/usr/bin/env node
var args = process.argv.slice(2);
var models = require('./models');
var bcrypt = require('bcrypt');
var inquirer = require("inquirer");
uniqid = require('uniqid');

//Campos com as perguntas
var perg = [
    {
      type: 'input',
      name: 'email',
      message: 'Email do usuário:',
    },
    {
      type: 'password',
      name: 'senha',
      message: 'Digite a senha do usuário:',
    },
    {
      type: 'input',
      name: 'url',
      message: 'Digite a URL de redirecionamento:',
    }
];
//Para criptografar a senha
hashPassword = function(password) {
  var salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}
inquirer.prompt(perg, function(resp) {
  var clientId = uniqid() + uniqid();
  var clientSecret = uniqid();
  //Verifica se já existe o usuário
  models.User.count({ 'email': resp.email }, function (err, count) {
    if(count == 0) {
      //Criação do um usuário com sua página de retorno, a página de retorno sempre será verificada
      models.User.create({
        email: resp.email, //Login do usuário
        hashed_password: hashPassword(resp.senha) //Senha do usuário
      }, function(error) {
        if(error) throw error;
        models.OAuthClientsModel.create({
          clientId: clientId,
          clientSecret: clientSecret,
          redirectUri: resp.url
        }, function() {
          console.log('Cadastro efetuado com sucesso!');
          console.log('Anote o ClientID e ClientSecret do usuário: ClientID:' + clientId + ' -- ClientSecret:' + clientSecret);
          process.exit();
        });
      });  
    } else throw 'Usuário com email já existe. Tente novamente.';
  });  


});

