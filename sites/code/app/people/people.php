<?php
	class people{
		public static $uid='';
		public static function handleRequest($r){
			switch ($r['path'][4]){
				case "find":
					$out=self::find($r);
				break;
			}
			return $out;
		}
		public static function find($r){
			//$d=phi::ensure($r,array(),1,array('self::read::friends'));
			$d=phi::ensure($r,array(),1);
			$maxDistance=1001;
			//location isnt required if searching for friends!
			if(!isset($r['qs']['filter']['location'])){
				return array('error'=>'Please select a location','disableRetry'=>true);
			}
			if(isset($r['qs']['counts'])){
				$req=array('filter','counts');
				$r['qs']['max']=100000;
			}else{
				$req=array('filter','max');
			}
			$d=phi::ensure($r,$req);
			$limit=(int) $d['max'];
			if(isset($r['qs']['filter']['location'])){
				$filter=$r['qs']['filter'];
				$pipeline=array();
				if((isset($filter['location']['coords'])||isset($filter['location']['geometry']))&&isset($filter['distance'])){
					$d=(int) $filter['distance'];
					if(isset($r['qs']['filter']['location']['coords'])){
						$coords=[(float) $r['qs']['filter']['location']['coords'][0],(float) $r['qs']['filter']['location']['coords'][1]];
					}else{
						$coords=array((float)$filter['location']['geometry']['coordinates'][0],(float) $filter['location']['geometry']['coordinates'][1]);
					}
					if($d<.5||$d>$maxDistance) return array('error'=>'invalid distance');
					$km=($d*1.60934)*1000;
					if($r['auth']){
						$fl=db2::findOne('nectar','user_friends',array('id'=>$r['auth']['uid']));
						$tl=db2::findOne('nectar','user_tags',array('id'=>$r['auth']['uid']));
						if(isset($tl['tags'])) $taglist=$tl['tags'];
						else $taglist=array();
						if($fl){
							$friendlist=$fl['friends'];
							$friendlist2=$fl['friends'];
							$friendlist2[]=$r['auth']['uid'];
						}else{
							$friendlist=array();
						}
						if(isset($filter['friends'])){
							//$int=((int) $filter['friends_mutual']);
							if($filter['friends']!='all'){
								if($filter['friends']=='friends'){
									$q['id']=array('$in'=>$friendlist);
								}
								if($filter['friends']=='notfriends'){
									$q['id']=array('$nin'=>$friendlist2);
								}
								if(!isset($q['id'])){
									return array('error'=>'invalid filter');
								}
							}
						}else{
							$q['id']=array('$nin'=>array($r['auth']['uid']));
						}
					}
					if(!isset($q)) $q=array();
					$opipelinep[]=$pipeline[]=array(
						'$geoNear'=>array(
							'near'=>array(
								'type'=>'Point',
								'coordinates'=>$coords
							),
							'query'=>$q,
							'distanceField'=>'dist.calculated',
							'key'=>'loc_city',
							'maxDistance'=>$km,//1000km
							'spherical'=>true
						)
					);
				}else{
					return array('error'=>'invalid_distance_filter');
				}
				//figure out match query!
				if(isset($filter['age'])){
					$start=strtotime('-'.$filter['age'][0].' years');
					$end=strtotime('-'.$filter['age'][1].' years');
					$match['$match']['birthday_ts']=array('$gte'=>$end,'$lte'=>$start);
				}
				if(isset($filter['gender'])){
					if($filter['gender']!='all_gender'){
						$match['$match']['gender.gender']=$filter['gender'];
					}
				}
				$sconf=json_decode(file_get_contents(ROOT.'/_manage/schema.json'),1);
				$conf=(isset($sconf['user']))?$sconf['user']:false;
				foreach ($conf['order'] as $k => $v) {
					$project[$v]=1;
				}
				$project['taginfo']=1;
				$project['dist']=1;
				if(!isset($friendlist)||!$friendlist) $friendlist=array();
				$project['friends']=array('$in'=>array('$id',$friendlist));
				$project['mutual']=array('$size'=>array('$setIntersection'=>array('$friendinfo.friends',$friendlist)));
				if(!isset($taglist)||!$taglist) $taglist=array();
				//$project['mutual_tags']=array('$size'=>array('$setIntersection'=>array('$taginfo.tags',$taglist)));
				$pipeline[]=array(
					'$lookup'=>array(
						'from'=>'user_friends',
						'localField'=>'id',
						'foreignField'=>'id',
						'as'=>'friendinfo'
					)
				);
				$pipeline[]=array(
					'$unwind'=>'$friendinfo'
				);
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
				$project['taginfo']=1;
				$pipeline[]=array(
					'$project'=>$project
				);
				if(isset($filter['friends_mutual'])){//dont do if 0
					//$filter['friends_mutual']=4;//temp
					//$match['$match']['mutual']=array('$gte'=>(int) $filter['friends_mutual']);
					$match['$match']['mutual']=array('$gte'=>(int) $filter['friends_mutual']);
				}
				if(isset($match)) $pipeline[]=array('$match'=>self::buildAndQuery2($match['$match']));
				//user_tags matching!
				if(isset($filter['tag_person'])&&sizeof($filter['tag_person']['order'])){
					$pipeline[]=array(
						'$match'=>self::buildAndQuery('taginfo.tags',$filter['tag_person']['order'])
					);
					//$pipeline[]=array('$project'=>array('taginfo'=>0));
				}
				if(isset($filter['tag_skills'])&&sizeof($filter['tag_skills']['order'])){
					$pipeline[]=array(
						'$match'=>self::buildAndQuery('taginfo.skills',$filter['tag_skills']['order'])
					);
					//$pipeline[]=array('$project'=>array('taginfo'=>0));
				}
				if(isset($r['qs']['counts'])){
					$pipeline[]=array(
						'$count'=>'id'
					);
				}else{
					$pipeline[]=array('$project'=>array('name'=>1,'pic'=>1,'id'=>1,'dist'=>1,'friends'=>1,'mutual'=>1,'pending'=>1,'gender'=>1,'birthday_ts'=>1,'location'=>1));
					if(isset($filter['sort'])){
						switch ($filter['sort']) {
							case 'tsu':
								$pipeline[]=array(
									'$sort'=>array('_id'=>-1)
								);
							break;
							case 'distance':
								$pipeline[]=array(
									'$sort'=>array('dist.calculated'=>1,'_id'=>1)
								);
							break;
							case 'mutual':
								$pipeline[]=array(
									'$sort'=>array('mutual'=>-1,'_id'=>1)
								);
							break;
						}
					}else{
						$pipeline[]=array(
							'$sort'=>array('_id'=>-1)
						);
					}
					if(isset($r['qs']['last'])){
						$skip=(int) $r['qs']['last'];
						$pipeline[]=array(
							'$skip'=>$skip
						);
					}
					$pipeline[]=array(
						'$limit'=>$limit
					);
					//add location info
					$pipeline[]=array(
						'$lookup'=>array(
							'from'=>'place',
							// 'localField'=>'location',
							// 'foreignField'=>'id',
							'as'=>'location_info',
							'let'=>array('id'=>'$location'),
							'pipeline'=>array(
								array(
									'$match'=>array(
										'$expr'=>array('$eq'=>array('$id','$$id'))
									)
								),
								array(
									'$limit'=>1
								)
							)
						)
					);
					$pipeline[]=array(
						'$unwind'=>array(
							'path'=>'$location_info',
							'preserveNullAndEmptyArrays'=>true
						)
					);
					$pipeline[]=array(
						'$lookup'=>array(
							'from'=>'callout',
							'localField'=>'id',
							'foreignField'=>'id',
							'as'=>'callout'
						)
					);
					$pipeline[]=array(
						'$unwind'=>array(
							'path'=>'$callout',
							'preserveNullAndEmptyArrays'=>true
						)
					);
				}
				#die(json_encode($pipeline));
				// if(isset($r['qs']['debug'])){
				// 	$use=10;
				// 	$c=0;
				// 	while ($c<$use) {
				// 		$newpipeline[]=$pipeline[$c];
				// 		$c++;
				// 	}
				// 	#die(json_encode($pipeline));
				// 	die(json_encode(db2::aggregate('nectar','user',$newpipeline)));
				// 	die(json_encode($pipeline));
				// }
				if(isset($r['qs']['counts'])){
					$res=db2::aggregate('nectar','user',$pipeline);
					if(isset($res[0]['id'])){
						return array('success'=>true,'data'=>array('count'=>$res[0]['id']));
					}else{
						return array('success'=>true,'data'=>array('count'=>0));
					}
				}else{
					//die(json_encode($opipelinep));
					//die(json_encode(db2::aggregate('nectar','user',$opipelinep)));
					$data=db2::aToList(db2::aggregate('nectar','user',$pipeline));
					// if(isset($r['qs']['debug'])){
					// 	die(json_encode(db2::aggregate('nectar','user',$pipeline)));
					// 	die(json_encode($data));
					// }
				}
				if($data){
					//graph on location info!
					// $data=db2::graph('nectar',$data,array(
					// 	'location'=>array(
					// 		'coll'=>'location',
					// 		'to'=>'location_info',
					// 		'match'=>'id'
					// 	)
					// ));
					if(isset($resp)&&isset($resp[0]['total'])){
						$data['total']=$resp[0]['total'];
					}
					$start=0;
					if(isset($r['qs']['last'])){
						$start=(int) $r['qs']['last'];
					}
					$data['last']=$start+sizeof($data['list']);
				}
			}else{
				return array('error'=>'location_data_required');
			}
			return array('success'=>true,'data'=>$data);
		}
		public static function buildAndQuery2($queries){
			foreach ($queries as $k => $v) {
				$query['$and'][]=array($k=>$v);
			}
			return $query;
		}
		public static function buildAndQuery($dot,$tags){
			if(sizeof($tags)>1){
				foreach ($tags as $k => $v) {
					$set[$dot]=array('$in'=>array($v));
					$query['$and'][]=$set;
				}
				return $query;
			}else{
				return array($dot=>array('$in'=>$tags));
			}
		}
	}
?>