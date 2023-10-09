<?php
	class COMMENT{
		public static function handleRequest($r){
			include_once(ROOT.'/api/app.php');
			switch ($r['path'][4]){
				case "deletecomment"://check
					$out=self::deleteComment($r);
				break;
				case 'newcomment'://check
					$out=self::newComment($r);
				break;
				case 'vote'://needs more
					$out=self::vote($r);
				break;
				case 'load'://needs more
					$out=self::load($r);
				break;
				default:
					$out=array('error'=>'invalid method');
				break;
			}
			return $out;
		}
		public static function load($r){
			$d=phi::ensure($r,array('room','context'));
			$post=db2::findOne(phi::$conf['dbname'],$d['context'],array('id'=>$d['room']));
			if(!$post&&$d['context']!='video') return array('error'=>'invalid_post');
			//if(!self::ensurePermissions($r,$post)) return array('error'=>'invalid_permissions');
			$id=$d['room'];
			$query=array('room'=>$id);
			$data=db2::toOrderedList(db2::find(phi::$conf['dbname'],'chat',$query,array('sort'=>array('_id'=>1))));
			if(!phi::$conf['prod']){
				if(isset($data['list'])){
					foreach ($data['list'] as $k => $v) {
						if($v['by']!=$r['auth']['uid']) $data['list'][$k]['content']=phi::obfuscateText($v['content']);
					}
				}
			}
			$isSteward=false;
			if(isset($r['auth']['uid'])) $isSteward=ONE_CORE::isSteward($r['auth']['uid']);

			//put comments inside
			if($data) foreach ($data['list'] as $k => $v) {
				if(!$isSteward){
					if(isset($v['status'])&&in_array($v['status'],['banned','pending'])){//removed banned comments!
						if(isset($r['auth']['uid'])&&$r['auth']['uid']!=$v['by']){//dont hide for person who posted
							unset($data['list'][$k]);
							$data['order']=array_values(array_diff($data['order'], [$k]));
						}else{
							if(isset($v['parent'])){
								$data['list'][$v['parent']]['replies'][]=$v['_id'];
								if(in_array($v['_id'], $data['order'])){
									$data['order']=array_values(array_diff($data['order'], array($v['_id'])));
								}
							}
						}
					}else{
						if(isset($v['parent'])){
							$data['list'][$v['parent']]['replies'][]=$v['_id'];
							if(in_array($v['_id'], $data['order'])){
								$data['order']=array_values(array_diff($data['order'], array($v['_id'])));
							}
						}
					}
				}else{
					if(isset($v['parent'])){
						$data['list'][$v['parent']]['replies'][]=$v['_id'];
						if(in_array($v['_id'], $data['order'])){
							$data['order']=array_values(array_diff($data['order'], array($v['_id'])));
						}
					}
				}
				//$data['list'][$k]['reaction']=$id.'_'.$v['_id'].'_'.$r['auth']['uid'];
			}
			$data=db2::graph(phi::$conf['dbname'],$data,array(
				'by'=>array(
					'map'=>array(
						'U'=>array(
							'coll'=>'user',
						),
						'G'=>array(
							'coll'=>'page'
						)
					),
					'to'=>'user',
					'match'=>'id',
					'filter'=>array('name','pic','id','health')
				),
				'reply.id'=>array(
					'coll'=>array(
						'field'=>'reply.type',
						'id'=>'reply.id'
					),
					'to'=>'reply.user',
					'opts'=>array(
						'user'=>array(
							'coll'=>'user',
							'match'=>'id',
							'clearOnNull'=>true,
							'fields'=>array('id'=>1,'name'=>1,'pic'=>1)
						),
						'page'=>array(
							'coll'=>'page',
							'match'=>'id',
							'clearOnNull'=>true,
							'fields'=>array('id'=>1,'name'=>1,'pic'=>1)
						)
					)
				),
				// 'reaction'=>array(
				// 	'coll'=>'reaction',
				// 	'to'=>'reaction',
				// 	'match'=>'id',
				// 	'filter'=>array('v'),
				// 	'clearOnNull'=>true
				// ),
				'media.data'=>array(
					'coll'=>'media',
					'to'=>'media.data',
					'match'=>'id',
					'subfield'=>'data',
					'clearOnNull'=>true
				)
			));
			$data['id']=$id;
			return array('success'=>true,'data'=>$data);
		}
		public static function deleteComment($r){
			//ensure they have perms to do this!
			$d=phi::ensure($r,array('id'),1,array('self::write::comment'));
			$id=db2::toId($r['qs']['id']);
			$chat=db2::findOne(phi::$conf['dbname'],'chat',array('_id'=>$id));
			if($chat){
				if($chat['by']==$r['auth']['uid']||ONE_CORE::isAdmin($r)){
					// db2::remove(phi::$conf['dbname'],'chat',array('_id'=>$id));
					$kid=db2::findOne(phi::$conf['dbname'],'chat',array('parent'=>$r['qs']['id']));
					if($kid){
						db2::update(phi::$conf['dbname'],'chat',array('_id'=>$id),array('$set'=>array('deleted'=>true,'content'=>'[Deleted Comment]')));
					}else{
						db2::remove(phi::$conf['dbname'],'chat',array('_id'=>$id));
					}
					//updatestats 
					return array('success'=>true);
				}else{
					return array('error'=>'invalid_permissions');
				}
			}else{
				return array('error'=>'invalid_comment');
			}
		}
		public static function calcStats($item,$context){
			$c=db2::count(phi::$conf['dbname'],'chat',array('room'=>$item['id']));
			$b=db2::count(phi::$conf['dbname'],'bookmark',array('post_id'=>$item['id']));
			$item['stats']=array(
				'comments'=>$c,
				'bookmarks'=>$b
			);
			//load reactions!
			//$regex = new MongoDB\BSON\Regex('^'.$item['id'],'i');//could be a major page, or feed within
			//die(json_encode($item));
			// $list=db2::toList(db2::find(phi::$conf['dbname'],'reaction',array('post'=>$item['id'])));
			// if($list){
			// 	foreach ($list as $k => $v) {
			// 		$idp=explode('_', $v['id']);
			// 		if(!isset($item['stats']['reactions'][$v['v']])) $item['stats']['reactions'][$v['v']]=0;
			// 		$item['stats']['reactions'][$v['v']]++;//[]=$idp[sizeof($idp)-1];
			// 	}
			// }else{
			// 	if(isset($item['stats']['reactions'])) unset($item['stats']['reactions']);
			// }
			// if(isset($item['stats']['reactions'])){
			// 	die(json_encode($item['stats']));
			// }
			//cache it!
			db2::update(phi::$conf['dbname'],$context,array('id'=>$item['id']),array('$set'=>array('stats'=>$item['stats'])));
			return $item['stats'];
		}
		public static function newComment($r){
			if(!isset($r['qs']['id'])) return array('error'=>'invalid_id');
			$context=$r['qs']['module'];
			phi::log('new comment! ['.$context.'] ['.$r['qs']['id'].']');
			$item=db2::findOne(phi::$conf['dbname'],$context,array('id'=>$r['qs']['id']));
			if(!$item) return array('error'=>'invalid_'.$context);
			//if(!self::ensurePermissions($r,$item)) return array('error'=>'invalid_permissions');
			$comment=db2::findOne(phi::$conf['dbname'],'chat',array('_id'=>db2::toId($r['qs']['comment_id'])));
			if(isset($comment['parent'])){
				$parent=db2::findOne(phi::$conf['dbname'],'chat',array('_id'=>db2::toId($comment['parent'])));
			}else $parent=false;
			#phi::log($item);
			$to=array();
			//look at context!
			$admin_comment=['bug','upset','report','video'];
			$rsvp_to=array();
			#phi::log('context: '.$admin_comment);
			if(in_array($context,$admin_comment)){
				if(isset($item['from']['id'])) $to[]=$item['from']['id'];//add to creator
				//send to all stewards
				$stewards=ONE_CORE::getStewards(1);
				#phi::log('got: '.json_encode($stewards));
				foreach($stewards as $k=>$v){
					$to[]=$v;
				}
				//skip the person who is making the comment!
				$skip[]=$comment['by'];
				#phi::log('admin content '.json_encode($to));
			}else{
				if(isset($item['by']['id'])) $to[]=$item['by']['id'];//add to creator
				if(isset($item['from']['id'])) $to[]=$item['from']['id'];//add to creator
				if(isset($item['page']['id'])) $to[]=$item['page']['id'];//add to creator
				if($to[0][0]!='U'&&isset($item['page'])){
					$page=db2::findOne(DB,'page',array('id'=>$item['page']['id']));
					if(isset($page['admins'])){
						foreach ($page['admins'] as $k => $v) {
							//also send to page admins
							$to[]=$v;
						}
					}
				}
				if(isset($item['cohost'])) $to=array_merge($to,$item['cohost']);
				//everyone who RSVP'd Going
				if($context=='event'){
					$list=db2::toOrderedList(db2::find(DB,'event_rsvp',array('eid'=>$item['id'],'rsvp'=>'going')));
					if($list&&isset($list['list'])){
						foreach ($list['list'] as $k => $v) {
							$rsvp_to[]=$v['uid'];
						}
					}
					#phi::log('list: '.json_encode($rsvp_to));
				}
			}
			//add in anyone that has already commented on this thread!
			if($item){
				#phi::log('updated stats for ['.$item['id'].']');
				if(!isset($skip)) $skip=array();
				$skip[]=$comment['by'];
				$hooks=array();
				if(!in_array($context,$admin_comment)){
					if(isset($comment['at'])&&sizeof($comment['at'])){//@'s are more powerful than general
						foreach ($comment['at'] as $uid => $v) {
							// $msg=array(
							// 	'from'=>$r['qs']['from'],//can be on behalf of
							// 	'from_data'=>ONE_CORE::getUser($r['qs']['from']),
							// 	'mode'=>'mirror',
							// 	'to'=>$to,
							// 	'type'=>'comment_mention',
							// 	'data'=>array(
							// 		'post_id'=>$item['id'],
							// 		'comment_id'=>$r['qs']['comment_id']
							// 	)
							// );
							// $skip=$to;
							//db2::save(phi::$conf['dbname'],'broadcast',$msg);
							//save to hook
							$skip[]=$uid;
							$data=array(
								'app_id'=>$r['qs']['appid'],
								'to'=>array(
									'id'=>$uid,
									'type'=>ONE_CORE::getIdType($uid)
								),
								'from'=>array(
									'id'=>$comment['by'],
									'type'=>ONE_CORE::getIdType($comment['by'])
								)
							);
							$data[$context]=$r['qs']['id'];
							$data['comment']=$r['qs']['comment_id'];
							$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),array(
								'id'=>'comment_mention_'.$context,
								'data'=>$data
							),1);
						}
						//phi::log($comment['at']);
					}
				}
				if(!$parent||in_array($context,$admin_comment)){
					if(isset($to)) foreach ($to as $k => $v) {
						if(!in_array($v, $skip)){
							$data=array(
								'app_id'=>$r['qs']['appid'],
								'to'=>array(
									'id'=>$v,
									'type'=>ONE_CORE::getIdType($v)
								),
								'from'=>array(
									'id'=>$comment['by'],
									'type'=>ONE_CORE::getIdType($comment['by'])
								)
							);
							$skip[]=$v;
							$data[$context]=$r['qs']['id'];
							$data['comment']=$r['qs']['comment_id'];
							$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),array(
								'id'=>'comment_'.$context,
								'data'=>$data
							),1);
						}
					}
				}else{
					if($parent['by']!=$r['qs']['from']){//dont noitfy myself about 
						if(!in_array($parent['by'], $skip)){
							//ONE_CORE::notify($r['qs']['from'],$parent['by'],$nk,$data);
							$data=array(
								'app_id'=>$r['qs']['appid'],
								'to'=>array(
									'id'=>$parent['by'],
									'type'=>ONE_CORE::getIdType($parent['by'])
								),
								'from'=>array(
									'id'=>$comment['by'],
									'type'=>ONE_CORE::getIdType($comment['by'])
								)
							);
							$skip[]=$parent['by'];
							$data[$context]=$r['qs']['id'];
							$data['comment']=$r['qs']['comment_id'];
							$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),array(
								'id'=>'comment_reply_'.$context,
								'data'=>$data
							),1);
						}
					}
				}
				if(!$parent&&sizeof($rsvp_to)){
					if(isset($rsvp_to)) foreach ($rsvp_to as $k => $v) {
						if(!in_array($v, $skip)){
							$data=array(
								'app_id'=>$r['qs']['appid'],
								'to'=>array(
									'id'=>$v,
									'type'=>ONE_CORE::getIdType($v)
								),
								'from'=>array(
									'id'=>$comment['by'],
									'type'=>ONE_CORE::getIdType($comment['by'])
								)
							);
							$data[$context]=$r['qs']['id'];
							$data['comment']=$r['qs']['comment_id'];
							#phi::log('data '.json_encode($data));
							$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),array(
								'id'=>'comment_'.$context.'_rsvp',
								'data'=>$data
							),1);
						}
					}
				}
				if(sizeof($hooks)) phi::saveHooks($hooks);
				//also run custom hooks for this comment if they exist, eg notifying cohosts!
				self::calcStats($item,$context);
				//queue notifications.
				return array('success'=>true);
			}else{
				phi::log('invalid item');
				phi::log('request');
				return array('error'=>'invalid_item');
			}
		}
	}
?>