<?php
	class NECTAR_NOTICE{
		public static function sendNotice($type,$admin_uid){//this also provides documentation on how to send notices!!!
			$from_uid='U9LASX1KG';//eros
			$data=false;
			$to_uid=$admin_uid;
			switch ($type) {
				case 'friendrequest':
					$data=array('_id'=>phi::getMongoId(time()),'id'=>$from_uid.'_'.$to_uid,'mutual'=>0);
				break;
				case 'connectin':
					$data=array('_id'=>'');
					return false;//not finished/cant test;
				break;
				case 'comment_on_post':
					$data=array('post_id'=>'PKICTEWQFXD3P','comment_id'=>'5b4cf2104ec9370648cb263a');
				break;
				case 'reply_to_comment':
					$data=array('post_id'=>'PKICTEWQFXD3P','comment_id'=>'5b4cf2104ec9370648cb263a');
				break;
				case 'post_to_timeline':
					$data=array('post_id'=>'PKICTEWQFXD3P');
				break;
				case 'video_to_timeline':
					$data=array('post_id'=>'PKICTEWQFXD3P');
				break;
				case 'post_mention':
					$data=array('post_id'=>'PKICTEWQFXD3P');
				break;
				case 'post_with':
					$data=array('post_id'=>'PKICTEWQFXD3P');
				break;
				case 'support_add':
					$data=array('post_id'=>'SCU8B9X53AONZ');
				break;
				case 'post_added':
					$data=array('post_id'=>'PKICTEWQFXD3P');
				break;
				case 'added_tags_to_post':
					$data=array('post_id'=>'PKICTEWQFXD3P','tags'=>array('healing','divine_feminine'));
				break;
				case 'broadcast':
					//make sample
					$msg=array(
						'type'=>'group_broadcast',
						'app'=>'tribalize',
						'message'=>'test message',
						'by'=>$admin_uid
					);
					$r=db2::save('nectar','broadcast',$msg);
					$data=array('mid'=>(string) $r->getInsertedId());
					return false;
				break;
				case 'reflection':
					//todo
				die('todo');
				break;
				case 'supportbroadcast':
					//make sample
					$msg=array(
						'type'=>'app_broadcast',
						'app'=>'support',
						'message'=>'Support Message!',
						'by'=>$admin_uid
					);
					$r=db2::save('nectar','broadcast',$msg);
					$data=array('mid'=>(string) $r->getInsertedId());
					return false;
				break;
				case 'friendadded':
				break;
				default:
					return array('error'=>'invalid message type');
				break;
			}
			//NECTAR::buildNotice($from_uid,$to_uid,$type,$data);
			NECTAR::notify($from_uid,$to_uid,$type,$data);

			return array('success'=>true);
		}
	}
?>