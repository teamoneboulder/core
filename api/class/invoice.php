<?php
	class INVOICE{
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
		public static function ensureUpdate($r,$d){
			//phi::log('ensureUpdateTime');
			$d['current']['updated']=time();
			return $d;
		}
		public static function hasPermission($r){
			$u=db2::findOne(DB,'user',['id'=>$r['auth']['uid']]);
			if(isset($r['auth']['internal'])) return true;
			if(isset($u['level'])&&$u['level']=='steward') return true;
			if(!isset($u['roles'])) $u['roles']=[];
			if(in_array('finances',$u['roles'])) return true;
			return false;
		}
		public static function load($r){
			$c=db2::findOne(phi::$conf['dbname'],'update',array('id'=>self::$id));
			$schema=ONE_CORE::getSchema('update');
			$c=db2::graphOne(phi::$conf['dbname'],$c,$schema['graph']);
			//add in other data, like comments
			//check permissions, assume public for now
			return array('success'=>true,'data'=>$c);
		}
	}
?>