<?php
	if(!is_file('/var/www/priv/config.json')) die('invalid_config');
	$conf=json_decode(file_get_contents('/var/www/priv/config.json'),1);
	$exec='';
	$instance='i-0095b72046723ba55';//hardcode
	$exec='aws elb register-instances-with-load-balancer --load-balancer-name '.$conf['aws']['loadbalancer_name'].' --instances '.$instance;
	die($exec);
?>