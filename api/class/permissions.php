<?php
	class permissions{
		public static $uid='';
		public static $logPermissonUpdates=0;
		public static function handleRequest($r){
			self::$uid=$r['path'][4];
			switch ($r['path'][5]){
				case "send"://check
					$out=self::friendRequest($r);
				break;
				case "delete"://check
					$out=self::deleteRequest($r);
				break;
				case "confirm"://check
					$out=self::confirmFriend($r);
				break;
				case "info"://check
					$out=self::info($r);
				break;
				case "update"://check
					$out=self::update($r);
				break;
				case "unfriend"://check
					$out=self::unfriend($r);
				break;
				case "autofriend"://check, internal only?
					$out=self::autofriend($r);
				break;
				case "respond"://check
					$out=self::respond($r);
				break;
				case "unnotify"://check
					$out=self::unnotify($r);
				break;
				default:
					$out=array('error'=>'invalid method');
				break;
			}
			return $out;
		}
		public static function autofriend($r){
			if(phi::$conf['admin_token']==$r['qs']['token']){
				$r['auth']['scope']=array('*');
				$d=phi::ensure($r,array('uids'));
				return self::confirmFriend($r,array(
					'uids'=>$r['qs']['uids']
				));
			}else{
				phi::alertAdmin('Someone tried hacking the autofriend: '.json_encode(phi::getSecurityInfo()));
				return array('error'=>'You are trying to hack the system, an admin has been alerted');
			}
		}
		public static function unnotify($r){
			//remove from follow
			$d=phi::ensure($r,array(),1,array('self::write::preferences'));
			db2::update(DB,'push_follow',array('id'=>self::$uid),array('$pullAll'=>array('push_follow'=>array($r['auth']['uid']))));
			//update "friend" item
			$id=self::$uid.'_'.$r['auth']['uid'];
			db2::update(DB,'friend',array('id'=>$id),array('$set'=>array('notify'=>false)));
			return array('success'=>true);
		}
		public static function clearFriendList($uid1,$uid2){
			$c=db2::findOne(DB,'user_friends',array('id'=>$uid1),array('projection'=>array('friend_list_info'=>1)));
			if($c&&isset($c['friend_list_info'])&&sizeof($c['friend_list_info'])){
				$lists=array_values(array_keys($c['friend_list_info']));
			}else{
				$lists=array();
			}
			if(!in_array($uid1.'_trusted', $lists)) $lists[]=$uid1.'_trusted';
			if(!in_array($uid1.'_family', $lists)) $lists[]=$uid1.'_family';
			if(!in_array($uid1.'_professional', $lists)) $lists[]=$uid1.'_professional';
			if(!in_array('friends', $lists)) $lists[]='friends';
			foreach ($lists as $k => $v) {
				$update['$pull'][$v]=array('$in'=>array($uid2));
			}
			$lists=self::ensureLists($uid1,$uid2,array('data'=>array('lists'=>array())));
			$update['$set']['lists']=$lists;
			if(self::$logPermissonUpdates) phi::log('UF ['.$uid1.'] '.json_encode($lists));
			db2::update(DB,'user_friends',array('id'=>$uid1),$update);
			//also remove birthdays + notifications
			db2::update(DB,'user_friend_birthday',array('id'=>$uid1),array('$pullAll'=>array('friends'=>array($uid2))));
			db2::update(DB,'push_follow',array('id'=>$uid1),array('$pullAll'=>array('push_follow'=>array($uid2))));
		}
		public static function unfriend($r){
			//remove from friends lists
			$d=phi::ensure($r,array(),1,array('self::write::friends'));
			$ids[]=self::$uid;
			$ids[]=$r['auth']['uid'];
			//need to remove from ALL friends lists!
			self::clearFriendList(self::$uid,$r['auth']['uid']);
			self::clearFriendList($r['auth']['uid'],self::$uid);
			//remove from friends table
			$ids2[]=self::$uid.'_'.$r['auth']['uid'];
			$ids2[]=$r['auth']['uid'].'_'.self::$uid;
			db2::remove(DB,'friend',array('id'=>array('$in'=>$ids2)),true);
			return array('success'=>true);
		}
		public static function update($r){
			$d=phi::ensure($r,array(),1,array('self::write::friends'));
			$cur=db2::findOne(DB,'friend',array('id'=>self::$uid.'_'.$r['auth']['uid']));
			$data=$r['qs']['data'];
			$pupdate=array(
				'perms'=>self::getPerms($r['qs']),//from reply
				'la'=>time()
			);
			if(isset($data['notify'])){
				$pupdate['notify']=true;
			}else{
				$pupdate['notify']=false;
			}
			if(isset($data['addbirthday'])){
				$pupdate['birthday']=true;
			}else{
				$pupdate['birthday']=false;
			}
			ONE_CORE::update('friend',array('id'=>self::$uid.'_'.$r['auth']['uid']),$pupdate);
			$tr=ONE_CORE::update('friend',array('id'=>$r['auth']['uid'].'_'.self::$uid),array(
				'notes'=>(isset($r['qs']['data']['notes']))?$r['qs']['data']['notes']:'',
				'la'=>time()
			));
			//handle friend list!
			$rdata=db2::findOne(DB,'user_friends',array('id'=>$r['auth']['uid']));
			if($rdata&&isset($rdata['friend_lists'])){
				foreach($rdata['friend_lists'] as $k => $v) {
					if(isset($rdata[$v])&&in_array(self::$uid, $rdata[$v])){
						$current[]=$v;
					}
				}
			}
			if(!isset($current)) $current=array();
			//compare
			if(isset($r['qs']['data']['list'])&&sizeof($r['qs']['data']['list'])){
				foreach ($r['qs']['data']['list'] as $k => $v) {
					if(!in_array($k, $current)){
						$add[$k]=self::$uid;
						if(isset($rdata['friend_lists'])){
							if(!in_array($k, $rdata['friend_lists'])){
								$add['friend_lists']['$each'][]=$k;//ensures any new friend list!
							}
						}
					}
					$newcurrent[]=$k;
				}
			}
			if(isset($r['qs']['data']['newlists'])){
				foreach ($r['qs']['data']['newlists'] as $k => $v) {
					$update['$set']['friend_list_info.'.$v['id']]=$v;
				}
			}
			if(!isset($newcurrent)){
				$newcurrent=array();
			}
			$removed=array_values(array_diff($current, $newcurrent));
			if(isset($add)){
				$update['$addToSet']=$add;
			}
			if(sizeof($removed)){
				foreach ($removed as $k => $v) {
					$update['$pull'][$v]=array('$in'=>array(self::$uid));
				}
			}
			if(isset($update)) db2::update(DB,'user_friends',array('id'=>$r['auth']['uid']),$update);
			$update2['$set']['lists']=self::ensureLists(self::$uid,$r['auth']['uid'],array('data'=>$data));
			if(self::$logPermissonUpdates) phi::log('UPDATES: '.json_encode($update2));
			db2::update(DB,'user_friends',array('id'=>self::$uid),$update2);
			if(!$cur['notify']&&isset($data['notify'])){
				db2::update(DB,'push_follow',array('id'=>self::$uid),array('$addToSet'=>array('push_follow'=>$r['auth']['uid'])),array('upsert'=>true));
			}
			if($cur['notify']&&!isset($data['notify'])){
				db2::update(DB,'push_follow',array('id'=>self::$uid),array('$pullAll'=>array('push_follow'=>array($r['auth']['uid']))));
			}
			if(!$cur['birthday']&&isset($data['addbirthday'])){
				db2::update(DB,'user_friend_birthday',array('id'=>$r['auth']['uid']),array('$addToSet'=>array('friends'=>self::$uid)),array('upsert'=>true));
			}
			if($cur['birthday']&&!isset($data['addbirthday'])){
				db2::update(DB,'user_friend_birthday',array('id'=>$r['auth']['uid']),array('$pullAll'=>array('friends'=>array(self::$uid))));
			}
			//edit birthday and push_follow
			return array('success'=>true);
		}
		public static function respond($r){
			include_once(phi::$conf['root'].'/sites/code/app/chat/chat.php');
			$d=phi::ensure($r,array(),1,array('self::write::friends'));
			$msg=array(
				'by'=>$r['auth']['uid'],
				'room'=>$r['qs']['id'],
				'content'=>$r['qs']['message']
			);
			chat::addMessage($msg);
			return array('success'=>true);
		}
		public static function info($r){
			if(self::$uid=='fb_link'&&!isset($r['auth']['uid'])){
				$d=phi::ensure($r,array('anon_uid'));
				$uid=$d['anon_uid'];
			}else{
				$d=phi::ensure($r,array(),1,array('self::read::friends'));
				$rdata=db2::findOne(DB,'user_friends',array('id'=>$r['auth']['uid']));
				$uid=$r['auth']['uid'];
			}
			//always
			$rdata['friend_list_info'][$uid.'_trusted']=array(
				'name'=>'Trusted Circle',
				'id'=>$uid.'_trusted',
				'protected'=>true
			);
			$rdata['friend_list_info'][$uid.'_family']=array(
				'name'=>'Family',
				'id'=>$uid.'_family',
				'protected'=>true
			);
			$rdata['friend_list_info'][$uid.'_professional']=array(
				'name'=>'Professional',
				'id'=>$uid.'_professional',
				'protected'=>true
			);
			$data['friendlist']['order']=phi::sort($rdata['friend_list_info'],array('key'=>'name','type'=>'string','keyOn'=>'id'));
			$data['friendlist']['list']=$rdata['friend_list_info'];
			//check lists!
			foreach ($data['friendlist']['list'] as $k => $v) {
				if(isset($rdata[$k])&&is_array($rdata[$k])&&in_array(self::$uid, $rdata[$k])){
					$data['friendlist']['list'][$k]['added']=true;
				}
			}
			if(isset($r['qs']['current'])&&$r['qs']['current']){
				$data['current']=db2::findOne(DB,'friend',array('id'=>self::$uid.'_'.$uid));
				if($data['current']){
					$c=db2::findOne(DB,'friend',array('id'=>$r['auth']['uid'].'_'.self::$uid));
					if($c){
						$data['current']['notes']=$c['notes'];
					}else{
						$data['current']['notes']='';	
					}
				}
			}
			return array('success'=>true,'data'=>$data);
		}
		public static function deleteRequest($r){
			$d=phi::ensure($r,array(),1,array('self::write::friends'));
			$id=$r['qs']['id'];
			$request=db2::findOne(DB,'friendrequest',array('id'=>$id));
			if(!$request) return array('error'=>'invalid_request');
			//remove friend request from db
			db2::remove(DB,'friendrequest',array('id'=>$id));
			//remove reference from chat
			include_once(phi::$conf['root'].'/sites/code/app/chat/chat.php');
			//add message
			if($r['auth']['uid']==$request['from']){
				$msg=array(
					'canceled'=>1,
					'by'=>$r['auth']['uid'],
					'room'=>$id
				);
			}else{
				$msg=array(
					'denied'=>1,
					'by'=>$r['auth']['uid'],
					'room'=>$id
				);
			}
			chat::addMessage($msg);
			phi::push('',$id,array('type'=>'clearfriendrequest','from'=>$r['auth']['uid']));
			return array('success'=>true);
		}
		public static function getPerms($data){
			if(isset($data['data']['contact'])){
				$perms=array_keys($data['data']['contact']);
			}else{
				$perms=false;
			}
			// $perms[]='name';
			// $perms[]='pic';
			return $perms;
		}
		public static function confirmFriend($r,$autodata=false){
			$d=phi::ensure($r,array(),1,array('self::write::friends'));
			phi::time('confirmFriend');
			if($autodata){
				// $fr=$autodata['data'][$autodata['uids'][0]];
				// $data=$autodata['data'][$autodata['uids'][1]]['data'];
				//default facebook friend settings!
				$fr=array(
					'data'=>array(
						'notes'=>'Friend from Facebok',
						'addbirthday'=>1
					)
				);
				$data=array(
					'notes'=>'Friend from Facebook',
					'addbirthday'=>1
				);
				$uid1=$autodata['uids'][0];
				$uid2=$autodata['uids'][1];
				//remove any potentially pending friend requests
				db2::remove(DB,'friendrequest',array('id'=>$uid1.'_'.$uid2));
				db2::remove(DB,'friendrequest',array('id'=>$uid2.'_'.$uid1));
			}else{
				if(!isset($r['qs']['id'])) return array('error'=>'invaid_friend_request');
				$id=$r['qs']['id'];
				$fr=db2::findOne(DB,'friendrequest',array('id'=>$id));
				$data=$r['qs']['data'];
				$uid1=self::$uid;
				$uid2=$r['auth']['uid'];
			}
			if($fr){
				ONE_CORE::update('friend',array('id'=>self::$uid.'_'.$uid2),array(
					'id'=>$uid1.'_'.$uid2,
					'perms'=>self::getPerms(array('data'=>$data)),//from original friend request
					'notes'=>(isset($fr['data']['notes']))?$fr['data']['notes']:'',
					'notify'=>(isset($data['notify']))?true:false,
					'birthday'=>(isset($data['addbirthday']))?true:false,
					'la'=>time()
				));
				ONE_CORE::update('friend',array('id'=>$uid2.'_'.$uid1),array(
					'id'=>$uid2.'_'.$uid1,
					'perms'=>self::getPerms($fr),//from reply
					'notes'=>(isset($data['notes']))?$data['notes']:'',
					'notify'=>(isset($fr['data']['notify']))?true:false,
					'birthday'=>(isset($fr['data']['addbirthday']))?true:false,
					'la'=>time()
				));
				//generate friends list cache!
				//build lists to add to!
				$add['friends']=$uid2;
				//add other lists
				if(isset($fr['data']['list'])&&sizeof($fr['data']['list'])){
					foreach ($fr['data']['list'] as $k => $v) {
						$add[$k]=$uid2;
						$add['friend_lists']['$each'][]=$k;
					}
				}
				$update['$addToSet']=$add;
				//determine any updates needed to user_list
				$update['$set']['lists']=self::ensureLists($uid1,$uid2,array('data'=>$data));
				if(self::$logPermissonUpdates) phi::log('UD1: ['.$uid1.'] '.json_encode($update));
				db2::update(DB,'user_friends',array('id'=>$uid1),$update,array('upsert'=>true));
				$add2['friends']=$uid1;
				if(isset($data['list'])&&sizeof($data['list'])){
					foreach ($data['list'] as $k => $v) {
						$add2[$k]=$uid1;
						$add2['friend_lists']['$each'][]=$k;
					}
				}
				if(isset($data['newlists'])){
					foreach ($data['newlists'] as $k => $v) {
						$update2['$set']['friend_list_info.'.$v['id']]=$v;
					}
				}
				$update2['$addToSet']=$add2;
				$update2['$set']['lists']=self::ensureLists($uid2,$uid1,$fr);
				if(self::$logPermissonUpdates) phi::log('UD2: ['.$uid2.']'.json_encode($update2));
				db2::update(DB,'user_friends',array('id'=>$uid2),$update2,array('upsert'=>true));
				//also exchange birthdays!!!!
				if(isset($fr['data']['addbirthday'])&&$fr['data']['addbirthday']){
					db2::update(DB,'user_friend_birthday',array('id'=>$uid1),array('$addToSet'=>array('friends'=>$uid2)),array('upsert'=>true));
				}
				if(isset($data['addbirthday'])&&$data['addbirthday']){
					db2::update(DB,'user_friend_birthday',array('id'=>$uid2),array('$addToSet'=>array('friends'=>$uid1)),array('upsert'=>true));
				}
				//add notification cache!!!
				if(isset($data['notify'])){
					db2::update(DB,'push_follow',array('id'=>$uid1),array('$addToSet'=>array('push_follow'=>$uid2)),array('upsert'=>true));
				}
				if(isset($fr['data']['notify'])){
					db2::update(DB,'push_follow',array('id'=>$uid2),array('$addToSet'=>array('push_follow'=>$uid1)),array('upsert'=>true));
				}
				//send message
				if(!$autodata){
					phi::push('',$id,array('type'=>'confirmfriend','from'=>$r['auth']['uid']));
					db2::remove(DB,'friendrequest',array('id'=>$id));
					include_once(phi::$conf['root'].'/sites/code/app/chat/chat.php');
					$msg=array(
						'added'=>1,
						'by'=>$r['auth']['uid'],
						'room'=>$id
					);
					chat::addMessage($msg);
				}
			}else{
				return array('error'=>'Invalid Friend Request');
			}
			phi::time('confirmFriend');
			return array('success'=>true);
		}
		public static function ensureLists($uid1,$uid2,$fr){
			$data=db2::findOne(DB,'user_friends',array('id'=>$uid1));
			if($data&&isset($data['lists'])&&sizeof($data['lists'])){
				$initial_list=$data['lists'];
				$current=self::getListsByUid($data['lists'],$uid2);
			}else{
				$initial_list=array();
				$current=false;
			}
			if(!$current) $current=array();
			$new=(isset($fr['data']['list']))?array_keys($fr['data']['list']):array();
			//determine if any removed
			$removed=array_values(array_diff($current, $new));
			$added=array_values(array_diff($new, $current));
			$list=$initial_list;
			if(sizeof($added)){
				foreach ($added as $k => $v) {
					if(!in_array($v, $list)) $list[]=$v;
				}
			}
			if(sizeof($removed)){
				foreach ($removed as $k => $v) {
					$list=array_values(array_diff($list,array($v)));
				}
			}
			if(self::$logPermissonUpdates) phi::log(array(
				'current'=>$initial_list,
				'added'=>$added,
				'removed'=>$removed,
				'returned'=>$list
			));			//add/remove now!
			return $list;
		}
		public static function getListsByUid($lists,$uid){
			if($lists) foreach ($lists as $k => $v) {
				$vp=explode('_', $v);
				if($vp[0]==$uid) $out[]=$v;
			}
			if(!isset($out)) $out=false;
			return $out;
		}
		public static function getFriendId($id1,$id2,$rev=false){
			$ids=array($id1,$id2);
			if($rev) rsort($ids);
			else sort($ids);
			return implode('_', $ids);
		}
		public static function getFriendRequest($id,$request=false){//may already have request, dont need to lookup
			if(!$request){
				$request=db2::findOne(DB,'friendrequest',array('id'=>$id));
			}
			if(!$request) return false;
			//add info from from
			$idp=explode('_', $id);
			$oid=array_values(array_diff($idp,array($request['from'])));
			$other_id=$oid[0];
			$request['from_info']=db2::findOne(DB,'user',['id'=>$request['from']],['projection'=>['id'=>1,'name'=>1,'pic'=>1]]);//ONE_CORE::getUserInfo($request['from'],$other_id);
			return $request;
		}
		public static function processTriggers($r){
			if(isset($r['qs']['triggers'])){
				foreach ($r['qs']['triggers'] as $k => $v) {
					switch($v){
						case 'fb_friend_import':
							db2::save(DB,'jobs',array('job'=>'fbimport','type'=>'friends','uid'=>$r['auth']['uid']));
						break;
					}
				}
			}
		}
		public static function friendRequest($r){
			if(self::$uid=='fb_link'){
				$uid=(isset($r['auth']['uid']))?$r['auth']['uid']:((isset($r['qs']['anon_uid']))?$r['qs']['anon_uid']:false);
				if(!$uid) return array('error'=>'invalid_permissions');
				$set=array('id'=>$uid,'data'=>$r['qs']['data']);
				$data=$r['qs']['data'];
				//MUST SAVE ANY RELEVANT FRIEND LIST INFO!
				if(isset($data['newlists'])){
					foreach ($data['newlists'] as $k => $v) {
						$update['$set']['friend_list_info.'.$v['id']]=$v;
					}
					db2::update(DB,'user_friends',array('id'=>$uid),$update,array('upsert'=>true));
				}
				db2::update(DB,'fb_friend_default',array('id'=>$uid),array('$set'=>$set),array('upsert'=>true));
				self::processTriggers($r);
				return array('success'=>true);
			}
			$d=phi::ensure($r,array(),1,array('self::write::friends'));
			//also ensure they are not blocked!
			// if(NECTAR::isBlocked($r['auth']['uid'],self::$uid)){
			// 	return array('error'=>'This user is not accepting friend requests');
			// }
			$id=self::getFriendId(self::$uid,$r['auth']['uid']);
			$data=$r['qs']['data'];
			$save=array('id'=>$id,'from'=>$r['auth']['uid'],'data'=>$data);
			#die(json_encode(self::getFriendRequest($id,$save)));
			if(db2::findOne(DB,'friendrequest',array('id'=>$save['id']))){
				return array('error'=>'friend request already sent');
			}else{
				$res=ONE_CORE::save('friendrequest',$save);
				if(isset($data['newlists'])){
					foreach ($data['newlists'] as $k => $v) {
						$update['$set']['friend_list_info.'.$v['id']]=$v;
					}
					db2::update(DB,'user_friends',array('id'=>$r['auth']['uid']),$update,array('upsert'=>true));
				}
				//send notification!
				include_once(phi::$conf['root'].'/sites/code/app/chat/chat.php');
				//add chat message!!!!
				$resp=chat::create(array(
					'auth'=>$r['auth'],
					'qs'=>array(
						'people'=>array($r['auth']['uid'],self::$uid)
					)
				));//ensure chat exists!
				//die(json_encode($resp));
				$message=array(
					'room'=>self::getFriendId(self::$uid,$r['auth']['uid']),
					'by'=>$r['auth']['uid'],
					'request'=>1,
					'content'=>$data['message']
				);
				chat::addMessage($message);
				//broadcast to the chat channel!
				phi::push('',$id,array('type'=>'friendrequest','data'=>self::getFriendRequest($id,$save)));
				return array('success'=>true);
			}
		}
	}
?>