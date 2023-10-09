<?php
	class CHECKIN{
		public static $id='';
		public static function handleRequest($r){
			if(isset($r['path'][5])) self::$id=$r['path'][5];
			if(!isset($out)) $out['error']='no_data';
			return $out;
		}
		public static function hasPermission($r){
			return true;
		}
		public static function awardPoints($r,$d,$key,$opts){
			//return false;
			if($d['current']['location']['type']=='location'||$d['current']['location']['type']=='page'){
				ONE_CORE::emitGameHook($r,'visit_location',[
					'page'=>[
						'id'=>$d['current']['location']['id'],
						'type'=>$d['current']['location']['type']
					]
				]);
			}
			if($d['current']['location']['type']=='event'){
				ONE_CORE::emitGameHook($r,'attend_an_event',[
					'page'=>[
						'id'=>$d['current']['location']['id'],
						'type'=>$d['current']['location']['type']
					]
				]);
				//also check for facilitators points!
				$total=db2::count(DB,'awards',[
					'game'=>'attend_an_event',
					'extra.page.id'=>$d['current']['location']['id']
				]);
				if($total==3){//we hit our maker
					if($d['current']['location']['data']['page']['id'][0]=='U'){
						ONE_CORE::emitGameHook([
							'auth'=>[
								'uid'=>$d['current']['location']['data']['page']['id']
							],
							'qs'=>[
								'appid'=>$r['qs']['appid']
							]
						],'teach_class',[
							'page'=>[
								'id'=>$d['current']['location']['id'],
								'type'=>$d['current']['location']['type']
							]
						]);
					}else{
						phi::log('location: '.json_encode($d['current']['location']));
						phi::log('checkin: event not a page user');
					}
				}
				if($total==6){//we hit our maker
					if($d['current']['location']['data']['page']['id'][0]=='U'){
						ONE_CORE::emitGameHook([
							'auth'=>[
								'uid'=>$d['current']['location']['data']['page']['id']
							],
							'qs'=>[
								'appid'=>$r['qs']['appid']
							]
						],'teach_class_half',[
							'page'=>[
								'id'=>$d['current']['location']['id'],
								'type'=>$d['current']['location']['type']
							]
						]);
					}else{
						phi::log('location: '.json_encode($d['current']['location']));
						phi::log('checkin: event not a page user');
					}
				}
				if($total==10){//we hit our maker
					if($d['current']['location']['data']['page']['id'][0]=='U'){
						ONE_CORE::emitGameHook([
							'auth'=>[
								'uid'=>$d['current']['location']['data']['page']['id']
							],
							'qs'=>[
								'appid'=>$r['qs']['appid']
							]
						],'teach_class_half',[
							'page'=>[
								'id'=>$d['current']['location']['id'],
								'type'=>$d['current']['location']['type']
							]
						]);
					}else{
						phi::log('location: '.json_encode($d['current']['location']));
						phi::log('checkin: event not a page user');
					}
				}
			}
		}
		public static function verifyUser($r,$d,$key,$opts){
			$u=db2::findOne(DB,$d['current']['page']['type'],['id'=>$d['current']['page']['id']]);

			if($u&&!isset($u['verified'])){
				phi::log('Verify Checkin for ['.$u['name'].']');
				ONE_CORE::update($d['current']['page']['type'],['id'=>$d['current']['page']['id']],array(
					'verified'=>1
				));
			}
			if(!$u){
				phi::log('invalid user in checkin ['.json_encode($d['current']).'] checkin');
			}
			return $d;
		}
		public static function verifyLocation($r,$d,$key,$opts){
			//die(json_encode($d['current']));
			if($d['current']['location']['type']=='location'){
				$l=db2::findOne(DB,'checkin_locations',['id'=>$d['current']['location']['id']]);
			}else{
				$l=db2::findOne(DB,$d['current']['location']['type'],['id'=>$d['current']['location']['id']]);
				//die(json_encode($l));
				//ensure there is a field set in checkin_locations (used for admin)
				if(!db2::findOne(DB,'checkin_locations',['id'=>$d['current']['location']['id']])){
					//add it!
					phi::log('Create location from ['.$d['current']['location']['type'].']');
					include_once(ROOT.'/api/class/formbuilder.php');
					$current=array(
						'id'=>$d['current']['location']['id'],
						'name'=>$l['name'],
						'data'=>$d['current']['location']
					);
					$resp=formbuilder::save(array(
						'auth'=>array(
							'uid'=>'internal'//allows for sending on behalf of a page without admin permissions
						),
						'qs'=>array(
							'appid'=>$r['qs']['appid'],
							'schema'=>'checkin_locations',
							'current'=>$current
						)
					));
					phi::push(false,'admin_checkin_locations',array('type'=>'onCreate','data'=>$resp['data']));
					phi::log('Created location '.json_encode($resp));
				}
			}
			if(!$l){
				API::toHeaders(array('error'=>'invalid_location'));
			}
		}
		public static function incrimentLocation($r,$d,$key,$opts){
			include_once(ROOT.'/api/class/formbuilder.php');
			$current=array(
				'id'=>$d['current']['location']['id'],
				'tsu'=>time()
			);
			$resp=formbuilder::save(array(
				'auth'=>array(
					'uid'=>'internal'//allows for sending on behalf of a page without admin permissions
				),
				'qs'=>array(
					'appid'=>$r['qs']['appid'],
					'schema'=>'checkin_locations',
					'current'=>$current
				)
			));
			//update UI!!!
			phi::push(false,'admin_checkin_locations',array('type'=>'onUpdate','data'=>$resp['data']));
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