<?php
	class filter{
		public static function handleRequest($r){
			switch ($r['path'][4]){
				case 'save':
					$out=self::save($r);
				break;
				case 'delete':
					$out=self::delete($r);
				break;
				case 'order':
					$out=self::order($r);
				break;
				case 'update':
					$out=self::update($r);
				break;
				default:
					$out=array('error'=>'invalid_method');
				break;
			}
			return $out;
		}
		public static function update($r){
			$d=phi::ensure($r,array('update'));
			if(!isset($d['update']['id'])) return array('error'=>'invalid_id');
			foreach ($d['update'] as $k => $v) {
				if($k!='id') $set['filters.list.'.$d['update']['id'].'.'.$k]=$v;
			}
			db2::update('nectar','connect_filter',array('id'=>$r['auth']['uid']),array('$set'=>$set));
			return array('success'=>true);
		}
		public static function delete($r){
			phi::ensure($r,array('id'));
			$id=$r['qs']['id'];
			$k='filters.list.'.$id;
			$k2='filters.order';
			db2::update('nectar','connect_filter',array('id'=>$r['auth']['uid']),array('$unset'=>array($k=>1),'$pullAll'=>array($k2=>array($id))));
			return array('success'=>true);
		}
		public static function order($r){
			phi::ensure($r,array('order'));
			$order=$r['qs']['order'];
			db2::update('nectar','connect_filter',array('id'=>$r['auth']['uid']),array('$set'=>array('filters.order'=>$order)));
			return array('success'=>true);
		}
		public static function save($r){
			phi::ensure($r,array('save'));
			$save=$r['qs']['save'];
			$id=db2::niceGUID(array(
				'len'=>12,
				'pre'=>'F'
			));
			$set['filters.list.'.$id]=$save;
			db2::update('nectar','connect_filter',array('id'=>$r['auth']['uid']),array('$set'=>$set,'$addToSet'=>array('filters.order'=>array('$each'=>array($id)))),array('upsert'=>true));
			return array('success'=>true);
		}
	}
?>