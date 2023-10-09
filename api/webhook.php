<?php
	class webhook{
		public static $fb_auth_token='fb_verify_2344d44c84409765d9a5ab39ae8cabcd';
		public static function handleRequest($r){
			$app=$r['path'][2];
			$r['conf']=API::getFileConf($app);
			if(!$r['conf']) return array('error'=>'invalid_app');
			if(!$r['qs']){
				$json = file_get_contents('php://input');
				$r['qs'] = json_decode($json, true);
			}
			switch ($r['path'][3]) {
				case 'facebook':
					$out=self::handleFacebook($r);
				break;
			}
			if(!isset($out)) $out=array('error'=>'invalid_webhook_request');
			return $out;
		}
		public static function handleFacebook($r){
			include_once(phi::$conf['root'].'/api/oauth2.php');
			//phi::log('fbwebhook');
			db2::save(DB,'webhook_facebook',array(
				'qs'=>$r['qs'],
				'path'=>$r['path']
			));
			switch ($r['path'][4]) {
				case 'user':
					if(isset($r['qs']['hub_challenge'])){//verfiy
						if($r['qs']['hub_verify_token']==self::$fb_auth_token){
							die(''.$r['qs']['hub_challenge']);
						}else{
							phi::alertAdmin('Webook auth forgary!');
							phi::log('request');
						}
					}else{
						foreach ($r['qs']['entry'] as $k => $v) {
							$fb_user_id=(isset($v['uid']))?$v['uid']:false;
							#phi::log('lookup fb user ['.$fb_user_id.']');
							if($fb_user_id){
								$fb_users=db2::toList(db2::find(DB,'fb_info',array('fbid'=>$fb_user_id)));
								//hardcode for now
								//phi::log($fb_users);
								if($fb_users) foreach ($fb_users as $k => $fb_user) {
									if($fb_user&&!isset($fb_user['disabled'])){
										$uid=$fb_user['id'];
										$u=db2::findOne(DB,'user',array('id'=>$uid));
										if(!$u){//not fully onboarded or has deleted
											//phi::log('Facebook webhook for a user that doesnt exists (anymore) or never did ['.$uid.'] ['.$fb_user['fbid'].']');
										}else{
											//save job to process in Node!
											if(isset($v['changed_fields'])){
												if(in_array('friends', $v['changed_fields'])){
													db2::save(DB,'jobs',array('job'=>'fbimport','type'=>'friends','uid'=>$uid));
												}
												if(in_array('feed', $v['changed_fields'])){
													//find latest!
													$postid=$v['id'];
														$l=db2::toOrderedList(db2::find(DB,'fb_post',array('uid'=>$uid),array('sort'=>array('created_ts'=>-1),'limit'=>1)));
														$job=array('job'=>'fbimport','type'=>'posts','uid'=>$uid);
														if($l){
															$lp=$l['list'][$l['order'][0]];
															$ts=(int) $lp['created_ts'];
															$debug=false;
															if(!phi::$conf['prod']&&$debug){//use other for debugging
																$job['latest']=$ts-(60*60*10);//ensure it dosnt pick up the one that was just done.
															}else{
																$job['latest']=$ts+15;//ensure it dosnt pick up the one that was just done.
															}
														}
	
														$id=$uid.'_facebook_post';
														phi::throttleJob($id,$job,60);//60 seconds limit
												}
											}
										}
									}else if(isset($fb_user['disabled'])){
										phi::log('fb webhook disabled for user ['.$fb_user['id'].']');
									}else{
										//phi::log('invalid fb webhook user');
									}
								}
								//phi::log($resp);
							}else{
								phi::log('invalid webhook from facebook');
							}
						}
					}
					//phi::log($r['qs']);
					header("HTTP/1.1 200 OK");
					die();
					$resp=array('success'=>true);
				break;
				default:
				break;
			}
			if(!isset($resp)) $resp=array('error'=>'invalid_fb');
			return $resp;
		}
	}