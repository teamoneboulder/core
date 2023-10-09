<?php
	if(!is_file('/var/www/priv/config.json')) die('invalid_config');
	$conf=json_decode(file_get_contents('/var/www/priv/config.json'),1);
	//set up hosts file properly
	exec('hostname',$result);
	$host=implode(',', $result);
	$hosts=file_get_contents($conf['home'].'/'.$conf['project'].'/_manage/conf/hosts');
	$newhosts=str_replace('[host]','127.0.0.1 '.$host, $hosts);
	file_put_contents('/etc/hosts', $newhosts);
?>