<?php
	class notifications{
		public static $uid='';
		public static function handleRequest($r){
			switch ($r['path'][4]){
				case 'clearnotifications':
					$out=self::clearNotifications($r);
				break;
				case 'feed':
					$out=self::feed($r);
				break;
				case 'button':
					switch ($r['path'][5]){
						case 'confirmtrust':
							$out=self::confirmTrust($r);
						break;
						case 'denytrust':
							$out=self::denyTrust($r);
						break;
					}
				break;
				case 'deletenotice':
					$out=self::deleteNotice($r);
				break;
				default:
					$out=array('error'=>'invalid method');
				break;
			}
			return $out;
		}
		public static function confirmTrust($r){
			$d=phi::ensure($r,array('id'));
			$n=db2::findOne(DB,'notification',['_id'=>db2::toId($d['id'])]);
			if(!$n) return ['error'=>'invalid notice'];
			$id=$n['data']['to']['id'].'_'.$n['data']['from']['id'];
			if(!db2::findOne(DB,'user_trust',['id'=>$id])) return ['error'=>'invalid trust request'];
			include_once(ROOT.'/api/class/formbuilder.php');
			$d=phi::ensure($r,array('id'));
			db2::update(DB,'notification',['_id'=>db2::toId($d['id'])],['$set'=>['response'=>'approved']]);
			return formbuilder::save(array(
				'auth'=>array(
					'uid'=>'internal'//allows for sending on behalf of a page without admin permissions
				),
				'qs'=>array(
					'appid'=>$r['qs']['appid'],
					'schema'=>'user_trust',
					'current'=>['id'=>$id,'status'=>'approved']
				)
			));
		}
		public static function denyTrust($r){
			$d=phi::ensure($r,array('id'));
			$n=db2::findOne(DB,'notification',['_id'=>db2::toId($d['id'])]);
			if(!$n) return ['error'=>'invalid notice'];
			$id=$n['data']['to']['id'].'_'.$n['data']['from']['id'];
			include_once(ROOT.'/api/class/formbuilder.php');
			//update notification!
			if(!db2::findOne(DB,'user_trust',['id'=>$id])) return ['error'=>'invalid trust request'];
			db2::update(DB,'notification',['_id'=>db2::toId($d['id'])],['$set'=>['response'=>'denied']]);
			return formbuilder::save(array(
				'auth'=>array(
					'uid'=>'internal'//allows for sending on behalf of a page without admin permissions
				),
				'qs'=>array(
					'appid'=>$r['qs']['appid'],
					'schema'=>'user_trust',
					'current'=>['id'=>$id,'status'=>'denied']
				)
			));
		}
		public static function clearNotifications($r){
			$d=phi::ensure($r,array('identity'),1,array('self::write::notices','self::write::badge'));
			if($d['identity']!=$r['auth']['uid']){//page!
				$p=db2::findOne(phi::$conf['dbname'],'page',array('id'=>$d['identity']));
				if(!$p) return array('error'=>'invalid_page');
				//ensure admin!
				if(!in_array($r['auth']['uid'], $p['admins'])) return array('error'=>'invalid_permissions');
			}
			if($d['identity'][0]=='U'){
				$count=ONE_CORE::getPushCount($d['identity'],array('notification'=>0));
			}else{
				$count=ONE_CORE::getPushCount($d['identity'],array('notification'=>0),1,$r['auth']['uid']);
			}
			return array('success'=>true,'count'=>$count);
		}
		public static function onChange($d,$type){
			$notification=ONE_CORE::getNotification($d['current']);
			if(isset($notification['to'])){
				phi::push('',$notification['to'].'_notification',array('type'=>$type,'data'=>$notification));
			}else{
				phi::log('invalid notification [to] '.json_encode($notification));
			}
			//phi::log($notification);
		}
		public static function feed($r){
			$d=phi::ensure($r,array('identity'),1,array('self::read::notices'));
			if($d['identity']==$r['auth']['uid']){
				$q=array('to'=>$r['auth']['uid']);
			}else{//page!
				$p=db2::findOne(phi::$conf['dbname'],'page',array('id'=>$d['identity']));
				if(!$p) return array('error'=>'invalid_page');
				//ensure admin!
				if(!in_array($r['auth']['uid'], $p['admins'])) return array('error'=>'invalid_permissions');
				$q=array('to'=>$d['identity']);
			}
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				$q['_id']=array('$lt'=>db2::toId($r['qs']['last']));
			}
			if(isset($r['qs']['after'])&&$r['qs']['after']&&$r['qs']['after']!='false'){
				$q['_id']=array('$gt'=>db2::toId($r['qs']['after']));
			}
			$data=db2::toOrderedList(db2::find(phi::$conf['dbname'],'notification',$q,array('sort'=>array('_id'=>-1),'limit'=>10)),false,1);
			if($data){
				foreach ($data['list'] as $k => $v) {
					if(isset($v['data'])){
						$data['list'][$k]=ONE_CORE::getNotification($v);
						if(!$data['list'][$k]){
							$data['order']=array_values(array_diff($data['order'], array($k)));
						}else{
							$data['list'][$k]['_id']=$v['_id'];
						}
					}else phi::log('issue with ['.$r['auth']['uid'].']');
				}
			}
			return array('success'=>true,'data'=>$data);
		}
		public static function deleteNotice($r){
			$d=phi::ensure($r,array('id','identity'),1,array('self::write::notices'));
			if($d['identity']!=$r['auth']['uid']){//page!
				$p=db2::findOne(phi::$conf['dbname'],'page',array('id'=>$d['identity']));
				if(!$p) return array('error'=>'invalid_page');
				//ensure admin!
				if(!in_array($r['auth']['uid'], $p['admins'])) return array('error'=>'invalid_permissions');
			}
			$n=db2::findOne(phi::$conf['dbname'],'notification',array('_id'=>db2::toId($d['id'])));
			if(!$n) return array('error'=>'invalid_notification');
			db2::remove(phi::$conf['dbname'],'notification',array('_id'=>db2::toId($d['id'])));
			return array('success'=>true);
		}
	}
?>