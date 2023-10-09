<?php
	include_once('/var/www/root/classes/settings.php');
	include_once('/var/www/root/classes/admin.php');
	if(CRON_ENABLED) echo json_encode(ADMIN_API::runJobs())."\r\n";//carriage return
	else phi::log('Cron Not Enabled');
?>