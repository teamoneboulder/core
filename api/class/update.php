<?php
	class UPDATE{
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
				case 'publish':
					$out=self::publish($r);
				break;
			}
			if(!isset($out)) $out['error']='no_data';
			return $out;
		}
		public static function hasPermission($r){
			return true;
		}
		public static function notifyStewards($r,$d,$key,$opts){
			if(!isset($d['current']['approved'])||!$d['current']['approved']){
				$l=db2::toOrderedList(db2::find(DB,'user',['level'=>'steward']));
				foreach ($l['order'] as $k => $v) {
					$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),array(
						'id'=>'update_available',
						'data'=>array(
							'app_id'=>$r['qs']['appid'],
							'to'=>array(
								'type'=>'user',
								'id'=>$v
							),
							'from'=>phi::keepFields($d['current']['from'],array('id','type')),
							'update'=>$d['current']['id']
						)
					),1);
				}
				if(isset($hooks)) phi::saveHooks($hooks);
			}
		}
		public static function feed($r){
			include_once(ROOT.'/api/class/formbuilder.php');
			$u=db2::findOne(DB,'user',array('id'=>$r['auth']['uid']),array('projection'=>array('level'=>1)));
			$query=array(
				'visibility'=>array('$in'=>array($u['level']))
			);
			$r['qs']['schema']='update';
			return formbuilder::feed($r,$query);
		}
		public static function publish($r){
			$d=phi::ensure($r,array('from'));
			$update=db2::findOne(phi::$conf['dbname'],'update',array('id'=>self::$id));
			if(!$update) return array('error'=>'invalid_update');
			//invite every user!
			$l=db2::toOrderedList(db2::find(phi::$conf['dbname'],'user',array(),array('projection'=>array('id'=>1))));
			if(phi::$conf['prod']){
				//bulk insert hooks!
				if($l['order']){
					foreach ($l['order'] as $k => $v) {
						$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),array(
							'id'=>'update_publish',
							'data'=>array(
								'app_id'=>$r['qs']['appid'],
								'to'=>array(
									'type'=>'user',
									'id'=>$v
								),
								'from'=>phi::keepFields($d['from'],array('id','type')),
								'update'=>$update['id']
							)
						),1);
					}
					phi::saveHooks($hooks);
				}
				$resp['sent']=sizeof($l['order']);
			}else{//dev mode
				phi::emitHook(phi::$conf['dbname'],time(),array(
					'id'=>'update_publish',
					'data'=>array(
						'app_id'=>$r['qs']['appid'],
						'to'=>array(
							'type'=>'user',
							'id'=>$r['auth']['uid']
						),
						'from'=>phi::keepFields($d['from'],array('id','type')),
						'update'=>$update['id']
					)
				));
				$resp['sent']=1;
				$resp['to_send']=sizeof($l['order']);
			}
			db2::update(phi::$conf['dbname'],'update',array('id'=>self::$id),array('$set'=>array('published'=>1)));
			return array('success'=>true,'data'=>$resp);
		}
		public static function load($r){
			$c=db2::findOne(phi::$conf['dbname'],'update',array('id'=>self::$id));
			$schema=ONE_CORE::getSchema('update');
			$c=db2::graphOne(phi::$conf['dbname'],$c,$schema['graph']);
			//add in other data, like comments
			//check permissions, assume public for now
			return array('success'=>true,'data'=>$c);
		}
	}
?>