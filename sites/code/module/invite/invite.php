<?php
	class invite{
		public static function handleRequest($r){
			switch ($r['path'][4]){
				case 'suggested':
					$out=self::suggested($r);
				break;
				case 'send':
					$out=self::send($r);
				break;
				case 'feed':
					$out=self::feed($r);
				break;
				default:
					$out=array('error'=>'invalid_method');
				break;
			}
			return $out;
		}
		public static function feed($r){
			$data=false;
			$q=array('to'=>$r['auth']['uid']);
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				$q['_id']=array('$lt'=>db2::toId($r['qs']['last']));
			}
			if(isset($r['qs']['after'])&&$r['qs']['after']){
				$q['_id']=array('$gt'=>db2::toId($r['qs']['after']));
			}
			$max=10;
			if(isset($r['qs']['max'])) $max=(int) $r['qs']['max'];
			$data=db2::toOrderedList(db2::find('nectar','event_invite',$q,array('limit'=>$max,'sort'=>array('_id'=>-1))),false,1);
			$data=db2::graph('nectar',$data,array(
				'from'=>array(
					'coll'=>'user',
					'to'=>'from_info',
					'match'=>'id',
					'filter'=>array('name','pic','id')
				),
				'event'=>array(
					'coll'=>'event',
					'match'=>'id',
					'to'=>'event',
					'clearOnNull'=>true,
					'graph'=>array(
						'location.id'=>array(
							'coll'=>'place',
							'to'=>'location.data',
							'match'=>'id'
						)
					)
				),
				'rsvp'=>array(
					'create'=>array(
						'join'=>array(
							'data'=>array('$event',$r['auth']['uid']),
							'separator'=>'_'
						)
					),
					'coll'=>'event_rsvp',
					'to'=>'rsvp',
					'match'=>'id',
					'subfield'=>'rsvp',
					'clearOnNull'=>true
				)
			));
			return array('success'=>true,'data'=>$data);
		}
		public static function send($r){
			$d=phi::ensure($r,array('to','id','type'));
			include_once(phi::$conf['root'].'/sites/code/app/chat/chat.php');
			$toset=$r['qs']['to'];
			$id=$r['qs']['id'];
			$post=db2::findOne('nectar',$d['type'],array('id'=>$id));
			if(!$post) return array('error'=>'invalid_'.$d['type']);
			$cl=db2::toList(db2::find('nectar','event_invite',array('to'=>array('$in'=>$toset),'event'=>$d['id'])),false,'to');
			if($cl){
				foreach ($toset as $k => $v) {
					if(!isset($cl[$v])){//ensure not a dupe invite!
						$to[]=$v;
					}
				}
			}else{
				$to=$toset;
			}
			if(!isset($to)){
				return array('success'=>true);//just dont send messages...
			}
			foreach ($to as $k => $v) {
				$save[]=array(
					'id'=>$id.'_'.$v,
					'event'=>$id,
					'to'=>$v,
					'from'=>$r['auth']['uid']
				);
			}
			db2::bulkInsert('nectar','event_invite',$save);
			$msg=array(
				'from'=>$r['auth']['uid'],//can be on behalf of
				'to'=>$to,
				'from_data'=>NECTAR::getUser($r['auth']['uid']),
				'type'=>'event_invite',
				'data'=>array(
					'event_id'=>$post['id']
				)
			);
			db2::save('nectar','broadcast',$msg);
			return array('success'=>true);
		}
		public static function alreadyInteracted($r,$event_id){
			$cl=db2::toList(db2::find('nectar','event_invite',array('event'=>$event_id)),false,'to');
			if($cl){
				$exclude=array_keys($cl);
				foreach ($exclude as $k => $v) {
					$exclude2[]=$r['auth']['uid'].'_'.$v;
				}
			}
			// $l=db2::toOrderedList(db2::find('nectar','event_rsvp',array('eid'=>$event_id),array('sort'=>array('_id'=>-1))),false,false,'uid');
			// if($l){
			// 	foreach ($l['order'] as $k => $v) {
			// 		$exclude2[]=$r['auth']['uid'].'_'.$v;
			// 	}
			// }
			$el=db2::findOne('nectar','event_list',array('id'=>$event_id));
			if($el){
				if(sizeof($el['going'])){
					foreach ($el['going'] as $k => $v) {
						$exclude2[]=$r['auth']['uid'].'_'.$v;
					}
				}
				if(isset($el['interested'])&&sizeof($el['interested'])){
					foreach ($el['interested'] as $k => $v) {
						$exclude2[]=$r['auth']['uid'].'_'.$v;
					}
				}
			}
			if(!isset($exclude2)) $exclude2=false;
			return $exclude2;
		}
		public static function suggested($r){
			//go by friends for now!
			$d=phi::ensure($r,array('event'));
			$limit=(isset($r['qs']['max'])&&$r['qs']['max'])?(int) $r['qs']['max']:10;
			$regex = new MongoDB\BSON\Regex('^'.$r['auth']['uid'],'i');
			$event=$r['qs']['event'];
			$q=array('id'=>$regex);
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				$q['_id']=array('$lt'=>db2::toId($r['qs']['last']));
			}
			//dont show people invited!
			$exclude2=self::alreadyInteracted($r,$event);
			if($exclude2){
				$q='';
				$q['$and'][]=array('id'=>$regex);
				$q['$and'][]=array('id'=>array('$nin'=>$exclude2));//exlude people who have already been invited!
				if(isset($r['qs']['last'])&&$r['qs']['last']){
					$q['$and'][]['_id']=array('$lt'=>db2::toId($r['qs']['last']));
				}
				if(isset($qid)) $q['$and'][]=$qid;
			}
			#die(json_encode($q));
			$out=db2::toOrderedList(db2::find('nectar','friend',$q,array('sort'=>array('_id'=>-1),'limit'=>$limit)),false,'_id');
			if($out){
				foreach ($out['order'] as $tk => $tv) {
					$v=$out['list'][$tv];
					$id=explode('_', $v['id']);
					$ids[]=$id[1];
				}
				$ulist=db2::toList(db2::find('nectar','user',array('id'=>array('$in'=>$ids)),array('projection'=>array('name'=>1,'pic'=>1,'id'=>1))));
				foreach ($ids as $k => $v) {
					if(isset($ulist[$v])){
						$data['order'][]=$v;
						$data['list'][$v]=$ulist[$v];
					}
				}
				$data['last']=$out['last'];
			}else{
				$data=false;
			}
			return array('success'=>true,'data'=>$data);
		}
	}
?>