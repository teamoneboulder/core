<?php
	class calendar{
		public static $uid='';
		public static function handleRequest($r){
			switch ($r['path'][4]){
				case 'range'://check
					$out=self::rangeCalendar($r);
				break;
				case 'feed':
					$out=self::feedCalendar($r);
				break;
				default:
					$out=array('error'=>'invalid_method');
				break;
			}
			return $out;
		}
		public static function rangeCalendar($r){
			$d=phi::ensure($r,array('range'),1,array('self::read::calendar'));
			$q=array('uid'=>$r['auth']['uid'],'start'=>array('$gte'=>db2::tsToTime($d['range']['start']),'$lte'=>db2::tsToTime($d['range']['end'])));
			//add in permission
			$u=db2::findOne(DB,'user',array('id'=>$r['auth']['uid']),array('projection'=>array('level'=>1)));
			if(isset($u['level'])) $level=$u['level'];
			else $level='explorer';
			$q['visibility']=array('$in'=>array($level));
			$data=db2::toOrderedList(db2::find(DB,'event',$q));
			return array('success'=>true,'data'=>$data);
		}
		public static function feedCalendar($r){
			$d=phi::ensure($r,array(),1,array('self::read::calendar'));
			if(isset($r['qs']['laston'])){
				$laston=$r['qs']['laston'];
			}else{
				$laston='start';
			}
			if(isset($r['qs']['past'])){
				$now=time();
				if(isset($r['qs']['last'])&&$r['qs']['last']){
					if(isset($r['qs']['last']['$date'])){
						$q=array($laston=>array('$lt'=>db2::tsToTime($r['qs']['last']['$date'],false)));
					}else{
						$q=array($laston=>array('$lt'=>db2::tsToTime($r['qs']['last'],false)));
					}
				}else{
					$q=array($laston=>array('$lt'=>db2::tsToTime($now)));
				}
				$sort=array('sort'=>array($laston=>-1));
			}else{
				$now=time()-(60*60*24);//going up to a day in past
				if(isset($r['qs']['last'])&&$r['qs']['last']){
					if(isset($r['qs']['last']['$date'])){
						$q=array($laston=>array('$gt'=>db2::tsToTime($r['qs']['last']['$date'],false)));
					}else{
						if($laston=='tsu') $r['qs']['last']=(int) $r['qs']['last']*1000;
						$q=array($laston=>array('$gt'=>db2::tsToTime($r['qs']['last'],false)));
					}
				}else{
					$q=array('start'=>array('$gt'=>db2::tsToTime($now)));
					$sort=array('sort'=>array('start'=>1));
				}
				if(!isset($sort)) $sort=array('sort'=>array($laston=>1));
			}
			$q['uid']=$r['auth']['uid'];
			if($laston=='tsu'){//give everything

			}else{
				$q['rsvp']=array('$in'=>array('going','interested'));
			}
			if(isset($r['qs']['calendarsync'])){
				$q['start']=array('$gt'=>db2::tsToTime($now));
			}
			#die(json_encode($q));
			//unset($q['start']);
			$data=db2::toOrderedList(db2::find(DB,'event_rsvp',$q,$sort),false,true,'_id',$laston);
			$data=db2::graph(DB,$data,array(
				'eid'=>array(
					'coll'=>'event',
					'to'=>'event',
					'match'=>'id',
					// 'graph'=>array(
					// 	'location.id'=>array(
					// 		'coll'=>'places',
					// 		'to'=>'location.info',
					// 		'match'=>'id'
					// 	)
					// )
				)
			));
			// $data['event']=db2::graphOne(DB,$data['event'],array(
			// 	'uid'=>array(
			// 		'coll'=>'user',
			// 		'to'=>'user',
			// 		'match'=>'id',
			// 		'filter'=>array('name','pic','id')
			// 	),
			// 	'canceled.by'=>array(
			// 		'coll'=>'user',
			// 		'to'=>'canceled.by_info',
			// 		'match'=>'id',
			// 		'filter'=>array('name','pic','id')
			// 	),
			// 	'rsvp_id'=>array(
			// 		'coll'=>'event_rsvp',
			// 		'to'=>'rsvp',
			// 		'subfield'=>'rsvp',
			// 		'match'=>'id'
			// 	),
			// 	'location.id'=>array(
			// 		'coll'=>'places',
			// 		'to'=>'location.info',
			// 		'match'=>'id'
			// 	)
			// ));
			return array('success'=>true,'data'=>$data);
		}
	}
?>