<?php
	class HUMAN_DESIGN{
		public static function handleRequest($r){
			if(isset($r['path'][5])) self::$id=$r['path'][5];
			switch ($r['path'][4]) {
				case 'gates':
					$out=self::getGates($r);
				break;
			}
			if(!isset($out)) $out['error']='no_data';
			return $out;
		}
		public static function getGates($r){
			$img=phi::$conf['s3'].'/img/0d70358192b92d/full.png';
			die($img);
			return ['success'=>true];
		}
	}
?>