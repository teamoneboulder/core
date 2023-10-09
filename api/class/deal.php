<?php
	class DEAL{
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
		public static function hasPermission($r){
			return true;
		}
		public static function getFilter($r,$q){
			if($q&&sizeof($q)){
				$tq=[
					'$and'=>[
						['$or'=>[
							['expires'=>['$exists'=>false]],
							['expires'=>['$gte'=>time()]]
						]]
					]
				];
				//die(json_encode($q));
				foreach($q as $k=>$v){
					$tq['$and'][]=[$k=>$v];
				}
			}else{
				$tq=['$or'=>[
					['expires'=>['$exists'=>false]],
					['expires'=>['$gte'=>time()]]
				]];
			}
			return $tq;
		}
		public static function load($r){
			$c=db2::findOne(phi::$conf['dbname'],'deal',array('id'=>self::$id));
			$schema=ONE_CORE::getSchema('deal');
			$c=db2::graphOne(phi::$conf['dbname'],$c,$schema['graph']);
			//add in other data, like comments
			//check permissions, assume public for now
			return array('success'=>true,'data'=>$c);
		}
	}
?>