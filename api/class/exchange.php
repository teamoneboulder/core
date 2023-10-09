<?php
	class EXCHANGE{
		public static $id='';
		public static function checkUpdatePermissions($r,$scopes,$id,$proposed){
			if($r['auth']['uid']=='internal') return true;
			//die(json_encode($r['auth']));
			$c=db2::findOne(DB,'exhcange',array('id'=>$id));
			if(!$c){
				//CHECK THE PAGE THEY ARE TRYING
				if($proposed['from']['id'][0]=='U'){
					if($proposed['from']['id']==$r['auth']['uid']) return true;
					else return false;
				}else{
					$p=db2::findOne(DB,'page',array('id'=>$proposed['from']['id']));
					if(!$p) return false;
					if(in_array($r['auth']['uid'], $p['admins'])) return true;
				}
			}
			if($c['from']['id'][0]=='U'){
				if($c['from']['id']==$r['auth']['id']) return true;
			}else{
				$p=db2::findOne(DB,'page',array('id'=>$c['from']['id']));
				if(!$p) return false;
				if(in_array($r['auth']['uid'], $p['admins'])) return true;
			}
			return false;
		}
		public static function hasPermission($r){
			return true;
		}
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
		public static function checkGiftGame($r,$d,$key,$opts){
			if($d['current']['from']['id'][0]=='U'){
				ONE_CORE::emitGameHook($r,'send_a_gift',$d['current']['from']['id']);
			}
		}
		public static function ensureFunds($r,$d,$key,$opts){
			$current=db2::findOne(phi::$conf['dbname'],'points',array('id'=>$d['current']['from']['id']));
			//allow root level account to make points!
			if($d['current']['from']['type']=='page'){
				$p=db2::findOne(DB,'page',array('id'=>$d['current']['from']['id']));
				if(isset($p['root'])&&$p['root']){
					if(!isset($d['current']['seed'])&&!isset($d['last']['seed'])) $d['current']['seed']=0;
					return $d;//allow root level account to make points!
				}
			}
			if(!$current) API::toHeaders(array('error'=>'insufficient_point_balance'));
			if(!isset($d['current']['amount'])) API::toHeaders(array('error'=>'invalid_amount'));
			if($d['last']){
				if($d['last']['amount']<$d['current']['amount']){
					$diff=$d['current']['amount']-$d['last']['amount'];
					if($diff>$current['balance']) API::toHeaders(array('error'=>'Sorry, but you dont have a sufficient amount of points to send.','current_balance'=>$current['balance']));
				}
			}else{
				if($d['current']['amount']>$current['balance']) API::toHeaders(array('error'=>'Sorry, but you dont have a sufficient amount of points to send.','current_balance'=>$current['balance']));
			}
			if(!isset($d['current']['seed'])&&!isset($d['last']['seed'])) $d['current']['seed']=0;
			return $d;
		}
		public static function addSigner($r,$d,$key,$opts){
			if(!$d['last']){//only add signer on creation
				$d['current']['from']['auth']=array(
					'type'=>'user',
					'id'=>$r['auth']['uid']
				);
			}
			return $d;
		}
		public static function load($r){
			$c=db2::findOne(phi::$conf['dbname'],'exchange',array('id'=>self::$id));
			$schema=ONE_CORE::getSchema('exchange');
			$c=db2::graphOne(phi::$conf['dbname'],$c,$schema['graph']);
			//add in other data, like comments
			//check permissions, assume public for now
			return array('success'=>true,'data'=>$c);
		}
		public static function ensureTags($r,$d,$key,$opts){
			if(isset($d['current'][$opts['dataField']])) ONE_CORE::ensureTags($r,$d['current'][$opts['dataField']],$opts['collection']);//saves any ta
			return $d;
		}
		public static function recalcBalancForId($id,$min_ts=false){
			if(!$id) return array('error'=>"invalid_user");
			if($id[0]=='U'){
				$user=db2::findOne(phi::$conf['dbname'],'user',array('id'=>$id));
			}else{
				$user=db2::findOne(phi::$conf['dbname'],'page',array('id'=>$id));
			}
			if(!isset($user)||!$user) return array('error'=>"invalid_user");
			if($min_ts){
				$pipeline[]=array(
					'$match'=>array(
						'from.id'=>$user['id'],
						'_id'=>array('$gte'=>db2::timeToId($min_ts))
					)
				);
				$pipeline2[]=array(
					'$match'=>array(
						'to.id'=>$user['id'],
						'_id'=>array('$gte'=>db2::timeToId($min_ts))
					)
				);
			}else{
				$pipeline[]=array(
					'$match'=>array(
						'from.id'=>$user['id']
					)
				);
				$pipeline2[]=array(
					'$match'=>array(
						'to.id'=>$user['id']
					)
				);
			}
			$pipeline[]=array(
				'$group'=>array(
					'_id'=>array(
						'page'=>'test'//placehlder really
					),
					'sum'=>array(
						'$sum'=>'$amount'
					),
					'count'=>array(
						'$sum'=>1
					)
				)
			);
			$pipeline2[]=array(
				'$group'=>array(
					'_id'=>array(
						'page'=>'test'//placehlder really
					),
					'sum'=>array(
						'$sum'=>'$amount'
					),
					'count'=>array(
						'$sum'=>1
					),
					'tags'=>array(
						'$push'=>'$tags'
					)
				)
			);
			#die(json_encode($pipeline));
			$sent=db2::aggregate(phi::$conf['dbname'],'exchange',$pipeline);
			$receiveddata=db2::aggregate(phi::$conf['dbname'],'exchange',$pipeline2);
			$sent_count=($sent)?(int) $sent[0]['count']:0;	
			$sent=($sent)?$sent[0]['sum']:0;	
			$received_count=($receiveddata)?(int) $receiveddata[0]['count']:0;	
			$received=($receiveddata)?(int) $receiveddata[0]['sum']:0;	
			if($received) $ratio=$sent/$received;
			else $ratio=0;
			$volume=$sent+$received;
			$score=$ratio*$volume;
			$tags=false;
			if(isset($receiveddata[0]['tags'])){
				foreach ($receiveddata[0]['tags'] as $k => $v) {
					if($v) foreach ($v as $tk => $tv) {
						if(!isset($tagcount[$tv])) $tagcount[$tv]=0;
						$tagcount[$tv]++;
					}
				}
				if(isset($tagcount)){
					arsort($tagcount);
					$tags['order']=array_keys($tagcount);
					$tags['counts']=$tagcount;
				}else{
					$tags['order']=false;
					$tags['counts']=false;
				}
			}
			$current=array(
				'sent'=>$sent,
				'sent_count'=>$sent_count,
				'balance'=>$received-$sent,
				'received'=>$received,
				'received_count'=>$received_count,
				'ratio'=>$ratio,
				'score'=>$score,
				'volume'=>$volume,
				'tags'=>$tags
			);
			phi::clog('==='.json_encode($current));
			if(!$min_ts){
				ONE_CORE::update('points',array('id'=>$user['id']),$current);
				if($user['id'][0]=='U') ONE_CORE::update('user',array('id'=>$user['id']),array('ratio'=>$ratio));
				else ONE_CORE::update('page',array('id'=>$user['id']),array('ratio'=>$ratio));
			}else{
				ONE_CORE::update('points_hot',array('id'=>$user['id']),$current);
				// if($user['id'][0]=='U') ONE_CORE::update('user',array('id'=>$user['id']),array('score_hot'=>$score));
				// else ONE_CORE::update('page',array('id'=>$user['id']),array('score_hot'=>$score));
			}
			return $current;
		}
		public static function recalcBalance($r,$d,$key,$opts){
			$data=$d['current'];
			$user=$data[$key];
			$pipeline[]=array(
				'$match'=>array(
					'from.id'=>$user['id']
				)
			);
			$pipeline2[]=array(
				'$match'=>array(
					'to.id'=>$user['id']
				)
			);
			$pipeline[]=array(
				'$group'=>array(
					'_id'=>array(
						'page'=>'test'//placehlder really
					),
					'sum'=>array(
						'$sum'=>'$amount'
					),
					'count'=>array(
						'$sum'=>1
					)
				)
			);
			$pipeline2[]=array(
				'$group'=>array(
					'_id'=>array(
						'page'=>'test'//placehlder really
					),
					'sum'=>array(
						'$sum'=>'$amount'
					),
					'count'=>array(
						'$sum'=>1
					),
					'tags'=>array(
						'$push'=>'$tags'
					)
				)
			);
			$sent=db2::aggregate(phi::$conf['dbname'],'exchange',$pipeline);
			$receiveddata=db2::aggregate(phi::$conf['dbname'],'exchange',$pipeline2);
			$sent_count=($sent)?(int) $sent[0]['count']:0;	
			$sent=($sent)?$sent[0]['sum']:0;	
			$received_count=($receiveddata)?(int) $receiveddata[0]['count']:0;	
			$received=($receiveddata)?(int) $receiveddata[0]['sum']:0;	
			if($received) $ratio=$sent/$received;
			else $ratio=0;
			$volume=$sent+$received;
			$score=$ratio*$volume;
			$tags=false;
			if(isset($receiveddata[0]['tags'])){
				foreach ($receiveddata[0]['tags'] as $k => $v) {
					if($v) foreach ($v as $tk => $tv) {
						if(!isset($tagcount[$tv])) $tagcount[$tv]=0;
						$tagcount[$tv]++;
					}
				}
				if(isset($tagcount)){
					arsort($tagcount);
					$tags['order']=array_keys($tagcount);
					$tags['counts']=$tagcount;
				}else{
					$tags=false;
				}
			}
			$current=array(
				'sent'=>$sent,
				'sent_count'=>$sent_count,
				'balance'=>$received-$sent,
				'received'=>$received,
				'received_count'=>$received_count,
				'ratio'=>$ratio,
				'score'=>$score,
				'volume'=>$volume,
				'tags'=>$tags
			);
			ONE_CORE::update('points',array('id'=>$user['id']),$current);
			#phi::log('score! '.json_encode($current));
			if($user['id'][0]=='U') ONE_CORE::update('user',array('id'=>$user['id']),array('ratio'=>$ratio,'score'=>$score));
			else ONE_CORE::update('page',array('id'=>$user['id']),array('ratio'=>$ratio,'score'=>$score));
			//emit data to a page that may be looking at
			if(isset($opts['notify'])&&!$d['last']){
				$h=phi::emitHook(phi::$conf['dbname'],time(),array(
					'id'=>'exchange_send',
					'data'=>array(
						'app_id'=>$r['qs']['appid'],
						'to'=>phi::keepFields($data['to'],array('id','type')),
						'from'=>phi::keepFields($data['from'],array('id','type')),
						'exchange'=>$data['id']
					)
				));
			}
			if($r['auth']['uid']==$user['id']){
				$d['additionalData']['points']=$current;
			}
			$d['current']=$data;
			return $d;
		}
	}
?>