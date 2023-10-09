<?php
	class GENEKEY{
		public static $id='';
		public static function handleRequest($r){
			if(isset($r['path'][5])) self::$id=$r['path'][5];
			switch ($r['path'][4]) {
				case 'load':
					$out=self::load($r);
				break;
			}
			if(!isset($out)) $out['error']='no_data';
			return $out;
		}
		public static function hasPermission(){
			//must be steward!
			return true;
		}
		public static function load($r){
			$c=db2::findOne(phi::$conf['dbname'],'genekye',array('id'=>self::$id));
			$schema=ONE_CORE::getSchema('changelog');
			$c=db2::graphOne(phi::$conf['dbname'],$c,$schema['graph']);
			//add in other data, like comments
			//check permissions, assume public for now
			return array('success'=>true,'data'=>$c);
		}
	}
?>