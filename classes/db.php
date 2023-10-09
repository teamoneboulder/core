<?php
	class db{
		public static function findOne($db,$coll,$query,$opts=array()){
			$db=phi::getDB(false,$db);
			return $db->$coll->findOne($query);
		}
		public static function find($db,$coll,$query,$opts=array()){
			$db=phi::getDB(false,$db);
			$res=$db->$coll->find($query);
			if(isset($opts['sort'])) $res->sort($opts['sort']);
			if(isset($opts['limit'])) $res->limit($opts['limit']);
			return $res;
		}
		public static function toList($cur){
			$res=false;
			while($cur->hasNext()){
				$c=$cur->getNext();
				$c['_id']=$c['_id'].'';
				$res['list'][$c['_id']]=$c;
				$res['order'][]=$c['_id'];
			}
			return $res;
		}
		public static function count($db,$coll,$query=array()){
			$db=phi::getDB(true,$db);
			return $db->$coll->count($query);
		}
		public static function save($db,$coll,$obj,$opts=array()){
			$wdb=phi::getDB(true,$db);
			$wdb->$coll->save($obj);
		}
		public static function remove($db,$coll,$query,$opts=array()){
			$wdb=phi::getDB(true,$db);
			$wdb->$coll->remove($query);
		}
		public static function update($db,$coll,$query,$obj,$opts=array()){
			$wdb=phi::getDB(true,$db);
			$wdb->$coll->update($query,$obj,$opts);
		}
	}
?>