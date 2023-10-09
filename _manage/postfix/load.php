<?php
	if(!is_file('/var/www/priv/config.json')) die('invalid_config');
	$conf=json_decode(file_get_contents('/var/www/priv/config.json'),1);
	error_reporting(0);
	include_once($conf['home'].'/'.$conf['project'].'/classes/settings.php');
	include_once($conf['home'].'/'.$conf['project'].'/classes/phi.php');
	error_reporting(0);
	$maincf=str_replace('[domain]',phi::$conf['domain'],file_get_contents(phi::$conf['root'].'/_manage/postfix/main.cf'));
	file_put_contents('/etc/postfix/main.cf', $maincf);
	file_put_contents('/etc/postfix/master.cf', file_get_contents(phi::$conf['root'].'/_manage/postfix/master.cf'));
	passthru('postfix reload');
?>