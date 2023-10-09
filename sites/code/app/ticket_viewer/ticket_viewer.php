<?php
	class ticket_viewer{
		public static function handleRequest($r){
			switch ($r['path'][4]){
				case "load":
					$out=self::load($r);
				break;
				default:
					$out=array('error'=>'invalid method');
				break;
			}
			return $out;
		}
		public static function load($r){
			phi::log('request');
			$d=phi::ensure($r,array('event'),true,array('self::read::tickets'));
			$data['event']=db2::findOne(DB,'event',array('id'=>$d['event']));
			$data['tickets']=db2::toOrderedList(db2::find(DB,'event_ticket',array('user.id'=>$r['auth']['uid'],'event'=>$d['event'])));
			$data['tickets']=db2::graph(DB,$data['tickets'],array(
				'ticket'=>array(
					'coll'=>'ticket',
					'to'=>'ticket_info',
					'match'=>'id'
				)
			));
			return array('success'=>true,'data'=>$data);
		}
	}
?>