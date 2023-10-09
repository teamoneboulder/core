<?php
	#die(json_encode($_SERVER));
	$conf=json_decode(file_get_contents('/var/www/priv/config.json'),1);
    include_once('/var/www/'.$conf['project'].'/classes/settings.php');  
    include_once('/var/www/'.$conf['project'].'/api/api.php');
	function outputToHeaders($o){
		$cache=md5($o['src']);
		$cachefile='/tmp/'.$cache;
		if(file_exists($cachefile)){
			$data=file_get_contents($o['src']);
		}else{
			$data=file_get_contents($o['src']);
			file_put_contents($cachefile, $data);
		}
		if($data){
			$lastModified	= gmdate('D, d M Y H:i:s', filemtime($cachefile)) . ' GMT';
			//unlink files if necessary
			if(isset($o['nocache'])){
				if(isset($o['src'])) unlink($o['src']);
			}
			$etag=md5($data);
			if ((isset($_SERVER['HTTP_IF_MODIFIED_SINCE'])&&$_SERVER['HTTP_IF_MODIFIED_SINCE'] == $lastModified) || (isset($_SERVER['HTTP_IF_NONE_MATCH'])&&trim($_SERVER['HTTP_IF_NONE_MATCH']) == $etag)) {	
				header("HTTP/1.1 304 Not Modified");
				header('Etag: "'.$etag.'"');
				header("Expires: Sun, 1 Jan 2039 00:00:00 GMT");
				header("Cache-Control: max-age=315360000");
				exit;
			} else {
				header('pragma:');
				header("Content-type: ".$o['mime']);
				header('Content-Length: ' . strlen($data));
				header("Cache-Control: max-age=315360000, public");				
				header('x-powered-by:');
				header('Expires: Sun, 1 Jan 2039 00:00:00 GMT' );
				header("Last-Modified: ".$lastModified);
				header('Etag: "'.$etag.'"');
				header("Accept-Ranges: bytes");
				echo $data;
				exit;
			}
		}else{
			die('invalid image');
		}
	}
	$urip=explode('?', $_SERVER['REQUEST_URI']);
	$uri=$urip[0];
	$urlp=explode('/', $uri);
	if(!isset($urlp[2])) die('Invalid app');
	$app=API::getFileConf($urlp[2]);
	if(!$app) die('Invalid app');
	if(!isset($urlp[3])) die('Invalid User');
	$uid=$urlp[3];
	if(!isset($urlp[4])) die('Invalid Size');
	$sizes=array('small','full','profile','square');
	if(!in_array($urlp[4], $sizes)) die('Invalid Size');
	$size=$urlp[4];
	//get user!
	if($uid[0]=='U'){
		$user=db2::findOne($app['db'],'user',array('id'=>$uid));
		if(!$user) die('Invalid User');
	}
	if($uid[0]=='G'){
		$user=db2::findOne($app['db'],'page',array('id'=>$uid));
		if(!$user) die('Invalid Page');
		$size='small';
	}
	if(!isset($user['pic'])){
		$url='https://s3.amazonaws.com/one-light/static/blank_user.jpg';
	}else if(is_string($user['pic'])){
		$url=$user['pic'];
	}else{
		if(!isset($user['pic']['path'])){
			$url='https://s3.amazonaws.com/one-light/static/blank_user.jpg';
		}else{
			$url=$app['s3'].$user['pic']['path'].'/'.$size.'.'.$user['pic']['ext'];
		}
	}
	#die($url);
	outputToHeaders(array('src'=>$url,'mime'=>phi::mime_content_type($url)));
	//die(json_encode($user));
?>