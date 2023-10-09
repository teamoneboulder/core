<?php
class OAUTH2{
	public static $debug=1;
	public static $encrypt=true;//encrypt access_token/refresh_token
	public static function handleRequest($r){
		switch ($r['path'][2]) {
			case 'url':
				$out=self::getUrl($r);
			break;
			case 'return':
				$out=self::handleReturn($r);
			break;
			case 'loginfb':
				$out=self::loginfb($r);
			break;
			case 'extendfb':
				$r=API::authUser($r,$r['qs']['appid']);
				$out=self::extendFbToken($r);
			break;
			default:
			 	$out=array('error'=>'invalid_request');
			break;
		}
		return $out;
	}
	public static function loginfb($r){
		$d=phi::ensure($r,array('access_token','payload'),true);
		$tokeninfo=array(
			'access_token'=>phi::safeEncrypt($d['access_token']),
			'e'=>1,
			'expires'=>strtotime('+60 days'),
			'tsu'=>time(),
			'ts'=>time()
		);
		#phi::log($tokeninfo);
		return self::checkLogin('fb_login',$tokeninfo);
	}
	public static function extendFbToken($r){
		//if(!$r['auth']) return array('error'=>'invalid_auth');
		$d=phi::ensure($r,array('access_token','payload'),true);
		#phi::log('extend token payload: ' .json_encode($d['payload']));
		try{
			$app='facebook';
			$payload=$d['payload'];
			#phi::log($payload);
			if($r['auth']) $payload['uid']=$r['auth']['uid'];//ensure
			else{//create temp user id
				include_once(ROOT.'/sites/nectar/api.php');
				$uidd=NECTAR::createAnon(array());
				$uid=$uidd['uid'];
				$r['auth']['uid']=$payload['uid']=$uid;
			}
			//see if there are any more scopes that have already been authd
			$setapp=(isset($payload['id']))?$payload['id']:$app;
			$tokeninfo=array(
				'access_token'=>phi::safeEncrypt($d['access_token']),
				'e'=>1,
				'expires'=>strtotime('+60 days'),
				'tsu'=>time(),
				'ts'=>time()
			);
			$oauth_id=$payload['uid'].'_'.$setapp;
			if(isset($payload['uniqueKey'])){//allow for multiple accounts to happen!
				$oauth_id.='_'.$payload['uniqueKey'];
			}
			if(isset($payload['process'])&&$payload['process']=='createuser'){//immediate
				$payload['app_id']=$app;
				$payload['oauth_id']=$oauth_id;
				$payload['creds']=$tokeninfo;
				$resp=self::hooks($payload['process'],$payload,array());
				if(isset($payload['force_redirect'])){
					if(isset($resp['redirect'])) unset($resp['redirect']);
				}
				if(isset($resp['error'])){
					return $resp;
				}
			}
			if(!isset($payload['app'])) return array('error'=>'invalid_app');
			if(!isset($payload['uid'])) return array('error'=>'invalid_user');
			if(isset($payload['scope'])) $tokeninfo['scope']=$payload['scope'];
			$payload['scope']=$tokeninfo['scope'];
			if(isset($payload['tester'])) $tokeninfo['tester']=1;
			//tidy up!
			if(isset($payload['login'])){//check login
				$resp=self::checkLogin($payload['login'],$tokeninfo);
				return $resp;
			}
			$ctoken=self::getCreds($payload['app'],$oauth_id);
			if($ctoken){
				if(isset($ctoken['scope'])&&$ctoken['scope']){
					$tokeninfo['scope']=implode(',',array_unique(array_merge(explode(',',$tokeninfo['scope']),explode(',',$ctoken['scope']))));
				}else{
					$tokeninfo['scope']=$tokeninfo['scope'];
				}
			}
			#phi::log('ctoken: '.json_encode($ctoken));
			//$cdb=phi::getDB(true,$payload['app']);
			//die(json_encode($cs));
			$tokeninfo['id']=$oauth_id;
			$tokeninfo['app']=$setapp;
			$tokeninfo['uid']=$payload['uid'];
			//$tokeninfo['scopes']=explode(',', $tokeninfo['scope']);//required for queryability
			$tokeninfo['scopes']=self::getScopes($tokeninfo,'facebook');
			#phi::log('tokeninfo: '.json_encode($tokeninfo));
			db2::update($payload['app'],'creds',array('id'=>$oauth_id),array('$set'=>$tokeninfo),array('upsert'=>true));
			$resp['success']=true;
			if(isset($payload['process'])&&$payload['process']!='createuser'){//immediate
				$payload['app_id']=$app;
				$payload['oauth_id']=$oauth_id;
				$resp=self::hooks($payload['process'],$payload,$resp);
			}
			if(isset($payload['queuejob'])){//queue
				$save=array('job'=>$payload['queuejob'],'type'=>$payload['queuetype'],'uid'=>$payload['uid']);
				if(isset($payload['queuefirst'])) $save['first']=true;
				db2::save($payload['app'],'jobs',$save);
			}
			if(isset($payload['queue'])){//queue
				foreach ($payload['queue'] as $k => $v) {
					$save=array('job'=>$v['job'],'type'=>$v['type'],'uid'=>$payload['uid']);
					//phi::log($save);
					if(isset($v['first'])) $save['first']=true;
					db2::save($payload['app'],'jobs',$save);
				}
			}
			self::log($payload['uid'].' just authed ['.$app.']');
			return $resp;
		}catch (Exception $e) {
			$resp=array('error'=>$e->getMessage(),'trace'=>$r['qs']['state']);
			phi::log('error with oauth: '.json_encode($resp));
			if(isset($payload['redirect'])){
				self::backToApp($cs['payload']['redirect'].'#oauth_error');
			}else{
				return $resp;
			}
		}
		return array('success'=>true,'at'=>$d['access_token']);
	}
	public static function getScopes($creds,$type){
		$scopes=array();
		if(isset($creds['access_token'])){
			$creds['access_token']=phi::safeDecrypt($creds['access_token']);
		}
		switch($type){
			case 'facebook':
				$data=self::get(array(
					'url'=>'https://graph.facebook.com/debug_token',
					'data'=>array(
						'input_token'=>$creds['access_token']
					),
					'app'=>'nectar',
					'app_id'=>'facebook',
					'app_token'=>true,
					'creds'=>$creds
				));
				if(isset($data['data']['scopes'])){
					$scopes=$data['data']['scopes'];
				}
				#phi::log('fbdata: '.json_encode($data));
			break;
		}
		return $scopes;
	}
	public static function hooks($hook,$payload,$response){
		$setapp=(isset($payload['id']))?$payload['id']:$payload['app_id'];
		$oauth_id=$payload['uid'].'_'.$setapp;
		if(isset($payload['uniqueKey'])){//allow for multiple accounts to happen!
			$oauth_id.='_'.$payload['uniqueKey'];
		}
		if(!isset($payload['oauth_id'])) $payload['oauth_id']=$oauth_id;
		#phi::log('payload-'.json_encode($payload));
		switch ($hook) {
			case 'loadgoogle':
				$payload['url']='https://www.googleapis.com/oauth2/v1/userinfo?alt=json';
				$resp=OAUTH2::get($payload);
				if(isset($resp['id'])){
					$save=array(
						'id'=>$resp['id'],
						'name'=>$resp['name'],
						'email'=>$resp['email'],
						'pic'=>$resp['picture']
					);
					db2::update($payload['app'],'creds_info',array('id'=>$payload['oauth_id']),array('$set'=>array('data'=>$save)),array('upsert'=>true));
				}else{
					phi::log('GOOGLE- '.json_encode($resp));
					phi::log('invalid google auth oauth2::loadgoogle');
				}
			break;
			case 'createuser':
			case 'loadfb':
				$scope=explode(',',$payload['scope']);
				if(in_array('manage_pages', $scope)){
					$payload['url']='https://graph.facebook.com/me/accounts';
					$resp=OAUTH2::get($payload);
					#phi::log($resp);
					if(isset($resp['data'])){
						foreach ($resp['data'] as $k => $v) {
							db2::update($payload['app'],'creds',array('id'=>$payload['uid'].'_'.$v['id']),array('$set'=>array('access_token'=>phi::safeEncrypt($v['access_token']),'e'=>1,'ts'=>time())),array('upsert'=>true));
							db2::update($payload['app'],'fb_pages',array('id'=>$v['id']),array('$set'=>array('name'=>$v['name'],'category'=>$v['category'],'ts'=>time())),array('upsert'=>true));
							$pages[]=$v['id'];
							$resppages[]=phi::keepFields($v,array('id','name','category'));
						}
						//update user
						db2::update($payload['app'],'fb_info',array('id'=>$payload['uid']),array('$addToSet'=>array('pages'=>array('$each'=>$pages))),array('upsert'=>true));
					}else{
						phi::log('no fb pages!');
						phi::log($payload);
						$resppages=false;
					}
				}else{
					$resppages=false;
				}
				$payload['url']='https://graph.facebook.com/me?fields=id,name,email';
				#phi::log($payload);
				$resp=OAUTH2::get($payload);
				#phi::log($resp);
				if($hook=='createuser'){
					$cu=db2::findOne('nectar','user',array('fbid'=>$resp['id']));
					if($cu){
						phi::log('Facebook user exists ['.$cu['id'].'] ['.$resp['id'].']');
						$response['hash']='#error=fb_user_exists';
						$response['error']='fb_user_exists';
						return $response;
					}
				}else{
					db2::update($payload['app'],'user',array('id'=>$payload['uid']),array('$set'=>array('fbid'=>$resp['id'])));
				}
				if(isset($resp['name'])){
					$pic='https://graph.facebook.com/'.$resp['id'].'/picture?type=large&width=720&height=720';
					include_once(ROOT.'/api/uploader.php');
					$r=array(
						'qs'=>array(
							'url'=>$pic,
							'sizes'=>array('small','full'),
							'path'=>'/img/'
						)

					);
					#phi::log($r);
					$tpic=phi::keepFields(upload::uploadImage($r),array('path','ext','ar'));
					#phi::log('pic: '.json_encode($tpic));
					db2::update($payload['app'],'fb_info',array('id'=>$payload['uid']),array('$set'=>array('name'=>$resp['name'],'fbid'=>$resp['id'])),array('upsert'=>true));
					db2::update($payload['app'],'creds_info',array('id'=>$payload['oauth_id']),array('$set'=>array('data'=>array('name'=>$resp['name'],'pic'=>$tpic,'fbid'=>$resp['id']))),array('upsert'=>true));
					//create user!
					if($hook=='createuser'){
						//ensure that his user doesnt alreay have an account!
						include_once(ROOT.'/api/stripe.php');
						#phi::log($payload);
						$newuser=stripe::payment(array(
							'qs'=>array(
								'appid'=>'2344d44c84409765d9a5ab39ae8cabcd',
								'plan'=>(isset($payload['plan']))?$payload['plan']:'personal_0',
								'token'=>(isset($payload['stripe_token']))?$payload['stripe_token']:false,
								'actions'=>(isset($payload['actions']))?$payload['actions']:false,
								'user'=>array(
									'id'=>$payload['uid'],
									'fbid'=>$resp['id'],
									'email'=>(isset($resp['email']))?$resp['email']:'',
									'name'=>$resp['name'],
									'pic'=>$tpic
								)
							)
						),'nectar');
						if(!isset($newuser['error'])){
							phi::log('New Facebook User! '.json_encode($newuser));
							//redirect to magic link URL!
							$magic=phi::getMagicLinkId('nectar',$payload['uid']);
							$response['magic']=$magic;
							$response['redirect']='https://'.phi::$conf['domain'].'/login/'.$magic;
							$response['hash']='#tt='.$magic;
						}else{
							$response['hash']='#showfb=1&error2='.base64_encode($newuser['error']);
							$response['error']=true;
						}
					}else{
						$response['hash']='#facebook_linked';
					}
				}else{
					$response['hash']='#error=no_name_returned';
					$response['error']=true;
				}
				#phi::log($resp);
			break;
		}
		#phi::log($response);
		return $response;
	}
	public static function get($opts,$retry=false){
		//get creds!
		if(!isset($opts['url'])&&!isset($opts['returnCreds'])) return array('error'=>'invalid_url');
		if(isset($opts['use_secret'])){
			$provider_info=self::getProviderInfo(['provider'=>$opts['app_id']]);
			// $creds['client_secret']=$provider_info['client_secret'];
			$opts['data']['client_secret']=$provider_info['client_secret'];
		}else if(isset($opts['force_app_token'])){
			$provider_info=self::getProviderInfo(['provider'=>$opts['app_id']]);
			$creds['access_token']=$provider_info['admin_access_token'];
			$retry=true;//dont allow retyr
		}else if(!isset($opts['app_token'])){
			if(!isset($opts['creds'])){
				if(!isset($opts['app'])) return array('error'=>'invalid_app');
				if(!isset($opts['uid'])&&!isset($opts['app_token'])) return array('error'=>'invalid_user_id');
				if(!isset($opts['app_id'])) return array('error'=>'invalid_app_id');
				//$cdb=phi::getDB(true,$opts['app']);
				//$u=$cdb->creds->findOne(array('_id'=>$opts['uid']),array($key=>1));
				$key=(isset($opts['id']))?$opts['id']:$opts['app_id'];
				if(isset($opts['oauth_id'])){
					$creds=self::getCreds($opts['app'],$opts['oauth_id']);
				}else if(isset($opts['multiple'])){//dont know mulitple key, try to lookup
					$creds=db2::findOne($opts['app'],'creds',array('uid'=>$opts['uid'],'app'=>$key));
					$opts['oauth_id']=$creds['id'];//ensure refresh updates correctly
					if($creds) $creds=self::getCreds($opts['app'],$creds['id'],$creds);//decrypt
				}else{
					$creds=self::getCreds($opts['app'],$opts['uid'].'_'.$key);
				}
				if(!$creds){
					if(isset($opts['dieUrl'])){
						$out=self::getUrl([
							'path'=>[flase,false,flase,$opts['app']],
							'qs'=>[
								'api'=>1,
								'payload'=>[
									'provider'=>$opts['app_id']
								]
							]
						]);
						die('go to: '.$out['url']);
					}
					return array('error'=>'no_creds');
				}
				if(isset($opts['returnCreds'])) return $creds;
			}else{
				$creds=$opts['creds'];
				//manually decrypt
				if(isset($creds['e'])){
					if(isset($creds['access_token'])) $creds['access_token']=phi::safeDecrypt($creds['access_token']);
					if(isset($creds['refresh_token'])&&$creds['refresh_token']) $creds['refresh_token']=phi::safeDecrypt($creds['refresh_token']);
				}
			}
		}else if(isset($opts['app_token'])){//overwrite app token with user token
			$providers=phi::$conf['oauth'];
			$provider_info=$providers[$opts['app_id']];
			switch ($opts['app_id']) {
				case 'facebook':
					$c=db2::findOne($opts['app'],'creds',array('id'=>$opts['app_id']));
					if(!$c){
						$resp=phi::curl('https://graph.facebook.com/oauth/access_token?client_id='.$provider_info['client_id'].'&client_secret='.$provider_info['client_secret'].'&grant_type=client_credentials');
						if(isset($resp['access_token'])){
							db2::update($opts['app'],'creds',array('id'=>$opts['app_id']),array('$set'=>array('access_token'=>$resp['access_token'])),array('upsert'=>true));
							$c=array(
								'access_token'=>$resp['access_token']
							);
						}else{
							phi::log('error getting aplication access_token');
							die('error getting aplication access_token');
						}
					}
					if(isset($c['access_token'])){
						$creds['access_token']=$c['access_token'];
					}else{
						phi::log('invalid app access_token');
						die('invalid app access_token');
					}
				break;
			}
		}
		$headers=((isset($opts['headers']))?(self::getHeaderType($opts['headers'],$creds)):(self::getBearerHeaders($creds,$provider_info)));
		$settings=array();
		if(isset($opts['json'])) $settings['jsonencodepost']=true;
		$data=((isset($opts['data']))?$opts['data']:false);
		$resp=phi::curl($opts['url'],$data,$headers,(isset($opts['type'])?$opts['type']:'GET'),1,$settings);
		//die(var_dump($resp));
		//store tsu
		// phi::log($opts);
		// phi::log($creds);
		if(isset($creds['id'])) db2::update($opts['app'],'creds',array('id'=>$creds['id']),array('$set'=>array('tsu'=>time())));
		//error catch
		#die(json_encode($resp));
		$check=array('error','errors');
		$err=0;
		foreach ($check as $k => $v) {
			if(isset($resp[$v])) $err=1;
		}
		if($err&&!$retry){//retry once!
			//refresh!
			phi::log('OAUTH retry/refresh');
			$resp=self::refreshToken($opts);
			$opts['creds']=$resp;
			//phi::log($opts);
			return self::get($opts,1);
		}else{
			return $resp;
		}
		//return $resp;
	}
	public static function getBearerHeaders($tokenobj,$provider_info){
		$headers[]='Authorization: Bearer '.$tokenobj['access_token'];
		//$headers[]="Content-Type: application/json";
		if(isset($provider_info['contentType'])){
			$headers[]=$provider_info['contentType'];
		}else{
			$headers[]="Content-Type: application/json";
		}
		return $headers;
	}
	public static function getHeaderType($type,$creds){
		return false;
	}
	public static function log($msg,$error=false){
		if(OAUTH2::$debug&&phi::$conf['env']!='prod') phi::log($msg,'OAUTH',$error);
	}
	public static function getCreds($app,$id,$creds=false){
		if(!$creds) $creds=db2::findOne($app,'creds',array('id'=>$id));
		if(isset($creds['e'])){
			if(isset($creds['access_token'])) $creds['access_token']=phi::safeDecrypt($creds['access_token']);
			if(isset($creds['refresh_token'])&&$creds['refresh_token']) $creds['refresh_token']=phi::safeDecrypt($creds['refresh_token']);
		}
		return $creds;
	}
	public static function refreshToken($opts){
		$key=(isset($opts['id']))?$opts['id']:$opts['app_id'];
		if(isset($opts['oauth_id'])){
			$creds=self::getCreds($opts['app'],$opts['oauth_id']);
			$updatekey=$opts['oauth_id'];
		}else{
			$creds=self::getCreds($opts['app'],$opts['uid'].'_'.$key);
			$updatekey=$opts['uid'].'_'.$key;
		}
		//refresh it!
		$provider=self::getProvider($opts['app_id'],$opts);
		try{
			$newAccessToken = $provider->getAccessToken('refresh_token', [
		        'refresh_token' => $creds['refresh_token']
		    ]);
		    $tokeninfo=self::getTokenInfo($newAccessToken);
		    #phi::log($tokeninfo);
		    db2::update($opts['app'],'creds',array('id'=>$updatekey),array('$set'=>$tokeninfo));
		    $tokeninfo['refreshed']=true;
		    return $tokeninfo;
		}catch(Exception $e){
			phi::log(array('error'=>$e->getMessage()));
			return array('error'=>$e->getMessage());
		}
	}
	public static function getTokenInfo($accessToken){
		if(self::$encrypt){
			$tokeninfo=array(
				'access_token'=>phi::safeEncrypt($accessToken->getToken()),
				'refresh_token'=>phi::safeEncrypt($accessToken->getRefreshToken()),
				'e'=>1,
				'expires'=>$accessToken->getExpires(),
				'tsu'=>time(),
				'ts'=>time()
			);
		}else{
			$tokeninfo=array(
				'access_token'=>$accessToken->getToken(),
				'refresh_token'=>$accessToken->getRefreshToken(),
				'expires'=>$accessToken->getExpires(),
				'tsu'=>time(),
				'ts'=>time()
			);
		}
		if(!$tokeninfo['refresh_token']) unset($tokeninfo['refresh_token']);
		return $tokeninfo;
	}
	public static function checkLogin($type,$creds){
		$payload=array(
			'creds'=>$creds
		);
		switch($type){
			case 'fb_login':
				$payload['url']='https://graph.facebook.com/me';
				$resp=OAUTH2::get($payload);
				//phi::log($resp);
				if($resp['id']){
					$cu=db2::findOne('nectar','user',array('fbid'=>$resp['id']));
					if($cu){
						$magic=phi::getMagicLinkId('nectar',$cu['id']);
						$response['magic']=$magic;
						$response['redirect']='https://'.phi::$conf['domain'].'/login/'.$magic;
						$response['hash']='#tt='.$magic;
						$response['success']=true;
					}else{
						$response['hash']='#error=user_not_found';
						$response['error']='user_not_found';
					}
				}else{
					$response['hash']='#error=invalid_facebook_login';
					$response['error']='invalid_facebook_login';
				}
			break;
		}
		//phi::log($response);
		return $response;
	}
	public static function handleReturn($r){
		#phi::log($r['qs']);
		if(isset($r['qs']['provider'])){
			switch($r['qs']['provider']){
				case 'stripe':
					include_once(ROOT.'/api/stripe.php');
					return stripe::handleOauthReturn($r);
				break;
			}
			return false;
		}
		$cs=db2::findOne('oauth','temp',array('id'=>$r['qs']['state']));
		$payload=$cs['payload'];
		$provider_info=self::getProviderInfo($payload);
		$app=$r['path'][3];
		$provider=self::getProvider($app,$payload);
		if(!isset($r['qs']['state'])||!$r['qs']['state']) return array('error'=>'invalid_state');
		if(!$cs) return array('error'=>'invalid_state');
		if((!isset($cs['payload']['uid'])||!$cs['payload']['uid'])&&isset($cs['payload']['process'])&&$cs['payload']['process']=='createuser'){
			include_once(ROOT.'/sites/nectar/api.php');
			$uidd=NECTAR::createAnon(array());
			$uid=$uidd['uid'];
			$cs['payload']['uid']=$uid;
		}
		try{
			if(!isset($r['qs']['code'])||!$r['qs']['code']){
				self::backToApp($cs['payload']['redirect']);
				return false;
			}
			$code=$r['qs']['code'];
			//$code.='_force';
			try{
				$accessToken = $provider->getAccessToken('authorization_code', [
		            'code' => $code
		        ]);
			}catch(Exception $e){
				return API::toHeaders(array('error'=>'unable_to_get_token: '.$e->getMessage()));;
			}
			$tokeninfo=self::getTokenInfo($accessToken);
			if(!$tokeninfo) API::toHeaders(array('error'=>'unable_to_get_token'));
			//tidy up!
			db2::remove('oauth','temp',array('id'=>$r['qs']['state']));
			if(isset($cs['payload']['login'])){//check login
				$url=$cs['payload']['redirect'];
				$resp=self::checkLogin($cs['payload']['login'],$tokeninfo);
				if(isset($resp['hash'])&&$resp['hash']=='#error=user_not_found'&&isset($cs['payload']['type'])&&$cs['payload']['type']=='continue_fb') $resp['hash']='#action=continue_fb';
				if(isset($resp['hash'])){
					$url.=$resp['hash'];
				}
				if(isset($resp['redirect'])&&isset($cs['payload']['force_redirect'])){
					self::backToApp($resp['redirect'].'#redirect='.base64_encode($url));
				}else{
					self::backToApp($url);
				}
				return false;
			}
			//see if there are any more scopes that have already been authd
			$setapp=(isset($cs['payload']['id']))?$cs['payload']['id']:$app;
			//$ctoken=db2::findOne($cs['payload']['app'],'creds',array('id'=>$cs['payload']['uid'].'_'.$setapp));
			$oauth_id=$cs['payload']['uid'].'_'.$setapp;
			if(isset($cs['payload']['uniqueKey'])){//allow for multiple accounts to happen!
				$oauth_id.='_'.$cs['payload']['uniqueKey'];
			}
			if(isset($cs['payload']['process'])&&$cs['payload']['process']=='createuser'){//immediate
				$cs['payload']['app_id']=$app;
				$cs['payload']['oauth_id']=$oauth_id;
				$cs['payload']['creds']=$tokeninfo;
				$resp=self::hooks($cs['payload']['process'],$cs['payload'],array());
				if(isset($resp['error'])){
					$url=$cs['payload']['redirect'];
					if(isset($resp['hash'])){
						$url.=$resp['hash'];
					}
					if(isset($resp['redirect'])&&isset($cs['payload']['force_redirect'])){
						self::backToApp($resp['redirect'].'#redirect='.base64_encode($url));
					}else{
						self::backToApp($url);
					}
					return false;
				}
			}
			//phi::log($cs['payload']);
			if(!isset($cs['payload']['app'])) return array('error'=>'invalid_app');
			if(!isset($cs['payload']['uid'])) return array('error'=>'invalid_user');
			if(isset($cs['payload']['scope'])) $tokeninfo['scope']=$cs['payload']['scope'];
			if(isset($cs['payload']['tester'])) $tokeninfo['tester']=1;
			$ctoken=self::getCreds($cs['payload']['app'],$oauth_id);
			if($ctoken){
				if(isset($ctoken['scope'])&&$ctoken['scope']){
					$tokeninfo['scope']=implode(',',array_merge(explode(',',$tokeninfo['scope']),explode(',',$ctoken['scope'])));
				}else{
					$tokeninfo['scope']=$tokeninfo['scope'];
				}
			}
			//$cdb=phi::getDB(true,$cs['payload']['app']);
			//die(json_encode($cs));
			$tokeninfo['id']=$oauth_id;
			$tokeninfo['app']=$setapp;
			$tokeninfo['uid']=$cs['payload']['uid'];
			$tokeninfo['scopes']=explode(',', $tokeninfo['scope']);//required for queryability
			#phi::log($tokeninfo);
			db2::update($cs['payload']['app'],'creds',array('id'=>$oauth_id),array('$set'=>$tokeninfo),array('upsert'=>true));
			$resp['success']=true;
			if($cs['payload']['provider']=='google'&&!isset($cs['payload']['process'])) $cs['payload']['process']='loadgoogle';
			if(isset($cs['payload']['process'])&&$cs['payload']['process']!='createuser'){//immediate
				$cs['payload']['app_id']=$app;
				$cs['payload']['oauth_id']=$oauth_id;
				$resp=self::hooks($cs['payload']['process'],$cs['payload'],$resp);
			}
			if(isset($cs['payload']['queuejob'])){//queue
				$save=array('job'=>$cs['payload']['queuejob'],'type'=>$cs['payload']['queuetype'],'uid'=>$cs['payload']['uid']);
				if(isset($cs['payload']['queuefirst'])) $save['first']=true;
				db2::save($cs['payload']['app'],'jobs',$save);
			}
			if(isset($cs['payload']['queue'])){//queue
				foreach ($cs['payload']['queue'] as $k => $v) {
					$save=array('job'=>$v['job'],'type'=>$v['type'],'uid'=>$cs['payload']['uid']);
					//phi::log($save);
					if(isset($v['first'])) $save['first']=true;
					db2::save($cs['payload']['app'],'jobs',$save);
				}
			}
			self::log($cs['payload']['uid'].' just authed ['.$app.']');
			phi::log($cs['payload']);
			if(isset($cs['payload']['redirect'])){
				$url=$cs['payload']['redirect'];
				if(isset($resp['hash'])){
					$url.=$resp['hash'];
				}
				if(isset($resp['redirect'])&&isset($cs['payload']['force_redirect'])){
					self::backToApp($resp['redirect'].'#redirect='.base64_encode($url));
				}else{
					self::backToApp($url);
				}
			}else{
				return $resp;
			}
		}catch (Exception $e) {
			$resp=array('error'=>$e->getMessage(),'trace'=>$r['qs']['state']);
			phi::log('error with oauth: '.json_encode($resp));
			if(isset($cs['payload']['redirect'])){
				self::backToApp($cs['payload']['redirect'].'#oauth_error');
			}else{
				return $resp;
			}
		}
	}
	public static function getProviderInfo($payload){
		if($payload['provider']=='nectar'){
			$info=db2::findOne('nectar','apps',array('id'=>$payload['app_id']));
			if(!$info) API::toHeaders(array('error'=>'invalid_provider'));
			return array(
				"client_id"=>$info['id'],
	            "client_secret"=>(isset($info['secret']))?$info['secret']:'',
	            "authorize_url"=>'https://auth.'.phi::$conf['domain'],
	            "token_url"=>'https://auth.'.phi::$conf['domain'],
	            "refresh_token"=>'https://auth.'.phi::$conf['domain'],
	            "scope"=>""
			);
		}else{
			$providers=phi::$conf['oauth'];
			if(!isset($providers[$payload['provider']])){
				if(class_exists('API')) API::toHeaders(array('error'=>'invalid_provider'));
				else phi::clog('invalid_provider');
				die();
			}
			return $providers[$payload['provider']];
		}
	}
	public static function getProvider($app,$payload){
		if($app=='nectar'){
			$provider_info=self::getProviderInfo($payload);
		}else{
			$providers=phi::$conf['oauth'];
			if(!isset($providers[$app])) {
				if(class_exists('API')) API::toHeaders(array('error'=>'invalid_provider'));
				else phi::clog('invalid_provider');
				die();
			}
			$provider_info=$providers[$app];
		}
		$provider_info['redirect_url']='https://api.'.phi::$conf['domain'].'/oauth2/return/'.$app;
		$provider = new \League\OAuth2\Client\Provider\GenericProvider([
		    'clientId'                => $provider_info['client_id'],    // The client ID assigned to you by the provider
		    'clientSecret'            => $provider_info['client_secret'],   // The client password assigned to you by the provider
		    'redirectUri'             => $provider_info['redirect_url'],
		    'urlAuthorize'            => $provider_info['authorize_url'],
		    'urlAccessToken'          => $provider_info['token_url'],
		    'urlResourceOwnerDetails' => (isset($provider_info['resource_url']))?$provider_info['resource_url']:false
		]);
		return $provider;
	}
	public static function getUrl($r){
		$payload=(isset($r['qs']['payload']))?$r['qs']['payload']:'';
		if($payload['provider']=='stripe'){
			include_once(ROOT.'/api/stripe.php');
			return stripe::oAuth2($r);
		}
		$provider_info=self::getProviderInfo($payload);
		$app=$r['path'][3];
		$provider=self::getProvider($app,$payload);
		$authorizationUrl = $provider->getAuthorizationUrl(array('approval_prompt'=>'force'));
		if(isset($r['qs']['scope'])){
			if(!is_array($r['qs']['scope'])) $sp=explode(',', $r['qs']['scope']);
			else $sp=$r['qs']['scope'];
			if(is_array($sp)){
				if(!isset($provider_info['scope_separator'])) $provider_info['scope_separator']=',';
				$authorizationUrl.='&scope='.urlencode(implode($provider_info['scope_separator'], $sp));
			}
		}else if(isset($provider_info['scope'])&&sizeof($provider_info['scope'])){
			$authorizationUrl.='&scope='.$provider_info['scope'];
		}
		$data=parse_url($authorizationUrl);
		parse_str($data['query'],$qs);
		if(!isset($payload['uid'])&&!isset($payload['login'])) return array('error'=>'invalid_user');
		if(!isset($payload['app'])) return array('error'=>'invalid_app');
		$uid=$qs['state'];//unique iid
		$save=array(
			'id'=>$uid,//unique per app
			'url'=>$authorizationUrl,
			'site'=>$app,
			'payload'=>$payload,
			'ts'=>time()
		);
		if(isset($r['qs']['scope'])){
			if(is_array($r['qs']['scope'])){
				$save['payload']['scope']=implode(',', $r['qs']['scope']);
			}else{
				$save['payload']['scope']= $r['qs']['scope'];
			}
		}
		db2::save('oauth','temp',$save);
		if(isset($provider_info['qs_params'])) $authorizationUrl.=$provider_info['qs_params'];
		if(isset($r['qs']['authOptions'])){
			foreach ($r['qs']['authOptions'] as $k => $v) {
				$authorizationUrl.='&'.$k.'='.$v;
			}
		}
		#phi::log($authorizationUrl);
		if(isset($r['qs']['api'])){
			return array('success'=>true,'url'=>$authorizationUrl);
		}else{
			// redirect the browser to the authorization endpoint (with a 302)
			http_response_code(302);
			header(sprintf('Location: %s', $authorizationUrl));
		}
	}
	public static function backToApp($url){
		// $qsa=$_REQUEST;
		// $db=phi::getDB(false);
		// if($profile&&phi::isadmin($qsa['site'])&&!isset($profile['admin'])){
		// 	$url=explode('#',$qsa['origin']);
		// 	$turl=$url[0].'#error=invalid_creds';
		// }else if($error){
		// 	$url=explode('#',$qsa['origin']);
		// 	$turl=$url[0].'#error='.$error;
		// }else{
		// 	$url=explode('#',$qsa['origin']);
		// 	if($token){
		// 		$ret=md5($token.AUTH_SALT.time());
		// 		//store for 60 seconds
		// 		$db=phi::getDB(true,phi::db($qsa['site']));
		// 		$db->user->update(array('_id'=>$token),array('$set'=>array('tempauth'=>$ret)));
		// 		//check last error?
		// 		$turl=$url[0].'#temptoken='.$ret;
		// 	}else{
		// 		$turl=$url[0];
		// 	}
		// }
		#OAUTH2::log('return to tracker '.$url,1);
		header("Location: ".$url);
	    die();
	}
}
?>