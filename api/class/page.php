<?php
	class page{
		public static $page='';
		public static function handleRequest($r){
			self::$page=$r['path'][4];
			switch ($r['path'][5]){
				case "load"://check
					//sleep(10);
					$out=self::load($r);
				break;
				case "follow"://check
					$out=self::follow($r);
				break;
				case "unfollow"://check
					$out=self::unfollow($r);
				break;
				case "removemember"://check
					$out=self::removeMember($r);
				break;
				case "calendar":
					$out=self::calendar($r);
				break;
				case "onboard"://check
					$out=self::onboard($r);
				break;
				case "newcomment"://check
					$out=self::newComment($r);
				break;
				case "newthreadcomment"://check
					$out=self::newThreadComment($r);
				break;
				case "updatethread"://check
					$out=self::updateThread($r);
				break;
				case "rideshare"://public
					$out=self::rideshare($r);
				break;
				case "schedule"://pubic
					$out=self::schedule($r);
				break;
				case "threads"://public
					$out=self::threads($r);
				break;
				case "events"://public
					$out=self::events($r);
				break;
				case "calendar"://public
					$out=self::calendar($r);
				break;
				case "claim"://check
					$out=self::claim($r);
				break;
				case "resources"://public
					$out=self::resources($r);
				break;
				case "loadthread"://public
					$out=self::loadThread($r);
				break;
				case "threadfollow"://check
					$out=self::threadFollow($r);
				break;
				case "invite"://check
					$out=self::invite($r);
				break;
				case "decline"://check
					$out=self::decline($r);
				break;
				case "content_list"://public
					$out=self::contentList($r);
				break;
				case "members"://public
					$out=self::members($r);
				break;
				case "directory":
					$out=self::directory($r);
				break;
				case "threadfollows"://check
					$out=self::threadFollows($r);
				break;
				case "settings":
					switch ($r['path'][6]){
						case "save"://check
							$out=self::saveSettings($r);
						break;
						case "permissionslist"://check
							$out=self::listPermissions($r);
						break;
						case "updatepermission"://check
							$out=self::updatePermission($r);
						break;
						case "deletepermission"://check
							$out=self::deletePermission($r);
						break;
					}
				break;
			}
			return $out;
		}
		public static function checkEmail($r,$d,$key,$opts){
			$d['current']['email']=trim($d['current']['email']);//remove spaces!!!
			if(!$d['last']){//new addition
				$c=db2::findOne(DB,'page',array('email'=>$d['current']['email']));
				if($c) API::toHeaders(array('error'=>'Email Address In Use'));
			}else{
				if($d['last']['email']!=$d['current']['email']){
					$c=db2::findOne(DB,'page',array('email'=>$d['current']['email']));
					if($c) API::toHeaders(array('error'=>'Email Address In Use'));
				}
			}
			return $d;
		}
		public static function directory($r){
			if(!isset($r['qs']['max'])) $r['qs']['max']=10;
			$limit=(int) $r['qs']['max'];
			$data=false;
			if(isset($r['qs']['filter'])){
				$filter=$r['qs']['filter'];
			}else{
				$filter=false;
			}
			//get all users in page
			$follows=db2::findOne(phi::$conf['dbname'],'page_follows',array('id'=>self::$page));
			if(self::$page=='global'||isset($follows['following'])){
				$pf=db2::findOne(phi::$conf['dbname'],'user_follow',array('id'=>$r['auth']['uid']));
				$pq=array(
					'$or'=>array(
						array(
							'privacy'=>'public'
						)
					)
				);
				if(isset($pf['following'])){
					$pq['$or'][1]=array(
						'privacy'=>array('$in'=>array('closed','private')),
						'id'=>array('$in'=>$pf['following'])
					);
				}
				$pipeline[]=array(
					'$match'=>array(
						'$and'=>array(
							$pq
						)
					)
				);
				if(self::$page!='global'){
					$pipeline[0]['$match']['$and'][]=array(
						'admins'=>array('$in'=>$follows['following'])
					);
					$pipeline[0]['$match']['$and'][]=array(
						'id'=>array('$ne'=>self::$page)
					);
				}
				if(isset($r['qs']['last'])&&$r['qs']['last']){
					$pipeline[0]['$match']['$and'][]['_id']=array('$lt'=>db2::toId($r['qs']['last']));
				}
				if(isset($r['qs']['after'])&&$r['qs']['after']){
					$pipeline[0]['$match']['$and'][]['_id']=array('$gt'=>db2::toId($r['qs']['after']));
				}
				if($filter){
					if(isset($filter['type'])&&$filter['type']&&$filter['type']!='all'){
						$pipeline[0]['$match']['$and'][]=array(
							'pagetype'=>$filter['type']
						);
					}
					if(isset($filter['tag'])){
						$pipeline[0]['$match']['$and'][]=array(
							'tags'=>array('$in'=>$filter['tag']['order'])
						);
					}
					$skip=array('root','all_pages');
					if(isset($filter['category'])&&$filter['category']&&!in_array($filter['category'], $skip)){
						$t=db2::findOne(phi::$conf['dbname'],'tags',array('id'=>$filter['category']));
						if($t){
							if(isset($t['page_children'])&&sizeof($t['page_children'])){
								$tags=$t['page_children'];
								$tags[]=$filter['category'];
							}else{
								$tags[]=$filter['category'];
							}
							$pipeline[0]['$match']['$and'][]=array(
								'tags'=>array('$in'=>$tags)
							);
						}else{
							return array('error'=>'invalid_category_selection');
						}
					}
				}
				//die(json_encode($pipeline));
				if(isset($pipeline)){
					$pipeline[0]=db2::filterLocationPipeline($pipeline[0],$filter,array(
						'key'=>'point',
						'distanceField'=>'dist.calculated'
					));
				}
				if(isset($filter['category'])&&$filter['category']!='root'){
					//die(json_encode($pipeline));
					$pipeline[]=array(
						'$project'=>array(
							'id'=>1,
							'name'=>1,
							'pic'=>1,
							'background'=>1,
							'privacy'=>1,
							'callout'=>1,
							'pagetype'=>1
						)
					);
					$pipeline[]=array(
						'$sort'=>array('_id'=>-1)
					);
					$pipeline[]=array(
						'$limit'=>$limit
					);
					$data=db2::atoList(db2::aggregate(phi::$conf['dbname'], 'page',$pipeline));
				}
			}else{
				$data=false;
			}
			if((!isset($r['qs']['last'])||!$r['qs']['last'])&&(!isset($r['qs']['after'])||!$r['qs']['after'])){//first load!
				include_once(ROOT.'/sites/code/module/browser/browser.php');
				$data['extra']['categories']=browser::load(array(
					'qs'=>array(
						'type'=>'page',
						'page'=>(isset($filter['category']))?$filter['category']:'root',
						'enableBlank'=>true
					)
				));
				//add counts!
				$data['extra']['categories']=self::addCategoryCounts($r,$pipeline,$data['extra']['categories']);
			}
			return array('success'=>true,'data'=>$data);
		}
		public static function addCategoryCounts($r,$pipeline,$data){
			//1 aggregation command!
			//return $data;
			if(isset($data['data']['children']['order'])){
				$cpipeline[]=$pipeline[0];//all filtering happens in first stage
				//now group and match!
				$taginfo=db2::toList(db2::find(phi::$conf['dbname'],'tags',array('id'=>array('$in'=>$data['data']['children']['order'])),array('projection'=>array('page_children'=>1,'id'=>1))));
				$proj=array(
					'id'=>1,
					'name'=>1,
					'pic'=>1,
					'background'=>1,
					'privacy'=>1,
					'callout'=>1,
					'pagetype'=>1
				);
				foreach ($taginfo as $k => $v) {
					if(isset($ttags)) unset($ttags);
					if(isset($v['page_children'])) $ttags=$v['page_children'];
					$ttags[]=$v['id'];
					$key='counts.'.$v['id'];
					$ks[]=$v['id'];
					$proj[$key]=array(
						'$cond'=>array(
							'if'=>array(
								'$gt'=>array(array('$size'=>array('$setIntersection'=>array(array('$ifNull'=>array('$tags',array())),$ttags))),0)
							),
							'then'=>1,
							'else'=>0
						)
					);
				}
				//die(json_encode($proj));
				$cpipeline[]=array(
					'$project'=>$proj
				);
				foreach ($ks as $k => $v) {
					$group[$v]=array('$sum'=>'$counts.'.$v);
				}
				$group['all_pages']=array('$sum'=>1);
				$group['_id']=null;
				//die(json_encode($group));
				$cpipeline[]=array(
					'$group'=>$group
				);
				$cdata=db2::aggregate(phi::$conf['dbname'], 'page',$cpipeline);
				if(isset($cdata[0])){
					$td=$cdata[0];
					unset($td['_id']);
					$data['data']['counts']=$td;
				}
			}
			return $data;
		}
		public static function deletePermission($r){
			$d=phi::ensure($r,array('id'),1,array('loggedin'));
			if(!self::hasPermission($r,array('page::admin'))) return array('error'=>'invalid_permissions');
			db2::remove(phi::$conf['dbname'],'permission',array('id'=>$d['id']));
			return array('success'=>true);
		}
		public static function listPermissions($r){
			$d=phi::ensure($r,array(),1,array('loggedin'));
			if(!self::hasPermission($r,array('page::admin'))) return array('error'=>'invalid_permissions');
			$q=array(
				'identity'=>array('$nin'=>array('members','admins','custom')),
				'page.id'=>self::$page
			);
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				$q['_id']=array('$lt'=>db2::toId($r['qs']['last']));
			}
			$data=db2::toOrderedList(db2::find(phi::$conf['dbname'],'permission',$q,array('sort'=>array('_id'=>-1))));
			$data=db2::graph(phi::$conf['dbname'],$data,array(
				'identity'=>array(
					'coll'=>'user',
					'to'=>'identity',
					'filter'=>array('id','name','pic'),
					'match'=>'id'
				),
				'page.id'=>array(
					'coll'=>'page',
					'to'=>'page.data',
					'filter'=>array('id','name','pic'),
					'match'=>'id'
				)
			));
			if($data){
				foreach ($data['list'] as $k => $v) {
					$data['list'][$k]['identity']=array(
						'id'=>$v['identity']['id'],
						'type'=>'user',
						'data'=>$v['identity']
					);
				}
			}
			return array('success'=>true,'data'=>$data);
		}
		public static function updatePermission($r){
			$d=phi::ensure($r,array('id','type'),1,array('loggedin'));
			if(!self::hasPermission($r,array('page::admin'))) return array('error'=>'invalid_permissions');
			$set=array(
				'id'=>self::$page.'_'.$d['id'],
				'identity'=>$d['type'],
				'page'=>array(
					'id'=>self::$page,
					'type'=>'page'
				),
				'scopes'=>array('page::write::'.$d['id'])
			);
			db2::update(phi::$conf['dbname'],'permission',array('id'=>$set['id']),array('$set'=>$set),array('upsert'=>true));
			db2::update(phi::$conf['dbname'],'page_settings',array('id'=>self::$page),array('$set'=>array('permissions.'.$d['id']=>$d['type'])),array('upsert'=>true));
			return array('success'=>true,'data'=>db2::findOne(phi::$conf['dbname'],'page_settings',array('id'=>self::$page),array('projection'=>array('permissions'=>1))));
		}
		public static function calendar($r){
			$d=phi::ensure($r,array(),1,array());
			//if(!self::hasPermission($r,array('page::member'))) return array('error'=>'invalid_permissions');
			if(!isset($r['qs']['type'])) $r['qs']['type']='list';
			if($r['qs']['type']=='list'){
				$q=array('page.id'=>self::$page);
				if(isset($r['qs']['past'])&&$r['qs']['past']){
					$sort=-1;
					$sign='$lt';
				}else{
					$sort=1;
					$sign='$tt';
				}
				if(isset($r['qs']['last'])){
					$q['start']=array($sign=>(int) $r['qs']['last']);
				}
				$data=db2::toOrderedList(db2::find(phi::$conf['dbname'],'event',$q,array('sort'=>array('start'=>$sort))),false,true,'id','start');
				$data=db2::graph(phi::$conf['dbname'],$data,array(
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
							'page'=>array(
								'coll'=>'page',
								'match'=>'id',
								'clearOnNull'=>true,
								'fields'=>array('id'=>1,'name'=>1,'pic'=>1)
							)
						)
					)
				));
			}else{
				$q=array('page.id'=>self::$page,'start'=>array('$gte'=>(int) $d['range']['start'],'$lte'=>(int) $d['range']['end']));
				$data=db2::toOrderedList(db2::find(phi::$conf['dbname'],'event',$q,array('projection'=>array('id'=>1,'name'=>1,'start'=>1,'end'=>1))));
			}
			return array('success'=>true,'data'=>$data);
		}
		public static function onboard($r){
			if(!isset($r['qs']['request'])) return array('success'=>true);
			$d=phi::ensure($r,array('request'),1,array('loggedin'));
			if(isset($d['request']['threads'])){
				foreach ($d['request']['threads'] as $k => $v) {
					$nr=$r;
					$nr['qs']=array(
						'id'=>$v,
						'follow'=>1
					);
					self::threadFollow($nr,1);
				}
			}
			return array('success'=>true);
		}
		public static function events($r){
			$d=phi::ensure($r,array('search'));
			$q=array('page.id'=>self::$page);
			$regex = new MongoDB\BSON\Regex($d['search'],'i');
			$q['name']=$regex;
			$data=db2::toOrderedList(db2::find(phi::$conf['dbname'],'event',$q,array('limit'=>8)));
			$data=db2::graph(phi::$conf['dbname'],$data,array(
				'venue'=>array(
					'coll'=>'schedule_venue',
					'to'=>'venue_info',
					'match'=>'id'
				)
			));
			return array('success'=>true,'data'=>$data);
		}
		public static function contentList($r){
			$d=phi::ensure($r,array('type'));
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				$q['_id']=array('$lt'=>db2::toId($r['qs']['last']));
				//$q['tsu']=array('$lt'=>db2::tsToTime($l['tsu']['$date'],false));
			}
			$q['page.id']=self::$page;
			$q['type']=$d['type'];
			if(isset($r['qs']['after'])&&$r['qs']['after']){
				$q['_id']=array('$gt'=>db2::toId($r['qs']['after']));
				//$q['tsu']=array('$gt'=>db2::tsToTime($a['tsu']['$date'],false));
			}
			$opts=array('sort'=>array('_id'=>-1));
			if(isset($r['qs']['max'])){
				$max=(int) $r['qs']['max'];
			}
			if(!isset($max)||!$max) $max=10;
			#die(json_encode($q));
			$data=db2::toOrderedList(db2::find(phi::$conf['dbname'],'page_content',$q,$opts),false,true,'id');
			return array('success'=>true,'data'=>$data);
		}
		public static function schedule($r){
			//validate that it is visible
			$p=db2::findOne(phi::$conf['dbname'],'page',array('id'=>self::$page));
			$ps=db2::findOne(phi::$conf['dbname'],'page_settings',array('id'=>self::$page));
			if(!$p) return array('error'=>'invalid_page');
			if(!isset($ps['schedule_live'])||!(int)$ps['schedule_live']){//not live yet, let load
				if(!in_array($r['auth']['uid'], $p['admins'])){
					return array('error'=>'Schedule Not Live Yet!');
				}
			}
			$data=db2::toOrderedList(db2::find(phi::$conf['dbname'],'event',array('page.id'=>self::$page,'schedule'=>1),array('sort'=>array('start'=>1))),array('id','name','pic','start','end','venue'));
			$out['events']=$data;
			$out['venues']=db2::toList(db2::find(phi::$conf['dbname'],'schedule_venue',array('page.id'=>self::$page)),false,'id');
			$ps=db2::findOne(phi::$conf['dbname'],'page_settings',array('id'=>self::$page));
			$out['venueOrder']=(isset($ps['venue_order']))?$ps['venue_order']:false;
			//add in RSVP's
			$regex = new MongoDB\BSON\Regex('^'.self::$page);
			$q=array('eid'=>$regex,'uid'=>$r['auth']['uid']);
			$out['rsvps']=db2::toList(db2::find(phi::$conf['dbname'],'event_rsvp',$q),array('rsvp'),'eid');
			$out['timezone']='America/Denver';//hack for now, should be in event settings!
			//still need tag/filters/venues
			return array('success'=>true,'data'=>$out);
		}
		public static function rideshare($r){
			$d=phi::ensure($r,array('type'));
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				$l=db2::findOne(phi::$conf['dbname'],'rideshare',array('_id'=>db2::toId($r['qs']['last'])));
				if(!$l) return array('error'=>'invalid_last_post');
				$q['_id']=array('$lt'=>db2::toId($l['_id']));
				//$q['tsu']=array('$lt'=>db2::tsToTime($l['tsu']['$date'],false));
			}
			$q['page.id']=self::$page;
			$q['type']=$d['type'];
			if(isset($r['qs']['after'])&&$r['qs']['after']){
				$a=db2::findOne(phi::$conf['dbname'],'rideshare',array('_id'=>db2::toId($r['qs']['after'])));
				if(!$a) return array('error'=>'invalid_after_post');
				$q['_id']=array('$gt'=>db2::toId($a['_id']));
				//$q['tsu']=array('$gt'=>db2::tsToTime($a['tsu']['$date'],false));
			}
			$opts=array('sort'=>array('_id'=>-1));
			if(isset($r['qs']['max'])){
				$max=(int) $r['qs']['max'];
			}
			if(!isset($max)||!$max) $max=10;
			$data=db2::toOrderedList(db2::find(phi::$conf['dbname'],'rideshare',$q,$opts),false,true,'id');
			//die(json_encode($schema['graph']));
			$data=db2::graph(phi::$conf['dbname'],$data,array(
				'destination.id'=>array(
					'coll'=>'place',
					'to'=>'destination.info',
					'match'=>'id'
				),
				'departure_location.id'=>array(
					'coll'=>'place',
					'to'=>'departure_location.info',
					'match'=>'id'
				),
				'uid'=>array(
					'coll'=>'user',
					'to'=>'user_info',
					'match'=>'id',
					'fields'=>array('id'=>1,'name'=>1,'pic'=>1)
				),
				'page.id'=>array(
					'coll'=>'page',
					'to'=>'page.data',
					'match'=>'id',
					'fields'=>array('id'=>1,'name'=>1,'pic'=>1,'url_name'=>1)
				)
			));
			return array('success'=>true,'data'=>$data);
		}
		public static function claim($r){
			$d=phi::ensure($r,array(),1,array('self::write::page'));
			$p=db2::findOne(phi::$conf['dbname'],'page',array('id'=>self::$page));
			if(!$p) return array('error'=>'invalid_page');
			$plan=db2::findOne(phi::$conf['dbname'],'plan',array('id'=>$p['uid']));
			if(!isset($plan['hasClaim'])) return array('error'=>'You do not have a claim to this page.');
			//claim!
			db2::update(phi::$conf['dbname'],'plan',array('id'=>$p['uid']),array('$unset'=>array('hasClaim'=>1),'$addToSet'=>array('pages'=>self::$page)));
			return array('success'=>true);
		}
		public static function threadFollows($r){
			$d=phi::ensure($r,array('id'),1,array('self::read::page'));
			if(!isset($r['qs']['max'])||!$r['qs']['max']) $r['qs']['max']=12;
			$r['qs']['max']=(int) $r['qs']['max'];
			$q=array('cid'=>$d['id']);
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				$q['_id']=array('$gt'=>db2::toId($r['qs']['last']));
			}
			if(isset($r['qs']['after'])&&$r['qs']['after']){
				$q['_id']=array('$lt'=>db2::toId($r['qs']['after']));
			}
			#die(json_encode($q));
			$data=db2::toOrderedList(db2::find(phi::$conf['dbname'],'chat_group_follow',$q,array('sort'=>array('_id'=>1),'limit'=>$r['qs']['max'])),false,true,'id');
			$data=db2::graph(phi::$conf['dbname'],$data,array(
				'uid'=>array(
					'coll'=>'user',
					'to'=>'user',
					'match'=>'id',
					'filter'=>array('id','name','pic')
				)
			));
			return array('success'=>true,'data'=>$data);
		}
		public static function decline($r){
			phi::ensure($r,array(),1,array('self::write::page'));
			db2::remove(phi::$conf['dbname'],'page_invite',array('page'=>self::$page,'id'=>$r['auth']['uid']));
			return array('success'=>true);
		}
		public static function members($r){
			if(!isset($r['qs']['max'])||!$r['qs']['max']) $r['qs']['max']=12;
			$r['qs']['max']=(int) $r['qs']['max'];
			//$q=array('page'=>self::$page);
			if(isset($r['qs']['filter'])){
				$filter=$r['qs']['filter'];
			}else{
				$filter=false;
			}
			if(!isset($filter['sort'])) $filter['sort']='recent';
			if($filter['sort']=='recent'){
				if(isset($r['qs']['last'])&&$r['qs']['last']){
					$q['_id']=array('$lt'=>db2::toId($r['qs']['last']));
				}
				if(isset($r['qs']['after'])&&$r['qs']['after']){
					$q['_id']=array('$gt'=>db2::toId($r['qs']['after']));
				}
			}
			#die(json_encode($q));
			$pf=db2::findOne(phi::$conf['dbname'],'page_follows',array('id'=>self::$page));
			if(isset($pf['following'])){
				$q['id']=array('$in'=>$pf['following']);
				$pq=array(
					'$match'=>$q
				);
				$pipeline[]=db2::filterLocationPipeline($pq,$filter,array(
					'key'=>'loc_city',
					'limit'=>100000,
					'distanceField'=>'dist.calculated'
				));
				if(isset($filter['skills'])){
					$pipeline[]=array(
						'$lookup'=>array(
							'from'=>'user_tags',
							'localField'=>'id',
							'foreignField'=>'id',
							'as'=>'taginfo'
						)
					);
					$pipeline[]=array(
						'$unwind'=>'$taginfo'
					);
					//first and and then unwind
					$pipeline[]=array(
						'$match'=>db2::buildTagQuery('taginfo.skills',$filter['skills']['order'])
					);
				}
				$pipeline[]=array(
					'$project'=>array('id'=>1,'name'=>1,'pic'=>1,'dist'=>1)
				);
				if($filter['sort']=='mutual'||true){//add in mutual friends to the result for filtering
					//add in mutual friends count info
					$pipeline[]=array(
						'$lookup'=>array(
							'from'=>'user_friends',
							'localField'=>'id',
							'foreignField'=>'id',
							'as'=>'friendinfo'
						)
					);
					$pipeline[]=array(
						'$unwind'=>array(
							'path'=>'$friendinfo',
							'preserveNullAndEmptyArrays'=>true
						)
					);
					$fl=db2::findOne(phi::$conf['dbname'],'user_friends',array('id'=>$r['auth']['uid']));
					if($fl) $friendlist=$fl['friends'];
					else $friendlist=array();
					$project=array(
						'id'=>1,
						'name'=>1,
						'pic'=>1,
						'dist'=>1,
						'mutual'=>array(
							'$cond'=>array(
								'if'=>array('$isArray'=>'$friendinfo.friends'),
								'then'=>array('$size'=>array('$setIntersection'=>array('$friendinfo.friends',$friendlist))),
								'else'=>0
							)
						)
					);
					$pipeline[]=array(
						'$project'=>$project
					);
				}
				switch($filter['sort']){
					case 'closest':
						$pipeline[]=array(
							'$sort'=>array('dist.calculated'=>-1,'_id'=>-1)
						);
						if(isset($r['qs']['last'])&&$r['qs']['last']){
							$pipeline[]=array(
								'$skip'=>(int) $r['qs']['last']
							);
						}
					break;
					case 'mutual':
						$pipeline[]=array(
							'$sort'=>array('mutual'=>-1,'_id'=>-1)
						);
						if(isset($r['qs']['last'])&&$r['qs']['last']){
							$pipeline[]=array(
								'$skip'=>(int) $r['qs']['last']
							);
						}
					break;
					default:
						$pipeline[]=array(
							'$sort'=>array('_id'=>-1)
						);
					break;
				}
				$pipeline[]=array(
					'$limit'=>$r['qs']['max']
				);
				#die(json_encode($filter));
				$data=db2::aToList(db2::aggregate(phi::$conf['dbname'],'user',$pipeline));
				if(isset($filter['sort'])&&$filter['sort']!='recent'){
					$data['last']=0;
					if(isset($r['qs']['last'])) $data['last']=(int) $r['qs']['last'];
					if(isset($data['order'])) $data['last']+=sizeof($data['order']);
				}
			}else{
				$data=false;
			}
			// $data=db2::toOrderedList(db2::find(phi::$conf['dbname'],'page_follow',$q,array('sort'=>array('_id'=>1),'limit'=>$r['qs']['max'])),false,true,'id','_id');
			// $data=db2::graph(phi::$conf['dbname'],$data,array(
			// 	'uid'=>array(
			// 		'coll'=>'user',
			// 		'to'=>'user',
			// 		'match'=>'id',
			// 		'filter'=>array('id','name','pic')
			// 	)
			// ));
			return array('success'=>true,'data'=>$data);
		}
		public static function invite($r){
			$d=phi::ensure($r,array(),1,array('loggedin'));
			$p=db2::findOne(phi::$conf['dbname'],'page',array('id'=>self::$page));
			if(!$p) return array('error'=>'invalid_page');
			$action=array(
				'type'=>'addToPage',
				'uid'=>$r['auth']['uid'],
				'data'=>array(
					'id'=>self::$page
				)
			);
			$link='https://'.phi::$conf['domain'].'?referal='.$r['auth']['uid'].'&load='.urlencode('/page/'.self::$page).'&action='.urlencode(http_build_query($action));
			if(isset($r['qs']['users'])&&sizeof($r['qs']['users'])){
				//send notification to users
				$l=db2::toList(db2::find(phi::$conf['dbname'],'page_follow',array('page'=>self::$page,'uid'=>array('$in'=>$r['qs']['users']))),false,'uid');
				if($l){
					$us=array_keys($l);
				}else{
					$us=array();
				}
				foreach ($r['qs']['users'] as $k => $v) {
					//ensure they arent already in the group!
					if(!in_array($v, $us)) NECTAR::notify($r['auth']['uid'],$v,'group_invite_internal',array('id'=>self::$page));
					$add[]=array(
						'id'=>$v,
						'page'=>self::$page,
						'invited_by'=>$r['auth']['uid']
					);
				}
				//bulk add invites
				db2::bulkInsert(phi::$conf['dbname'],'page_invite',$add); 
			}
			if(isset($r['qs']['emails'])&&sizeof($r['qs']['emails'])){
				foreach ($r['qs']['emails'] as $k => $v) {
					NECTAR::sendEmail($r['auth']['uid'],false,'group_invite',array('page'=>$p,'join_link'=>$link),false,$v);
				}	
			}
			return array('success'=>true);
		}
		public static function resources($r){
			$d=phi::ensure($r,array());
			if(!isset($r['qs']['max'])||!$r['qs']['max']) $r['qs']['max']=12;
			$r['qs']['max']=(int) $r['qs']['max'];
			$q=array('page.id'=>self::$page);
			if(isset($r['qs']['after'])&&$r['qs']['after']){
				$q['_id']=array('$gt'=>db2::toId($r['qs']['after']));
			}
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				$q['_id']=array('$lt'=>db2::toId($r['qs']['last']));
			}
			$data=db2::toOrderedList(db2::find(phi::$conf['dbname'],'resource',$q,array('sort'=>array('_id'=>-1),'limit'=>$r['qs']['max'])),false,true,'id','_id');
			$data=db2::graph(phi::$conf['dbname'],$data,array(
				'page.id'=>array(
					'coll'=>'page',
					'to'=>'page.data',
					'match'=>'id',
					'filter'=>array('id','name','pic')
				)
			));
			return array('success'=>true,'data'=>$data);
		}
		public static function threads($r){
			$d=phi::ensure($r,array());
			if(!isset($r['qs']['max'])||!$r['qs']['max']) $r['qs']['max']=12;
			$r['qs']['max']=(int) $r['qs']['max'];
			if(isset($r['qs']['last'])&&$r['qs']['last']){

			}
			if(isset($r['qs']['after'])&&$r['qs']['after']){

			}
			$data=db2::toOrderedList(db2::find(phi::$conf['dbname'],'chat_group',array('page'=>self::$page,'thread'=>1),array('sort'=>array('tsu'=>-1),'limit'=>$r['qs']['max'])));
			return array('success'=>true,'data'=>$data);
		}
		public static function isMember($uid){
			if(db2::findOne(phi::$conf['dbname'],'page_follow',array('uid'=>$uid,'page'=>self::$page))) return true;
			return false;
		}
		public static function threadFollow($r,$internal=false){
			include_once(ROOT.'/sites/code/app/chat/chat.php');
			$d=phi::ensure($r,array('id','follow'),1,array('self::write::chat'));
			//ensure they are a member of the page!
			if(!self::isMember($r['auth']['uid'])) return array('error'=>'Must be member of this page to join or leave this thread');
			$d['follow']=(int)$d['follow'];
			$id=$d['id'].'_'.$r['auth']['uid'];
			$nr=$r;
			if($d['follow']){
				$nr['qs']=array(
					'add'=>array($r['auth']['uid']),
					'id'=>$d['id']
				);
				chat::updateChat($nr);
				//db2::update(phi::$conf['dbname'],'chat_group_follow',array('id'=>$id),array('$set'=>array('id'=>$id,'cid'=>$d['id'],'uid'=>$r['auth']['uid'])),array('upsert'=>true));
				// db2::update(phi::$conf['dbname'],'chat_group',array('id'=>$d['id']),array('$addToSet'=>array('people'=>$r['auth']['uid'])));
			}else{
				//db2::remove(phi::$conf['dbname'],'chat_group_follow',array('id'=>$id));
				$nr['qs']=array(
					'remove'=>array($r['auth']['uid']),
					'id'=>$d['id']
				);
				chat::updateChat($nr);
				//db2::update(phi::$conf['dbname'],'chat_group',array('id'=>$d['id']),array('$pullAll'=>array('people'=>array($r['auth']['uid']))));
				//
			}
			if(!$internal) $data=db2::findOne(phi::$conf['dbname'],'chat_group',array('id'=>$d['id']));
			else $data=false;
			//$data['total']=db2::count(phi::$conf['dbname'],'chat_group_follow',array('cid'=>$d['id']));
			return array('success'=>true,'data'=>$data);
		}
		public static function loadThread($r){
			$d=phi::ensure($r,array('id'));
			$data=db2::findOne(phi::$conf['dbname'],'chat_group',array('id'=>$d['id']));
			if(!$data) return array('error'=>'invalid_thread');
			return array('success'=>true,'data'=>$data);
		}
		public static function updateThread($r){
			$d=phi::ensure($r,array('thread'),1,array('self::write::chat'));
			$d['thread']['page']=self::$page;
			$d['thread']['tsu']=db2::tsToTime(time());
			$d['thread']['thread']=1;
			if(!isset($d['thread']['id'])){//creating a thread!
				#phi::log($d['thread']);
				#die(json_encode($d));
				$d['thread']['people'][]=$r['auth']['uid'];
				$resp=NECTAR::save('chat_group',$d['thread']);
				$id=$resp['id'];
				$tid=$id.'_'.$r['auth']['uid'];
				db2::update(phi::$conf['dbname'],'chat_group_follow',array('id'=>$tid),array('$set'=>array('id'=>$tid,'cid'=>$id,'uid'=>$r['auth']['uid'])),array('upsert'=>true));
				//add 
				//notify all members of group of the new thread!
				//get members and notify! [ASYNC]
				$l=db2::toList(db2::find(phi::$conf['dbname'],'page_follow',array('page'=>self::$page)),false,'uid');
				if($l){
					$uids=array_keys($l);
					foreach ($uids as $k => $v) {
						if($r['auth']['uid']!=$v) NECTAR::notify($r['auth']['uid'],$v,'new_group_thread',array('page'=>self::$page,'thread'=>$id));
					}
				}
			}else{//updating
				NECTAR::update('chat_group',array('id'=>$d['thread']['id']),$d['thread']);
				$id=$d['thread']['id'];
			}
			phi::push('',self::$page,array('type'=>'updateMenu','data'=>self::load($r,true),'uuid'=>(isset($r['qs']['uuid']))?$r['qs']['uuid']:''));
			//die(json_encode($d['thread']));
			return array('success'=>true,'thread'=>db2::findOne(phi::$conf['dbname'],'chat_group',array('id'=>$id)));
		}
		public static function hasPermission($r,$scopes,$pid=false){
			if(!self::$page) self::$page=$pid;
			//phi::time('page:hasPermission');
			$p=db2::findOne(phi::$conf['dbname'],'page',array('id'=>self::$page));
			if(!$p) return true;//doesnt exist yet, let anyone create!
			if(in_array($r['auth']['uid'], $p['admins'])){//admin Q
				return true;
				if(in_array('page::admin', $scopes)) return true;
				$qs[]=array(
					'page.id'=>self::$page,
					'identity'=>'admins',
					'scopes'=>array('$in'=>$scopes)
				);
				$qs[]=array(
					'page.id'=>self::$page,
					'identity'=>'admins',
					'scopes'=>array('*')
				);
			}
			if(ONE_CORE::isSteward($r['auth']['uid'])) return true;
			return false;
			if(in_array('page::admin', $scopes)) return false;
			//member q
			if(db2::findOne(phi::$conf['dbname'],'page_follow',array('uid'=>$r['auth']['uid'],'page'=>self::$page))){
				if(in_array('page::member', $scopes)) return true;
				$qs[]=array(
					'page.id'=>self::$page,
					'identity'=>'members',
					'scopes'=>array('$in'=>$scopes)
				);
				$qs[]=array(
					'page.id'=>self::$page,
					'identity'=>'members',
					'scopes'=>array('*')
				);
			}
			if(in_array('page::member', $scopes)) return false;
			$qs[]=array(
				'page.id'=>self::$page,
				'identity'=>$r['auth']['uid'],
				'scopes'=>array('$in'=>$scopes)
			);
			$qs[]=array(
				'page.id'=>self::$page,
				'identity'=>$r['auth']['uid'],
				'scopes'=>array('*')
			);
			#die(json_encode($qs));
			$ret=db2::toList(db2::find(phi::$conf['dbname'],'permission',array('$or'=>$qs)));
			//phi::time('page:hasPermission');
			if($ret) return true;
			return false;
		}
		public static function ensureModulePermissions($modules,$id=false){
			if($id) self::$page=$id;
			$ensure=array('stream','calendar','threads','resources');
			$settings=db2::findOne(phi::$conf['dbname'],'page_settings',array('id'=>self::$page));
			foreach ($modules as $k => $v) {
				if(in_array($v, $ensure)&&!isset($settings['permissions'][$v])){
					$perm=($v=='stream')?'members':'admins';
					$toupdate['$set']['permissions.'.$v]=$perm;//default to admins
					$ud=array(
						'id'=>self::$page.'_'.$v,
						'identity'=>$perm,
						'page'=>array(
							'id'=>self::$page,
							'type'=>'page'
						),
						'scopes'=>array('page::write::'.$v)
					);
					$update[]=array(array('id'=>$ud['id']),array('$set'=>$ud),array('upsert'=>true));
				}
			}
			if(isset($settings['permissions'])){
				foreach ($settings['permissions'] as $k => $v) {
					if(!in_array($k, $modules)){
						$toremove[]=self::$page.'_'.$k;
					}
				}
			}
			$changed=0;
			if(isset($toupdate)){
				phi::log('update page_settings '.json_encode($toupdate));
				db2::update(phi::$conf['dbname'],'page_settings',array('id'=>self::$page),$toupdate,array('upsert'=>true));
				$changed=1;
			}
			if(isset($toremove)){
				phi::log('toremove permissions '.json_encode($toremove));
				db2::remove(phi::$conf['dbname'],'permission',array('id'=>array('$in'=>$toremove)),1);
				$changed=1;
			}
			if(isset($update)){
				phi::log('set permissions '.json_encode($update));
				db2::bulkUpdate(phi::$conf['dbname'],'permission',$update);
				$changed=1;
			}
			if(!$changed){
				phi::log('no changes to permissions');
			}
		}
		public static function saveSettings($r){
			//die(json_encode($r['qs']));
			$d=phi::ensure($r,array('save'),1,array('loggedin'));
			self::hasPermission($r,array('page::admin'));
			NECTAR::update('page',array('id'=>self::$page),$r['qs']['save']);
			if(isset($d['save']['modules'])){
				self::ensureModulePermissions($d['save']['modules']);
			}
			phi::push('',self::$page,array('type'=>'updateMenu','data'=>self::load($r,true),'uuid'=>(isset($r['qs']['uuid']))?$r['qs']['uuid']:''));
			return array('success'=>true,'data'=>db2::findOne(phi::$conf['dbname'],'page_settings',array('id'=>self::$page),array('projection'=>array('permissions'=>1))));
		}
		public static function savePost($r,$page){
			include_once(ROOT.'/sites/code/app/feed/feed.php');
			$post=$r['qs']['post'];
			if(isset($r['qs']['context'])&&$r['qs']['context']&&$r['qs']['context']!=''){//ensures
				$context=$r['qs']['context'];
			}else{
				$context='post';
			}
			$st=microtime(true);
			if(!isset($post['tags'])) $post['tags']=array();
			if(!isset($post['with'])) $post['with']=array();
			//get inline tags!
			if(!isset($post['message'])) $post['message']='';
			$inline_tags=feed::getInlineTags($post['message']);
			if($inline_tags) $post['tags']=array_merge($post['tags'],$inline_tags);
			//process media!
			if(isset($post['loc']['coordinates'])){
				$post['loc']['coordinates'][0]=(float) $post['loc']['coordinates'][0];
				$post['loc']['coordinates'][1]=(float) $post['loc']['coordinates'][1];
			}
			if(isset($post['location_info'])){
				feed::cacheLocation($post['location'],$post['location_info']);
				unset($post['location_info']);
			}
			$post=feed::processMedia($r,$post);
			$post['tsu']=db2::tsToTime(time());//add tsu
			$new_post=false;
			$update=false;
			$cpost=false;
			if(isset($post['page']['data'])) unset($post['page']['data']);
			if(isset($post['fbid'])){
				//add in ID
				$cpost=db2::findOne(phi::$conf['dbname'],$context,array('fbid'=>$post['fbid']));
				$post['id']=$cpost['id'];//keep id
			}else{
				if(isset($post['id'])) $update=true;
			}
			if($post['tags']) $post['tags']=array_unique($post['tags']);//ensure uniqueness of tags!
			if($update||$cpost){
				if(!$cpost) $cpost=db2::findOne(phi::$conf['dbname'],$context,array('id'=>$post['id']));
				if(!$cpost) return array('error'=>'invalid_post_id');
				if(isset($post['stats'])) unset($post['stats']);
				if(isset($post['user'])) unset($post['user']);
				$_id=$post['_id'];
				$post=NECTAR::update($context,array('id'=>$post['id']),$post);
				$post['_id']=$cpost['_id'];
				if(!isset($cpost['tags'])) $cpost['tags']=array();
				if(!$cpost['tags']) $cpost['tags']=array();
				if(!$cpost['with']) $cpost['with']=array();
				$new=array_values(array_diff($post['tags'],$cpost['tags']));
				$new_with=array_values(array_diff($post['with'],$cpost['with']));
				if(isset($cpost['at'])&&sizeof($cpost['at'])){
					$lastat=array_keys($cpost['at']);
				}else $lastat=array();
				if(isset($post['at'])&&sizeof($post['at'])){
					$curat=array_keys($post['at']);
				}else $curat=array();
				$new_at=array_values(array_diff($curat,$lastat));
				if(!sizeof($new_at)) $new_at=false;
			}else{
				if($context=='app_feedback'||$context=='support'){
					$post['status']='open';
					//assign it!
					if($context=='app_feedback') $post['with']=array('UC9QP6XFW','U9LASX1KG');//head(s) of feedback
					$post['ua_info']=phi::getUAInfo();
				}
				$post=NECTAR::save($context,$post);
				if(isset($post['qotd'])){
					db2::update(phi::$conf['dbname'],'qotd',array('id'=>$post['qotd']),array('$inc'=>array('responses'=>1)));
				}
				//notify the to if another user!
				$new=$post['tags'];
				$new_with=$post['with'];
				$new_post=true;
				if(isset($post['at'])&&sizeof($post['at'])){
					$new_at=array_keys($post['at']);
				}else $new_at=false;
			}
			$post['vote_stats']=feed::ensureTags($r,$post,$new,$context);
			if($new_with){
				foreach ($new_with as $k => $v) {
					if($context=='app_feedback'){
						$tk='feedback_assign';
						NECTAR::notify(ADMIN_UID,$v,$tk,array('post_id'=>$post['id']));
					}else{
						// $tk='post_with';
						// NECTAR::notify($r['auth']['uid'],$v,$tk,array('post_id'=>$post['id']));
						// $skip[]=$v;
					}
				}
			}
			if($new_at){}
			if($new_post){//notify
				//notify people in group!
				if(!isset($skip)) $skip=false;
				$msg=array(
					'from'=>$post['by']['id'],//can be on behalf of
					'from_data'=>NECTAR::getUser($post['by']['id']),
					'skip'=>$skip,
					'broadcast'=>false,
					'type'=>'post_added',
					'page'=>$post['page']['id'],
					'data'=>array(
						'post_id'=>$post['id']
					)
				);
				phi::log($msg);
				db2::save(phi::$conf['dbname'],'broadcast',$msg);
			}
			$post['stats']=feed::calcStats($post,$context);//will update and cache
			//add important info
			//$post['user']=NECTAR::getUser($post['by']['id']);
			#die(json_encode($post));
			//add in proper data as whole post!
			$postlist=feed::addFeedData($r,array('order'=>array($post['id']),'list'=>array($post['id']=>$post)));
			$post=$postlist['list'][$post['id']];
			if(isset($r['qs']['channel'])){
				$channel=$r['qs']['channel'];
				phi::push('',$channel,array('type'=>'post','post'=>$post));//utilize web sockets to send update directly!
			}
			$et=microtime(true);
			$td=($et-$st)*1000;
			$diff=round($td,2);
			$diff2=round(($et-$st),4);
			phi::log('post time: ['.$diff.'] ms ['.$diff2.'] seconds');
			//$postlist=feed::addFeedData($r,array('order'=>array($post['id']),'list'=>array($post['id']=>$post)));
			//$post=$postlist['list'][$post['id']];
			return array('success'=>true,'data'=>$post,'post_id'=>$post['id']);
		}
		public static function newThreadComment($r,$comment=false){//from a chat!
			$d=phi::ensure($r,array(),1,array('self::write::chat'));
			include_once(ROOT.'/sites/code/app/chat/chat.php');
			if(!isset($r['qs']['id'])) return array('error'=>'invalid_id');
			if(!isset($r['qs']['from'])) return array('error'=>'invalid_from');
			chat::setRead(array('auth'=>$r['auth'],'qs'=>array('identity'=>$r['qs']['from'],'id'=>$r['qs']['from'].'_'.$r['qs']['id'],'last'=>$r['qs']['comment_id'],'room'=>$r['qs']['id'],'nopush'=>true)));
			$group=db2::findOne(phi::$conf['dbname'],'chat_group',array('id'=>$r['qs']['id']));
			if(!$group){//autocreate
				return array('error'=>'invalid_chat');
			}
			if(!isset($group['people'])) $group['people']=array();
			if(!in_array($r['qs']['from'], $group['people'])){//add person to following for this chat
				db2::update(phi::$conf['dbname'],'chat_group',array('id'=>$r['qs']['id']),array('$set'=>array('tsu'=>db2::tsToTime(time())),'$addToSet'=>array('people'=>array('$each'=>array($r['qs']['from'])))));
			}
			//phi::log($group);
			//touch chat for all
			if(!$comment){
				$comment=db2::findOne(phi::$conf['dbname'],'chat',array('_id'=>db2::toId($r['qs']['comment_id'])));
				$comment['_id']=(string) $comment['_id']['$oid'];
			}
			if(isset($comment['parent'])){
				$p=db2::findOne(phi::$conf['dbname'],'chat',array('_id'=>db2::toId($comment['parent'])));
				$notify=(isset($p['notify'])&&$p['notify'])?$p['notify']:array();
				if(!in_array($p['by'], $notify)) $notify[]=$p['by'];
				#phi::log('user this! '.json_encode($people));
			}else{
				$notify=$group['people'];
			}
			$notify=array_values(array_diff($notify,array($r['qs']['from'])));
			foreach ($group['people'] as $k => $v){
				//send user notice that chat order has changed!
				if($r['qs']['from']!=$v){//send to everybody else but the person who sent!
					//puuuuush!
					//set unread counts for people in chat!
					$last=db2::findOne(phi::$conf['dbname'],'lastread',array('id'=>$v.'_'.$group['id']));
					$q=array('room'=>$r['qs']['id']);
					if($last) $q['_id']=array('$gt'=>db2::toId($last['last']));
					$unread=db2::count(phi::$conf['dbname'],'chat',$q);
					$badges=NECTAR::getPushCount($v,array('chat'=>array($r['qs']['id']=>$unread)));
					$to[]=$v;
				}
				//always do this part!
				chat::touchChat($v,$group['id']);
			}
			$from=NECTAR::getUser($r['qs']['from']);
			$page=db2::findOne(phi::$conf['dbname'],'page',array('id'=>$group['page']));
			$title=$page['name'].' > '.$group['name'];
			#phi::log('notify: '.json_encode($notify));
			if(isset($notify)){
				$bc=NECTAR::getUserBadgeCount($notify);
				foreach ($notify as $k => $v) {
					$count=0;
					if(isset($bc[$v])) $count+=$bc[$v];
					self::sendThreadPush($v,$r['qs']['from'],$group['id'],'chat',$r['qs']['comment_id'],$count,$title);
				}
			}
			$comment['content']=chat::getPreviewContent($comment);
			$set=array('last'=>phi::keepFields($comment,array('_id','content','by')),'tsu'=>db2::tsToTime(time()));
			db2::update(phi::$conf['dbname'],'chat_group',array('id'=>$r['qs']['id']),array('$set'=>$set));
			return array('success'=>true);
		}
		public static function sendThreadPush($to_uid,$from_uid,$room,$type,$comment_id,$count,$title){
			$comment=db2::findOne(phi::$conf['dbname'],'chat',array('_id'=>db2::toId($comment_id)));
			$from=NECTAR::getUser($from_uid);
			if(isset($comment['amount'])){
				$msg='Sent you $'.phi::toMoney($comment['amount']);
			}else if(isset($comment['request'])){
				$msg='sent you a friend request!';
			}else if(isset($comment['added'])){
				$msg='added you as a friend!';
			}else if(isset($comment['attachment'])){
				if(isset($comment['attachment']['context'])){
					switch ($comment['attachment']['context']) {
						case 'post':
							$msg='shared a post!';
						break;
						case 'event':
							$msg='shared an event!';
						break;
						case 'post_response':
							$msg='messaged about a post!';
						break;
						case 'connect_response':
							$msg='messaged about a connect post!';
						break;
						default:
							$msg='shared an attachment with you!';
						break;
					}
				}else{
					switch ($comment['attachment']['type']) {
						case 'tags':
							$msg='sent a connectin request';
							$message='Connectin Request!';
						break;
					}
				}
			}else if(isset($comment['denied'])){
				return false;//dont send any push here for that...
			}else if(isset($comment['canceled'])){
				return false;//dont send any push here for that...
			}else if(isset($comment['content'])&&$comment['content']){
				$msg=phi::limitLength($comment['content'],150);
			}else{
				if(isset($comment['media'])){
					if($comment['media']['type']=='images'){
						if(sizeof($comment['media']['data'])==1){
							$msg='Sent an image';
						}else{
							$msg='Sent '.sizeof($comment['media']['data']).' images';
						}
					}
				}
			}
			$devices=db2::toList(db2::find(phi::$conf['dbname'],'device',array('uid'=>$to_uid)));
			if($devices) phi::sendPush($devices,$from['name'].': '.$msg,'',$count,'',$title,array(
				'app'=>'previewpage',
				'page'=>array('module'=>'chat','data'=>chat::loadPreviewChat($room,$to_uid)),
				'from'=>$from
			),$to_uid,1);
		}
		public static function newComment($r,$comment=false){//from a chat!
			//get chat
			$d=phi::ensure($r,array(),1,array('self::write::chat'));//handles specific perm later
			include_once(ROOT.'/sites/code/app/chat/chat.php');
			if(!isset($r['qs']['id'])) return array('error'=>'invalid_id');
			if(!isset($r['qs']['from'])) return array('error'=>'invalid_from');
			chat::setRead(array('auth'=>$r['auth'],'qs'=>array('id'=>$r['qs']['from'].'_'.$r['qs']['id'],'last'=>$r['qs']['comment_id'],'identity'=>$r['qs']['from'],'room'=>$r['qs']['id'],'nopush'=>true)));
			$group=db2::findOne(phi::$conf['dbname'],'chat_group',array('id'=>$r['qs']['id']));
			$idp=explode('_',$r['qs']['id']);
			if($idp[0][0]=='G') $page=$idp[0];
			else $page=$idp[1];
			if(!$group){//autocreate
				$conn=chat::create(array(
					'auth'=>$r['auth'],
					'qs'=>array(
						'people'=>array($r['qs']['from'],$page),
						'page'=>$page
					)
				));
				$group=$conn['data'];
			}
			//touch chat for all
			if(!$comment){
				$comment=db2::findOne(phi::$conf['dbname'],'chat',array('_id'=>db2::toId($r['qs']['comment_id'])));
				$comment['_id']=(string) $comment['_id']['$oid'];
			}
			foreach ($group['people'] as $k => $v){
				//send user notice that chat order has changed!
				if($r['qs']['from']!=$v){//send to everybody else but the person who sent!
					//puuuuush!
					//set unread counts for people in chat!
					if($v[0]=='U'){
						$last=db2::findOne(phi::$conf['dbname'],'lastread',array('id'=>$v.'_'.$group['id']));
						$q=array('room'=>$r['qs']['id']);
						if($last) $q['_id']=array('$gt'=>db2::toId($last['last']));
						$unread=db2::count(phi::$conf['dbname'],'chat',$q);
						$badges=NECTAR::getPushCount($v,array('chat'=>array($r['qs']['id']=>$unread)));
						self::sendPush($v,$r['qs']['from'],$group['id'],'chat',$r['qs']['comment_id'],$badges['count']);
					}
					if($v[0]=='G'){
						$page=db2::findOne(phi::$conf['dbname'],'page',array('id'=>$v),array('projection'=>array('admins'=>1)));
						$bc=NECTAR::getUserBadgeCount($page['admins']);
						foreach ($page['admins'] as $tk => $tv){
							$last=db2::findOne(phi::$conf['dbname'],'lastread',array('id'=>$v.'_'.$tv.'_'.$group['id']));
							$q=array('room'=>$r['qs']['id']);
							if($last) $q['_id']=array('$gt'=>db2::toId($last['last']));
							$unread=db2::count(phi::$conf['dbname'],'chat',$q);
							$badges=NECTAR::getPushCount($v,array('chat'=>array($r['qs']['id']=>$unread)),1,$tv);
							$count=0;
							if(isset($bc[$tv])) $count=$bc[$tv];
							$count++;
							self::sendPush($v,$r['qs']['from'],$group['id'],'chat',$r['qs']['comment_id'],$count,$tv);
						}
					}
				}
				//always do this part!
				$order=chat::touchChat($v,$group['id']);
			}
			if(isset($comment['media'])){
				if($comment['media']['type']=='images'){
					if(sizeof($comment['media']['data'])==1){
						$comment['content']='Sent an image';
					}else{
						$comment['content']='Sent '.sizeof($comment['media']['data']).' images';
					}
				}
				if($comment['media']['type']=='link'){
					$comment['content']='Sent a link';
				}
			}else if(isset($comment['attachment'])){
				switch ($comment['attachment']['context']) {
					case 'post':
						$comment['content']='Shared a post with you';
					break;
					case 'event':
						$comment['content']='Shared an event with you';
					break;
					case 'post_response':
						$comment['content']='Responded to your post.';
					break;
					case 'connect_response':
						$comment['content']='Responded to your connect post.';
					break;
					default:
						$comment['content']='Shared an attachment with you';
					break;
				}
			}else{
				$comment['content']=phi::limitLength($comment['content'],150);
			}
			$set=array('last'=>phi::keepFields($comment,array('_id','content','by')),'tsu'=>db2::tsToTime(time()));
			db2::update(phi::$conf['dbname'],'chat_group',array('id'=>$r['qs']['id']),array('$set'=>$set));
			return array('success'=>true);
		}
		public static function sendPush($to_uid,$from_uid,$room,$type,$comment_id,$count,$admin_uid=false){
			$comment=db2::findOne(phi::$conf['dbname'],'chat',array('_id'=>db2::toId($comment_id)));
			if($from_uid[0]=='U'){
				$from=NECTAR::getUser($from_uid);
				if($to_uid[0]=='G'){
					$to_info=db2::findOne(phi::$conf['dbname'],'page',array('id'=>$to_uid),array('projection'=>array('id'=>1,'name'=>1,'pic'=>1)));
					$from['name']=$from['name'].' to '.$to_info['name'];
				}
			}else{//page
				$from=db2::findOne(phi::$conf['dbname'],'page',array('id'=>$from_uid),array('projection'=>array('id'=>1,'name'=>1,'pic'=>1)));
			}
			if(isset($comment['content'])) $msg=phi::limitLength($comment['content'],150);
			if(isset($comment['media'])){
				if($comment['media']['type']=='images'){
					if(sizeof($comment['media']['data'])==1){
						$msg='Sent an image';
					}else{
						$msg='Sent '.sizeof($comment['media']['data']).' images';
					}
				}
			}
			//$msg=$from['name'].': '.$msg;
			if($to_uid[0]=='U'){
				$devices=db2::toList(db2::find(phi::$conf['dbname'],'device',array('uid'=>$to_uid)));
				if($devices) phi::sendPush($devices,$msg,'',$count,'',$from['name'],array(
					'app'=>'previewpage',
					'page'=>array('module'=>'chat','data'=>chat::loadPreviewChat($room,$to_uid)),
					'from'=>$from
				),$to_uid);
			}else{
				$devices=db2::toList(db2::find(phi::$conf['dbname'],'device',array('uid'=>$admin_uid)));
				if($devices) phi::sendPush($devices,$msg,'',$count,'',$from['name'],array(
					'app'=>'previewpage',
					'page'=>array('module'=>'chat','data'=>chat::loadPreviewChat($room,$to_uid)),
					'from'=>$from
				),$admin_uid);
			}
		}
		public static function ensureAdmins($r,$diff,$data){
			if(isset($diff['admins']['added'])){
				foreach ($diff['admins']['added'] as $k => $v) {
					//ensure they are members of hte group!
					$u=db2::findOne(phi::$conf['dbname'],'page_follow',array('uid'=>$v,'page'=>$data['id']));
					if(!$u){
						self::follow(array(
							'auth'=>array('uid'=>$v,'scope'=>array('*'))//internal
						),$data['id'],1);
					}
					db2::update(phi::$conf['dbname'],'user',array('id'=>$v),array('$addToSet'=>array('pages'=>$data['id'])));
					//notify!
					if($v!=$r['auth']['uid']){
						NECTAR::notify($r['auth']['uid'],$v,'page_admin_add',array('page'=>$data['id']));
					}
					phi::push($v,'relay',array(
						'type'=>'pageupdate'
					));
				}
			}
			if(isset($diff['admins']['removed'])){
				foreach ($diff['admins']['removed'] as $k => $v) {
					db2::update(phi::$conf['dbname'],'user',array('id'=>$v),array('$pullAll'=>array('pages'=>array($data['id']))));
				}
			}
		}
		public static function follow($r,$page=false,$no_notify=false){
			$d=phi::ensure($r,array(),1,array('self::write::follow'));
			if($page) self::$page=$page;
			$c=db2::findOne(phi::$conf['dbname'],'page',array('id'=>self::$page));
			if(!$c) return array('error'=>'invalid_page');
			if(!isset($c['following'])) $c['following']=0;
			$c['following']++;
			$set=array(
				'id'=>self::$page.'_'.$r['auth']['uid'],
				'uid'=>$r['auth']['uid'],
				'page'=>self::$page
			);
			if(db2::findOne(phi::$conf['dbname'],'page_follow',array('id'=>$set['id']))){
				//phi::log('already following');
				return array('error'=>'already_following');
			}
			db2::update(phi::$conf['dbname'],'user_follow',array('id'=>$r['auth']['uid']),array('$addToSet'=>array('following'=>self::$page)),array('upsert'=>true));
			db2::update(phi::$conf['dbname'],'page_follow',array('id'=>$set['id']),array('$set'=>$set),array('upsert'=>true));
			db2::update(phi::$conf['dbname'],'page_follows',array('id'=>self::$page),array('$addToSet'=>array('following'=>$r['auth']['uid'])),array('upsert'=>true));
			db2::update(phi::$conf['dbname'],'page',array('id'=>self::$page),array('$inc'=>array('following'=>1)));
			if(!$no_notify) NECTAR::notify($r['auth']['uid'],self::$page,'page_follow',array(
				'page'=>self::$page
			));
			return array('success'=>true,'data'=>array('following'=>$c['following'],'is_following'=>db2::findOne(phi::$conf['dbname'],'page_follow',array('id'=>self::$page.'_'.$r['auth']['uid']))));
		}
		public static function removeMember($r){
			$d=phi::ensure($r,array('uid'),1,array());
			$uid=$d['uid'];
			$c=db2::findOne(phi::$conf['dbname'],'page',array('id'=>self::$page));
			if(!$c) return array('error'=>'invalid_page');
			if(!in_array($r['auth']['uid'], $c['admins'])) return array('error'=>'invalid_permissions');
			if(in_array($uid, $c['admins'])){
				if($c['pagetype']=='group'){
					return array('error'=>'Admins cannot be removed from a group, they must first step down as an admin before removal');
				}else{
					return array('error'=>'Admins cannot be removed from a page, they must first step down as an admin before removal');
				}
			}
			//remove from all threads!
			//get theads
			$tthreads=db2::toOrderedList(db2::find(phi::$conf['dbname'],'chat_group',array('page'=>self::$page)));
			if($tthreads){
				$threads=$tthreads['order'];
				$cgf=db2::toList(db2::find(phi::$conf['dbname'],'chat_group_follow',array('uid'=>$d['uid'],'cid'=>array('$in'=>$threads))));
				if($cgf){
					foreach ($cgf as $k => $v) {
						phi::log('remove from chat: '.$v['id']);
						db2::remove(phi::$conf['dbname'],'chat_group_follow',array('id'=>$v['id']));
						db2::update(phi::$conf['dbname'],'chat_group',array('id'=>$v['cid']),array('$pullAll'=>array('people'=>array($uid))));
					}
				}
			}
			//remove follows
			db2::update(phi::$conf['dbname'],'user_follow',array('id'=>$uid),array('$pullAll'=>array('following'=>array(self::$page))));
			db2::update(phi::$conf['dbname'],'page_follows',array('id'=>self::$page),array('$pullAll'=>array('following'=>array($uid))));
			db2::remove(phi::$conf['dbname'],'page_follow',array('id'=>self::$page.'_'.$uid));
			db2::update(phi::$conf['dbname'],'page',array('id'=>self::$page),array('$inc'=>array('following'=>-1)));
			$c['following']--;
			return array('success'=>true,'data'=>array('following'=>$c['following']));
		}
		public static function unfollow($r){
			$d=phi::ensure($r,array(),1,array('self::write::follow'));
			$c=db2::findOne(phi::$conf['dbname'],'page',array('id'=>self::$page));
			if(!$c) return array('error'=>'invalid_page');
			if(in_array($r['auth']['uid'], $c['admins'])){
				if($r['auth']['uid']==$c['uid']){
					if($c['pagetype']=='group'){
						return array('error'=>'The page owner cannot leave a group, they must first step down as the owner before leaving');
					}else{
						return array('error'=>'The page owner cannot unfollow a page, they must first step down as the owner before unfollowing');
					}
				}else{
					db2::update(phi::$conf['dbname'],'page',array('id'=>self::$page),array('$pullAll'=>array('admins'=>array($r['auth']['uid']))));
				}
			}
			//remove from all threads!
			//db2::toList(db2::find(phi::$conf['dbname'],'chat_group_follow',array()));
			db2::update(phi::$conf['dbname'],'user_follow',array('id'=>$r['auth']['uid']),array('$pullAll'=>array('following'=>array(self::$page))));
			db2::update(phi::$conf['dbname'],'page_follows',array('id'=>self::$page),array('$pullAll'=>array('following'=>array($r['auth']['uid']))));
			db2::remove(phi::$conf['dbname'],'page_follow',array('id'=>self::$page.'_'.$r['auth']['uid']));
			db2::update(phi::$conf['dbname'],'page',array('id'=>self::$page),array('$inc'=>array('following'=>-1)));
			$c['following']--;
			return array('success'=>true,'data'=>array('following'=>$c['following']));
		}
		public static function load($r,$internal=false){
			//load primary categories!
			include_once(ROOT.'/api/class/formbuilder.php');
			//return array('error'=>404);
			$data=db2::findOne(phi::$conf['dbname'],'page',array('id'=>self::$page));
			if(!$data) return array('error'=>404);
			$data=db2::graphOne(phi::$conf['dbname'],$data,array(
				'tags'=>array(
					'coll'=>'tags',
					'collapseList'=>true,
					'to'=>'tag_info',
					'match'=>'id',
					'filter'=>array('name','id')
				),
				'admins'=>array(
					'coll'=>'user',
					'collapseList'=>true,
					'to'=>'admin_info',
					'match'=>'id',
					'filter'=>array('name','id','pic')
				),
				'id'=>array(
					'coll'=>'points',
					'to'=>'points',
					'match'=>'id'
				),
				'location.id'=>array(
					'coll'=>'place',
					'to'=>'location.info',
					'match'=>'id'
				)
			));
			//add tags_selected
			//$d2=db2::findOne(phi::$conf['dbname'],'tagvote_user',array('id'=>self::$page.'_'.$r['auth']['uid']));
			//if($d2) $data['tags_selected']=$d2['tags'];
			//return cache and build there
			if(!$internal){
				$uid=(isset($r['auth']['uid'])&&$r['auth']['uid'])?$r['auth']['uid']:'';
				$data['is_following']=db2::findOne(phi::$conf['dbname'],'page_follow',array('id'=>self::$page.'_'.$uid));
				//show count of friends that are following!
				$pipeline[]=array(
					'$match'=>array(
						'id'=>self::$page
					)
				);
				// $friends=db2::findOne(phi::$conf['dbname'],'user_friends',array('id'=>$r['auth']['uid']),array('projection'=>array('friends'=>1)));
				$pipeline[]=array(
					'$project'=>array(
						'following'=>1,
						'count'=>array('$size'=>'$following'),
						'user'=>$uid
					)
				);
				$pipeline[]=array(
					'$lookup'=>array(
						'from'=>'user_friends',
						'localField'=>'user',
						'foreignField'=>'id',
						'as'=>'friend_info'
					)
				);
				$pipeline[]=array(
					'$unwind'=>'$friend_info'
				);
				$pipeline[]=array(
					'$project'=>array(
						'count'=>1,
						'friends'=>array('$size'=>array('$setIntersection'=>array('$friend_info.friends','$following'))),
						'friend_list'=>array('$setIntersection'=>array('$friend_info.friends','$following'))
					)
				);
				#die(json_encode($pipeline));
				$pdata=db2::aggregate(phi::$conf['dbname'],'page_follows',$pipeline);
				if($pdata){
					$adata=$pdata[0];
					if(isset($adata['friend_list'])){
						//pick first 10 and get info!
						$d=json_decode(json_encode($adata['friend_list']),1);
						$sub=array_slice($d,0,10);
						$adata['friend_info']=db2::toList(db2::find(phi::$conf['dbname'],'user',array('id'=>array('$in'=>$sub)),array('projection'=>array('id'=>1,'name'=>1,'pic'=>1))),false,'id');
					}
					$data['follow_info']=$adata;
				}
				//die(json_encode($adata));
				//add a review if there is one!
				$review=db2::findOne(phi::$conf['dbname'],'review',array('page.id'=>self::$page));
				$review=db2::graphOne(phi::$conf['dbname'],$review,array(
					'uid'=>array(
						'coll'=>'user',
						'to'=>'user',
						'match'=>'id',
						'filter'=>array('name','id','pic')
					)
				));
				$data['photos']=self::getPhotos();
				if($review) $data['review']['last']=$review;
				$url=db2::findOne(phi::$conf['dbname'],'url_name',array('id'=>self::$page));
				if($url){
					$data['url_name']=$url['url_name'];
				}
				//add member status/invite
				// if(!$data['is_following']){
				// 	$data['invite']=db2::findOne(phi::$conf['dbname'],'page_invite',array('id'=>$r['auth']['uid'],'page'=>self::$page));
				// 	$data['invite']=db2::graphOne(phi::$conf['dbname'],$data['invite'],array(
				// 		'invited_by'=>array(
				// 			'coll'=>'user',
				// 			'to'=>'by_info',
				// 			'match'=>'id',
				// 			'filter'=>array('name','id','pic')
				// 		)
				// 	));
				// }
			}
			$data['events']=formbuilder::feed(array(
				'auth'=>$r['auth'],
				'qs'=>[
					'schema'=>'event'
				]
			),[
				'page.id'=>self::$page,
				'start'=>['$gt'=>time()-(60*60*12)]
			],array(
				'sort'=>['start'=>1]
			),'id');
			$data['deals']=formbuilder::feed(array(
				'auth'=>$r['auth'],
				'qs'=>[
					'schema'=>'deal'
				]
			),[
				'page.id'=>self::$page//it will automagically apply expires filter
			],array(
				'sort'=>['_id'=>1]
			),'id');
			// //add in persnal permissions
			if(isset($r['auth']['uid'])&&$r['auth']['uid']) $data['extra_permissions']=db2::findOne(phi::$conf['dbname'],'permission',array('identity'=>$r['auth']['uid'],'page.id'=>self::$page));
			//add in extra data! (Arise...)
			// if(is_file(ROOT.'/sites/code/app/page/page.json')){
			// 	$tdata=json_decode(file_get_contents(ROOT.'/sites/code/app/page/page.json'),1);
			// 	if(isset($tdata[$data['id']])){
			// 		$data=array_merge_recursive($data,$tdata[$data['id']]);
			// 	}
			// }
			return array('success'=>true,'data'=>$data);
		}
		public static function getPhotos(){
			$data=db2::toOrderedList(db2::find(phi::$conf['dbname'],'media',array('by'=>self::$page,'type'=>'images'),array('limit'=>6,'sort'=>array('_id'=>-1))),false,1);
			return $data;
		}
	}
?>
