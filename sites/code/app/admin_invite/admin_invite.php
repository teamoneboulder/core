<?php
	class admin_invite{
		public static $uid='';
		public static function handleRequest($r){
			switch ($r['path'][4]){
				case "load":
					$out=self::load($r);
				break;
				case "feed2":
					$out=self::feed2($r);
				break;
				case "feed":
					$out=self::feed($r);
				break;
				case "add":
					$out=self::add($r);
				break;
				case "suggested":
					$out=self::suggested($r);
				break;
				default:
					$out=array('error'=>'invalid_method');
				break;
			}
			return $out;
		}
		public static function add($r){
			$d=phi::ensure($r,array('data'));
			$d['data']['assigned_to']=$r['auth']['uid'];
			NECTAR::save('codes',$d['data']);
			return array('success'=>true);
		}
		public static function load($r){
			return array('success'=>true);
		}
		public static function feed($r){
			$limit=10;
			if(isset($r['qs']['max'])) $limit=(int) $r['qs']['max'];
			$opts=array('sort'=>array('_id'=>-1),'limit'=>$limit);
			$uid=(isset($r['qs']['identity']))?$r['qs']['identity']:$r['auth']['uid'];
			$q=array('by.id'=>$uid);
			if(isset($r['qs']['last'])){
				$q['_id']=array('$lt'=>db2::toId($r['qs']['last']));
			}
			if(isset($r['qs']['after'])){
				$q['_id']=array('$gt'=>db2::toId($r['qs']['after']));
			}
			$data=db2::toOrderedList(db2::find('nectar','code',$q,$opts),false,true,'_id');
			return array('success'=>true,'data'=>$data);
		}
		public static function feed2($r){
			$limit=10;
			if(isset($r['qs']['max'])) $limit=(int) $r['qs']['max'];
			$opts=array('sort'=>array('_id'=>-1),'limit'=>$limit);
			//$q=array('assigned_to'=>$r['auth']['uid']);
			$q=array();
			if(isset($r['qs']['last'])){
				$q['_id']=array('$lt'=>db2::toId($r['qs']['last']));
			}
			if(isset($r['qs']['after'])){
				$q['_id']=array('$gt'=>db2::toId($r['qs']['after']));
			}
			$data=db2::toOrderedList(db2::find('nectar','codes',$q,$opts),false,true,'_id');
			//graph on
			if($data){
				$data=db2::graph('nectar',$data,array(
					'assigned_to'=>array(
						'coll'=>'user',
						'to'=>'admin',
						'match'=>'id',
						'filter'=>array('name','pic','id')
					),
					'claimed_by'=>array(
						'coll'=>'user',
						'to'=>'user',
						'match'=>'id',
						'filter'=>array('name','pic','id')
					)
				));
			}
			return array('success'=>true,'data'=>$data);
		}
	}
?>