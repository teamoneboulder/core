<?php
	class report{
		public static $id='';
		public static function handleRequest($r){
			if(isset($r['path'][5])) self::$id=$r['path'][5];
			switch ($r['path'][4]){
				case "send":
					$out=self::send($r);
				break;
				case "load":
					$out=self::load($r);
				break;
				default:
					$out=array('error'=>'invalid method');
				break;
			}
			return $out;
		}
		public static function hasPermission($r){
			return true;
		}
		public static function takeAction($r,$d,$key,$opts){
			#die(json_encode($d['current']));
			if(isset($d['current']['context'])&&$d['current']['item']['type']=='chat'&&$d['current']['immediate']){
				phi::log('immedate action on comment!! '.json_encode($d['current']));
				ONE_CORE::update('chat',['_id'=>db2::toId($d['current']['item']['id'])],[
					'status'=>'pending'
				]);
			}
			$stewards=ONE_CORE::getStewards(1);
			#phi::log('GOT '.json_encode($stewards));
			foreach($stewards as $k=>$v){
				$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),array(
					'id'=>'report_add',
					'data'=>array(
						'app_id'=>$r['qs']['appid'],
						'to'=>['id'=>$v,'type'=>'user'],
						'from'=>['id'=>$d['current']['by'],'type'=>'user'],
						'report'=>$d['current']['id']
					)
				),1);
			}
			if(isset($hooks)) phi::saveHooks($hooks);
			#phi::alertAdmin('Report  ['.json_encode($d['current']).']');
		}
		public static function load($r){
			$c=db2::findOne(phi::$conf['dbname'],'report',array('id'=>self::$id));
			$schema=ONE_CORE::getSchema('report');
			$c=db2::graphOne(phi::$conf['dbname'],$c,$schema['graph']);
			//add in other data, like comments
			//check permissions, assume public for now
			return array('success'=>true,'data'=>$c);
		}
		public static function send($r){
			$d=phi::ensure($r,array('id','type','report'));
			$immediate=(isset($r['qs']['immediate'])&&$r['qs']['immediate'])?1:0;
			$report=array(
				'item'=>array(
					'id'=>$d['id'],
					'type'=>$d['type']
				),
				'report'=>$d['report'],
				'immediate'=>$immediate,
				'by'=>$r['auth']['uid']
			);
			if(isset($r['qs']['context'])&&$r['qs']['context']&&$r['qs']['context']!='false'){
				$report['context']=$r['qs']['context'];
			}
			return ONE_CORE::saveData($r,'report',$report);
		}
	}
?>