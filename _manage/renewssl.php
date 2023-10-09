<?php
	$inital=1;//must do it this way to ensure port 80 for load balancer
	if(!is_file('/var/www/priv/config.json')) die('invalid_config');
	$conf=json_decode(file_get_contents('/var/www/priv/config.json'),1);
	error_reporting(0);
	include_once($conf['home'].'/'.$conf['project'].'/classes/settings.php');
	include_once($conf['home'].'/'.$conf['project'].'/classes/phi.php');
	error_reporting(0);
	$cp=realpath(dirname(__FILE__));
	//go over all subdomains!
	$subdomains=json_decode(file_get_contents($cp.'/subdomains.json'),1);
	//die(json_encode($subdomains));
	//$domain=$conf['domain'];
	$data=phi::parseString(file_get_contents($cp.'/conf/lighttpd_template.conf'),$conf);
	// $data=str_replace('[domain]', $domain, $data);
	// $data=str_replace('[home]', $home, $data);
	// $data=str_replace('[project]', $project, $data);
	if(isset($argv[1])){
		echo 'Skipping load new certs'.PHP_EOL;;
	}else{
		if(!isset($conf['subdomains_only'])){
			$sites[]=array(
				'site'=>$conf['domain'],
				'root'=>'sites/landing'
			);
		}
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
		if(isset($update)){
			//initalize temporary config (no https)
			if($inital){
				passthru('acmeconfig');
			}else{
				$nd=$data;
				$nd=str_replace('$HTTP["scheme"] == "http"', '$HTTP["scheme"] == "https"', $nd);
				file_put_contents('/etc/lighttpd/lighttpd.conf', $nd);//ensures HTTP requests dont get redirected...will cause issue in prod
				passthru('service lighttpd stop');
				passthru('service lighttpd start');
			}
			$toupdate=true;//hack
			if($toupdate){
				foreach ($update as $k => $v) {
					if($inital){
						$exec='sudo certbot certonly --force-renew --webroot -w '.$conf['home'].'/'.$conf['project'].'/sites/internal -d '.$v['site'].' -d '.$v['site'];
					}else{
						$exec='sudo certbot certonly --force-renew --webroot -w '.$conf['home'].'/'.$conf['project'].'/'.$v['path'].' -d '.$v['site'].' -d '.$v['site'];
					}
					#phi::clog($exec);
					passthru($exec);
					// $key=file_get_contents('/etc/letsencrypt/live/'.$v['site'].'/privkey.pem');
					// $chain=file_get_contents('/etc/letsencrypt/live/'.$v['site'].'/fullchain.pem');
					// //combine and save!
					// $comb=$key.$chain;
					// if(!is_dir($certdir)) exec('mkdir -p '.$certdir);
					// if(!is_dir($certdir.'/'.$v['site'])) exec('mkdir -p '.$certdir.'/'.$v['site']);
					// file_put_contents($certdir.'/'.$v['site'].'/comb.pem', $comb);
					// file_put_contents($certdir.'/'.$v['site'].'/fullchain.pem', $comb);
					// echo 'Successfully saved certs for ['.$v['site'].']'.PHP_EOL;
				}
				// echo 'Waiting fore a few moments...'.PHP_EOL;
				// sleep(10);//issues heere?
			}
			// foreach ($update as $k => $v) {
			// 	//if($v['current']!=$current){
			// 		$key=file_get_contents('/etc/letsencrypt/live/'.$v['site'].'/privkey.pem');
			// 		$chain=file_get_contents('/etc/letsencrypt/live/'.$v['site'].'/fullchain.pem');
			// 		//combine and save!
			// 		$comb=$key.$chain;
			// 		if(!is_dir($certdir)) exec('mkdir -p '.$certdir);
			// 		if(!is_dir($certdir.'/'.$v['site'])) exec('mkdir -p '.$certdir.'/'.$v['site']);
			// 		file_put_contents($certdir.'/'.$v['site'].'/comb.pem', $comb);
			// 		file_put_contents($certdir.'/'.$v['site'].'/fullchain.pem', $comb);
			// 		echo 'Successfully saved certs for ['.$v['site'].']'.PHP_EOL;
			// 	// }else{
			// 	// 	die('cert not updated for ['.$v['site'].']');
			// 	// }
			// }
		}else{

		}
	}
	//passthru('copysslcerts');//has to do with e
	echo 'Setting ligghttpd.conf'.PHP_EOL;
	file_put_contents('/etc/lighttpd/lighttpd.conf', $data);//ensure lighttpd gets put back...
	passthru('service lighttpd stop');
	passthru('service lighttpd start');
?>