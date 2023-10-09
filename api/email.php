<?php
class EMAIL{
	public static function handleRequest($r){
		switch ($r['path'][2]) {
			case 'link':
				$out=self::onLink($r);
			break;
			case 'read.png':
				$out=self::onRead($r);
			break;
			default:
			 	$out=array('error'=>'invalid_request');
			break;
		}
		return $out;
	}
	public static function onLink($r){
		phi::ensure($r,array('link','id','campaign','app'));
		API::getFileConf($r['qs']['app']);
		$app=$r['qs']['app'];
		unset($r['qs']['app']);
		$save=phi::keepFields($r['qs'],array('id','campaign','link'));
		if(!isset($r['qs']['preview'])){
			db2::save($app,'email_history',$save);
			db2::update($app,'email_campaign',array('id'=>$r['qs']['campaign']),array('$inc'=>array('clicked'=>1)));
		}
		phi::redir($r['qs']['link']);
	}
	public static function onRead($r){
		phi::ensure($r,array('id','campaign','app'));
		//ensure valid app first!
		API::getFileConf($r['qs']['app']);
		$app=$r['qs']['app'];
		unset($r['qs']['app']);
		$save=phi::keepFields($r['qs'],array('id','campaign'));
		if(!isset($r['qs']['preview'])){
			if(!db2::count($app,'email_history',array('id'=>$r['qs']['id']))){//add to campaign stat for first read email
				db2::update($app,'email_campaign',array('id'=>$r['qs']['campaign']),array('$inc'=>array('read'=>1)));
			}
			db2::save($app,'email_history',$save);//keep all record
		}
		//header('pragma:');
		$data=file_get_contents(ROOT.'/_img/blank.png');
		header("Content-type: image/png");
		header('Content-Length: ' . strlen($data));
		//header('x-powered-by:');
		header("Accept-Ranges: bytes");
		die($data);
		//die('<img src="'.$data.'">');
		//return array('success'=>true);//might need to be image
	}
}