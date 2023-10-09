<?php
	class TAGS{
		public static $id='';
		public static function handleRequest($r){
			if(isset($r['path'][5])) self::$id=$r['path'][5];
			switch ($r['path'][4]) {
				case 'load':
					//$out=self::load($r);
				break;
			}
			if(!isset($out)) $out['error']='no_data';
			return $out;
		}
		public static function hasPermission($r){
			return true;
		}
	}
?>