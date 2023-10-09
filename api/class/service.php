<?php
	class SERVICE{
		public static $id='';
		public static function handleRequest($r){
			if(isset($r['path'][5])) self::$id=$r['path'][5];
			switch ($r['path'][4]) {
				case 'load':
					$out=self::load($r);
				break;
				case 'pay':
					$out=self::pay($r);
				break;
				case 'deny':
					$out=self::deny($r);
				break;
				case 'feed':
					$out=self::feed($r);
				break;
			}
			if(!isset($out)) $out['error']='no_data';
			return $out;
		}
		public static function pay($r){
			return ['success'=>true];
		}
		public static function deny($r){
			return ['success'=>true];
		}
		public static function feed($r){
			return ['success'=>true];
		}
		public static function cacheData($r,$d,$k,$opts){
			$service=db2::findOne(DB,'service',['id'=>$d['current']['service']]);
			if(!$service) API::toHeaders(['error'=>'invalid_service']);
			$offering=db2::findOne(DB,'service_offering',['id'=>$d['current']['service_offering']]);
			if(!$offering) API::toHeaders(['error'=>'invalid_service_offering']);
			$d['current']['service_info']=$service;
			$d['current']['service_offering_info']=$offering;
			return $d;
		}
		public static function notifyRequest($r,$d,$k,$opts){
			include_once(phi::$conf['root'].'/sites/code/app/chat/chat.php');
			//add chat message!!!!
			$resp=chat::create(array(
				'auth'=>$r['auth'],
				'qs'=>array(
					'people'=>array($r['auth']['uid'],$d['current']['to']['id'])
				)
			));//ensure chat exists!
			#phi::log('chat: '.json_encode($resp));
			if(isset($resp['error'])) API::toHeaders($resp);
			//die(json_encode($resp));
			$message=array(
				'room'=>$resp['data']['id'],
				'by'=>$r['auth']['uid'],
				'attachment'=>[
					'type'=>'service_offering_request',
					'id'=>$d['current']['id']
				]
			);
			if(isset($d['current']['content'])&&$d['current']['content']){
				$message['content']=$d['current']['content'];
			}
			#phi::log('message: '.json_encode($message));
			chat::addMessage($message);
		}
		public static function ensureUser($r,$d,$k,$opts){
			if(isset($d['current'][$k]['type'])&&$d['current'][$k]['type']==$opts['anon_schema']){
				if(!isset($d['current']['event'])) API::toHeaders(array('error'=>'invalid_event_setting'));
				if(!isset($d['current'][$k]['data']['name'])) API::toHeaders(array('error'=>'invalid_name'));
				if(!isset($d['current'][$k]['data']['email'])) API::toHeaders(array('error'=>'invalid_email'));
				if(!isset($d['current'][$k]['id'])){
					$s=ONE_CORE::save($opts['anon_schema'],array(
						'eid'=>$d['current']['event'],
						'name'=>$d['current'][$k]['data']['name'],
						'email'=>$d['current'][$k]['data']['email'],
						'confirm_email'=>$d['current'][$k]['data']['email']
					));
					//die(json_encode($s));
					if(isset($s['id'])){
						$d['current'][$k]['id']=$s['id'];
					}else{
						API::toHeaders(array('error'=>'error saving anon user ['.json_encode($s).']'));
					}
				}else{//update with new data!
					db2::update(DB,$opts['anon_schema'],array('id'=>$d['current'][$k]['id']),array(
						'name'=>$d['current'][$k]['data']['name'],
						'email'=>$d['current'][$k]['data']['email']
					));
				}
			}
			return $d;
		}
		public static function hasPermission($r){
			return true;
		}
		public static function checkServices($r,$d,$key,$opts){
			$max=1;
			$u=db2::findOne(DB,'user',['id'=>$d['current']['page']['id']]);
			if(!ONE_CORE::hasFeatures($d['current']['page']['id'],['services'])){
				API::toHeaders(['error'=>'You must be a Producer to list your services']);
			}
			// $valid=['producer','steward'];
			// if(!in_array($u['level'], $valid)){
			// 	API::toHeaders(['error'=>'You must be a Producer to list your services']);
			// }
			$current=db2::toOrderedList(db2::find(DB,'service',['page.id'=>$d['current']['page']['id'],'active'=>1]));
			if($current){
				$total=sizeof($current['order']);
				if($total<=($max-1)){
					//ok
				}else if($total==$max){
					//see if its new
					if(!$d['last']&&$d['current']['active']){//new would be adding
						API::toHeaders(['error'=>'A maximum of 3 services can be listed at once.  Please enable/disable the services youd like to have currently listed.']);
					}
					if(!$d['last']['active']&&$d['current']['active']){
						API::toHeaders(['error'=>'A maximum of 3 services can be listed at once.  Please enable/disable the services youd like to have currently listed.']);
					}	
				}else{
					API::toHeaders(['error'=>'A maximum of 3 services can be listed at once.  Please enable/disable the services youd like to have currently listed.']);
				}
			}
			return $d;
		}
		public static function load($r){
			$c=db2::findOne(phi::$conf['dbname'],'service',array('id'=>self::$id));
			// $schema=ONE_CORE::getSchema('update');
			// $c=db2::graphOne(phi::$conf['dbname'],$c,$schema['graph']);
			//add in other data, like comments
			//check permissions, assume public for now
			ONE_CORE::pageLoad($r,'service',self::$id);
			return ['success'=>true,'data'=>ONE_CORE::load($r,self::$id,'service')];
		}
	}
?>