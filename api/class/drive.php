<?php
	class drive{
		public static $uid='';
		public static function handleRequest($r){
			include_once(phi::$conf['root'].'/api/oauth2.php');
			switch ($r['path'][4]){
				case "load":
					$out=self::load($r);					
				break;
				case "checkpermissions":
					$out=self::checkPermissions($r);
				break;
				case "setpermissions":
					$out=self::setPermissions($r);
				break;
				default:
					$out=array('error'=>'invalid method');
				break;
			}
			return $out;
		}
		public static function load($r){
			$data=array('orderBy'=>'modifiedTime desc','pageSize'=>20);
			if(isset($r['qs']['search'])){
				$data['q']="name contains '".$r['qs']['search']."' and (mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.google-apps.form')";
			}
			$opts=array(
				'url'=>'https://www.googleapis.com/drive/v3/files',
				'data'=>$data,
				'uid'=>$r['auth']['uid'],
				'app'=>'nectar',
				'app_id'=>'google',
				'id'=>'drive'
			);
			if(isset($r['qs']['oauth_id'])){//enable multiple accounts!
				$opts['oauth_id']=$r['qs']['oauth_id'];
			}
			#die(json_encode($opts));
			$resp=OAUTH2::get($opts);
			if(isset($r['qs']['api'])){
				if(isset($resp['files'])){
					foreach ($resp['files'] as $k => $v) {
						$out['order'][]=$v['id'];
						$out['list'][$v['id']]=$v;
					}
				}
				return array('success'=>true,'data'=>$out);
			}else{
				$out=$resp;
			}
			return $out;
		}
		public static function checkPermissions($r){
			$ispublic=false;
			$opts=array(
				'url'=>'https://www.googleapis.com/drive/v3/files/'.$r['qs']['id'].'/permissions',
				'data'=>array('orderBy'=>'modifiedTime desc','pageSize'=>20),
				'uid'=>$r['auth']['uid'],
				'app'=>'nectar',
				'app_id'=>'google',
				'id'=>'drive'
			);
			if(isset($r['qs']['oauth_id'])){//enable multiple accounts!
				$opts['oauth_id']=$r['qs']['oauth_id'];
			}
			$resp=OAUTH2::get($opts);
			$roles=array('commenter','reader','writer');
			foreach($resp['permissions'] as $k => $v) {
				if($v['type']=='anyone'&&in_array($v['role'], $roles)) $ispublic=true;
			}
			return array('success'=>true,'public_view'=>$ispublic);
		}
		public static function setPermissions($r){
			$d=phi::ensure($r,array('id','role'));
			$roles=array('reader','commenter','writer');
			if(!in_array($r['qs']['role'], $roles)) return array('error'=>'invalid_role_type');
			$opts=array(
				'url'=>'https://www.googleapis.com/drive/v3/files/'.$r['qs']['id'].'/permissions',
				'data'=>array('role'=>$r['qs']['role'],'type'=>'anyone'),
				'uid'=>$r['auth']['uid'],
				'app'=>'nectar',
				'app_id'=>'google',
				'type'=>'POST',
				'json'=>true
			);
			if(isset($r['qs']['oauth_id'])){//enable multiple accounts!
				$opts['oauth_id']=$r['qs']['oauth_id'];
			}
			$resp=OAUTH2::get($opts);
			if($resp['id']){
				return array('success'=>true);
			}else{
				return array('error'=>$resp['error']['message']);
			}	
		}
	}
?>