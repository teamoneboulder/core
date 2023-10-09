<?php
use OpenTok\OpenTok;
use OpenTok\MediaMode;
use OpenTok\ArchiveMode;
class voip{
	public static $debug=1;
	public static $encrypt=true;//encrypt access_token/refresh_token
	public static function handleRequest($r){
		switch ($r['path'][2]) {
			case 'session':
				$out=self::session($r);
			break;
			default:
			 	$out=array('error'=>'invalid_request');
			break;
		}
		return $out;
	}
	public static function session(){
		$opentok = new OpenTok(phi::$conf['opentok']['key'], phi::$conf['opentok']['secret']);
		$session = $opentok->createSession();
		return array('success'=>true);
	}
}
?>