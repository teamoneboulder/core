<?php
	class UPSET{
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
		public static function takeAction($r,$d,$key,$opts){
			#die(json_encode($d['current']));
			$stewards=ONE_CORE::getStewards();
			foreach($stewards as $k=>$v){
				$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),array(
					'id'=>'upset_add',
					'data'=>array(
						'app_id'=>$r['qs']['appid'],
						'to'=>['id'=>$v,'type'=>'user'],
						'from'=>phi::keepFields($d['current']['from'],['id','type']),
						'upset'=>$d['current']['id']
					)
				),1);
			}
			if(isset($hooks)) phi::saveHooks($hooks);
			#phi::alertAdmin('Report  ['.json_encode($d['current']).']');
		}
		public static function hasPermission($r){
			return true;
		}
		public static function load($r){
			$c=db2::findOne(phi::$conf['dbname'],'upset',array('id'=>self::$id));
			$schema=ONE_CORE::getSchema('upset');
			$c=db2::graphOne(phi::$conf['dbname'],$c,$schema['graph']);
			//add in other data, like comments
			//check permissions, assume public for now
			return array('success'=>true,'data'=>$c);
		}
	}
?>