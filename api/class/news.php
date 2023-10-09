<?php
	class NEWS{
		public static $id='';
		public static function handleRequest($r){
			if(isset($r['path'][5])) self::$id=$r['path'][5];
			switch ($r['path'][4]) {
				case 'load':
					$out=self::load($r);
				break;
				case 'feed':
					$out=self::feed($r);
				break;
				case 'approve':
					$out=self::approve($r);
				break;
			}
			if(!isset($out)) $out['error']='no_data';
			return $out;
		}
		public static function approve($r){
			db2::update(DB,'news',['id'=>self::$id],['$set'=>['approved'=>1]]);
			return ['success'=>true];
		}
		public static function hasPermission(){
			return true;
		}
		public static function feed($r){
			include_once(ROOT.'/api/class/formbuilder.php');
			$u=false;
			if(isset($r['auth']['uid'])) $u=db2::findOne(DB,'user',['id'=>$r['auth']['uid']]);
			if(isset($u['level'])&&$u['level']=='steward'){
				$q=[
				];
			}else{
				$q=[
					'approved'=>1
				];
			}
			$qs['schema']='news';
			if(isset($r['qs']['last'])) $qs['last']=$r['qs']['last'];
			return formbuilder::feed(array(
				'auth'=>$r['auth'],
				'qs'=>$qs
			),$q,array(
				'sort'=>array('created_ts'=>-1)
			),'_id');
		}
		public static function load($r){
			//add in other data, like comments
			//check permissions, assume public for now
			$data=ONE_CORE::load($r,self::$id,'news');
			if(isset($data['error'])) return $data;
			return array('success'=>true,'data'=>$data);
		}
	}
?>