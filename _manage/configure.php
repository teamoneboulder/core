<?php
	if(!is_file('/var/www/priv/config.json')) die('invalid_config');
	$conf=json_decode(file_get_contents('/var/www/priv/config.json'),1);
	
?>