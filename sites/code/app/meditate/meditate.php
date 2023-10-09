<?php
	class meditate{
		public static $uid='';
		public static function handleRequest($r){
			switch ($r['path'][4]){
				case "load"://check
					//ensure proper permissions
					$out=self::loadUserData($r);
				break;
				case "sessions"://check
					$out=self::loadSessions($r);
				break;
				case "save"://check
					$out=self::saveSession($r);
				break;
				default:
					$out=array('error'=>'invalid method');
				break;
			}
			return $out;
		}
		public static function saveSession($r){
			$d=phi::ensure($r,array(),1,array('self::write::meditate'));
			$save=array(
				'id'=>$r['auth']['uid'],
				'length'=>$r['qs']['length']
			);
			$data=NECTAR::save('meditate_session',$save);
			phi::log('Meditate Session: '.json_encode($save));
			//add to feed!
			// include_once(phi::$conf['root'].'/sites/code/app/feed/feed.php');
			// $r['qs']=array(
			// 	'channel'=>'feed',
			// 	'appid'=>$r['qs']['appid'],
			// 	'token'=>$r['qs']['token'],
			// 	'post'=>array(
			// 		'message'=>'I just did a '.$r['qs']['length'].' minute meditation session!',
			// 		'page'=>'meditate_session'
			// 	)
			// );
			// feed::updatePost($r);
			//see if there is any accomplishment!
			return array('success'=>true,'data'=>$data);
		}
		public static function loadSessions($r){
			$d=phi::ensure($r,array(),1,array('self::read::meditate'));
			$q=array('id'=>$r['auth']['uid']);
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				$q['_id']=array('$lt'=>db2::toId($r['qs']['last']));
			}
			$limit=20;
			$data=db2::toOrderedList(db2::find('nectar','meditate_session',$q,
				array('limit'=>$limit,'sort'=>array('_id'=>-1))
			),false,true,'_id');
			return array('success'=>true,'data'=>$data);
		}
		public static function loadUserData($r){
			$d=phi::ensure($r,array(),1,array('self::read::meditate'));
			$data=NECTAR::getAppData($r,'meditate');
			return array('success'=>true,'data'=>$data);
		}
	}
?>