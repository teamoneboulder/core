<?php
	class profile{
		public static $uid='';
		public static function handleRequest($r){
			self::$uid=$r['path'][4];
			switch ($r['path'][5]){
				case "connectin"://public
					$out=self::loadConnectIn($r);
				break;
				case "cloud"://public
					$out=self::loadCloud($r);
				break;
				case "test":
					if(!phi::$conf['prod']) $out=self::test($r);
				break;
				case "load"://check
					$out=self::loadProfile($r);
				break;
				case "mutual"://testing only
					$out=self::mutualFriends($r);
				break;
				case "request"://testing only
					$out=self::request($r);
				break;
				case "deny"://testing only
					$out=self::deny($r);
				break;
				case "unlinkhd":
					$out=self::unlinkhd($r);
				break;
				case "processhd":
					$out=self::processHD($r);
				break;
				case "approve"://testing only
					$out=self::approve($r);
				break;
				case "info"://check
					$out=self::loadInfo($r);
				break;
				case "friends"://public
					$out=self::friends($r);
				break;
				case "savereflection"://check
					$out=self::saveReflection($r);
				break;
				case "reflections"://public
					$out=self::reflections($r);
				break;
				case "reflection"://public
					$out=self::reflection($r);
				break;
				case "images"://public
					$out=self::images($r);
				break;
				case "deleteimage"://public
					$out=self::deleteImage($r);
				break;
				case "bookmarks"://public
					$out=self::bookmarks($r);
				break;
				case "loadskillsfeed"://public
					$out=self::loadSkillsFeed($r);
				break;
				case "folders"://public
					$out=self::folders($r);
				break;
				default:
					$out=array('error'=>'invalid method');
				break;
			}
			return $out;
		}
		// public static function hasPermission($r,$scopes,$uid=false){
		// 	if(!self::$uid) self::$uid=$uid;
		// 	if(self::$uid==$r['auth']['uid']) return true;
		// 	return false;
		// 	//advanced permsisions coming soon
		// 	$p=db2::findOne(phi::$conf['dbname'],'user',array('id'=>self::$uid));
		// }
		public static function folders($r){
			$limit=10;
			$folderpipeline=array(
				array(
					'$match'=>array('uid'=>self::$uid)
				)
			);
			if(!$r['auth']||$r['auth']['uid']!=self::$uid){
				if($r['auth']) $lists=ONE_CORE::getLists(self::$uid,$r['auth']['uid']);
				else $lists=array('public');
				//pipeline for folders!
				$sconf=json_decode(file_get_contents(ROOT.'/_manage/schema.json'),1);
				$conf=(isset($sconf['bookmark_collection']))?$sconf['bookmark_collection']:false;
				foreach ($conf['order'] as $k => $v) {
					$project[$v]=1;
				}
				$project['mutual']=array('$size'=>array('$setIntersection'=>array('$perms',$lists)));
				$folderpipeline[]=array(
					'$project'=>$project
				);
				$folderpipeline[]=array(
					'$match'=>array('mutual'=>array('$gt'=>0))
				);
			}
			$folderpipeline[]=array(
				'$sort'=>array('tsu'=>-1)
			);
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				$c=(int) $r['qs']['last'];
				$folderpipeline[]=array('$skip'=>(int) $r['qs']['last']);
			}else{
				$c=0;
			}
			$folderpipeline[]=array('$limit'=>$limit);
			$data=db2::atoList(db2::aggregate(phi::$conf['dbname'],'bookmark_collection',$folderpipeline));
			$data['last']=$c+$limit;
			return array('success'=>true,'data'=>$data);
		}
		public static function getFolders($r){
			//get permissions!
			//phi::time('getFolders');
			$lists=ONE_CORE::getLists(self::$uid,$r['auth']['uid']);
			if(!$lists) return false;
			//pipeline for folders!
			$project['id']=true;
			$project['mutual']=array(
				'$size'=>array('$setIntersection'=>array('$perms',$lists))
			);
			$folderpipeline=array(
				array(
					'$match'=>array('uid'=>self::$uid)
				),
				array(
					'$project'=>$project
				),
				array(
					'$match'=>array('mutual'=>array('$gt'=>0))
				)
			);
			#die(json_encode($folderpipeline));
			$data=db2::aggregate(phi::$conf['dbname'],'bookmark_collection',$folderpipeline);
			if($data){
				foreach ($data as $k => $v) {
					$folders[]=$v['id'];
				}
			}else{
				$folders=false;
			}
			//phi::time('getFolders');
			return $folders;
		}
		public static function bookmarks($r){
			if($r['auth']&&$r['auth']['uid']!=self::$uid){
				$folders=self::getFolders($r);
				if(!$folders){
					return array('success'=>true,'data'=>false);
				}
				$q=array('uid'=>self::$uid,'folders'=>array('$in'=>$folders));
			}else{
				$q=array('uid'=>self::$uid);
			}
			//get available folders!
			if(isset($r['qs']['search'])){
				$regex = new MongoDB\BSON\Regex('^'.$r['qs']['search'],'i');//could be a major page, or feed within
				$q['name']=$regex;
			}
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				$l=db2::findOne(phi::$conf['dbname'],'bookmark',array('_id'=>db2::toId($r['qs']['last'])));
				if(!$l) return array('error'=>'invalid_last_post');
				$q['tsu']=array('$lt'=>db2::tsToTime($l['tsu']['$date'],false));
			}
			if(isset($r['qs']['after'])&&$r['qs']['after']){
				$a=db2::findOne(phi::$conf['dbname'],'bookmark',array('_id'=>db2::toId($r['qs']['after'])));
				if(!$a) return array('error'=>'invalid_after_post');
				$q['tsu']=array('$gt'=>db2::tsToTime($a['tsu']['$date'],false));
			}
			$opts=array('sort'=>array('tsu'=>-1));
			$max=(isset($r['qs']['max'])&&$r['qs']['max'])?(int) $r['qs']['max']:10;
			$opts['limit']=$max;
			#die(json_encode($q));
			#phi::log($q);
			$data=db2::toOrderedList(db2::find(phi::$conf['dbname'],'bookmark',$q,$opts),false,true,'_id');
			//graph on
			if($data){
				foreach ($data['list'] as $k => $v) {
					$posts[]=$v['post_id'];
					$map[$v['post_id']]=$v['_id'];
				}
				$pdata=db2::toOrderedList(db2::find(phi::$conf['dbname'],'post',array('id'=>array('$in'=>$posts))));
				$postdata=db2::graph(phi::$conf['dbname'],$pdata,array(
					'by.id'=>array(
						'coll'=>array(
							'field'=>'by.type',
							'id'=>'by.id'
						),
						'to'=>'by.data',
						'filter'=>array('name','pic','id'),
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
					'page.id'=>array(
						'coll'=>array(
							'field'=>'page.type',
							'id'=>'page.id'
						),
						'to'=>'page.data',
						'opts'=>array(
							'user'=>array(
								'coll'=>'user',
								'match'=>'id',
								'clearOnNull'=>true,
								'fields'=>array('id'=>1,'name'=>1,'pic'=>1)
							),
							'event'=>array(
								'coll'=>'event',
								'match'=>'id'
							),
							'news_source'=>array(
								'coll'=>'news_source',
								'match'=>'id'
							)
						)
					),
					'media.data'=>array(
						'coll'=>'media',
						'to'=>'media.data',
						'match'=>'id',
						'subfield'=>'data',
						'clearOnNull'=>true
					)
				));
				if($postdata['list']){
					foreach ($postdata['list'] as $k => $v) {
						$mk=$map[$v['id']];
						$data['list'][$mk]['post']=$v;
						$mks[]=$mk;
					}
				}
				$remove=array_values(array_diff($data['order'],$mks));
				if($remove&&sizeof($remove)){
					#phi::log('post removed, removing from bookmark');
					$data['order']=array_values(array_diff($data['order'],$remove));
					foreach ($remove as $k => $v) {
						unset($data['list'][$v]);
						$ids[]=db2::toId($v);
					}
					//go ahead and remove!!
					//db2::remove(phi::$conf['dbname'],'bookmark',array('_id'=>array('$in'=>$ids)),1);
					//ensure last!!!
					$l=$data['order'][sizeof($data['order'])-1];
					$data['last']=$data['list'][$l]['_id'];
				}
				//remove any that didnt have matching post...post may have been deleted!

			}
			return array('success'=>true,'data'=>$data);
		}
		public static function reflection($r){
			$d=phi::ensure($r,array('id'));
			$data=db2::findOne(phi::$conf['dbname'],'reflection',array('_id'=>db2::toId($d['id'])));
			$data=db2::graphOne(phi::$conf['dbname'],$data,array(
				'uid'=>array(
					'coll'=>'user',
					'to'=>'user',
					'match'=>'id',
					'filter'=>array('name','pic','id')
				),
				'to'=>array(
					'coll'=>'user',
					'to'=>'to_user',
					'match'=>'id',
					'filter'=>array('name','pic','id')
				)
			));
			#sleep(10);
			return array('success'=>true,'data'=>$data);
		}
		public static function reflections($r){
			if(!isset($r['qs']['max'])) $r['qs']['max']=10;
			$limit=(int) $r['qs']['max'];
			$types=array('received','given');
			if(!isset($r['qs']['type'])||!in_array($r['qs']['type'], $types)) return array('error'=>'invalid_type');
			switch ($r['qs']['type']) {
				case 'received':
					$q=array('to'=>self::$uid);
				break;
				case 'given':
					$q=array('uid'=>self::$uid);
				break;
			}
			if(isset($r['qs']['last'])){
				$q['_id']=array('$lt'=>db2::toId($r['qs']['last']));
			}
			$data=db2::toOrderedList(db2::find(phi::$conf['dbname'],'reflection',$q,array('sort'=>array('_id'=>-1),'limit'=>$limit)),false,true,'_id');
			$data=db2::graph(phi::$conf['dbname'],$data,array(
				'uid'=>array(
					'coll'=>'user',
					'to'=>'user',
					'match'=>'id',
					'filter'=>array('name','pic','id')
				),
				'to'=>array(
					'coll'=>'user',
					'to'=>'to_user',
					'match'=>'id',
					'filter'=>array('name','pic','id')
				)
			));
			return array('success'=>true,'data'=>$data);
		}
		public static function saveReflection($r){
			$d=phi::ensure($r,array('data'),1,array('self::write::reflection'));
			$save=$r['qs']['data'];
			$save['uid']=$r['auth']['uid'];
			$save['to']=self::$uid;
			if(self::$uid==$r['auth']['uid']){
				phi::alertAdmin($r['qs']['auth'].' tried to hack reflection');
				return array('error'=>'Cant leave yourself a reflection');
			}
			if(isset($r['qs']['id'])&&$r['qs']['id']){
				ONE_CORE::update('reflection',array('_id'=>db2::toId($r['qs']['id'])),$save);
				ONE_CORE::notify($r['auth']['uid'],$save['to'],'reflection_update',array('reflection'=>$r['qs']['id']));
			}else{
				$save=ONE_CORE::save('reflection',$save);
				//notify person!
				ONE_CORE::notify($r['auth']['uid'],$save['to'],'reflection',array('reflection'=>$save['_id']));
			}
			//add stats
			return array('success'=>true,'data'=>self::getReflectionCount($r));
		}
		public static function friends($r){
			if(!isset($r['qs']['type'])) return array('error'=>'invalid type');
			$limit=(isset($r['qs']['max']))?(int) $r['qs']['max']:15;
			$q=array('$and'=>array(array('id'=>new MongoDB\BSON\Regex('^'.self::$uid,'i')),array('id'=>array('$nin'=>array(self::getFriendId($r['auth']['uid'],self::$uid))))));
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				$q['_id']=array('$lt'=>db2::toId($r['qs']['last']));
			}
			if($r['qs']['type']=='mutual'){
				if(!$r['auth']){
					return array('error'=>'invalid_permissions');
				}
				$ids[]=self::$uid;
				$ids[]=$r['auth']['uid'];
				$d=db2::toList(db2::find(phi::$conf['dbname'],'user_friends',array('id'=>array('$in'=>$ids)),array('projection'=>array('friends'=>1,'id'=>1))));
				if($d){
					$mutuallist=array_values(array_intersect($d[self::$uid]['friends'], $d[$r['auth']['uid']]['friends']));
					if(sizeof($mutuallist)){
						foreach ($mutuallist as $k => $v) {
							$mutuallist2[]=self::$uid.'_'.$v;
						}
						$q['id']=array('$in'=>$mutuallist2);
					}else{
						return array('success'=>true,'data'=>false);
					}
				}else{
					return array('success'=>true,'data'=>false);
				}
			}
			$data=db2::toOrderedList(db2::find(phi::$conf['dbname'],'friend',$q,array('limit'=>$limit,'sort'=>array('_id'=>-1)),array('projection'=>array('id'=>1))),false,1);
			//now get user feed
			if($data){
				foreach ($data['order'] as $k => $v) {
					$idp=explode('_', $v);
					$tids[]=$idp[1];
				}
				$out=ONE_CORE::graphUserData($tids,$r['auth']['uid'],1);
				$out['last']=$data['last'];//copy over last!
			}else $out=false;
			return array('success'=>true,'data'=>$out);
		}
		public static function test($r){
			//tags
			$fl=db2::findOne(phi::$conf['dbname'],'user_friends',array('id'=>'U9LASX1KG'));
			if($fl){
				$list=$fl['friends'];
			}else{
				$list=array();
			}
			//sort by mutual friends!
			$sconf=json_decode(file_get_contents(ROOT.'/_manage/schema.json'),1);
			$conf=(isset($sconf['connection']))?$sconf['connection']:false;
			foreach ($conf['order'] as $k => $v) {
				$project[$v]=1;
			}
			$project['mutual']=array('$size'=>array('$setIntersection'=>array('$friendinfo.friends',$list)));
			$tagpipeline=array(
				array(
					'$sort'=>array('_id'=>-1)
				),
				array(
					'$lookup'=>array(
						'from'=>'user_friends',
						'localField'=>'uid',
						'foreignField'=>'id',
						'as'=>'friendinfo'
					)
				),
				array(
					'$unwind'=>'$friendinfo'
				),
				array(
					'$project'=>$project
				),
				array(
					'$match'=>array(
						'mutual'=>array('$gte'=>4)
					)
				),
				array(
					'$limit'=>10
				),
				// array(
				// 	'$project'=>array('friendinfo'=>0)
				// )
			);
			$locationpipeline=array(
				array(
					'$geoNear'=>array(
						'near'=>array(
							'type'=>'Point',
							'coordinates'=>array(-105.300565,40.036861)
						),
						'distanceField'=>'dist.calculated',
						'maxDistance'=>100000,//1000km
						'spherical'=>true
					)
				),
				array(
					'$lookup'=>array(
						'from'=>'user_tags',
						'localField'=>'id',
						'foreignField'=>'id',
						'as'=>'taginfo'
					)
				),
				array(
					'$unwind'=>'$taginfo'
				),
				array(
					'$match'=>array(
						'taginfo.tags'=>array('$in'=>array('app_development'))
					)
				),
				array(
					'$limit'=>10
				),
				array(
					'$project'=>array('name'=>1)
				)
			);
			$data=db2::aggregate(phi::$conf['dbname'],'connection',$tagpipeline);
			return array('success'=>true,'data'=>$data);
		}
		public static function deleteImage($r){
			$d=phi::ensure($r,array('id'),1,array('self::write::images'));
			$m=db2::findOne(phi::$conf['dbname'],'media',array('id'=>$d['id']));
			if(!$m) return array('error'=>'image_not_found');
			//only the creator can delete
			if($m['by']!=$r['auth']['uid']) return array('error'=>'invalid_permissions');
			db2::remove(phi::$conf['dbname'],'media',array('id'=>$d['id']));
			return array('success'=>true);
		}
		public static function images($r){
			$limit=(isset($r['qs']['max']))?(int) $r['qs']['max']:15;
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				$q['_id']=array('$lt'=>db2::toId($r['qs']['last']));
			}
			$q['page']=self::$uid;
			$q['type']='images';
			$data=db2::toOrderedList(db2::find(phi::$conf['dbname'],'media',$q,array('limit'=>$limit,'sort'=>array('_id'=>-1))),false,1);
			return array('success'=>true,'data'=>$data);
		}
		public static function mutualFriends($r){
			return array('success'=>true,'friends'=>ONE_CORE::getMutualFriends($r['auth']['uid'],self::$uid));
		}
		public static function loadCloud($r){
			phi::time('profile::loadCloud');
			if(!isset($r['qs']['type'])) return array('error'=>'invalid cloud type');
			switch ($r['qs']['type']) {
				case 'tag':
					$out=self::loadTagCloud($r);
				break;
				case 'skills':
					$out=self::loadSkillsCloud($r);
				break;
				default:
					return array('error'=>'invalid cloud type');
				break;
			}
			phi::time('profile::loadCloud',.5);
			return $out;
		}
		public static function loadTagCloud($r){
			$pipeline=array(
				array(
					'$match'=>array(
						//"_id"=>array('$gte'=>db2::getIdFromTime($limit)),
						'uid'=>self::$uid
					)
				),
				array(
					'$group'=>array(
						"_id"=>array( 
					        "tag"=>'$tag'
					    ),
					    "count"=>array(
					    	'$sum'=>1
					    )
					)
				)
			);
			$cloud=db2::aggregate(phi::$conf['dbname'],'user_vote_feed',$pipeline);
			$pipeline2=array(
				array(
					'$match'=>array(
						'by.id'=>self::$uid
					)
				),
				array(
					'$unwind'=>'$tags'
				),
				array(
					'$group'=>array(
						"_id"=>array( 
					        "tag"=>'$tags'
					    ),
					    "count"=>array(
					    	'$sum'=>1
					    )
					)
				)
			);
			$cloud2=db2::aggregate(phi::$conf['dbname'],'post',$pipeline2);
			//parse
			$max=(isset($r['qs']['max']))?(int) $r['qs']['max']:30;
			if($max>60) $max=60;
			$out['data']=self::parseCloud($cloud,$cloud2,$max);
			$out['success']=true;
			return $out;
		}
		public static function loadSkillsFeed($r){
			$d=phi::ensure($r,array('tag','max'));
			$max=(int) $d['max'];
			$l=db2::findOne(phi::$conf['dbname'],'user_friends',array('id'=>self::$uid),array('projection'=>array('friends'=>1)));
			$q=array(
				'id'=>array('$in'=>$l['friends']),
				'skills'=>array(
					'$in'=>array($d['tag'])
				)
			);
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				$q['_id']=array('$gt'=>db2::toId($r['qs']['last']));
			}
			$data=db2::toOrderedList(
				db2::find(phi::$conf['dbname'],'user_tags',$q,array('sort'=>array('_id'=>1),'limit'=>$max,'projection'=>array('id'=>1))),
				1,'_id'
			);
			$data=db2::graph(phi::$conf['dbname'],$data,array(
				'id'=>array(
					'coll'=>'user',
					'to'=>'user',
					'match'=>'id',
					'filter'=>array('name','pic','id')
				)
			));
			return array('success'=>true,'data'=>$data);
		}
		public static function loadSkillsCloud($r){
			$l=db2::findOne(phi::$conf['dbname'],'user_friends',array('id'=>self::$uid),array('projection'=>array('friends'=>1)));
			if($l&&isset($l['friends'])){
				foreach ($l['friends'] as $k => $v) {
					$ids[]=$v;
				}
				$pipeline=array(
					array(
						'$match'=>array(
							'id'=>array('$in'=>$ids)
						)
					),
					array(
						'$unwind'=>'$skills'
					),
					array(
						'$group'=>array(
							"_id"=>array( 
						        "tag"=>'$skills'
						    ),
						    "count"=>array(
						    	'$sum'=>1
						    )
						)
					)
				);
				return array('success'=>true,'data'=>self::parseSkillsCloud(db2::aggregate(phi::$conf['dbname'],'user_tags',$pipeline)));
			}else{
				return array('success'=>true,'data'=>false);
			}
		}
		public static function parseSkillsCloud($cloud){
			if($cloud){
				foreach ($cloud as $k => $v){
					if(!isset($data[$v['_id']['tag']])) $data[$v['_id']['tag']]=0;
					$data[$v['_id']['tag']]+=$v['count'];
				}
			}
			if(isset($data)){//map actual tag name here!
				$list=array_keys($data);
				$listdata=db2::toList(db2::find(phi::$conf['dbname'],'skills',array('id'=>array('$in'=>$list)),array('projection'=>array('name'=>1,'id'=>1))));
				foreach ($data as $k => $v) {
					if(isset($listdata[$k])){
						$out[]=array('key'=>$listdata[$k]['name'],'value'=>$v,'id'=>$k);
					}else{
						phi::log('profile:invalid skills ['.$k.']');
					}
				}
			}
			if(!isset($out)) $out=false;
			else {
				usort($out, function($a, $b){
				    return $a['value']<$b['value'];
				});
			}
			return $out;
		}
		public static function parseCloud($feedbackcloud,$postcloud,$max=30){
			if($feedbackcloud){
				foreach ($feedbackcloud as $k => $v) {
					if(!isset($data[$v['_id']['tag']])) $data[$v['_id']['tag']]=0;
					$data[$v['_id']['tag']]+=$v['count'];
				}
			}
			if($postcloud){
				foreach ($postcloud as $k => $v) {
					if($v['_id']['tag']){
						if(!isset($data[$v['_id']['tag']])) $data[$v['_id']['tag']]=0;
						$data[$v['_id']['tag']]+=$v['count']*5;
					}
				}
			}
			if(isset($data)){//map actual tag name here!
				$out=array();
				$list=array_keys($data);
				$listdata=db2::toList(db2::find(phi::$conf['dbname'],'tags',array('id'=>array('$in'=>$list)),array('projection'=>array('name'=>1,'id'=>1))));
				foreach ($data as $k => $v) {
					if(isset($listdata[$k])){
						$out[]=array('key'=>$listdata[$k]['name'],'value'=>$v,'id'=>$k);
					}else{
						phi::log('profile:invalid tag ['.$k.']');
					}
				}
			}
			if(!isset($out)) $out=false;
			else {
				usort($out, function($a, $b){
				    return $a['value']<$b['value'];
				});
				$out=array_slice($out,0,$max);
			}
			return $out;
		}
		public static function loadConnectIn($r){
			$c=db2::findOne(phi::$conf['dbname'],'user_tags',array('id'=>self::$uid));
			if(self::$uid!=$r['auth']['uid']){
				$u2=db2::findOne(phi::$conf['dbname'],'user_tags',array('id'=>$r['auth']['uid']));
			}
			if(isset($u2)&&$u2&&$c&&isset($c['tags'])){
				if(!isset($u2['tags'])) $u2['tags']=array();
				$intersect=array_intersect($c['tags'], $u2['tags']);
				if(sizeof($intersect)) $intersect=array_values($intersect);
				else $intersect=false;
			}else{
				$intersect=false;
			}
			if(isset($c['tags'])){
				$opts=array('projection'=>array('id'=>1,'name'=>1,'connection_parent'=>1,'content_parent'=>1,'connection_parents'=>1,'content_parents'=>1));
				$out['data']['info']=db2::toList(db2::find(phi::$conf['dbname'],'tags',array('id'=>array('$in'=>$c['tags'])),$opts));
				//ensure parents are in list!
				$ps=array();
				$inter=array('connection'=>array(),'content'=>array());
				$cats=array('connection'=>array(),'content'=>array());
				$catlist=array('connection'=>array(),'content'=>array());
				if(isset($out['data']['info'])&&sizeof($out['data']['info'])) foreach ($out['data']['info'] as $k => $v) {
					if(isset($v['connection_parents'])&&sizeof($v['connection_parents'])>1){
						$tv=$v['connection_parents'][sizeof($v['connection_parents'])-2];
						if($tv){
							if(!in_array($tv, $ps)) $ps[]=$tv;
							if(!in_array($tv, $cats['connection'])) $cats['connection'][]=$tv;
							if(!isset($catlist['connection'][$tv])) $catlist['connection'][$tv]=array();
							if(!in_array($v['id'], $catlist['connection'][$tv])) $catlist['connection'][$tv][]=$v['id'];
							if($intersect&&in_array($v['id'], $intersect)) $inter['connection'][$tv][]=$v['id'];
						}
					}
					if(isset($v['content_parents'])&&sizeof($v['content_parents'])>1){
						$tv=$v['content_parents'][sizeof($v['content_parents'])-2];
						if($tv){
							if(!in_array($tv, $ps)) $ps[]=$tv;
							if(!in_array($tv, $cats['content'])) $cats['content'][]=$tv;
							if(!isset($catlist['content'][$tv])) $catlist['content'][$tv]=array();
							if(!in_array($v['id'], $catlist['content'][$tv])) $catlist['content'][$tv][]=$v['id'];
							if($intersect&&in_array($v['id'], $intersect)) $inter['content'][$tv][]=$v['id'];
						}
					}
				}
				if(sizeof($ps)){
					$parents=db2::toList(db2::find(phi::$conf['dbname'],'tags',array('id'=>array('$in'=>$ps)),$opts));
					if($parents){
						foreach ($parents as $k => $v) {
							$out['data']['info'][$k]=$v;
						}
					}
				}
				sort($cats['connection']);
				sort($cats['content']);
				foreach ($catlist['connection'] as $k => $v) {
					sort($catlist['connection'][$k]);
				}
				foreach ($catlist['content'] as $k => $v) {
					sort($catlist['content'][$k]);
				}
				$out['data']['categories']=$cats;
				$out['data']['cat_list']=$catlist;
				$out['data']['mutual']=$intersect;
				if($intersect) $out['data']['mutual_info']=$inter;
				$out['data']['tags']=$c['tags'];
				$out['success']=true;
			}else{
				$out['success']=true;
			}
			return $out;
		}
		public static function getReflectionCount($r){
			$list=db2::toList(db2::find(phi::$conf['dbname'],'reflection',array('to'=>self::$uid)));
			if($list){
				$bc=0;
				foreach ($list as $k => $v) {
					if(!isset($list[$v['uid']])){
						$list2[$v['uid']]=true;
						$bc++;//only count first reflection
					}
					//check # of mutual friends TODO
				}
				return array('to'=>sizeof($list2),'by'=>$bc);
			}else{
				return false;
			}
		}
		public static function loadInfo($r){
			$data=ONE_CORE::getUserData(self::$uid,$r['auth']['uid'],array('callout','gender','location','location_apt','sign','birthday','skills','phone','email','address'),array('location_info','location_city'));
			$data['isMe']=($r['auth']&&$r['auth']['uid']==self::$uid)?true:false;
			if($r['auth']) $data['friends']=self::getFriendInfo(self::$uid,$r['auth']['uid']);
			$data['photos']=self::getPhotos();
			//add in most recently viewed people...
			return array('success'=>true,'data'=>$data);
		}
		public static function getPhotos(){
			$data=db2::toOrderedList(db2::find(phi::$conf['dbname'],'media',array('by'=>self::$uid,'type'=>'images'),array('limit'=>6,'sort'=>array('_id'=>-1))),false,1);
			return $data;
		}
		public static function getFriendInfo($uid1,$uid2){
			$l1=db2::findOne(phi::$conf['dbname'],'user_friends',array('id'=>$uid1),array('projection'=>array('friends'=>1)));
			$recent=db2::toList(db2::find(phi::$conf['dbname'],'friend',array('$and'=>array(array('id'=>new MongoDB\BSON\Regex('^'.$uid1,'i')),array('id'=>array('$ne'=>$uid1.'_'.$uid2)))),array('sort'=>array('la'=>-1),'limit'=>6)));
			if($recent){
				foreach ($recent as $k => $v) {
					$p=explode('_',$v['id']);
					$recentlist[]=$p[1];
				}
			}
			if(!isset($fecentlist)) $fecentlist=array();
			if($uid1==$uid2||!$uid2){
				$out=array(
					'total'=>sizeof($l1['friends'])-1
				);
			}else{
				$l2=db2::findOne(phi::$conf['dbname'],'user_friends',array('id'=>$uid2),array('projection'=>array('friends'=>1)));
				if($l1&&$l2){
					$mutuallist=array_values(array_intersect($l1['friends'], $l2['friends']));
					$out=array(
						'total'=>sizeof($l1['friends'])-1,
						'mutual'=>count($mutuallist)
					);
				}else{
					$out=array(
						'total'=>sizeof($l1['friends'])-1
					);
				}
			}
			if(!isset($get)) $get=array();
			if(isset($mutuallist)){
				foreach ($mutuallist as $k => $v) {
					if(!in_array($v, $get)&&sizeof($get)<3) $get[]=$v;
				}
			}else{
				$mutuallist=array();
			}
			$c=0;
			while (sizeof($get)<6&&isset($recentlist[$c])) {
				if(!in_array($recentlist[$c], $get)&&!in_array($recentlist[$c], $mutuallist)) $get[]=$recentlist[$c];
				$c++;
			}
			$out['order']=array_reverse($get);
			if(sizeof($get)){
				$outdata=ONE_CORE::graphUserData($get,$uid2);
				$out['list']=$outdata['list'];
			}
			return $out;
		}
		public static function hasPermission($r){
			return true;
		}
		public static function loadProfile($r){
			include_once(ROOT.'/api/class/formbuilder.php');
			$user=ONE_CORE::load($r,self::$uid,'user');
			#die(json_encode($user));
			if(!$user) return array('error'=>404);
			#$user['points']=db2::findOne(phi::$conf['dbname'],'points',array('id'=>self::$uid),array('id'=>1));
			if(isset($user['points']['tags']['order'])){
				$user=db2::graphOne(phi::$conf['dbname'],$user,array(
					'points.tags.order'=>array(
						'coll'=>'tags_exchange',
						'to'=>'points.tags.list',
						'match'=>'id',
						'fields'=>array('id'=>1,'name'=>1),
						'collapseList'=>true
				)));
			}
			$data=$user;
			//group
			//add services offered
			if(isset($r['auth']['uid'])&&$r['auth']['uid']==self::$uid){
				$q=[
					'page.id'=>self::$uid
				];
			}else{
				$q=[
					'page.id'=>self::$uid,
					'active'=>1,
					'disabled'=>0
				];
			}
			$data['services']=formbuilder::feed(array(
				'auth'=>$r['auth'],
				'qs'=>[
					'schema'=>'service'
				]
			),$q,array(
			),'id');
			//ensure pages
			if(isset($data['pages'])){
				if($r['auth']['uid']!=self::$uid){
					$pf=db2::findOne(phi::$conf['dbname'],'page_follow',array('id'=>$r['auth']['uid']));
					if(isset($pf['following'])){
						$following=$pf['following'];
					}else{
						$following=array();
					}
					$q=array(
						'$and'=>array(
							array(
								'id'=>array('$in'=>$data['pages'])
							),
							array(
								'$or'=>array(
									array('privacy'=>'public'),
									array('privacy'=>array('$in'=>array('closed','private')),'id'=>array('$in'=>$following))
								)
							)
						)
					);
					//do a sort???
					$l=db2::toList(db2::find(phi::$conf['dbname'],'page',$q,array('projection'=>array('id'=>1))));
					foreach($data['pages'] as $k => $v) {
						if(isset($l[$v])){
							$o[]=$v;
						}
					}
					if(!isset($o)){
						unset($data['pages']);
					}else{
						$data['pages']=$o;
					}
				}
				#die(json_encode($data['pages']));
			}
			//die(json_encode($data));
			$out['data']=$data;
			if(isset($r['auth']['uid'])){
				$out['data']['permissions']=db2::findOne(DB,'friendrequest',['id'=>self::$uid.'_'.$r['auth']['uid']]);
			}else{
				$out['data']['permissions']=false;
			}
			if(!$out['data']['permissions']||(isset($out['data']['permissions']['status'])&&$out['data']['permissions']['status']!='approved')){//strip out any data!
				if(isset($out['data']['privacy'])){
					foreach($out['data']['privacy'] as $k=>$v){
						if($v=='private') unset($out['data'][$k]);
					}
				}
			}
			$out['data']['isMe']=(isset($r['auth']['uid'])&&$r['auth']['uid']==self::$uid)?true:false;
			//$out=self::addStatus($r,$out);
			//$out['data']['friends']=self::getFriendInfo(self::$uid,($r['auth'])?$r['auth']['uid']:false);
			//$out['data']['about']['reflections']=self::getReflectionCount($r);
			//$out['data']['photos']=self::getPhotos();
			self::setLastView($r);
			$out['ts']=time();
			if($out['data']['permissions']){
			}else{
				$remove=['phone'];
				foreach ($remove as $k => $v) {
					if(isset($out['data'][$v])) unset($out['data'][$v]);
				}
			}
			$out['success']=true;
			return $out;
		}
		public static function checkBadge($r,$d,$key,$opts){
			if(db2::findOne(DB,'user_badge',['badge'=>$d['current']['badge'],'to.id'=>$d['current']['to']['id']])){
				API::toHeaders(['error'=>'Cannot issue multiple badges to the same person']);
			}
		}
		public static function checkTrustStatus($r,$d,$key,$opts){
			if($d['current']['status']=='pending'){
				phi::emitHook(phi::$conf['dbname'],time(),array(
					'id'=>'trust_request',
					'data'=>array(
						'app_id'=>$r['qs']['appid'],
						'to'=>phi::keepFields($d['current']['to'],array('id','type')),
						'from'=>phi::keepFields($d['current']['from'],array('id','type'))
					)
				));
			}
		}
		public static function request($r){
			include_once(ROOT.'/api/class/formbuilder.php');
			$d=phi::ensure($r,array('id','to','from'));
			return formbuilder::save(array(
				'auth'=>array(
					'uid'=>'internal'//allows for sending on behalf of a page without admin permissions
				),
				'qs'=>array(
					'appid'=>$r['qs']['appid'],
					'schema'=>'user_trust',
					'current'=>['id'=>$d['id'],'status'=>'pending','to'=>$d['to'],'from'=>$d['from']]
				)
			));
		}
		public static function deny($r){
			include_once(ROOT.'/api/class/formbuilder.php');
			$d=phi::ensure($r,array('id'));
			return formbuilder::save(array(
				'auth'=>array(
					'uid'=>'internal'//allows for sending on behalf of a page without admin permissions
				),
				'qs'=>array(
					'appid'=>$r['qs']['appid'],
					'schema'=>'user_trust',
					'current'=>['id'=>$d['id'],'status'=>'denied']
				)
			));
		}
		public static function approve($r){
			include_once(ROOT.'/api/class/formbuilder.php');
			$d=phi::ensure($r,array('id'));
			return formbuilder::save(array(
				'auth'=>array(
					'uid'=>'internal'//allows for sending on behalf of a page without admin permissions
				),
				'qs'=>array(
					'appid'=>$r['qs']['appid'],
					'schema'=>'user_trust',
					'current'=>['id'=>$d['id'],'status'=>'approved']
				)
			));
		}
		public static function checkEmail($r,$d,$key,$opts){
			$d['current']['email']=trim($d['current']['email']);//remove spaces!!!
			if(!$d['last']){//new addition
				$c=db2::findOne(DB,'user',array('email'=>$d['current']['email']));
				if($c) API::toHeaders(array('error'=>'Email Address In Use'));
			}else{
				if($d['last']['email']!=$d['current']['email']){
					$c=db2::findOne(DB,'user',array('email'=>$d['current']['email']));
					if($c) API::toHeaders(array('error'=>'Email Address In Use'));
				}
			}
			return $d;
		}
		public static function ensureReferedType($r,$d,$key,$opts){
			if(!isset($d['current']['refered_type'])){
				$d['current']['refered_type']=ONE_CORE::getIdType($d['current']['refered_by']);
				#phi::log('setreferedby: '.$d['current']['refered_type']);
				return $d;
			}
		}
		public static function issueReferedBy($r,$d,$key,$opts){
			if(isset($d['current']['pic'])&&$d['current']['pic']['path']!='/static/blank_user'){//if they have uploaded a picture, they have onboarded!
				$refered_by=(isset($d['current']['refered_by']))?$d['current']['refered_by']:$d['last']['refered_by'];
				ONE_CORE::emitGameHook([
					'auth'=>['uid'=>$refered_by],
					'qs'=>[
						'appid'=>$r['qs']['appid']
					]
				],'referal',[
					'page'=>[
						'id'=>$d['current']['id'],
						'type'=>($d['current']['id'][0]=='U')?'user':'page'
					]
				]);
			}
		}
		public static function checkSkillsGame($r,$d,$key,$opts){
			if(isset($d['current']['skills'])){
				ONE_CORE::emitGameHook($r,'profile_skills',$d['current']['id']);
			}
			return $d;
		}
		public static function checkBirthdayGame($r,$d,$key,$opts){
			if(isset($d['current']['birthday'])){
				ONE_CORE::emitGameHook($r,'profile_birthday',$d['current']['id']);
			}
			return $d;
		}
		public static function checkProfilePicGame($r,$d,$key,$opts){
			// if($d['last']){
			// 	if(!isset($d['last']['pic'])&&isset($d['current']['pic'])&&$d['current']['pic']['path']!='/static/blank_user'){
			// 		ONE_CORE::emitGameHook($r,'profile_pic',$d['current']['id']);
			// 	}
			// }else if(isset($d['current']['pic'])&&$d['current']['pic']['path']!='/static/blank_user'){
			// 	ONE_CORE::emitGameHook($r,'profile_pic',$d['current']['id']);
			// }
			if(isset($d['current']['pic'])&&$d['current']['pic']['path']!='/static/blank_user'){
				ONE_CORE::emitGameHook($r,'profile_pic');
			}
			return $d;
		}
		public static function sendGamePoints($r,$d,$key,$opts){
			include_once(ROOT.'/api/class/formbuilder.php');
			#phi::log('sendGamePoints: '.json_encode($d['current']));
			$current=array(
				'from'=>array(
					'id'=>'one_boulder',
					'type'=>'page'
				),
				'to'=>$d['current']['page'],
				'seed'=>1,
				'amount'=>$d['current']['points'],
				'message'=>(isset($d['current']['game_info']['message']))?phi::parseString($d['current']['game_info']['message'],$d['current']):''
			);
			#phi::log('send game points!!! '.json_encode($current));
			formbuilder::save(array(
				'auth'=>array(
					'uid'=>'internal'//allows for sending on behalf of a page without admin permissions
				),
				'qs'=>array(
					'appid'=>$r['qs']['appid'],
					'schema'=>'exchange',
					'current'=>$current
				)
			));
			return $d;
		}
		public static function checkQuestionGame($r,$d,$key,$opts){
			$lastTotal=0;
			if($d['last']){
				foreach ($d['schema_conf']['order'] as $k => $v) {
					if($v!='id'&&isset($d['last'][$v])&&$d['last'][$v]) $lastTotal++;
				}
			}
			$total=0;
			$currentTotal=0;
			foreach ($d['schema_conf']['order'] as $k => $v) {
				if($v!='id'&&isset($d['current'][$v])&&$d['current'][$v]) $currentTotal++;
				if($v!='id') $total++;
			}
			if($currentTotal==$total){
				if($lastTotal==$total){
					phi::log('['.$d['current']['id'].'] already has all questions answered!');
				}else{
					ONE_CORE::emitGameHook($r,'profile_questions',$d['current']['id']);
				}
			}
			return $d;
		}
		public static function ensureLevel($r,$d,$key,$opts){
			if(!isset($d['current']['level'])) $d['current']['level']='explorer';
			if($d['last']&&!isset($d['last']['level_active'])) $d['last']['level_active']=false;
			if($d['last']&&($d['last']['level']!=$d['current']['level']||(isset($d['current']['level_active'])&&$d['current']['level_active']!=$d['last']['level_active']))&&$d['current']['level']!='explorer'&&$d['current']['level']!='player'){
				//phi::log('level change!!!!');
				if(isset($d['current']['level_active'])&&$d['current']['level_active']){
					$id='level_change';
				}else{
					$id='level_change_inactive';
				}
				$h=phi::emitHook(phi::$conf['dbname'],time(),array(
					'id'=>$id,
					'data'=>array(
						'app_id'=>$r['qs']['appid'],
						'to'=>[
							'id'=>$d['current']['id'],
							'type'=>'user'
						],
						'level'=>$d['current']['level']
					)
				));
			}
			return $d;
		}
		public static function unlinkhd($r){
			if($r['auth']['uid']==self::$uid){
				ONE_CORE::update('user_profiles',['id'=>self::$uid],[],false,false,['humandesign'=>1]);
				return ['success'=>true];
			}else{
				return ['error'=>'invalid_permissions'];
			}
		}
		public static function checkGenekeyGame($r,$d,$key,$opts){
			if((!$d['last']||!isset($d['last'][$key]))&&$d['current'][$key]){
				ONE_CORE::emitGameHook($r,'profile_genekey',$d['current']['id']);	
			}
		}
		public static function checkHumanDesignImage($r,$d,$key,$opts){
			#phi::log('check design');
			include_once(ROOT.'/api/uploader.php');
			if(isset($d['current']['humandesign']['img'])&&is_string($d['current']['humandesign']['img'])){
				//save it!
				$r=array(
					'qs'=>array(
						'url'=>$d['current']['humandesign']['img'],
						'sizes'=>array('small','full'),
						'path'=>'/img/'
					)

				);
				$d['current']['humandesign']['img']=phi::keepFields(upload::uploadImage($r),array('path','ext','ar'));
				//scheudle job
				$url='https://api.'.phi::$conf['domain'].'/one_core/module/profile/'.$d['current']['id'].'/processhd';
				#phi::log('url:'.$url);
				phi::scheduleJob(md5($url.time()),time(),array(
					'url'=>$url,
					'type'=>'url',
					'data'=>array(
						'internal'=>1
					)
				));
			}
			return $d;
		}
		public static function processHD($r){
			//do OCR!!!
			//phi::log('request');
			$u=db2::findOne(DB,'user_profiles',['id'=>self::$uid]);
			$url=phi::$conf['s3'].$u['humandesign']['img']['path'].'/full.'.$u['humandesign']['img']['ext'];
			$exec='node /var/www/'.phi::$conf['project'].'/node/ocr.js '.$url;
			//phi::log('exec: '.$exec);
			$res=phi::execNode($exec);
			phi::log('🚀🚀🚀 HD OCR UPDATE  ===== '.json_encode($res));
			db2::update(DB,'user_profiles',['id'=>self::$uid],['$set'=>['humandesign.profile'=>$res]]);
			return ['success'=>true];
		}
		public static function checkHumanDesignGame($r,$d,$key,$opts){
			#phi::log($d);
			if((!$d['last']||!isset($d['last'][$key]))&&$d['current'][$key]){
				ONE_CORE::emitGameHook($r,'profile_humandesign',$d['current']['id']);	
			}
		}
		public static function checkLevel($r,$d,$key,$opts){
			if(!isset($d['current']['level'])) $d['current']['level']='explorer';
			return $d;
		}
		public static function welcome($r,$d,$key,$opts){
			phi::log('🚀🚀🚀 NEW MEMBER! ['.$d['current']['name'].'] ['.$d['current']['source'].']');
			switch($d['current']['source']){
				case 'invited':
					$type='new_member_invite';
				break;
				case 'visit':
					$type='new_member_visit';
				break;
				case 'app':
					$type='new_member_welcome';
				break;
				case 'event':
				default:
					$type='new_member_welcome';
				break;
			}
			$h=phi::emitHook(phi::$conf['dbname'],time(),array(
				'id'=>$type,
				'data'=>array(
					'app_id'=>$r['qs']['appid'],
					'user'=>$d['current']['id']
				)
			));
			$d['current']['score']=0;//initalize score to 0
			return $d;
		}
		public static function setBirthdayTime($r,$d,$key,$opts){
			if(isset($d['current']['birthday']['birthday'])){
				$d['current']['birthday']['ts']=strtotime($d['current']['birthday']['birthday']);
				$d['current']['birthday']['month'] = date('m',$d['current']['birthday']['ts']);
				$d['current']['birthday']['day'] = date('d',$d['current']['birthday']['ts']);
				$d['current']['birthday']['year'] = date('Y',$d['current']['birthday']['ts']);
			}else{
			}
			return $d;
		}
		public static function getFriendId($id1,$id2,$rev=false){
			$ids=array($id1,$id2);
			if($rev) rsort($ids);
			else sort($ids);
			return implode('_', $ids);
		}
		public static function setLastView($r){
			if(isset($r['auth']['uid'])&&self::$uid!=$r['auth']['uid']){
				$fid=self::$uid.'_'.$r['auth']['uid'];
				if(db2::findOne(phi::$conf['dbname'],'friend',array('id'=>$fid))){
					db2::update(phi::$conf['dbname'],'friend',array('id'=>$fid),array('$set'=>array('la'=>time())));
				}
			}
		}
		public static function addStatus($r,$out){
			if($r['auth']&&self::$uid==$r['auth']['uid']){
				$out['data']['status']='me';
			}else{
				if(!$r['auth']){
					$out['data']['status']='nothing';
				}else{
					$fid=self::getFriendId(self::$uid,$r['auth']['uid']);
					if(db2::findOne(phi::$conf['dbname'],'friendrequest',array('id'=>$fid))){
						$out['data']['status']='pending';
					}
					if(db2::findOne(phi::$conf['dbname'],'friend',array('id'=>$fid))){
						$out['data']['status']='friends';
					}
					if(!isset($out['data']['status'])) $out['data']['status']='nothing';
				}
			}
			return $out;
		}
	}
?>