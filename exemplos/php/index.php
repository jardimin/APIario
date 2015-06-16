<?php
require('Client.php');
require('GrantType/IGrantType.php');
require('GrantType/AuthorizationCode.php');
require('GrantType/RefreshToken.php');

const CLIENT_ID     = '28471984739287473';
const CLIENT_SECRET = '3947839820';

const REDIRECT_URI           = 'http://colmeia.teste/php/index.php';
const AUTHORIZATION_ENDPOINT = 'http://colmeia.teste:3001/oauth/authorise';
const TOKEN_ENDPOINT         = 'http://colmeia.teste:3001/oauth/token';
const ACCESS_TOKEN_BEARER   = 1;

$client = new OAuth2\Client(CLIENT_ID, CLIENT_SECRET);

if (isset($_GET['access_token'])) {
    //Seta o access token
    $client->setAccessToken($_GET['access_token']);
    //Define o tipo do token
    $client->setAccessTokenType(ACCESS_TOKEN_BEARER);
    //Verifica se está logado corretamente
    $response = $client->fetch('http://colmeia.teste:3001/logged');
    //Caso o token esteja expirado usa o refresh token para recuperar
    if($response['result'] != '1') {
        $params = array('refresh_token' => $_GET['refresh_token']);
        $response = $client->getAccessToken(TOKEN_ENDPOINT, 'refresh_token', $params);
        $info = $response['result'];
        if($response['result'] != 'Error') {
            header('Location: ' . REDIRECT_URI . '?access_token=' . $info['access_token'] . '&refresh_token='.$info['refresh_token']);
            die('Redirect');       
        } else echo 'Erro no refresh token';
        
    }
    include('form.php');
    die();
}

if (!isset($_GET['code']))
{
    //Prepara a url para solicitar a autorização e código de acesso
    $auth_url = $client->getAuthenticationUrl(AUTHORIZATION_ENDPOINT, REDIRECT_URI);
    //Redireciona para a URL solicitando a autorização
    header('Location: ' . $auth_url);
    die('Redirect');
}
else
{
    //Parâmetros para solicitar o access token
    $params = array('code' => $_GET['code'], 'redirect_uri' => REDIRECT_URI);
    //Solicita o access token usando o código de autorização
    $response = $client->getAccessToken(TOKEN_ENDPOINT, 'authorization_code', $params);
    //Pega o resultado
    $info = $response['result'];
    //Redireciona para o formulário para enviar os vídeos
    header('Location: ' . REDIRECT_URI . '?access_token=' . $info['access_token'] . '&refresh_token='.$info['refresh_token']);
    die('Redirect'); 
}

