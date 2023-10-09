<?php
	class htmleditor{
		public static function handleRequest($r){
			switch ($r['path'][4]){
				case "save"://check
					$out=self::save($r);
				break;
				case "load"://check
					$out=self::load($r);
				break;
				default:
					$out=array('error'=>'invalid_method');
				break;
			}
			return $out;
		}
		public static function load($r){
			if(!isset($r['path'][4])) return array('error'=>'invalid_id');
			$c=db2::findOne('nectar','website',array('id'=>$r['path'][5]));
			if($c){
				$c['success']=true;
				return $c;
			}else{
				return array('success'=>true);
			}
		}
		public static function save($r){
			phi::log('QS: '.json_encode($r['qs']));
			$d=phi::ensure($r,array('gjs-html','gjs-styles','gjs-styles','gjs-components','page_id','view_id'));
			$d['id']=$d['page_id'].'_'.$d['view_id'];
			$d['tsu']=time();
			if(isset($d['token'])) unset($d['token']);
			if(isset($d['appid'])) unset($d['appid']);
			db2::update('nectar','website',array('id'=>$d['id']),array('$set'=>$d),array('upsert'=>true));
			return array('success'=>true);
		}
	}
?>