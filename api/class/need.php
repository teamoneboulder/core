<?php
	class NEED{
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
				'schema'=>'need',
				'max'=>10
			);
			#phi::log('query - '.json_encode($q));
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
		public static function notifyPoster($r,$d,$key,$opts){
			if(isset($d['current']['not_approved_message'])&&!isset($d['last']['not_approved_message'])&&(!isset($d['current']['approved'])||!$d['current']['approved'])){
				#phi::log('notifyPoster of rejected');
				phi::emitHook(phi::$conf['dbname'],time(),array(
					'id'=>'request_denied',
					'data'=>array(
						'app_id'=>$r['qs']['appid'],
						'to'=>$d['current']['from'],
						'from'=>[
							'id'=>$r['auth']['uid'],
							'type'=>'user'
						],
						'need'=>$d['current']['id']
					)
				));
			}
		}
		public static function notifyStewards($r,$d,$key,$opts){
			if(!isset($d['current']['approved'])||!$d['current']['approved']){
				$l=db2::toOrderedList(db2::find(DB,'user',['level'=>'steward']));
				foreach ($l['order'] as $k => $v) {
					$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),array(
						'id'=>'request_available',
						'data'=>array(
							'app_id'=>$r['qs']['appid'],
							'to'=>array(
								'type'=>'user',
								'id'=>$v
							),
							'from'=>phi::keepFields($d['current']['from'],array('id','type')),
							'need'=>$d['current']['id']
						)
					),1);
				}
				if(isset($hooks)) phi::saveHooks($hooks);
			}
		}
		public static function broadcast($r,$d,$key,$opts){
			$l=db2::toOrderedList(db2::find(phi::$conf['dbname'],'user',array(),array('projection'=>array('id'=>1))));//'level'=>array('$in'=>$ev['visibility'])
			$data=array(
				'id'=>'need_broadcast',
				'data'=>array(
					'app_id'=>$r['qs']['appid'],
					'to'=>array(
						'type'=>'user',
						//'id'=>$v
					),
					'from'=>phi::keepFields($d['current']['from'],array('id','type')),
					'need'=>$d['current']['id']
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
		public static function sendFulfilledConfirmation($r,$d,$key,$opts){
			phi::emitHook(phi::$conf['dbname'],time(),array(
				'id'=>'need_fulfilled_request',
				'data'=>array(
					'app_id'=>$r['qs']['appid'],
					'to'=>$d['current']['request']['from'],
					'from'=>$d['current']['by'],
					'need'=>$d['current']['request_id']
				)
			));
		}
		public static function issuePoints($r,$d,$key,$opts){
			if(isset($d['current']['approved'])&&$d['current']['approved']&&!isset($d['last']['approved'])){
				//dont allow double send!
				$r['auth']['uid']=$d['current']['from']['id'];
				$ret=ONE_CORE::emitGameHook($r,'request');
			}
			return $d;
		}
		public static function hasPermission(){
			return true;
		}
		public static function addSigner($r,$d,$key,$opts){
			if(!$d['last']){//only set signer on initial
				$d['current']['from']['auth']=array(
					'type'=>'user',
					'id'=>$r['auth']['uid']
				);
			}
			return $d;
		}
		public static function sendRequestGame($r,$d,$key,$opts){
			if(!isset($d['last'][$key])&&isset($d['current'][$key])&&$d['current'][$key]==1){
				ONE_CORE::emitGameHook([
					'auth'=>[
						'uid'=>$d['last']['by']['id']
					],
					'qs'=>[
						'appid'=>$r['qs']['appid']
					]
				],'request_fulfilled',[
					'request_id'=>$d['last']['request_id']
				]);
				ONE_CORE::emitGameHook([
					'auth'=>[
						'uid'=>$r['auth']['uid']
					],
					'qs'=>[
						'appid'=>$r['qs']['appid']
					]
				],'request_fulfilled_response',[
					'request_id'=>$d['last']['request_id']
				]);
			}
		}
		public static function load($r){
			include_once(ROOT.'/api/class/formbuilder.php');
			$c=db2::findOne(phi::$conf['dbname'],'need',array('id'=>self::$id));
			if(!$c) return array('error'=>'Not Found');
			$schema=ONE_CORE::getSchema('need');
			$c=db2::graphOne(phi::$conf['dbname'],$c,$schema['graph']);
			$c['fulfilled_info']=formbuilder::feed([
				'auth'=>[
					'uid'=>'internal'
				],
				'qs'=>[
					'schema'=>'request_fulfilled'
				]
			],[
				'request_id'=>$c['id']
			]);
			if($c['fulfilled_info']['data']){
				$confirmed=0;
				$pending=0;
				$me_submitted=0;
				foreach ($c['fulfilled_info']['data']['list'] as $k => $v) {
					if($v['by']['id']==$r['auth']['uid']){
						$me_submitted=1;
					}
					if(isset($v['approved'])){
						if($v['approved']==1){
							$confirmed++;
						}
					}else{
						$pending++;
					}
				}
				$c['fulfilled_info']['pending']=$pending;
				$c['fulfilled_info']['confirmed']=$confirmed;
				$c['fulfilled_info']['me_submitted']=$me_submitted;
			}
			//add in other data, like comments
			//check permissions, assume public for now
			return array('success'=>true,'data'=>$c);
		}
	}
?>