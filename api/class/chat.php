<?php
	class chat{
		public static $uid='';
		public static function handleRequest($r){
			switch ($r['path'][4]){
				case "data"://check
					$out=self::load($r);
				break;
				case "load"://check
					$out=self::loadChat($r);
				break;
				case 'save'://check
					$out=self::save($r);
				break;
				case 'updatechat'://ok for now
					$out=self::updateChat($r);
				break;
				case 'newcomment'://check
					$out=self::newComment($r);
				break;
				case 'setread'://ok for now
					$out=self::setRead($r);
				break;
				case 'loadread'://check
					$out=self::loadRead($r);
				break;
				case 'bookmark'://check
					$out=self::bookmark($r);
				break;
				case 'unbookmark'://check
					$out=self::unbookmark($r);
				break;
				default:
					$out=array('error'=>'invalid method');
				break;
			}
			return $out;
		}
		public static function create($r){
			$d=phi::ensure($r,array('people'),1,array('self::write::chat'));
			if(!in_array($r['auth']['uid'], $r['qs']['people'])) $r['qs']['people'][]=$r['auth']['uid'];
			$total=sizeof($r['qs']['people']);
			$save=array('people'=>$r['qs']['people']);
			if(isset($r['qs']['page'])){
				sort($r['qs']['people']);
				$k=implode('_', $r['qs']['people']);
				$room=db2::findOne(DB,'chat_group',array('id'=>$k));
				if($room){//its ok, just return the already created chat!
					$room['total']=sizeof($room['people']);
					$room['people']=array_values(array_diff($room['people'],array($r['auth']['uid'])));
					$room=self::addPeople($room);
					//return
					//name pic id
					return array('success'=>true,'data'=>$room,'current'=>true);
				}
				//$save['page']=$r['qs']['page'];
				$save['id']=$k;
				$save['page']=$r['qs']['page'];
			}else if(sizeof($r['qs']['people'])==2){
				sort($r['qs']['people']);
				$k=implode('_', $r['qs']['people']);
				$room=db2::findOne(DB,'chat_group',array('id'=>$k));
				if($room){//its ok, just return the already created chat!
					$room['total']=sizeof($room['people']);
					$room['people']=array_values(array_diff($room['people'],array($r['auth']['uid'])));
					$room=self::addPeople($room);
					//return
					//name pic id
					return array('success'=>true,'data'=>$room,'current'=>true);
				}
				$save['id']=$k;
			}
			if(isset($r['qs']['name'])&&$r['qs']['name']) $save['name']=$r['qs']['name'];
			if(sizeof($save['people'])>2&&!isset($save['name'])) return array('error'=>'name must be set for chat with 3 or more people');
			//check to see if already exists
			#phi::log($save);
			$save['tsu']=db2::tsToTime(time());
			$room=ONE_CORE::save('chat_group',$save);
			foreach ($room['people'] as $k => $v) {//add it to their chat list order!
				self::touchChat($v,$room['id'],$room);
			}
			$room['people']=array_values(array_diff($room['people'],array($r['auth']['uid'])));
			$room=self::addPeople($room);
			$room['total']=$total;
			return array('success'=>true,'data'=>phi::keepFields($room,array('id','name','people','people_list','total')));
		}
		public static function checkId($r,$d,$key,$opts,$hook_name){
			//dont allow create if person isnt in chat!
			if(!in_array($r['auth']['uid'], $d['current']['people'])){
				API::toHeaders(array('error'=>'You must be included in a chat group you are creating!'));
			}
			$d['current']['people']=array_unique($d['current']['people']);
			if(sizeof($d['current']['people'])<2){
				API::toHeaders(array('error'=>'There must be at least two people in the chat'));
			}
			//see if all people who are in this chat already exists
			if(!$d['last']){//not submitting an ID, hoping to create, lets see if chat exists
				if(sizeof($d['current']['people'])==2){//only do for two person chat
					if(!isset($d['current']['name'])||!$d['current']['name']){//if a name is passed, allow making a new chat!
						$c=db2::toOrderedList(db2::find(phi::$conf['dbname'],'chat_group',array('people'=>array('$all'=>$d['current']['people']))));
						if(isset($c['order'])) foreach ($c['order'] as $k => $v) {
							if($c['list'][$v]&&sizeof($c['list'][$v]['people'])==2){
								API::toHeaders(array('success'=>true,'exists_path'=>'/chat/'.$c['list'][$v]['id']));
							}
						}
					}
				}

			}
			return $d;
		}
		public static function emitUpdate($r,$d,$key,$opts,$hook_name){
			foreach ($d['current']['people'] as $k => $v) {
				phi::push(false,$v.'_chats',array('type'=>$hook_name,'data'=>$d['current']));
			}
			return $d;
		}
		public static function getGraphOpts($uid=''){
			return array(
				'by'=>array(
					'coll'=>'user',
					'to'=>'user',
					'match'=>'id',
					'fields'=>array('name'=>1,'pic'=>1,'id'=>1)
				),
				'added'=>array(
					'coll'=>'user',
					'to'=>'added',
					'match'=>'id',
					'fields'=>array('name'=>1,'pic'=>1,'id'=>1)
				),
				'removed'=>array(
					'coll'=>'user',
					'to'=>'removed',
					'match'=>'id',
					'fields'=>array('name'=>1,'pic'=>1,'id'=>1)
				),
				'media.data'=>array(
					'coll'=>'media',
					'to'=>'media.data',
					'match'=>'id',
					'subfield'=>'data',
					'clearOnNull'=>true
				),
				'attachment'=>array(
					'coll'=>array(
						'field'=>'attachment.type',
						'id'=>'attachment.id'
					),
					'to'=>'attachment.data',
					'opts'=>array(
						'tags'=>array(
							'coll'=>'tags',
							'match'=>'id',
							'clearOnNull'=>true
						),
						'page'=>array(
							'coll'=>'page',
							'match'=>'id',
							'clearOnNull'=>true,
							'fields'=>array('name'=>1,'pic'=>1,'id'=>1,'callout'=>1)
						),
						'service_offering_request'=>array(
							'coll'=>'service_offering_request',
							'match'=>'id',
							'clearOnNull'=>true
						),
						'event'=>array(
							'coll'=>'event',
							'match'=>'id',
							'clearOnNull'=>true,
							'graph'=>array(
								'uid'=>array(
									'coll'=>'user',
									'to'=>'user',
									'match'=>'id',
									'filter'=>array('name','pic','id')
								),
								'rsvp'=>array(
									'create'=>array(
										'join'=>array(
											'data'=>array('$id',$uid),
											'separator'=>'_'
										)
									),
									'coll'=>'event_rsvp',
									'to'=>'rsvp',
									'match'=>'id',
									'subfield'=>'rsvp',
									'clearOnNull'=>true
								)
							)
						)
					)
				)
			);
		}

		public static function updateChat($r){
			$d=phi::ensure($r,array('id'),1,array('self::read::chat'));
			$cg=ONE_CORE::load($r,$d['id'],'chat_group');
			//ensure permissions!
			if(!$cg) return array('error'=>'invalid_chat');
			if(isset($d['add'])){
				if(false&&sizeof($cg['people'])==2){
					//create the new chat and return it!
					$cg['people'][]=$d['add'];
					phi::log('new people chat! '.json_encode($cg));
					$ret=self::create(array(
						'auth'=>$r['auth'],
						'qs'=>array(
							'people'=>$cg['people']
						)
					));
					$ret['newchat']=1;
					return $ret;
				}else{
					db2::update(phi::$conf['dbname'],'chat_group',array('id'=>$d['id']),array('$set'=>array('tsu'=>db2::tsToTime(time())),'$addToSet'=>array('people'=>array('$each'=>$d['add']))));
					$msg=array(
						'added'=>$d['add'],
						'by'=>$r['auth']['uid'],
						'room'=>$d['id']
					);
				}
			}
			if(isset($d['remove'])){
				db2::update(phi::$conf['dbname'],'chat_group',array('id'=>$d['id']),array('$set'=>array('tsu'=>db2::tsToTime(time())),'$pullAll'=>array('people'=>$d['remove'])));
				$msg=array(
					'removed'=>$d['remove'],
					'by'=>$r['auth']['uid'],
					'room'=>$d['id']
				);
				$cg['people']=array_values(array_diff($cg['people'],$d['remove']));
				#phi::log('CG:'.json_encode($cg));
			}
			$last=db2::toOrderedList(db2::find(phi::$conf['dbname'],'chat',array('room'=>$d['id']),array('sort'=>array('_id'=>-1),'limit'=>1)));
			if($last&&isset($d['add'])){
				//bulk update
				$tlast=$last['list'][$last['order'][0]];
				$lastid=$tlast['_id'];
				#phi::log('set last chat to: '.$lastid);
				 foreach ($d['add'] as $k => $v) {
					$keyid=$v.'_'.$d['id'];
					$keyid2=$d['id'].'_'.$v;
					#phi::log('Last: '.$keyid);
					$updates[]=array(array('id'=>$keyid),array('$set'=>array('last'=>$lastid,'id'=>$keyid)),array('upsert'=>true));
				}
				if(isset($updates)) db2::bulkUpdate(phi::$conf['dbname'],'lastread',$updates);//ensures that lastread is set properly to count message
			}
			if(isset($cg['thread'])){
				if(isset($d['add'])) foreach ($d['add'] as $k => $v) {
					$keyid=$d['id'].'_'.$v;
					#phi::log('Last: '.$keyid);
					$updates2[]=array(array('id'=>$keyid),array('$set'=>array('id'=>$keyid,'uid'=>$v,'cid'=>$d['id'])),array('upsert'=>true));
				}
				if(isset($d['remove'])) foreach ($d['remove'] as $k => $v) {
					$keyid=$d['id'].'_'.$v;
					#phi::log('Last: '.$keyid);
					db2::remove(phi::$conf['dbname'],'chat_group_follow',array('id'=>$keyid));
					//$updates2[]=array(array('id'=>$keyid),array('$set'=>array('id'=>$keyid,'uid'=>$v,'cid'=>$d['id'])),array('upsert'=>true));
				}
				if(isset($updates2)) db2::bulkUpdate(phi::$conf['dbname'],'chat_group_follow',$updates2);
				#phi::log(json_encode($updates2));
			}
			self::addMessage($msg);
			//db2::update(phi::$conf['dbname'],'lastread',array('id'=>$r['qs']['id']),array('$set'=>array('last'=>$r['qs']['last'],'id'=>$r['qs']['id'])),array('upsert'=>true));
			//get last message fl
			phi::log($cg);
			if(isset($d['add'])) foreach ($d['add'] as $k => $v) {//should update for new people
				self::touchChat($v,$d['id'],$cg);
			}
			foreach ($cg['people'] as $k => $v) {//should update for old people
				self::touchChat($v,$d['id'],$cg);
			}
			return array('success'=>true);
		}
		public static function unbookmark($r){
			$d=phi::ensure($r,array('id'),1,array('self::write::chat'));
			$c=db2::findOne(phi::$conf['dbname'],'chat',array('_id'=>db2::toId($d['id'])));
			if(!$c) return array('error'=>'invalid_chat');
			db2::update(phi::$conf['dbname'],'chat',array('_id'=>db2::toId($d['id'])),array('$pullAll'=>array('bookmark'=>array($r['auth']['uid']))));
			return array('success'=>true);
		}
		public static function bookmark($r){
			$d=phi::ensure($r,array('id'),1,array('self::write::chat'));
			$c=db2::findOne(phi::$conf['dbname'],'chat',array('_id'=>db2::toId($d['id'])));
			if(!$c) return array('error'=>'invalid_chat');
			db2::update(phi::$conf['dbname'],'chat',array('_id'=>db2::toId($d['id'])),array('$addToSet'=>array('bookmark'=>$r['auth']['uid'])));
			return array('success'=>true);
		}
		public static function hasPermission(){
			return true;
		}
		public static function load($r){
			$d=phi::ensure($r,array('id'));
			$data=ONE_CORE::load($r,$d['id'],'chat_group');
			return array('success'=>true,'data'=>$data);
		}
		public static function loadChat($r){
			$id=$r['qs']['room'];
			$query=array('room'=>$id);
			$limit=10;
			if(isset($r['qs']['max'])&&$r['qs']['max']) $limit=(int) $r['qs']['max'];
			//if(phi::$conf['prod']&&false){
				if(isset($r['qs']['last'])&&$r['qs']['last']) $query['_id']=array('$lt'=>db2::toId($r['qs']['last']));
				if(isset($r['qs']['after'])&&$r['qs']['after']) $query['_id']=array('$gt'=>db2::toId($r['qs']['after']));
				$laston='_id';
				$sort=array('_id'=>-1);
			// }else{
			// 	if(isset($r['qs']['last'])&&$r['qs']['last']) $query['tsu']=array('$lt'=>db2::tsToTime((int) $r['qs']['last']));
			// 	if(isset($r['qs']['after'])&&$r['qs']['after']) $query['tsu']=array('$gt'=>db2::tsToTime((int) $r['qs']['after']));
			// 	$query['parent']=array('$exists'=>false);
			// 	$laston='tsu';
			// 	$sort=array('tsu'=>-1);
			// }
			#die(json_encode($query));
			if(isset($r['qs']['filter'])){
				if($r['qs']['filter']=='photos'){
					$query['media.type']='images';
				}
				if($r['qs']['filter']=='links'){
					$query['media.type']='link';
				}
				if($r['qs']['filter']=='bookmarks'){
					$query['bookmark']=array('$in'=>array($r['auth']['uid']));
				}
			}
			//load chat and esure person has permsission
			$c=db2::findOne(phi::$conf['dbname'],'chat_group',array('id'=>$id));
			//if(!$c) return array('success'=>true,'data'=>false,'supressed_error'=>'invalid_chat_group');
			if($c){
				if(!isset($c['people'])) $c['people']=array();
				if(!in_array($r['auth']['uid'], $c['people'])){
					if(isset($c['page'])){
						if(isset($c['thread'])){//chat thread on a page
							//allow for now, future check
						}else{//direct chat to page
							$p=db2::findOne(phi::$conf['dbname'],'page',array('id'=>$c['page']),array('projection'=>array('admins'=>1)));
							if(!$p) return array('error'=>'invalid_page');
							if(!in_array($r['auth']['uid'], $p['admins'])){
								phi::alertAdmin($r['auth']['uid'].' tried to load chat ['.$c['id'].'] they didnt have permission for');
								return array('error'=>'invalid_permissions');
							}
						}
					}else{
						phi::alertAdmin($r['auth']['uid'].' tried to load chat ['.$c['id'].'] they didnt have permission for');
						return array('error'=>'invalid_permissions');
					}
				}
			}
			$data=db2::toOrderedList(db2::find(phi::$conf['dbname'],'chat',$query,array('limit'=>$limit,'sort'=>$sort)),false,1,'_id',$laston);
			$data=db2::graph(phi::$conf['dbname'],$data,self::getGraphOpts($r['auth']['uid']));
			//add page info!
			//graph object
			if(isset($data['list'])){
				foreach ($data['list'] as $k => $v) {
					if(isset($v['bookmark'])&&in_array($r['auth']['uid'], $v['bookmark'])){
						$data['list'][$k]['bookmark']=true;
					}else{
						$data['list'][$k]['bookmark']=false;
					}
					if($v['by'][0]=='G'){
						$page=$v['by'];
					}
				}
			}
			if(isset($page)){
				$page=db2::findOne(phi::$conf['dbname'],'page',array('id'=>$page),array('projection'=>array('id'=>1,'name'=>1,'pic'=>1)));
				foreach ($data['list'] as $k => $v) {
					if($v['by'][0]=='G'){
						$data['list'][$k]['user']=$page;
					}
				}
			}
			//add in sub chats if needed
			if(isset($data['order'])){
				$cl=db2::toOrderedList(db2::find(phi::$conf['dbname'],'chat',array('parent'=>array('$in'=>$data['order'])),array('sort'=>array('tsu'=>-1))));
				$cl=db2::graph(phi::$conf['dbname'],$cl,array(
					'by'=>array(
						'coll'=>'user',
						'to'=>'user',
						'match'=>'id',
						'fields'=>array('name'=>1,'pic'=>1,'id'=>1)
					)
				));
				if($cl){
					foreach ($cl['order'] as $k => $v) {
						$data['list'][$cl['list'][$v]['parent']]['children']['list'][$v]=$cl['list'][$v];
						$data['list'][$cl['list'][$v]['parent']]['children']['order'][]=$v;
					}
				}
			}
			if(!phi::$conf['prod']){
				$room=db2::findOne(phi::$conf['dbname'],'chat_group',array('id'=>$id));
				if(!$room) $room['people']=array();
				if(isset($data['list'])){
					foreach ($data['list'] as $k => $v) {
						if($v['by']!=$r['auth']['uid']&&!in_array($r['auth']['uid'], $room['people'])) $data['list'][$k]['content']=phi::obfuscateText($v['content']);
					}
				}
			}
			// if(!isset($r['qs']['last'])||!$r['qs']['last']){//see if there is any extra data, eg friend request
			// 	include_once(phi::$conf['root'].'/sites/code/module/permissions/permissions.php');
			// 	$data['extra']=permissions::getFriendRequest($id);
			// }
			#sleep(10);
			$data['id']=$id;
			return array('success'=>true,'data'=>$data);
		}
		public static function userInChat($r,$cg){
			#die(json_encode($cg));
			if(isset($cg['thread'])){
				if(db2::findOne(phi::$conf['dbname'],'chat_group_follow',array('id'=>$cg['id'].'_'.$r['auth']['uid']))) return true;
				return false;
			}else{
				if(in_array($r['auth']['uid'], $cg['people'])) return true;//if not, check pages
				$up=db2::findOne(phi::$conf['dbname'],'user',array('id'=>$r['auth']['uid']),array('projection'=>array('pages')));
				$check[]=$r['auth']['uid'];
				if(isset($up['pages'])){
					foreach ($up['pages'] as $k => $v) {
						$check[]=$v;
					}
				}
				$inchat=false;
				foreach ($check as $k => $v) {
					if(in_array($v, $cg['people'])) $inchat=true;
				}
				return $inchat;
			}
		}
		public static function ensurePeopleCount($r,$d,$key,$opts){
			if(isset($d['current']['people'])&&sizeof($d['current']['people'])<2){
				API::toHeaders(['error'=>'Must be at least 2 people in a chat']);
			}
		}
		public static function checkNotifications($r,$d,$key,$opts){
			//phi::log('resp: '.json_encode($d['diff']));
			if(isset($d['diff']['people']['removed'])){
				foreach($d['diff']['people']['removed'] as $k=>$v){
					//phi::log('clear chat notification for ['.$v.'] ['.$d['current']['id'].']');
					ONE_CORE::getPushCount($v,array('chat'=>array($d['current']['id']=>0)),1,false);
				}
			}
		}
		public static function loadRead($r){
			$cg=db2::findOne(phi::$conf['dbname'],'chat_group',array('id'=>$r['qs']['room']));
			//if(!$cg) return array('error'=>'invalid_chat_group');
			if($cg&&!self::userInChat($r,$cg)) return array('error'=>'invalid_permissions');
			$current=db2::findOne(phi::$conf['dbname'],'chat_read',array('id'=>$r['qs']['room']));
			return array('success'=>true,'data'=>$current);
		}
		public static function setRead($r){
			//get current lastread
			// $last=db2::findOne(phi::$conf['dbname'],'lastread',array('id'=>$r['qs']['id']));
			// if(!$last||($last&&$last['last']!=$r['qs']['last'])){//ensure a dupe doesnt happen...doesnt effect db, but will cause a secondary websocket notification...
				//get diff from last
				$d=phi::ensure($r,array('last','id','room','identity'),1,array('self::write::chat'));
				if($r['auth']['uid']==$d['identity']){

				}else{
					$p=db2::findOne(phi::$conf['dbname'],'page',array('id'=>$d['identity']));
					if(!$p) return array('error'=>'invalid_page');
					if(!in_array($r['auth']['uid'], $p['admins'])) return array('error'=>'invalid_permissions');
				}
				db2::update(phi::$conf['dbname'],'lastread',array('id'=>$r['qs']['id']),array('$set'=>array('last'=>$r['qs']['last'],'id'=>$r['qs']['id'])),array('upsert'=>true));
				//also update the chat item read list and send read receipt update to clients
				$k='read.'.$d['identity'];
				db2::update(phi::$conf['dbname'],'chat_read',array('id'=>$r['qs']['room']),array('$set'=>array($k=>$r['qs']['last'])),array('upsert'=>true));
				phi::push(false,$r['qs']['room'],array('type'=>'readreceipt','data'=>array('message_id'=>$r['qs']['last'],'by'=>$d['identity'])));
				//set cound to 0!
				if($d['identity'][0]=='G'){
					$admin_uid=$r['auth']['uid'];
				}else{
					$admin_uid=false;
				}
				ONE_CORE::getPushCount($d['identity'],array('chat'=>array($r['qs']['room']=>0)),(isset($r['qs']['nopush']))?0:1,$admin_uid);
				$updated=true;
			// }else{
			// 	if(!phi::$conf['prod']) phi::log('already read!');
			// 	$updated=false;
			// }
			return array('success'=>true,'updated'=>$updated);
		}
		public static function newComment($r,$comment=false){
			//get chat
			if(!isset($r['qs']['id'])) return array('error'=>'invalid_id');
			if(!isset($r['qs']['from'])) return array('error'=>'invalid_from');
			self::setRead(array('auth'=>$r['auth'],'qs'=>array('identity'=>$r['qs']['from'],'id'=>$r['qs']['from'].'_'.$r['qs']['id'],'last'=>$r['qs']['comment_id'],'room'=>$r['qs']['id'],'nopush'=>true)));
			if(!$comment){
				$comment=db2::findOne(phi::$conf['dbname'],'chat',array('_id'=>db2::toId($r['qs']['comment_id'])));
				$comment['_id']=(string) $comment['_id']['$oid'];
			}
			$lastinfo=array('last'=>phi::keepFields($comment,array('_id','content','by')),'tsu'=>db2::tsToTime(time()));
			$lastinfo['last']=db2::graphOne(phi::$conf['dbname'],$lastinfo['last'],array(
				'by'=>array(
					'coll'=>'user',
					'to'=>'user',
					'match'=>'id',
					'fields'=>array('name'=>1,'pic'=>1,'id'=>1)
				)
			));
			$group=ONE_CORE::load($r,$r['qs']['id'],'chat_group');
			$group['last']=$lastinfo['last'];
			if(!$group){//autocreate
				if(strpos($r['qs']['id'], '_')!==false){//user to user who arent friends, autocreate!
					$conn=self::create(array(
						'auth'=>$r['auth'],
						'qs'=>array(
							'people'=>explode('_',$r['qs']['id'])
						)
					));
					$group=$conn['data'];
				}else{
					return array('error'=>'invalid_chat');
				}
			}
			//phi::log($group);
			//touch chat for all
			if(isset($comment['parent'])){
				$p=db2::findOne(phi::$conf['dbname'],'chat',array('_id'=>db2::toId($comment['parent'])));
				$notify=(isset($p['notify'])&&$p['notify'])?$p['notify']:array();
				if(!in_array($p['by'], $notify)) $notify[]=$p['by'];
				#phi::log('user this! '.json_encode($people));
			}else{
				$notify=$group['people'];
			}
			$notify=array_values(array_diff($notify,array($r['qs']['from'])));
			$silent=(isset($r['qs']['silent'])&&$r['qs']['silent'])?1:0;
			//phi::log('notify! '.json_encode($notify));
			foreach ($group['people'] as $k => $v){
				//send user notice that chat order has changed!
				
				if($r['qs']['from']!=$v){//send to everybody else but the person who sent!
					//puuuuush!
					//set unread counts for people in chat!
					$last=db2::findOne(phi::$conf['dbname'],'lastread',array('id'=>$v.'_'.$group['id']));
					$q=array('room'=>$r['qs']['id']);
					if($last) $q['_id']=array('$gt'=>db2::toId($last['last']));
					$unread=db2::count(phi::$conf['dbname'],'chat',$q);
					$badges=ONE_CORE::getPushCount($v,array('chat'=>array($r['qs']['id']=>$unread)));
					$to[]=$v;

				}
				//always do this part!
				self::touchChat($v,$group['id'],$group);
			}
			if(!$silent){
				if(isset($notify)&&sizeof($notify)){
					$bc=ONE_CORE::getUserBadgeCount($notify);
					foreach ($notify as $k => $v) {
						$count=0;
						if(isset($bc[$v])) $count+=$bc[$v];
						self::sendPush($v,$r['qs']['from'],$group['id'],'chat',$r['qs']['comment_id'],$count,(isset($group['name'])?$group['name']:false));
						// $h=phi::emitHook(phi::$conf['dbname'],time(),array(
						// 	'id'=>'new_message',
						// 	'data'=>array(
						// 		'user'=>$v,
						// 		'from'=>array(
						// 			'id'=>$r['qs']['from'],
						// 			'type'=>'user'
						// 		),
						// 		'chat'=>$r['qs']['comment_id']
						// 	)
						// ),1);
						// if($h){
						// 	$hooks[]=$h;
						// }
					}
					// if(isset($hooks)&&sizeof($hooks)){
					// 	phi::saveHooks($hooks);
					// }
				}
			}
			#phi::log('comment in '.json_encode($comment));
			$lastinfo['last']['content']=$comment['content']=chat::getPreviewContent($comment);

			#phi::log('comment out '.json_encode($comment));
			db2::update(phi::$conf['dbname'],'chat_group',array('id'=>$r['qs']['id']),array('$set'=>$lastinfo));
			return array('success'=>true);
		}
		public static function getPreviewContent($comment){
			if(isset($comment['amount'])){
				$comment['content']='Sent $'.phi::toMoney($comment['amount']);
			}else if(isset($comment['media'])){
				if($comment['media']['type']=='call'){
					$comment['content']='called';
				}else if($comment['media']['type']=='images'){
					if(sizeof($comment['media']['data'])==1){
						$comment['content']='Sent an image';
					}else{
						$comment['content']='Sent '.sizeof($comment['media']['data']).' images';
					}
				}
				if($comment['media']['type']=='link'){
					$comment['content']='Sent a link';
				}
				if($comment['media']['type']=='video'){
					$comment['content']='Sent a video';
				}
				if($comment['media']['type']=='audio'){
					$comment['content']='Sent an audio message';
				}
			}else if(isset($comment['removed'])){
				if(sizeof($comment['removed'])==1){
					$comment['content']='left the chat';
				}else{
					$comment['content']='removed '.sizeof($comment['removed']).' people';
				}
			}else if(isset($comment['added'])){
				if($comment['added']==1){
					$comment['content']='added you as a friend!';
				}else if(sizeof($comment['added'])==1){
					$comment['content']='Added 1 person';
				}else{
					$comment['content']='Added '.sizeof($comment['added']).' people';
				}
			}else if(isset($comment['request'])){
				$comment['content']='Sent you a friend request!';
			}else if(isset($comment['denied'])){
				$comment['content']='Denied your friend request';
			}else if(isset($comment['canceled'])){
				$comment['content']='Canceled the friend request';
			}else if(isset($comment['added'])){
				$comment['content']='Replied to friend request';
			}else if(isset($comment['attachment'])){
				if(!isset($comment['attachment']['type'])){
					$comment['attachment']['type']='';
				}
				switch ($comment['attachment']['type']) {
					case 'page':
						$comment['content']='Shared a page with you';
					break;
					case 'event':
						$comment['content']='Shared an event with you';
					break;
					case 'service_offering_request':
						$comment['content']='Requested a payment for a service';
					break;
					default:
						$comment['content']='Shared an attachment with you';
					break;
				}
			}else{
				$comment['content']=phi::limitLength($comment['content'],150);
			}
			return $comment['content'];
		}
		public static function addMessage($message,$by=false,$silent=''){
			include_once(ROOT.'/sites/one_core/one_core.api');
			if(!isset($message['room'])) return array('error'=>'invalid_room');
			if(!isset($message['by'])) return array('error'=>'invalid_sender');
			$message['tsu']=db2::tsToTime(time());
			if(isset($message['media'])){//process media!
				$message=ONE_CORE::processMedia(array(),$message);
				phi::log($message);
			}
			$chat=db2::save(phi::$conf['dbname'],'chat',$message);
			$message['_id']=(string) $chat->getInsertedId();
			//newComment to a page chat if its a page chat...
			self::newComment(array(//internal call
				'auth'=>array(
					'uid'=>$message['by'],
					'scope'=>array('*')
				),
				'qs'=>array(
					'silent'=>$silent,
					'comment_id'=>$message['_id'],
					'from'=>$message['by'],
					'id'=>$message['room']
				)
			),$message);
			//send to channel!
			$message['type']='message';
			if(!$by) $by=ONE_CORE::getUser($message['by']);
			$message['user']=$by;
			$message=db2::graphOne(phi::$conf['dbname'],$message,self::getGraphOpts());
			phi::push('',$message['room'],$message);//for anybody out there listening...
			return $message;
		}
		public static function sendPush($to_uid,$from_uid,$room,$type,$comment_id,$count,$group_name=false){
			$comment=db2::findOne(phi::$conf['dbname'],'chat',array('_id'=>db2::toId($comment_id)));
			$from=ONE_CORE::getUser($from_uid);
			$msg='';
			if($group_name){
				$title=$group_name;
				$msg=$from['name'].': ';
			}else{
				$title=$from['name'];
			}
			if(isset($comment['amount'])){
				$msg.='sent you $'.phi::toMoney($comment['amount']);
			}else if(isset($comment['request'])){
				$msg.='sent you a friend request!';
			}else if(isset($comment['removed'])){
				if(sizeof($comment['removed'])==1){
					$msg.='left the chat';
				}else{
					$msg.='removed '.sizeof($comment['removed']).' people from the chat';
				}
			}else if(isset($comment['added'])){
				if($comment['added']==1){
					$msg.='added you as a friend!';
				}else{
					$people=db2::toOrderedList(db2::find(phi::$conf['dbname'],'user',array('id'=>array('$in'=>$comment['added'])),array('projection'=>array('name'=>1))));
					$s=sizeof($comment['added']);
					if(sizeof($people['order'])==$s){
						if($s==1){
							$msg.='added '.$people['list'][$people['order'][0]]['name'];
						}else if($s==2){
							$msg.='added '.$people['list'][$people['order'][0]]['name'].' and '.$people['list'][$people['order'][1]]['name'];
						}else{
							$msg.='added '.$people['list'][$people['order'][0]]['name'].' and '.($s-1).' others';
						}
					}else{//fallback..missing data
						if($s==1){
							$msg.='added '.$s.' person';
						}else{
							$msg.='added '.$s.' people';
						}
					}
				}
			}else if(isset($comment['attachment'])){
				if(isset($comment['attachment']['type'])){
					switch ($comment['attachment']['type']) {
						case 'post':
							$msg.='shared a post!';
						break;
						case 'event':
							$msg.='shared an event!';
						break;
						case 'service_offering_request':
							$msg.='requested a payment for a service.';
						break;
						default:
							$msg.='shared an attachment with you!';
						break;
					}
				}else{
					switch ($comment['attachment']['type']) {
						case 'tags':
							$msg.='sent a connectin request';
							$message='Connectin Request!';
						break;
					}
				}
			}else if(isset($comment['denied'])){
				return false;//dont send any push here for that...
			}else if(isset($comment['canceled'])){
				return false;//dont send any push here for that...
			}else if(isset($comment['content'])&&$comment['content']){
				$msg.=phi::limitLength($comment['content'],150);
			}else{
				if(isset($comment['media'])){
					if($comment['media']['type']=='images'){
						if(sizeof($comment['media']['data'])==1){
							$msg.='Sent an image';
						}else{
							$msg.='Sent '.sizeof($comment['media']['data']).' images';
						}
					}
					if($comment['media']['type']=='video'){
						$msg.='Sent a video';
					}
					if($comment['media']['type']=='audio'){
						$msg.='Sent an audio message';
					}
				}
			}
			$devices=db2::toList(db2::find(phi::$conf['dbname'],'device',array('uid'=>$to_uid)));
			if($devices) phi::sendPush($devices,$msg,'',$count,'',$title,array(
				'data'=>self::loadPreviewChat($room,$to_uid),
				'pic'=>phi::getImg($from['pic'],'square'),
				'route'=>'/chat/'.$room
			),$to_uid,1);
		}
		public static function loadPreviewChat($rid,$uid){
			$data=self::previewChatList($uid,10,0,$rid);
			$d=$data['list'][$data['order'][0]];
			if(isset($d['tsu'])) unset($d['tsu']);
			return $d;
		}
		public static function previewChatList2($uid,$limit=10,$last,$after,$q=false){
			if(!$q){
				$q=array('people'=>array('$in'=>array($uid)));
				if($last&&$last!='false'){
					$q['tsu']=array('$lt'=>db2::tsToTime($last));
				}
				if($after&&$after!='false'){
					$q['tsu']=array('$gt'=>db2::tsToTime($after));
				}
			}
			$data=db2::toOrderedList(db2::fixTsu(db2::find(phi::$conf['dbname'],'chat_group',$q,array('sort'=>array('tsu'=>-1),'limit'=>$limit))),false,1,'id','tsu');
			if(isset($data['list'])) foreach ($data['list'] as $k => $v) {
				if(isset($v['thread'])){
					$data['list'][$k]['total']=sizeof($v['people']);//move to a db count
				}else{
					$data['list'][$k]['total']=sizeof($v['people']);
					$data['list'][$k]=self::addPeople($data['list'][$k]);
					$data['list'][$k]['people']=array_values(array_diff($data['list'][$k]['people'], array($uid)));
					// if($data['list'][$k]['total']==2&&!isset($data['list'][$k]['page'])){
					// 	$check[$k]=NECTAR::getFriendId($v['people'][0],$v['people'][1]);
					// }
				}
			}
			$data=db2::graph(phi::$conf['dbname'],$data,array(
				'last.by'=>array(
					'coll'=>'user',
					'to'=>'last.user',
					'match'=>'id',
					'fields'=>array('name'=>1,'pic'=>1,'id'=>1)
				),
				'page'=>array(
					'coll'=>'page',
					'to'=>'page_info',
					'match'=>'id',
					'fields'=>array('name'=>1,'pic'=>1,'id'=>1)
				)
			));
			// if(isset($check)){
			// 	$ids=array_values($check);
			// 	$l=db2::toList(db2::find(phi::$conf['dbname'],'friendrequest',array('id'=>array('$in'=>$ids))));
			// 	if($l){
			// 		foreach ($check as $id => $fr) {
			// 			if(isset($l[$id])){
			// 				$data['list'][$id]['status']='pending';
			// 			}
			// 		}
			// 	}
			// }
			$return=$data;
			return $return;
		}
		public static function previewChatList($uid,$limit=10,$start=0,$chat_id=false){
			if(!$chat_id) $current=db2::findOne(phi::$conf['dbname'],'chat_order',array('id'=>$uid));
			else $current=false;
			if($current||$chat_id){
				//prepare it!
				//limit 10
				if(!$chat_id){
					$c=$start;
					$end=$c+$limit;
					$get=array();
					while($c<$end&&isset($current['order'][$c])){
						$chats[]=$current['order'][$c];
						$c++;
					}
				}else{
					$chats[]=$chat_id;
					$c=0;
				}
				if(!isset($chats)) return false;
				$l=db2::toList(db2::find(phi::$conf['dbname'],'chat_group',array('id'=>array('$in'=>$chats))));
				$l=db2::graph(phi::$conf['dbname'],$l,array(
					'page'=>array(
						'coll'=>'page',
						'to'=>'page_info',
						'match'=>'id',
						'fields'=>array('name'=>1,'pic'=>1,'id'=>1)
					)
				),1);
				#phi::log(json_encode($l));
				$data=array('order'=>$chats,'list'=>$l);
				// $data=db2::graph(phi::$conf['dbname'],$data,array(
				// 	'people'=>array(
				// 		'coll'=>'user',
				// 		'to'=>'people',
				// 		'match'=>'id',
				// 		'fields'=>array('name'=>1,'pic'=>1,'id'=>1)
				// 	)
				// ));
				#die(json_encode($data));
				foreach ($data['list'] as $k => $v) {
					if(isset($v['thread'])){
						$data['list'][$k]['total']=sizeof($v['people']);//move to a count
					}else{
						$data['list'][$k]['total']=sizeof($v['people']);
						$data['list'][$k]=self::addPeople($data['list'][$k]);
						//$data['list'][$k]['people']=array_values(array_diff($data['list'][$k]['people'], array($uid)));
						// if($data['list'][$k]['total']==2&&!isset($data['list'][$k]['page'])){
						// 	$check[$k]=NECTAR::getFriendId($v['people'][0],$v['people'][1]);
						// }
					}
				}
				if(isset($check)){
					$ids=array_values($check);
					$l=db2::toList(db2::find(phi::$conf['dbname'],'friendrequest',array('id'=>array('$in'=>$ids))));
					if($l){
						foreach ($check as $id => $fr) {
							if(isset($l[$id])){
								$data['list'][$id]['status']='pending';
							}
						}
					}
				}
				$return=$data;
				$return['last']=$c;
			}else{
				$return=false;
			}
			return $return;
		}
		public static function addPeople($room){
			$c=0;
			foreach ($room['people'] as $k => $v) {
				if($v[0]=='U'){
					$users[]=$v;
				}
				if($v[0]=='G'){
					$pages[]=$v;
				}
			}
			if(isset($users)){
				$ul=db2::toList(db2::find(phi::$conf['dbname'],'user',array('id'=>array('$in'=>$users)),array('projection'=>array('id'=>1,'name'=>1,'pic'=>1,'blocked'=>1))));
				if($ul){
					foreach ($ul as $k => $v) {
						$room['people_list'][$v['id']]=phi::keepFields($v,array('id','name','pic','blocked'));
						$room['people_list'][$v['id']]['type']='person';
					}
				}
			}
			if(isset($pages)){
				$pl=db2::toList(db2::find(phi::$conf['dbname'],'page',array('id'=>array('$in'=>$pages)),array('projection'=>array('id'=>1,'name'=>1,'pic'=>1))));
				if($pl){
					foreach ($pl as $k => $v) {
						$room['people_list'][$v['id']]=phi::keepFields($v,array('id','name','pic'));
						$room['people_list'][$v['id']]['type']='page';
					}
				}
			}
			return $room;
		}
		public static function touchChat($uid,$rid,$chat){//moves current chat to nearest
			// $limit=1000;
			// $c=db2::findOne(phi::$conf['dbname'],'chat_order',array('id'=>$uid));
			// if(!$c){
			// 	$c=array('order'=>array(),'id'=>$uid);
			// }
			// if(in_array($rid, $c['order'])){//remove it!
			// 	$k=array_search($rid, $c['order']);
			// 	array_splice($c['order'],$k,1);
			// }
			// //add to beginning!
			// array_unshift($c['order'], $rid);
			// //save it!
			// db2::update(phi::$conf['dbname'],'chat_order',array('id'=>$c['id']),array('$set'=>$c),array('upsert'=>true));
			//if(NECTAR::isUserOnline($uid)) 
			// $last=db2::findOne(phi::$conf['dbname'],'lastread',array('id'=>$uid.'_'.$group['id']));
			// $q=array('room'=>$r['qs']['id']);
			// if($last) $q['_id']=array('$gt'=>db2::toId($last['last']));
			// $unread=db2::count(phi::$conf['dbname'],'chat',$q);
			// $chat['unread']=$unread;
			phi::push('',$uid.'_chats',array('type'=>'onUpdate','data'=>$chat));
			//phi::push($uid,'relay',array('type'=>'newchat'));//utilize web sockets to send update directly!
			//return $c['order'];
		}
		public static function save($r){
			$d=phi::ensure($r,array('people'),1,array('self::write::chat'));
			if(!in_array($r['auth']['uid'], $r['qs']['people'])) $r['qs']['people'][]=$r['auth']['uid'];
			$total=sizeof($r['qs']['people']);
			$save=array('people'=>$r['qs']['people']);
			if(isset($r['qs']['page'])){
				sort($r['qs']['people']);
				$k=implode('_', $r['qs']['people']);
				$room=db2::findOne(phi::$conf['dbname'],'chat_group',array('id'=>$k));
				if($room){//its ok, just return the already created chat!
					$room['total']=sizeof($room['people']);
					$room['people']=array_values(array_diff($room['people'],array($r['auth']['uid'])));
					$room=self::addPeople($room);
					//return
					//name pic id
					return array('success'=>true,'data'=>$room,'current'=>true);
				}
				//$save['page']=$r['qs']['page'];
				$save['id']=$k;
				$save['page']=$r['qs']['page'];
			}else if(sizeof($r['qs']['people'])==2){
				sort($r['qs']['people']);
				$k=implode('_', $r['qs']['people']);
				$room=db2::findOne(phi::$conf['dbname'],'chat_group',array('id'=>$k));
				if($room){//its ok, just return the already created chat!
					$room['total']=sizeof($room['people']);
					$room['people']=array_values(array_diff($room['people'],array($r['auth']['uid'])));
					$room=self::addPeople($room);
					//return
					//name pic id
					return array('success'=>true,'data'=>$room,'current'=>true);
				}
				$save['id']=$k;
			}
			if(isset($r['qs']['name'])&&$r['qs']['name']) $save['name']=$r['qs']['name'];
			if(sizeof($save['people'])>2&&!isset($save['name'])) return array('error'=>'name must be set for chat with 3 or more people');
			//check to see if already exists
			#phi::log($save);
			$save['tsu']=db2::tsToTime(time());
			$room=ONE_CORE::save('chat_group',$save);
			foreach ($room['people'] as $k => $v) {//add it to their chat list order!
				self::touchChat($v,$room['id'],$room);
			}
			$room['people']=array_values(array_diff($room['people'],array($r['auth']['uid'])));
			$room=self::addPeople($room);
			$room['total']=$total;
			return array('success'=>true,'data'=>phi::keepFields($room,array('id','name','people','people_list','total')));
		}
	}
?>