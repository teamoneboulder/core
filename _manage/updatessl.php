<?php
	if(!is_file('/var/www/priv/config.json')) die('invalid_config');
	$conf=json_decode(file_get_contents('/var/www/priv/config.json'),1);
	error_reporting(0);
	include_once($conf['home'].'/'.$conf['project'].'/classes/settings.php');
	include_once($conf['home'].'/'.$conf['project'].'/classes/phi.php');
	error_reporting(0);
	//go over all subdomains!
	$cp=realpath(dirname(__FILE__));
	$subdomains=json_decode(file_get_contents($cp.'/subdomains.json'),1);
	//die(json_encode($subdomains));
	$data=phi::parseString(file_get_contents($cp.'/conf/lighttpd_template.conf'),$conf);
	$sites[]=array(
		'site'=>$conf['domain'],
		'root'=>'sites/landing'
	);
	foreach ($subdomains as $k => $v) {
		$sites[]=array(
			'site'=>$v['subdomain'].'.'.$conf['domain'],
			'root'=>$v['root']
		);
	}
	$certdir='/var/www/priv';
	//check to see if this is all up to date!
	foreach ($sites as $k => $v) {
		$saveto=$certdir.'/'.$v['site'];
		$update[]=array('path'=>$v['root'],'site'=>$v['site'],'saveto'=>$saveto,'current'=>md5_file('/etc/letsencrypt/live/'.$v['site'].'/privkey.pem'));
	}
	#die(json_encode($update));
	if(isset($update)){
		//initalize temporary config (no https)
		foreach ($update as $k => $v) {
			//if($v['current']!=$current){
			$start=5;
			$path='';
			while($start>=0&&!$path){
				if($start>0) $tpath='-000'.$start;
				if($start==0) $tpath='';
				if(is_file('/etc/letsencrypt/live/'.$v['site'].$tpath.'/privkey.pem')){
					$path=$tpath;
				}
				$start--;
			}
			echo 'Loading ['.'/etc/letsencrypt/live/'.$v['site'].$path.'/privkey.pem'.']'.PHP_EOL;
			$key=file_get_contents('/etc/letsencrypt/live/'.$v['site'].$path.'/privkey.pem');
			$chain=file_get_contents('/etc/letsencrypt/live/'.$v['site'].$path.'/fullchain.pem');
			//combine and save!
			$comb=$key.$chain;
			if(!is_dir($certdir)) exec('mkdir -p '.$certdir);
			if(is_dir($certdir.'/'.$v['site'])) exec('rm -rf '.$certdir.'/'.$v['site']);
			sleep(1);
			if(!is_dir($certdir.'/'.$v['site'])) exec('mkdir -p '.$certdir.'/'.$v['site']);
			file_put_contents($certdir.'/'.$v['site'].'/comb.pem', $comb);
			file_put_contents($certdir.'/'.$v['site'].'/fullchain.pem', $comb);
			echo 'Successfully saved certs for ['.$v['site'].']'.PHP_EOL;
			// }else{
			// 	die('cert not updated for ['.$v['site'].']');
			// }
		}
	}else{

	}
	//passthru('copysslcerts');//has to do with e
	echo 'Successfully set ligghttpd.conf'.PHP_EOL;
	file_put_contents('/etc/lighttpd/lighttpd.conf', $data);
	passthru('service lighttpd stop');
	passthru('service lighttpd start');
?>