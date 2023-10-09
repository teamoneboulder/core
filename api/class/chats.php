<?php
	class chats{
		public static $uid='';
		public static function handleRequest($r){
			switch ($r['path'][4]){
				case "load":
					//ensure proper permissions
					$out=self::load2($r);
					//$out=self::load2($r);
				break;
				default:
					$out=array('error'=>'invalid method');
				break;
			}
			return $out;
		}
		public static function load2($r,$recount=false){
			//get chat order!
			#die(json_encode($r['auth']));
			$d=phi::ensure($r,array('identity'),1,array('self::read::chats'));
			include_once(phi::$conf['root'].'/api/class/chat.php');
			$last=(isset($r['qs']['last'])&&$r['qs']['last'])?(int) $r['qs']['last']:0;
			$max=(isset($r['qs']['max'])&&$r['qs']['max'])?(int) $r['qs']['max']:10;
			$after=(isset($r['qs']['after'])&&$r['qs']['after'])?$r['qs']['after']:false;
			if($d['identity']==$r['auth']['uid']){
				$identity=$r['auth']['uid'];
			}else{
				$p=db2::findOne(phi::$conf['dbname'],'page',array('id'=>$d['identity']));
				if(!$p) return array('error'=>'invalid_page');
				//ensure admin!
				if(!in_array($r['auth']['uid'], $p['admins'])) return array('error'=>'invalid_permissions');
				$identity=$d['identity'];
			}
			if(isset($r['qs']['ids'])){
				//die(json_encode($r['qs']['ids']));
				foreach ($r['qs']['ids'] as $k => $v) {
					$in[]=db2::toId($v);
				}
				$q=array('_id'=>array('$in'=>$in));
			}else{
				$q=false;
			}
			$data=chat::previewChatList2($identity,$max,$last,$after,$q);
			if($data){
				if($recount){
					foreach ($data['list'] as $k => $v) {
						if($identity[0]=='G'){
							$lrid=$identity.'_'.$r['auth']['uid'].'_'.$v['id'];
						}else{
							$lrid=$identity.'_'.$v['id'];
						}
						$lastread=db2::findOne(phi::$conf['dbname'],'lastread',array('id'=>$lrid));
						if($lastread){//compare
							$unread=db2::count(phi::$conf['dbname'],'chat',array('room'=>$v['id'],'_id'=>array('$gt'=>db2::toId($lastread['last']))));
						}else{
							$unread=db2::count(phi::$conf['dbname'],'chat',array('room'=>$v['id']));
						}
						$data['list'][$k]['unread']=$unread;
					}
				}else{//use what is cached in badgecounts
					if($identity[0]=='G'){
						$realidentity=$identity.'_'.$r['auth']['uid'];
					}else{
						$realidentity=$identity;
					}
					$badge=db2::findOne(phi::$conf['dbname'],'badgecount',array('id'=>$realidentity));
					foreach ($data['list'] as $k => $v) {
						if(isset($badge['chat'][$k])){
							$data['list'][$k]['unread']=$badge['chat'][$k];
						}else{
							$data['list'][$k]['unread']=0;
						}
						foreach($v['people_list'] as $tk => $tv){
							if(isset($tv['blocked'])){
								$data['list'][$k]['blocked']=1;
							}
						}
					}
				}
			}
			return array('success'=>true,'data'=>$data);
		}
		public static function load($r,$recount=false){
			//get chat order!
			$d=phi::ensure($r,array('identity'));
			include_once(phi::$conf['root'].'/api/class/chat.php');
			$last=(isset($r['qs']['last'])&&$r['qs']['last'])?(int) $r['qs']['last']:0;
			$max=(isset($r['qs']['max'])&&$r['qs']['max'])?(int) $r['qs']['max']:10;
			if($d['identity']==$r['auth']['uid']){
				$identity=$r['auth']['uid'];
			}else{
				$p=db2::findOne(phi::$conf['dbname'],'page',array('id'=>$d['identity']));
				if(!$p) return array('error'=>'invalid_page');
				//ensure admin!
				if(!in_array($r['auth']['uid'], $p['admins'])) return array('error'=>'invalid_permissions');
				$identity=$d['identity'];
			}
			$data=chat::previewChatList($identity,$max,$last);
			if($data){
				if($recount){
					foreach ($data['list'] as $k => $v) {
						if($identity[0]=='G'){
							$lrid=$identity.'_'.$r['auth']['uid'].'_'.$v['id'];
						}else{
							$lrid=$identity.'_'.$v['id'];
						}
						$lastread=db2::findOne(phi::$conf['dbname'],'lastread',array('id'=>$lrid));
						if($lastread){//compare
							$unread=db2::count(phi::$conf['dbname'],'chat',array('room'=>$v['id'],'_id'=>array('$gt'=>db2::toId($lastread['last']))));
						}else{
							$unread=db2::count(phi::$conf['dbname'],'chat',array('room'=>$v['id']));
						}
						$data['list'][$k]['unread']=$unread;
					}
				}else{//use what is cached in badgecounts
					if($identity[0]=='G'){
						$realidentity=$identity.'_'.$r['auth']['uid'];
					}else{
						$realidentity=$identity;
					}
					$badge=db2::findOne(phi::$conf['dbname'],'badgecount',array('id'=>$realidentity));
					foreach ($data['list'] as $k => $v) {
						if(isset($badge['chat'][$k])){
							$data['list'][$k]['unread']=$badge['chat'][$k];
						}else{
							$data['list'][$k]['unread']=0;
						}
					}
				}
			}
			return array('success'=>true,'data'=>$data);
		}
	}
?>