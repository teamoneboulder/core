<?php
	class events{
		public static $uid='';
		public static function handleRequest($r){
			switch ($r['path'][4]){
				case 'feed':
					$out=self::feed($r);
				break;
				case 'range':
					$out=self::rangeCalendar($r);
				break;
				case 'tickets':
					$out=self::tickets($r);
				break;
				default:
					$out=array('error'=>'invalid method');
				break;
			}
			return $out;
		}
		public static function rangeCalendar($r){
			$d=phi::ensure($r,array('range'));
			$q=array('start'=>array('$gte'=>(int) $d['range']['start'],'$lte'=>(int) $d['range']['end']));
			$uid=(isset($r['auth']['uid'])&&$r['auth']['uid'])?$r['auth']['uid']:'';
			$pq=[
				'$or'=>[
					[
						'$and'=>[
							[
								'start'=>array('$gte'=>(int) $d['range']['start'],'$lte'=>(int) $d['range']['end'])
							],
							[
								'privacy'=>'public'
							]
						]

					],
					[
						'$and'=>[
							[
								'start'=>array('$gte'=>(int) $d['range']['start'],'$lte'=>(int) $d['range']['end'])
							],
							[
								'privacy'=>'private'
							],
							[
								'$or'=>[
									['page.id'=>$uid],
									['cohost'=>['$in'=>[$uid]]]
								]
							]
						]
					]
				]
			];
			//die(json_encode($pq));
			//add in permission
			//$q=array();
			// $u=db2::findOne(DB,'user',array('id'=>$r['auth']['uid']),array('projection'=>array('level'=>1)));
			// if(isset($u['level'])) $level=$u['level'];
			// else $level='explorer';
			//$q['visibility']=array('$in'=>array($level));
			#die(json_encode($q));
			$data=db2::toOrderedList(db2::find(DB,'event',$pq));
			$data=db2::graph(DB,$data,[
				"cohost"=>[
	                "coll"=>"user",
	                "to"=>"cohost_info",
	                "match"=>"id",
	                "collapseList"=>true,
	                "fields"=>["id"=>1,"pic"=>1,"name"=>1,"badges"=>1]
	            ],
	            "page.id"=>[
	                "coll"=>[
	                    "field"=>"page.type",
	                    "id"=>"page.id"
	                ],
	                "to"=>"page.data",
	                "opts"=>[
	                    "user"=>[
	                        "coll"=>"user",
	                        "match"=>"id",
	                        "fields"=>["id"=>1,"pic"=>1,"name"=>1,"health"=>1,"badges"=>1]
	                    ],
	                    "page"=>[
	                        "coll"=>"page",
	                        "match"=>"id",
	                        "fields"=>["id"=>1,"pic"=>1,"name"=>1,"admins"=>1]
	                    ]
	                ],
	                "match"=>"id"
	            ]
			]);
			//add in birthday
			return array('success'=>true,'data'=>self::addBirthdays($d['range'],$data));
		}
		public static function getBirthdays($opts){
			$month=(int) date('m',(int) $opts['date']);
			$year=(int) date('Y',(int) $opts['date']);
			if($opts['type']=='past'){
				$prevmonth=$month-1;
				if($prevmonth==0) $prevmonth=12;
				$months[]=$month;
				$months[]=$prevmonth;
				$boundary=$opts['date']-(60*60*24);
				//$sopts=['sort'=>['birthday.month'=>1,'birthday.day'=>1]];
			}
			if($opts['type']=='upcoming'){
				$nextmonth=$month+1;
				if($nextmonth==13) $nextmonth=1;
				$months[]=$month;
				$months[]=$nextmonth;
				$boundary=$opts['date']-(60*60*24);
				//$sopts=['sort'=>['birthday.month'=>1,'birthday.day'=>1]];
			}
			//$sopts=[];
			$l=db2::toOrderedList(db2::find(DB,'user',['birthday.month'=>['$in'=>$months]],['projection'=>['birthday'=>1,'name'=>1,'id'=>1,'pic'=>1]]));
			//sort it!
			$out=false;
			if($l){
				foreach ($l['list'] as $k => $v) {
					$l['list'][$k]['ts']=DateTime::createFromFormat('m/d/Y', ($v['birthday']['month'].'/'.$v['birthday']['day'].'/'.$year));
					$l['list'][$k]['ts']=$l['list'][$k]['ts']->getTimestamp();
				}
				if($opts['type']=='upcoming'){
					$data=phi::sort($l['list'],[
						'key'=>'ts',
						'type'=>'number'
					]);
				}
				if($opts['type']=='past'){
					$data=phi::sort($l['list'],[
						'key'=>'ts',
						'type'=>'number',
						'reverse'=>1
					]);
				}
				foreach ($data as $k => $v) {
					if($opts['type']=='upcoming'&&$v['ts']>=$boundary){
						$out['list'][$v['id']]=$v;
						$out['order'][]=$v['id'];
					}
					if($opts['type']=='past'&&$v['ts']<$boundary){
						$out['list'][$v['id']]=$v;
						$out['order'][]=$v['id'];
					}
				}
			}
			return ['data'=>$out,'success'=>true];
		}
		public static function addBirthdays($range,$data=false){
			$startmonth=(int) date('m',(int) $range['start']);
			$endmonth=(int) date('m',(int) $range['end']);
			$year=(int) date('Y',(int) $range['end']);
			$cm=$startmonth;
			$months=[];
			while($cm<=$endmonth){
				if(!in_array($cm, $months)) $months[]=$cm;
				$cm++;
			}
			$l=db2::toOrderedList(db2::find(DB,'user',['birthday.month'=>['$in'=>$months]],['projection'=>['birthday'=>1,'name'=>1,'id'=>1,'pic'=>1]]));
			if($l){
				foreach ($l['list'] as $k => $v) {
					$data['order'][]=$v['id'];
					$v['icon']='icon-birthday';
					$v['type']='birthday';//there will be a bound condition here wrapping around years
					$v['start']=strtotime($v['birthday']['day'].'-'.$v['birthday']['month'].'-'.$year)+(60*60*12);//make it an noon
					$v['allDay']=1;
					$data['list'][$v['id']]=$v;
				}
			}
			return $data;
		}
		public static function tickets($r){
			//pipeline?!
			$q=array('user.id'=>$r['auth']['uid']);
			if(isset($r['qs']['max'])&&$r['qs']['max']){
				$max=(int) $r['qs']['max'];
			}else{
				$max=10;
			}
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				$last=(int) $r['qs']['last'];
			}else{
				$last=0;
			}
			$pipeline[]=array(
				'$match'=>$q
			);
			$pipeline[]=array(
				'$group'=>array(
					'_id'=>array(
						'event'=>'$event'
					),
					'active'=>array(
						'$sum'=>array(
							'$cond'=>array(
								array('$eq'=>array('$status','active')),1,0
							)
						)
					),
					'claimed'=>array(
						'$sum'=>array(
							'$cond'=>array(
								array('$eq'=>array('$status','claimed')),1,0
							)
						)
					),
					'transferred'=>array(
						'$sum'=>array(
							'$cond'=>array(
								array('$eq'=>array('$status','transferred')),1,0
							)
						)
					),
					'start'=>array(
						'$max'=>'$start'
					)
				)
			);
			$pipeline[]=array(
				'$sort'=>array('start'=>-1)
			);
			if($last){
				$pipeline[]=array(
					'$skip'=>$last
				);
			}
			$pipeline[]=array(
				'$limit'=>$max
			);
			$l=db2::aToList(db2::aggregate(phi::$conf['dbname'],'event_ticket',$pipeline),'_id.event','start',false);
			//graph data!
			$l=db2::graph(phi::$conf['dbname'],$l,array(
				'_id.event'=>array(
					'coll'=>'event',
					'to'=>'event_info',
					'match'=>'id'
				)
			));
			if($l) $l['last']=sizeof($l['order'])+$last;
			return array('success'=>true,'data'=>$l);
		}
		public static function feed($r){
			$maxDistance=1001;
			$r['qs']['schema']='event';
			$d=phi::ensure($r,array('schema'));
			$uid=(isset($r['auth']['uid'])&&$r['auth']['uid'])?$r['auth']['uid']:'';
			$schema=ONE_CORE::getSchema($d['schema']);
			if(isset($r['qs']['max'])){
				$max=(int) $r['qs']['max'];
			}
			if(!isset($max)||!$max) $max=10;
			//$friendlist=NECTAR::getFriends($r['auth']['uid']);
			$friendlist=false;
			//query opts!
			//$q=array('uid'=>$r['auth']['uid']);
			$q=array();
			// if(isset($r['qs']['search'])&&isset($r['qs']['search_field'])){
			// 	$regex = new MongoDB\BSON\Regex('^'.$r['qs']['search'],'i');//could be a major page, or feed within
			// 	$q[$r['qs']['search_field']]=$regex;
			// }
			$last=false;
			if(isset($r['qs']['last'])&&$r['qs']['last']&&$r['qs']['last']!='undefined'){
				$last=explode('_',$r['qs']['last']);
			}
			if(isset($r['qs']['after'])&&$r['qs']['after']){
				$after=explode('_',$r['qs']['after']);
			}
			if(!isset($r['qs']['filter'])) $r['qs']['filter']='';
			switch($r['qs']['filter']){
				case 'mine':
					$q['start']['$lte']=time()+(60*60*24*265*1);//up to 1 years in advance...
					$q['start_unique']['$gte']=phi::getUniqueNumber(1);
					$sort=-1;
				break;
				case 'going':
					$q['start']['$lte']=time()+(60*60*24*265*1);//up to 1 years in advance...
					$q['start_unique']['$gte']=phi::getUniqueNumber(1);
					$sort=-1;
				break;
				case 'interested':
					$q['start']['$lte']=time()+(60*60*24*265*1);//up to 1 years in advance...
					$q['start_unique']['$gte']=phi::getUniqueNumber(1);
					$sort=-1;
				break;
				case 'past':
					$sort=-1;
					$q['start']['$lte']=time()+(60*60*4);//up to 1 
					$q['start_unique']['$gte']=phi::getUniqueNumber(1);
				break;
				case 'added':
					$sort=-1;
					$q['_id']['$lte']=db2::getIdFromTime(time());
				break;
				case 'upcoming':
				default:
					$sort=1;
					$q['start']['$gte']=time()-(60*60*4);//up to 1 
					$q['start_unique']['$gte']=phi::getUniqueNumber(1);
				break;
			}
			//die(json_encode($q));
			if($r['qs']['filter']=='going'||$r['qs']['filter']=='interested'){
				//find all event rsvps that have going
				$l=db2::toOrderedList(db2::find(DB,'event_rsvp',array(
					'uid'=>$r['auth']['uid'],
					'rsvp'=>$r['qs']['filter']
				)),false,false,'eid');
				if(!$l) return array('success'=>true,'data'=>false);
				$q['id']=array('$in'=>$l['order']);

			}
			if($sort==1){
				if(isset($r['qs']['last'])&&$r['qs']['last']){
					// $l=db2::findOne(phi::$conf['dbname'],$d['schema'],array('_id'=>db2::toId($r['qs']['last'])));
					// if(!$l) return array('error'=>'invalid_last_post');
					if($r['qs']['filter']=='added'){
						$q=[
							'_id'=>['$gt'=>db2::toId($last[0])]
						];
					}else{
						$q=[
							'$or'=>[
								[
									'$and'=>[
										['start'=>['$eq'=>(int) $last[0]]],
										['start_unique'=>[
											'$gt'=>(int) $last[1]
										]]
									]
								],
								[
									'start'=>['$gt'=>(int) $last[0]]
								]
							]
						];
					}
					//die(json_encode($q));
					// $q['start']['$gte']=(int) $last[0];
					// $q['start_unique']['$gt']=(int) $last[1];
					//$q['tsu']=array('$lt'=>db2::tsToTime($l['tsu']['$date'],false));
				}
				//die(json_encode($q));
				if(isset($r['qs']['after'])&&$r['qs']['after']){
					// $a=db2::findOne(phi::$conf['dbname'],$d['schema'],array('_id'=>db2::toId($r['qs']['after'])));
					// if(!$a) return array('error'=>'invalid_after_post');
					// $q['start']['$lte']=(int) $after[0];
					// $q['start_unique']['$gt']=(int) $last[1];
					if($r['qs']['filter']=='added'){

					}else{
						$q=[
							'$or'=>[
								[
									'$and'=>[
										['start'=>['$eq'=>(int) $last[0]]],
										['start_unique'=>[
											'$gt'=>(int) $last[1]
										]]
									]
								],
								[
									'start'=>['$lt'=>(int) $last[0]]
								]
							]
						];
					}
					//$q['tsu']=array('$gt'=>db2::tsToTime($a['tsu']['$date'],false));
				}
			}
			if($sort==-1){
				if(isset($r['qs']['last'])&&$r['qs']['last']){
					// $l=db2::findOne(phi::$conf['dbname'],$d['schema'],array('_id'=>db2::toId($r['qs']['last'])));
					// if(!$l) return array('error'=>'invalid_last_post');
					// $q['start']['$lte']=(int) $last[0];
					// $q['start_unique']['$gt']=(int) $last[1];
					if($r['qs']['filter']=='added'){
						$q=[
							'_id'=>['$lt'=>db2::toId($last[0])]
						];
					}else{
						$q=[
							'$or'=>[
								[
									'$and'=>[
										['start'=>['$eq'=>(int) $last[0]]],
										['start_unique'=>[
											'$gt'=>(int) $last[1]
										]]
									]
								],
								[
									'start'=>['$lt'=>(int) $last[0]]
								]
							]
						];
					}
					//$q['tsu']=array('$lt'=>db2::tsToTime($l['tsu']['$date'],false));
				}
				if(isset($r['qs']['after'])&&$r['qs']['after']){
					// $a=db2::findOne(phi::$conf['dbname'],$d['schema'],array('_id'=>db2::toId($r['qs']['after'])));
					// if(!$a) return array('error'=>'invalid_after_post');
					// $q['start']['$gte']=(int) $after[0];
					// $q['start_unique']['$gt']=(int) $last[1];
					$q=[
						'$or'=>[
							[
								'$and'=>[
									['start'=>['$eq'=>(int) $last[0]]],
									['start_unique'=>[
										'$gt'=>(int) $last[1]
									]]
								]
							],
							[
								'start'=>['$gt'=>(int) $last[0]]
							]
						]
					];
					//$q['tsu']=array('$gt'=>db2::tsToTime($a['tsu']['$date'],false));
				}
			}
			//die(json_encode($q));
			$pipeline=array();
			$filter=(isset($r['qs']['filter']))?$r['qs']['filter']:false;
			if(isset($filter['tag']['order'])&&sizeof($filter['tag']['order'])){
				$q['tags']=array('$all'=>$filter['tag']['order']);
			}
			if(isset($r['qs']['page'])){
				$q['type']=$r['qs']['page'];
			}
			// $u=db2::findOne(DB,'user',array('id'=>$r['auth']['uid']),array('projection'=>array('level'=>1)));
			// if(isset($u['level'])) $level=$u['level'];
			// else $level='explorer';
			// $q['visibility']=array('$in'=>array($level));
			//die(json_encode($q));
			//die(json_encode($q));
			//if(!isset($q['start'])) $q['start']=array('$gte'=>time()-(60*60*6));//6 hours ago
			//$coords=ONE_CORE::getCoords($filter);
			#die(json_encode($q));
			$coords=false;
			//if($r['qs']['filter']=='past'||$r['qs']['filter']=='upcoming'){
				$q=[
					'$or'=>[
						[
							'$and'=>[
								$q,
								[
									'privacy'=>'public'
								]
							]

						],
						[
							'$and'=>[
								$q,
								[
									'privacy'=>'private'
								],
								[
									'$or'=>[
										['page.id'=>$uid],
										['cohost'=>['$in'=>[$uid]]]
									]
								]
							]
						]
					]
				];
			//}
			#die(json_encode($q));
			if($coords&&isset($filter['distance'])){
				$td=(int) $filter['distance'];
				if($td<.5||$td>$maxDistance) return array('error'=>'invalid distance');
				$km=($td*1.60934)*1000;
				$pipeline[]=array(
					'$geoNear'=>array(
						'near'=>array(
							'type'=>'Point',
							'coordinates'=>$coords
						),
						'query'=>$q,
						'distanceField'=>'dist.calculated',
						'key'=>'point',
						'maxDistance'=>$km,//1000km
						'spherical'=>true
					)
				);
			}else{
				if(sizeof($q)){
					$pipeline[]=array(
						'$match'=>$q
					);
				}
			}

			// if($schema) foreach ($schema['order'] as $k => $v) {
			// 	$project[$v]=1;
			// }
			//add in my rsvp info

			// $project['info.friends']=array('$in'=>array('$uid',$friendlist));
			// $project['info.mutual_going']=array('$size'=>array('$setIntersection'=>array('$event_list.going',$friendlist)));
			// $project['info.mutual_interested']=array('$size'=>array('$setIntersection'=>array('$event_list.interested',$friendlist)));
			// if(!$taglist) $taglist=array();
			// $project['mutual_tags']=array('$size'=>array('$setIntersection'=>array('$tags',$taglist)));
			$pipeline[]=array(
				'$addFields'=>array(
					'rsvp'=>array(
						'$concat'=>array('$id','_',(isset($r['auth']['uid']))?$r['auth']['uid']:'')
					)
				)
			);
			if($r['qs']['filter']=='added'){
				$pipeline[]=array(
					'$sort'=>array('_id'=>-1)
				);
			}else{
				$pipeline[]=array(
					'$sort'=>array('start'=>$sort,'start_unique'=>1)
				);
			}
			$pipeline[]=array(
				'$limit'=>$max
			);
			$pipeline[]=array(
				'$lookup'=>array(
					'from'=>'event_list',
					'localField'=>'id',
					'foreignField'=>'id',
					'as'=>'event_list'
				)
			);
			$pipeline[]=array(
				'$unwind'=>array(
					'path'=>'$event_list',
					'preserveNullAndEmptyArrays'=>true
				)
			);
			$pipeline[]=array(
				'$lookup'=>array(
					'from'=>'event_rsvp',
					'localField'=>'rsvp',
					'foreignField'=>'id',
					'as'=>'rsvp'
				)
			);
			$pipeline[]=array(
				'$unwind'=>array(
					'path'=>'$rsvp',
					'preserveNullAndEmptyArrays'=>true
				)
			);
			#die(json_encode($pipeline));
			if($r['qs']['filter']=='added'){
				$data=db2::aToList(db2::aggregate(phi::$conf['dbname'],$d['schema'],$pipeline),'_id','_id');
			}else{
				#die(json_encode($pipeline));
				$data=db2::aToList(db2::aggregate(phi::$conf['dbname'],$d['schema'],$pipeline),'id',['start','_','start_unique']);
			}
			if(isset($schema['graph'])) $data=db2::graph(phi::$conf['dbname'],$data,$schema['graph']);
			if(in_array($r['qs']['filter'], ['upcoming','past'])){
				if(!isset($r['qs']['last'])||!$r['qs']['last']){
					$data['extra']=['birthdays'=>self::getBirthdays([
						'date'=>time(),
						'type'=>$r['qs']['filter']
					])];
				}
			}
			return array('success'=>true,'data'=>$data);
		}
	}
?>