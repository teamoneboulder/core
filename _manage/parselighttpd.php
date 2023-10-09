<?php
	if(!is_file('/var/www/priv/config.json')) die('invalid_config');
	$conf=json_decode(file_get_contents('/var/www/priv/config.json'),1);
	include_once($conf['home'].'/'.$conf['project'].'/classes/settings.php');
	$domain=$conf['domain'];
	$cp=realpath(dirname(__FILE__));
	$subdomains=json_decode(file_get_contents($cp.'/subdomains.json'),1);
	$data=file_get_contents($cp.'/conf/lighttpd_template.conf');
	$data=str_replace('[domain]', $domain, $data);
	$data=str_replace('[home]', $conf['home'], $data);
	$data=str_replace('[project]', $conf['project'], $data);
	$internal_ip=phi::getLocalIp();//
	$data=str_replace('[internal_ip]', $internal_ip, $data);
	//ensure all subdomains
	//check to see if certs exist!
	$sites=array($domain);
	foreach ($subdomains as $k => $v){
		$sites[]=$v['subdomain'].'.'.$domain;
	}
	$certdir='/var/www/priv';
	//check to see if this is all up to date!
	foreach ($sites as $k => $v) {
		$saveto=$certdir.'/'.$v;
		if(!is_dir($certdir.'/'.$v)){
			$update[]=array('site'=>$v,'saveto'=>$saveto);
		}
	}
	if(isset($update)&&false){
		//initalize temporary config (no https)
		passthru('acmeconfig');
		foreach ($update as $k => $v) {
			$exec='sudo certbot certonly --webroot -w '.$conf['home'].'/'.$conf['project'].'/sites/internal -d '.$v['site'].' -d www.'.$v['site'];
			passthru($exec);
			if(is_file('/etc/letsencrypt/live/'.$v['site'].'/privkey.pem')){
				$key=file_get_contents('/etc/letsencrypt/live/'.$v['site'].'/privkey.pem');
				$chain=file_get_contents('/etc/letsencrypt/live/'.$v['site'].'/fullchain.pem');
				//combine and save!
				$comb=$key.$chain;
				if(!is_dir($certdir)) exec('mkdir -p '.$certdir);
				if(!is_dir($certdir.'/'.$v['site'])) exec('mkdir -p '.$certdir.'/'.$v['site']);
				file_put_contents($certdir.'/'.$v['site'].'/comb.pem', $comb);
				file_put_contents($certdir.'/'.$v['site'].'/fullchain.pem', $comb);
				echo 'Successfully saved certs for ['.$v['site'].']'.PHP_EOL;
			}else{
				die('did not auth for ['.$v['site'].']');
			}
		}
	}
	echo 'Successfully set ligghttpd.conf'.PHP_EOL;
	file_put_contents('/etc/lighttpd/lighttpd.conf', $data);
?>