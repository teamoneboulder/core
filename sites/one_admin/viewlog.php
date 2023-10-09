<?php
	if(!is_file('/var/www/priv/config.json')) die('invalid_config');
	  $conf=json_decode(file_get_contents('/var/www/priv/config.json'),1);
	  #if($conf['prod']&&!$ak) die(file_get_contents('index.html'));
	  include_once($conf['home'].'/'.$conf['project'].'/classes/settings.php');
	  include_once($conf['home'].'/'.$conf['project'].'/api/app.php');
	  include_once(phi::$conf['home'].'/'.phi::$conf['project'].'/classes/shop.php');
	  include_once(phi::$conf['home'].'/'.phi::$conf['project'].'/api/api.php');
	  include_once(phi::$conf['home'].'/'.phi::$conf['project'].'/sites/nectar/api.php');
	  //get current costs!
	  $r=API::parseRequest();
	  if(isset($r['qs']['data'])){
		  $r['qs']['data']=json_decode($r['qs']['data'],1);
		  if($r['qs']['data']['url']=='current.js'){
		  	$r['qs']['data']['url']='https://d1cef0xr3m3hlw.cloudfront.net/source/prod/nectar/pub/'.$r['qs']['data']['version'].'/js.js';
		  	#die($r['qs']['data']['url']);
		  }
		  if($r['qs']['data']['url']=='current.dna'){
		  	$r['qs']['data']['url']='https://d1cef0xr3m3hlw.cloudfront.net/source/prod/nectar/pub/'.$r['qs']['data']['version'].'/js.js';
		  	#die($r['qs']['data']['url']);
		  }
		}else if($r['qs']['url']){
			$r['qs']['data']['url']=$r['qs']['url'];
			$r['qs']['data']['column']=$r['qs']['column'];
			$r['qs']['data']['line']=$r['qs']['line'];
			if(strpos($r['qs']['data']['url'], '.dna')!==false){
				$sp=explode('?', $r['qs']['data']['url']);
				$up=explode('/', $sp[0]);
				$ver=$up[sizeof($up)-2];
				$app=$up[sizeof($up)-3];
				$r['qs']['data']['url']='https://d1cef0xr3m3hlw.cloudfront.net/source/prod/'.$app.'/pub/'.$ver.'/js.js';
			}
		}else{
			die('inavlid config');
		}
	  //get source!\
	  $exec='/usr/bin/node '.ROOT.'/node/beautify.js '.$r['qs']['data']['url'].' '.$r['qs']['data']['column'].' '.$r['qs']['data']['line'];
	  #die($exec);
	  exec($exec,$result);
	  $res=implode('', $result);
	  $out=phi::hexToStr($res);
	  //trim!
	  $data = preg_split('/\r\n|\r|\n/', $out);
	  $found=false;
	  foreach ($data as $k => $v) {
	  	if(!$found&&strpos($v, '*****')!==false){
	  		$index=$k;
	  	}
	  }
	  if(!isset($index)){
	  	die('could not properly find index');
	  }
	  $range=500;
	  $start=$index-$range;
	  $end=$index+$range;
	  foreach ($data as $k => $v) {
	  	if($k>$start&&$k<$end){
	  		$display[]=$v;
	  	}
	  }
	  $out=implode(PHP_EOL, $display);
	  header('Content-Type: application/javascript');
	  die($out);
?>