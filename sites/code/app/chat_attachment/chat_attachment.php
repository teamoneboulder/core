<?php
	class chat_attachment{
		public static $uid='';
		public static function handleRequest($r){
			switch ($r['path'][4]){
				case "send":
					//ensure proper permissions
					$out=self::send($r);
				break;
				default:
					$out=array('error'=>'invalid method');
				break;
			}
			return $out;
		}
		public static function send($r){
			//get chat order!
			$d=phi::ensure($r,array('attachment','to','message'));
			$u=db2::findOne('nectar','user',array('id'=>$d['to']));
			if(!$u) return array('error'=>'invalid_user');
			include_once(phi::$conf['root'].'/sites/code/app/chat/chat.php');
			$chat=array(
				'auth'=>$r['auth'],
				'qs'=>array(
					'people'=>array($r['auth']['uid'],$d['to'])
				)
			);
			#phi::log($chat);
			$resp=chat::create($chat);//ensure chat exists!
			$attachment=phi::keepFields($d['attachment'],array('id','type','context'));
			$message=array(
				'room'=>NECTAR::getFriendId($r['auth']['uid'],$d['to']),
				'by'=>$r['auth']['uid'],
				'attachment'=>$attachment,
				'content'=>$d['message']
			);
			#phi::log($message);
			chat::addMessage($message);
			return array('success'=>true);
		}
	}
?>