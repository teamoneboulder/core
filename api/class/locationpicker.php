<?php
	class locationpicker{
		public static function handleRequest($r){
			switch ($r['path'][4]){
				case "history":
					$out=self::history($r);
				break;
				case "sethistory":
					$out=self::setHistory($r);
				break;
			}
			if(!isset($out)) $out=array('error'=>'invalid_method');
			return $out;
		}
		public static function setHistory($r){
			$d=phi::ensure($r,array('id','data'));
			$p=db2::findOne('nectar','place',array('id'=>$d['id']));
			NECTAR::ensurePlace(array(
				'location'=>$d['id'],
				'location_info'=>$d['data']
			));
			$id=$r['auth']['uid'].'_'.$d['id'];
			$set=array(
				'id'=>$id,
				'uid'=>$r['auth']['uid'],
				'place'=>$d['id'],
				'tsu'=>db2::tsToTime(time())
			);
			db2::update('nectar','place_history',array('id'=>$id),array('$set'=>$set),array('upsert'=>true));
			return array('success'=>true);
		}
		public static function history($r){
			$q=array('uid'=>$r['auth']['uid']);
			$max=10;
			if(isset($r['qs']['last'])){
				$l=db2::findOne('nectar','place_history',array('_id'=>db2::toId($r['qs']['last'])));
				if(!$l) return array('error'=>'invalid_last_post');
				$q['tsu']=array('$lt'=>db2::tsToTime($l['tsu']['$date'],false));
			}
			if(isset($r['qs']['after'])){
				$a=db2::findOne('nectar','place_history',array('_id'=>db2::toId($r['qs']['after'])));
				if(!$a) return array('error'=>'invalid_after_post');
				$q['tsu']=array('$gt'=>db2::tsToTime($a['tsu']['$date'],false));
			}
			$opts=array('sort'=>array('tsu'=>-1),'limit'=>$max);
			$data=db2::toOrderedList(db2::find('nectar','place_history',$q,$opts),false,true,'_id');
			$data=db2::graph('nectar',$data,array(
				'place'=>array(
					'coll'=>'place',
					'to'=>'place_info',
					'match'=>'id',
					'clearOnNull'=>true
				)
			));
			return array('success'=>true,'data'=>$data);
		}
	}
?>