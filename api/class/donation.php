<?php
	class DONATION{
		public static $id='';
		public static function handleRequest($r){
			if(isset($r['path'][5])) self::$id=$r['path'][5];
			switch ($r['path'][4]) {
				case 'load':
					$out=self::load($r);
				break;
			}
			if(!isset($out)) $out['error']='no_data';
			return $out;
		}
		public static function createReceipt($r,$d,$opts,$key){
			if($d['current']['to']['type']=='page'){
				//phi::log('do a page donation!');
			}
			if($d['current']['to']['type']=='event'){
				include_once(ROOT.'/api/class/formbuilder.php');
				$data=formbuilder::save(array(
					'auth'=>$r['auth'],
					'qs'=>array(
						'appid'=>$r['qs']['appid'],
						'schema'=>'ticket_receipt',
						'current'=>[
							'purchaser'=>[
								'id'=>$r['auth']['uid'],
								'type'=>'user'
							],
							'event'=>$d['current']['to']['id'],
							'payment_info_id'=>$d['current']['payment_id'],
							'donation'=>$d['current']['amount']-$d['current']['fees'],
							'amount'=>$d['current']['amount']-$d['current']['fees'],
							'tickets'=>['donation']
						]
					)
				));
				include_once(ROOT.'//api/class/event.php');
				//also recalc temp invoice!
				phi::log('ticket_receipt resp : '.json_encode($data));
				EVENT::calcTempInvoice(false,$d['current']['to']['id']);
			}
		}
		public static function notify($r,$d,$opts,$key){
			$to=false;
			if($d['current']['to']['type']=='event'){//replace notification to hosts!
				$e=db2::findOne(DB,'event',['id'=>$d['current']['to']['id']]);
				$as=db2::findOne(DB,'ticket_settings',array('id'=>$e['id']));
				if($as&&isset($as['notify_list'])&&sizeof($as['notify_list'])){
					foreach($as['notify_list'] as $k => $v){
						$added[]=$v;
						$to[]=[
							'id'=>$v,
							'type'=>'user'
						];
					}
				}
			}else{
				$to=[$d['current']['to']];
			}
			if($to){
				$h=false;
				foreach($to as $k => $v){
					if($v['id']!=$d['current']['from']['id']){
						$h[]=phi::emitHook(phi::$conf['dbname'],time(),array(
							'id'=>'donation_send',
							'data'=>array(
								'app_id'=>$r['qs']['appid'],
								'to'=>phi::keepFields($v,array('id','type')),
								'from'=>phi::keepFields($d['current']['from'],array('id','type')),
								'donation'=>$d['current']['id']
							)
						),1);
					}
				}
				if($h) phi::saveHooks($h);
			}
		}
		public static function hasPermission($r){
			return true;
		}
		public static function charge($r,$d,$key,$opts){
			#die(json_encode($d['current']));
			include_once(ROOT.'/api/bank.php');
			$charge['data']['from']=$d['current']['from']['id'];
			$charge['data']['to']=$d['current']['to'];//['type'=>'page','id'=>'one_boulder'];
			$charge['data']['amount']=(int) $d['current']['amount'];
			$charge['data']['method']=$d['current']['method']['data']['card'];
			$charge['data']['description']=$d['current']['message'];
			#die(json_encode($charge));
			$charge['type']=$d['current']['method']['type'];
			//include tag!!!!
			$charge['data']['tag']='donation_'.$d['current']['to']['type'];
			#phi::log($charge);
			$resp=bank::charge($charge);
			#die(json_encode($resp));
			//add transaction!
			if(isset($resp['error'])) API::toHeaders($resp);
			#die(json_encode($resp));
			$d['current']['payment_id']=$resp['payment_id'];
			return $d;
		}
		public static function load($r){
			$c=db2::findOne(phi::$conf['dbname'],'donation',array('id'=>self::$id));
			$schema=ONE_CORE::getSchema('donation');
			$c=db2::graphOne(phi::$conf['dbname'],$c,$schema['graph']);
			//add in other data, like comments
			//check permissions, assume public for now
			return array('success'=>true,'data'=>$c);
		}
	}
?>