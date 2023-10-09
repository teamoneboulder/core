<?php
	if(!is_file('/var/www/priv/config.json')) die('invalid_config');
	$conf=json_decode(file_get_contents('/var/www/priv/config.json'),1);
	error_reporting(0);
	include_once($conf['home'].'/'.$conf['project'].'/classes/settings.php');
	include_once($conf['home'].'/'.$conf['project'].'/classes/phi.php');
	error_reporting(0);
	//phi::clog('ENV '.$argv[2]);
	phi::publish((isset($argv[1]))?$argv[1]:'',false,false,(isset($argv[2]))?$argv[2]:false);
?>