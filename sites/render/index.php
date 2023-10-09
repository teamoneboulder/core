<?php
	$conf=json_decode(file_get_contents('/var/www/priv/config.json'),1);
    include_once('/var/www/'.$conf['project'].'/classes/settings.php');  
    include_once('/var/www/'.$conf['project'].'/api/api.php');  
  	$r=API::parseRequest();
  	$file=ROOT.'/sites/render/'.$r['path'][1].'.php';
  	if(is_file($file)){
  		include_once($file);
  	}else{
  		die('invalid render');
  	}
?>