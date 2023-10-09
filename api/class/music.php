<?php
	class MUSIC{
		public static $id='';
		public static function handleRequest($r){
			if(isset($r['path'][5])) self::$id=$r['path'][5];
			switch ($r['path'][4]) {
				case 'getstream':
					$out=self::getStream($r);
				break;
				case 'load':
					$out=self::load($r);
				break;
				case 'album':
					$out=self::album($r);
				break;
			}
			if(!isset($out)) $out['error']='no_data';
			return $out;
		}
		public static function album($r){
			include_once(ROOT.'/api/class/formbuilder.php');
			$album=ONE_CORE::load($r,self::$id,'music_album');
			if(!$album) return array('error'=>'Album not found');
			$data['album']=$album;
			$data['tracks']=formbuilder::feed(array(
				'auth'=>$r['auth'],
				'qs'=>array('schema'=>'music','max'=>100)
			),array('album'=>self::$id));
			return array('success'=>true,'data'=>$data);
		}
		public static function load($r){
			$c=db2::findOne(phi::$conf['dbname'],'music',array('id'=>self::$id));
			$schema=ONE_CORE::getSchema('music');
			$c=db2::graphOne(phi::$conf['dbname'],$c,$schema['graph']);
			//add in other data, like comments
			//check permissions, assume public for now
			return array('success'=>true,'data'=>$c);
		}
		public static function getStream($r){
			$schema=ONE_CORE::getSchema('music_stream');
			$stream=db2::findOne(DB,'music_stream',array('start'=>array('$lte'=>time()),'end'=>array('$gte'=>time())));
			$stream=db2::graphOne(DB,$stream,$schema['graph']);
			return array('success'=>true,'data'=>$stream);
		}
		public static function broadcast($r,$d,$key,$opts){
			phi::log('Broadcast disabled for music!');
			return $d;//disable for now
			$l=db2::toOrderedList(db2::find(phi::$conf['dbname'],'user',array(),array('projection'=>array('id'=>1))));//'level'=>array('$in'=>$ev['visibility'])
			$data=array(
				'id'=>'music_stream_broadcast',
				'data'=>array(
					'app_id'=>$r['qs']['appid'],
					'to'=>array(
						'type'=>'user'
					),
					'from'=>phi::keepFields($d['current']['from'],array('id','type')),
					'music_stream'=>$d['current']['id']
				)
			);
			if(phi::$conf['prod']){
				//bulk insert hooks!
				if(isset($l['order'])){
					foreach ($l['order'] as $k => $v) {
						if($v){
							$data['data']['to']['id']=$v;
							$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),$data,1);
						}
					}
					//save hooks
					phi::saveHooks($hooks);
					$resp['sent']=sizeof($l['order']);
				}else{
					$resp['sent']=0;
				}
			}else{//dev mode
				$data['data']['to']['id']=phi::$conf['admin_id'];
				phi::log('hook: '.json_encode($data));
				phi::emitHook(phi::$conf['dbname'],time(),$data);
				$resp['sent']=1;
				$resp['to_send']=sizeof($l['order']);
			}
			return $d;
		}
		public static function hasPermission(){
			return true;
		}
	}
?>