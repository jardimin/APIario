<?php
require('Client.php');
require('GrantType/IGrantType.php');
require('GrantType/AuthorizationCode.php');

const CLIENT_ID     = '28471984739287473';
const CLIENT_SECRET = '3947839820';

const REDIRECT_URI           = 'http://localhost/teste/index.php';
const AUTHORIZATION_ENDPOINT = 'http://localhost:3001/oauth/authorise';
const TOKEN_ENDPOINT         = 'http://localhost:3001/oauth/token';

$client = new OAuth2\Client(CLIENT_ID, CLIENT_SECRET);
if (!isset($_GET['code']))
{
    $auth_url = $client->getAuthenticationUrl(AUTHORIZATION_ENDPOINT, REDIRECT_URI);
   // echo $auth_url;
   // die();
    header('Location: ' . $auth_url);
    die('Redirect');
}
else
{
    $params = array('code' => $_GET['code'], 'redirect_uri' => REDIRECT_URI);
    $response = $client->getAccessToken(TOKEN_ENDPOINT, 'authorization_code', $params);
    $info = $response['result'];
    //print_r($info);
    //die();
    $client->setAccessToken($info['access_token']);
    $response = $client->fetch('http://localhost:3001/secret');
    var_dump($response, $response['result']);
}

