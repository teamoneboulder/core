<?php
if(!is_file('/var/www/priv/config.json')) die('invalid_config');
$conf=json_decode(file_get_contents('/var/www/priv/aws.json'),1);
$vars=array(
	'[aws_access_key]'=>$conf['accessKeyId'],
	'[aws_secret_access_key]'=>$conf['secretAccessKey']
);
$c=file_get_contents(__DIR__.'/aliases');
foreach ($vars as $k => $v) {
	$c=str_replace($k, $v, $c);
}
die($c);
?>