<?php
	class OFFER{
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
			}
			if(!isset($out)) $out['error']='no_data';
			return $out;
		}
		public static function notifyPoster($r,$d,$key,$opts){
			if(isset($d['current']['not_approved_message'])&&!isset($d['last']['not_approved_message'])&&(!isset($d['current']['approved'])||!$d['current']['approved'])){
				//phi::log('notifyPoster of rejected');
				phi::emitHook(phi::$conf['dbname'],time(),array(
					'id'=>'offer_denied',
					'data'=>array(
						'app_id'=>$r['qs']['appid'],
						'to'=>$d['current']['from'],
						'from'=>[
							'id'=>$r['auth']['uid'],
							'type'=>'user'
						],
						'offer'=>$d['current']['id']
					)
				));
			}
		}
		public static function feed($r){
			include_once(ROOT.'/api/class/formbuilder.php');
			$u=false;
			if(isset($r['auth']['uid'])&&$r['auth']['uid']) $u=db2::findOne(DB,'user',array('id'=>$r['auth']['uid']));
			if(!$u) $u=[
				'level'=>'explorer',
				'id'=>'anon'
			];
			if(isset($u['level'])&&$u['level']=='steward'){
				$q=[];//show everything
			}else{
				if($u['id']!='anon'){
					$pages=db2::toOrderedList(db2::find(DB,'page',['hidden'=>['$exists'=>false],'admins'=>['$in'=>[$u['id']]]],['projection'=>['id'=>1,'name'=>1,'pic'=>1]]));
					if($pages) $ids=$pages['order'];
					$ids[]=$u['id'];
					$q=[
						'$or'=>[
							['approved'=>1],
							['from.id'=>['$in'=>$ids]]
						]
					];
				}else{
					$q=['approved'=>1];
				}
			}
			$qs=array(
				'schema'=>'offer',
				'max'=>10
			);
			if(isset($r['qs']['last'])){
				$qs['last']=$r['qs']['last'];
			}
			return formbuilder::feed(array(
				'auth'=>$r['auth'],
				'qs'=>$qs
			),$q,array(
				'sort'=>array('_id'=>-1)
			),'_id');
		}
		public static function notifyStewards($r,$d,$key,$opts){
			if(!isset($d['current']['approved'])||!$d['current']['approved']){
				$l=db2::toOrderedList(db2::find(DB,'user',['level'=>'steward']));
				foreach ($l['order'] as $k => $v) {
					$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),array(
						'id'=>'offer_available',
						'data'=>array(
							'app_id'=>$r['qs']['appid'],
							'to'=>array(
								'type'=>'user',
								'id'=>$v
							),
							'from'=>phi::keepFields($d['current']['from'],array('id','type')),
							'offer'=>$d['current']['id']
						)
					),1);
				}
				if(isset($hooks)) phi::saveHooks($hooks);
			}
		}
		public static function issuePoints($r,$d,$key,$opts){
			if(isset($d['current']['approved'])&&$d['current']['approved']&&!isset($d['last']['approved'])){
				//dont allow double send!
				$r['auth']['uid']=$d['current']['from']['id'];
				$ret=ONE_CORE::emitGameHook($r,'offer');
			}
			return $d;
		}
		public static function hasPermission(){
			return true;
		}
		public static function load($r){
			$c=db2::findOne(phi::$conf['dbname'],'offer',array('id'=>self::$id));
			$schema=ONE_CORE::getSchema('offer');
			$c=db2::graphOne(phi::$conf['dbname'],$c,$schema['graph']);
			//add in other data, like comments
			//check permissions, assume public for now
			return array('success'=>true,'data'=>$c);
		}
	}
?>