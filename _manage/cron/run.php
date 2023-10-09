<?php
	if(!is_file('/var/www/priv/config.json')) die('invalid_config');
	$conf=json_decode(file_get_contents('/var/www/priv/config.json'),1);
	include_once($conf['home'].'/'.$conf['project'].'/classes/settings.php');
	include_once($conf['home'].'/'.$conf['project'].'/classes/admin.php');
	if(CRON_ENABLED) echo json_encode(ADMIN_API::runJobs())."\r\n";//carriage return
	else phi::log('Cron Not Enabled');
?>