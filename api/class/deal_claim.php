<?php
	class DEAL_CLAIM{
		public static $id='';
		public static function handleRequest($r){
			if(isset($r['path'][5])) self::$id=$r['path'][5];
			if(!isset($out)) $out['error']='no_data';
			return $out;
		}
		public static function hasPermission($r){
			return true;
		}
		// public static function awardPoints($r,$d,$key,$opts){
			
		// }
		public static function ensureClaim($r,$d,$key,$opts){
			$deal=db2::findOne(DB,'deal',['id'=>$d['current']['deal']]);
			//ensure its not expired!
			if(isset($deal['expires'])&&time()>$deal['expires']){
				API::toHeaders([
						'error'=>'Passed expiration date'
					]);
			}
			//ensure it is within the count
			$c=db2::count(DB,'deal_claim',['deal'=>$d['current']['deal']]);
			//die('einsure');
			if(isset($deal['max'])){
				$c++;
				if($c>$deal['max']){
					API::toHeaders([
						'error'=>'Maximum number of claimes ['.$deal['max'].'] reached'
					]);
				}
			}
		}
		public static function updateCount($r,$d,$key,$opts){
			include_once(ROOT.'/api/class/formbuilder.php');
			$c=db2::count(DB,'deal_claim',['deal'=>$d['current']['deal']]);
			$resp=formbuilder::save(array(
				'auth'=>array(
					'uid'=>'internal'//allows for sending on behalf of a page without admin permissions
				),
				'qs'=>array(
					'appid'=>$r['qs']['appid'],
					'schema'=>'deal',
					'current'=>[
						'id'=>$d['current']['deal'],
						'claimed'=>$c
					]
				)
			));		
			#phi::log('update count! '.json_encode($resp));
			// $current=array(
			// 	'id'=>$d['current']['location']['id'],
			// 	'tsu'=>time()
			// );
			// $resp=formbuilder::save(array(
			// 	'auth'=>array(
			// 		'uid'=>'internal'//allows for sending on behalf of a page without admin permissions
			// 	),
			// 	'qs'=>array(
			// 		'appid'=>$r['qs']['appid'],
			// 		'schema'=>'checkin_locations',
			// 		'current'=>$current
			// 	)
			// ));
			
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