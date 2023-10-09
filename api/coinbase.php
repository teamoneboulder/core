<?php
	error_reporting(1);
	class COINBASE{
		public static $coll=false;
		public static $db='';
		public static $ver=1;
		public static $creds='';
		public static $encription=false;//do this later
		public static $userid='';
		public static function getVer(){
			return array('ver'=>self::$ver);
		}
		public static function checkUser($r){
			if(isset($r['qs']['token'])){
				$c=db2::findOne(DB,'user_apps',array('_id'=>$r['qs']['token']));
				if($c){
					self::$userid=$c['uid'];
					if(isset($r['qs']['gid'])&&$r['qs']['gid']&&$c['uid']!=$r['qs']['gid']){//this is a community request!  Whoa...
						$com=GROUPUP::getUser($r['qs']['gid'],array('admins'));
						if(!$com||!in_array($c['uid'], $com['admins'])){
							return false;
						}else{
							self::$userid=$r['qs']['gid'];
							return true;
						}
					}
					return true;
				}else return false;
			}else if(isset($r['qs']['code'])){//lookup by code!
				$u=$db->user_creds->findOne(array('temp_creds.coinbasestate'=>$r['qs']['state']));
				if(!$u) return false;
				self::$userid=$u['_id'];
				return true;
			}else{
				return false;
			}
		}
		public static function getCreds(){
			return $creds;
		}
		public static function handleRequest($r,$coll,$retry=false){
			if(!$retry){
				self::$coll=$coll;
				self::$db=self::getDB();
				#sleep(8);
				include_once('/var/www/root/sites/groupup/api.php');//ensure its included!
				if($r['path'][3]!='webhook'){
					if(!self::checkUser($r)) return array('error'=>'invalid_user');
					if(self::$userid[0]=='C'){//enable for communities...holy shit
						$r['user']=GROUPUP::getUser(self::$userid,array('creds','creds_settings','temp_creds','name'));
						$r['user']['uid']=self::$userid;
					}else{
						$r['user']=GROUPUP::getUser(self::$userid,array('creds','creds_settings','temp_creds','uid','email','name'));
					}
				}
				self::$creds=self::getCreds();
			}
			switch ($r['path'][3]) {
				case 'get':
					if(!PROD){//internal testing
						switch ($r['path'][4]) {
							case 'balance':
								$out=self::getBalance($r);//internal testing
							break;
							case 'refresh':
								$out=self::refreshToken($r);//internal testing
							break;
							case 'account':
								$out=self::getPrimaryAccount($r);//internal testing
							break;
							case 'user':
								$out=self::getUserAccount($r);//internal testing
							break;
						}
					}
				break;
				case 'webhook':
					$out=self::parseWebHook($r);
				break;
				case 'unlink':
					GROUPUP::checkScope($r,array('coinbase::write'),self::$userid);
					$out=self::unlinkAccount($r);
				break;
				case 'transfer':
					GROUPUP::checkScope($r,array('coinbase::write'),self::$userid);
					$out=self::transfer($r);
				break;
				case 'transactions':
					GROUPUP::checkScope($r,array('coinbase::read'),self::$userid);
					$out=self::getTransactions($r);
				break;
				case 'buy':
					GROUPUP::checkScope($r,array('coinbase::write'),self::$userid);
					switch ($r['path'][4]) {
						case 'listpayments':
							$out=self::getPayments($r);
						break;
						case 'bitcoin':
							$out=self::buyBitcoin($r);
						break;
					}
				break;
				case 'card':
					switch ($r['path'][4]) {
						case 'submit':
							$out=self::issueCard($r);
						break;
						case 'check':
							$out=self::checkCard($r);
						break;
					}
				break;
				case 'oauth':
					$redir=$redir=PROTOCOL.API.'/groupup/coinbase/oauth/return';
					switch ($r['path'][4]) {
						case 'return':
							self::oauthReturn($r,$redir);
						break;
						case 'url':
							GROUPUP::checkScope($r,array('coinbase::write'),self::$userid);
							$out['url']=self::getAuthUrl($r,$redir);
							$out['success']=true;
						break;
					}
				break;
				default:
					$out=array('error'=>'method_not_found');
				break;
			}
			if(!isset($out)) $out=array('error'=>'method_not_found');
			if($out['errors']&&($out['error']=='The access token expired'||$primary['errors'][0]['id']=='invalid_token'||$primary['errors'][0]['id']=='expired_token')){//refresh token for coinbase and retry!
				if(!$retry){
					$r=self::refreshToken($r);
					if($r) $out=self::handleRequest($r,$coll,1);//retry it!
				}
			}
			if(isset($out['errors'])){
				$out['error']=$out['errors'][0]['message'];
				unset($out['errors']);
			}
			$out=phi::cleanData($out);
			return $out;
		}
		public static function checkCard($r){
			//check if already existing
			$cardinfo=GROUPUP::getUser(self::$userid,array('creds.shift'));
			if(isset($cardinfo['creds']['shift'])&&isset($cardinfo['creds']['shift']['cards'][0])){
				$cardid=$cardinfo['creds']['shift']['cards'][0];
				$card=$cardinfo['creds']['shift']['card'][$cardid];
				$cardholder=$cardinfo['creds']['shift']['id'];
				//$url='https://api.shiftpayments.com/cardholders/'.$cardholder;
				$url='https://api.shiftpayments.com/card/'.$card['id'];
				$resp=phi::curl($url,false,self::getShiftHeaders(),'GET');
				die(json_encode($resp));
			}else{
				return array('error'=>'no_cards');
			}
		}
		public static function issueCard($r){
			//check if already existing
			$cardinfo=GROUPUP::getUser(self::$userid,array('creds.shift'));
			$force=true;
			if(!isset($cardinfo['creds']['shift'])||$force){
				$wdb=phi::getDB(true,'groupup');
				$wdb->user_creds->update(array('_id'=>self::$userid),array('$unset'=>array('creds.shift'=>1)));
				$data=array(
					"design_key"=>"groupup_1",
					"first_name"=>"Tom",
					"last_name"=>"Bassett",
					"email"=>"tom@groupup.me",
					"phone_number"=>"+18157351272",
					"date_of_birth"=>"1989-06-24",
					"address"=>array(
						"street_one"=>"2871 Springdale Lane",
						"locality"=>"Boulder",
						"region"=>"CO",
						"postal_code"=>"80303",
						"country"=>"USA"
					),
					"document"=>array(
						"type"=>"SSN",
						"value"=>"123450000"
					)
				);
				#die(json_encode(self::getShiftHeaders()));
				$url='https://api.shiftpayments.com/cardholders';
				$resp=phi::curl($url,$data,self::getShiftHeaders(),'POST');
				if(isset($resp['cardholder'])){
					//saveit!
					$update['$set']['creds.shift.id']=$resp['cardholder']['id'];
					$update['$set']['creds.shift.email']=$resp['cardholder']['email'];
					$update['$set']['creds.shift.created']=strtotime($resp['cardholder']['created_at']);
					//card info
					$card=$resp['cardholder']['cards'][0]['card'];
					$cardid='card_'.$card['id'];
					$update['$set']['creds.shift.card.'.$cardid]=array(
						'id'=>$card['id'],
						'expiration'=>$card['expiration'],
						'cvv'=>$card['cvv'],
						'status'=>$card['status'],
						'activated'=>strtotime($card['activated_at']),
						'design_key'=>$card['design_key']
					);
					$update['$addToSet']['creds.shift.cards']=$cardid;
					GROUPUP::updateUser(self::$userid,$update);
					return array('success'=>true,'resp'=>$resp);
				}else{
					return array('error'=>'Error Issuing Card');
				}
			}else{
				return array('success'=>true,'message'=>'Card Already Issued');
			}
		}
		public static function getShiftHeaders(){
			$creds=array(
				'user'=>'pk_test_72bf76fa137a7a4f64e6de197e306b96',
				'password'=>''
			);
			$headers[]='Authorization: Basic '.base64_encode($creds['user'].':'.$creds['password']);
			$headers[]="Content-Type: application/x-www-form-urlencoded";
			return $headers;
		}
		public static function getPrimaryAccount($r){
			$url='https://api.coinbase.com/v2/accounts';
			$resp=phi::curl($url,false,self::getHeaders($r['user']['creds']['coinbase']['access_token']),'GET');
			$email=$resp['data']['email'];
			if(isset($resp['errors'])) return $resp;
			$info=false;
			if(isset($resp['data'])&&sizeof($resp['data'])){
				foreach ($resp['data'] as $k => $v) {
					if($v['primary']||true){
						$info=$v;
					}
				}
				if(!isset($info)){
					$info=$resp['data'][0];
				}
			}
			//die(json_encode($resp));
			return $info;
		}	
		public static function getUserEmail($r){
			$url='https://api.coinbase.com/v2/user';
			$resp=phi::curl($url,false,self::getHeaders($r['user']['creds']['coinbase']['access_token']),'GET');
			$email=$resp['data']['email'];
			return $email;
		}	
		public static function oauthReturn($r,$redir){
			$code=$r['qs']['code'];
			//exchange for access token!
			$url='https://api.coinbase.com/oauth/token';
			$postopts=array(
				'grant_type'=>'authorization_code',
				'code'=>$code,
				'client_id'=>self::$creds['client_id'],
				'client_secret'=>self::$creds['client_secret'],
				'redirect_uri'=>$redir
			);
			$resp=phi::curl($url,$postopts);
			if(isset($resp['access_token'])){
				$resp=phi::cleanData($resp);
				$r['user']['creds']['coinbase']=$resp;
				$primary=self::getPrimaryAccount($r);
				$resp['account_id']=$primary['id'];
				$resp['email']=self::getUserEmail($r);
				//encrypt access and refresh tokens
				$resp['access_token']=phi::encrypt($resp['access_token']);
				$resp['refresh_token']=phi::encrypt($resp['refresh_token']);
				GROUPUP::updateUser(self::$userid,array('$set'=>array('creds.coinbase'=>$resp),'$unset'=>array('temp_creds.coinbasestate'=>1,'temp_creds.coinbaseopts'=>1)));
				if(isset($r['user']['temp_creds']['coinbaseopts']['phonegap'])&&$r['user']['temp_creds']['coinbaseopts']['phonegap']){
					$redir=PROTOCOL.DOMAIN.'/success.html';
				}else{
					if(isset($r['user']['temp_creds']['coinbaseopts']['iframe'])&&(int) $r['user']['temp_creds']['coinbaseopts']['iframe']) $redir=PROTOCOL.DOMAIN.$r['user']['temp_creds']['coinbaseopts']['location'];
					else $redir=PROTOCOL.'app.'.DOMAIN.$r['user']['temp_creds']['coinbaseopts']['location'];//non-iframe
				}
				if(isset($r['user']['temp_creds']['coinbaseopts']['phonegap'])&&$r['user']['temp_creds']['coinbaseopts']['phonegap']) phi::redir($redir.'?success=linkedcoinbase');
				else phi::redir($redir.'#success=linkedcoinbase');
			}else{
				if(isset($r['user']['temp_creds']['coinbaseopts']['phonegap'])&&$r['user']['temp_creds']['coinbaseopts']['phonegap']) phi::redir($redir.'?error=coinbaseautherror');
				else phi::redir($redir.'#error=coinbaseautherror');
			}
		}
		public static function checkPasscode($r){
			///for ensuring passcode
			$q=array('_id'=>new MongoRegex('/'.$r['user']['uid'].'/'));
			$fc=self::$db->auth_fail->count($q);
			if($fc>=5) return array('error'=>'Too many failed attempts on this account.  You are only allowed 5 failed attempts in 1 day.  Please try again later');
			//check the code!
			$wdb=GROUPUP::getDB(true);
			if(!isset($r['user']['creds_settings']['coinbase_pin'])||$r['user']['creds_settings']['coinbase_pin']!=$r['qs']['code']){
				$wdb->auth_fail->save(array('_id'=>$r['user']['uid'].'_'.time(),'ip'=>phi::getIP(),'ts'=>time()));
				return array('error'=>'Invalid Pin, '.(5-$fc).' attempts remaining');
			}
			//clear on success
			$wdb->auth_fail->remove($q);
			return false;
			///for e
		}
		public static function transfer($r){
			#die(json_encode($r));
			if(!isset($r['qs']['amount'])||!$r['qs']['amount']) return array('error'=>'invalid_amount');
			if(!isset($r['qs']['to'])||!$r['qs']['to']) return array('error'=>'no_to');
			if(!isset($r['qs']['gid'])||!$r['qs']['gid']) return array('error'=>'no_from');
			if(!isset($r['qs']['type'])||!$r['qs']['type']) return array('error'=>'no_type');
			if(!isset($r['qs']['code'])||!$r['qs']['code']) return array('error'=>'no_code');
			if($r['qs']['type']=='card'){//do transfer to their account first
				return array('error'=>'Feature Coming Soon, If you need to do this, please add funds to your Coinbase account from the Bank Settings in GroupUp.');
			}
			//to ensure passcode
			$shouldreturn=self::checkPasscode($r);
			if($shouldreturn) return $shouldreturn;

			$description=(isset($r['qs']['description']))?$r['qs']['description']:'TEST PAYMENT';
			$r['qs']['to']=($r['qs']['to']=='groupup')?'C9OoaCwaD':$r['qs']['to'];
			$sendto=GROUPUP::getUser($r['qs']['to'],array('name','creds','email','pic'));
			if(!$sendto||!$sendto['creds']['coinbase']){
				return array('error'=>'reciever_not_configured');
			}
			$sendto['uid']=$r['qs']['to'];
			$account=$r['user']['creds']['coinbase']['account_id'];
			$amount=$r['qs']['amount'];
			if(isset($sendto['creds']['coinbase']['email'])){
				$to=$sendto['creds']['coinbase']['email'];//use the same email the user created their groupup account with.
			}else{
				$to=$sendto['email'];//non coinbase person
			}
			$idem=phi::niceGUID(array(
				'len'=>8,
				'pre'=>'T'
			));
			$transferopts=array(
				'type'=>'send',
				'to'=>$to,
				'amount'=>$amount,
				'currency'=>'USD',
				'description'=>$description,
				'idem'=>$idem
			);
			$transferurl='https://api.coinbase.com/v2/accounts/'.$account.'/transactions';
			$resp=phi::curl($transferurl,$transferopts,self::getHeaders($r['user']['creds']['coinbase']['access_token']));
			if(isset($resp['data']['status'])&&$resp['data']['status']=='completed'){//should always be completed right away, sending to email
				//save relevant info!
				$id=$idem.'_'.$r['user']['uid'].'_'.$sendto['uid'];
				$wdb=GROUPUP::getDB(true);
				$bc=abs((float) $resp['data']['amount']['amount']);//bitcoin amount
				$trans=array(
					'_id'=>$id,
					'cid'=>$resp['data']['id'],
					'to'=>$sendto['uid'],
					'from'=>$r['user']['uid'],
					'amount'=>$amount,
					'type'=>'transfer',
					'status'=>'completed',
					'bc'=>$bc,
					'description'=>$description,
					'ts'=>time()
				);
				$wdb->transactions->save($trans);
				GROUPUP::sendUserNotice($sendto['uid'],$r['user']['uid'],'money_sent',array('tid'=>$id));
				GROUPUP::sendUserNotice($r['user']['uid'],$sendto['uid'],'money_received',array('tid'=>$id));
				$receipt=array(
					'sendto'=>array(
						'name'=>$sendto['name'],
						'pic'=>$sendto['pic']
					),
					'amount'=>$resp['data']['amount'],
					'native_amount'=>$resp['data']['native_amount'],
				);
				return array('success'=>true,'receipt'=>$receipt);
			}else{
				if(isset($resp['errors'][0]['message'])) return $resp;
				else return array('error'=>'unknown_error');
			}
		}
		public static function unlinkAccount($r){
			//self::updateUser($r['user']['uid'],array('$unset'=>array('creds.dwolla'=>1,'creds.dwolla_info'=>1)));
			GROUPUP::updateUser($r['user']['uid'],array('$unset'=>array('creds.coinbase'=>1,'creds_settings.coinbase_pin'=>1)));
			return array('success'=>true);
		}
		public static function parseWebHook($r,$data=false){
			$wdb=self::getDB(true);
			if(!$data){
				phi::log('coinbase webhook');
				$json = file_get_contents('php://input');
				$data = json_decode($json, true);
				$obj=array('data'=>$data,'ts'=>time());
				$wdb->coinbase_webhook->save($obj);
				#phi::log($data);
			}
			if(!isset($data['type'])) return false;
			$id=$data['data']['id'];
			switch ($data['type']) {
				case 'wallet:buys:completed':
					$wdb->transactions->update(array('cid'=>$id),array('$set'=>array('status'=>'completed')));
				break;
				case 'wallet:buys:canceled':
					$wdb->transactions->update(array('cid'=>$id),array('$set'=>array('status'=>'canceled')));
				break;
			}
		}
		public static function buyBitcoin($r){
			if(!isset($r['qs']['amount'])||!$r['qs']['amount']) return array('error'=>'invalid_amount');
			if(!isset($r['qs']['id'])||!$r['qs']['id']) return array('error'=>'no_id');
			//to ensure passcode
			$shouldreturn=self::checkPasscode($r);
			if($shouldreturn) return $shouldreturn;
			$amount=$r['qs']['amount'];
			$amount=(float) $amount;
			if(!is_numeric($amount)||!is_float($amount)) return array('error'=>'invalid_amount');
			if($amount>100) return array('error'=>'amount_too_high');
			if($amount<1.5) return array('error'=>'amount_too_low');
			$id=$r['qs']['id'];
			$accountid=$r['user']['creds']['coinbase']['account_id'];
			if(!isset($r['user']['creds']['coinbase']['funding'][$id])) return array('error'=>'invalid_funding_source');
			$resource=$r['user']['creds']['coinbase']['funding'][$id];
			//save last used funding source
			GROUPUP::updateUser($r['user']['uid'],array('$set'=>array('creds.coinbase.last_used'=>$id)));
			//create reqeust
			$url='https://api.coinbase.com/v2/accounts/'.$accountid.'/buys';
			//$amount=1.5;
			$postopts=array(
				'amount'=>$amount,//ensures that amount is there
				'currency'=>'USD',
				'payment_method'=>$resource
			);
			$resp=phi::curl($url,$postopts,self::getHeaders($r['user']['creds']['coinbase']['access_token']));
			#phi::log($resp);
			if(!isset($resp['errors'])){
				//save it in transactions!
				$bc=(float) $resp['data']['amount']['amount'];
				$receipt=array(
					'fees'=>$resp['data']['fee']['amount'],
					'subtotal'=>$resp['data']['subtotal']['amount'],
					'total'=>$resp['data']['total']['amount'],
					'bitcoin'=>$bc
				);	
				$wdb=GROUPUP::getDB(true);
				$id=$resp['data']['id'].'_'.$r['user']['uid'];
				$trans=array(
					'_id'=>$id,
					'cid'=>$resp['data']['id'],
					'type'=>'funds_added',
					'amount'=>(float) $amount,
					'bc'=>$bc,
					'status'=>$resp['data']['status'],
					'ts'=>time()
				);
				$wdb->transactions->save($trans);
				GROUPUP::sendUserNotice($r['user']['uid'],$r['user']['uid'],'funds_added',array('tid'=>$id));
				return array('success'=>true,'receipt'=>$receipt);
			}else{
				return array('error'=>$resp['errors'][0]['message']);
			}
		}
		public static function getHeaders($token,$headers=array()){
			//$headers[]='Content-Type: application/json';
			$headers[]='CB-VERSION: 2017-01-23';
			$headers[]='Authorization: Bearer '.$token;
			//$headers[]='User-Agent: coinbase/php/2.5.0';
			return $headers;
		}
		public static function getData($obj){
			$i=0;
			while($obj->has($i)){
				$out[$i]=$obj->get($i)->getRawData();
				$i++;
			}
			return $out;
		}
		public static function getPayments($r,$retry=false){
			if(!self::$creds) self::$creds=self::getCreds();
			if(isset($r['user']['creds']['coinbase']['access_token'])&&isset($r['user']['creds']['coinbase']['refresh_token'])){
				$url='https://api.coinbase.com/v2/payment-methods';
				$resp=phi::curl($url,false,self::getHeaders($r['user']['creds']['coinbase']['access_token']),'GET');
				if(isset($resp['errors'])) return $resp;//allows for proper refresh of token
				foreach ($resp['data'] as $k => $v) {
					if($v['type']=='debit_card'&&$v['allow_buy']&&$v['instant_buy']){
						$id=md5($v['id']);
						$val=array(
							'pid'=>$id,
							'name'=>$v['name'],
							'type'=>$v['type'],
							'currency'=>$v['currency']
						);
						if(isset($r['user']['creds']['coinbase']['last_used'])&&$r['user']['creds']['coinbase']['last_used']==$id) $val['primary']=1;
						$valid[]=$val;
						$save[$id]=$v['id'];
					}
				}
				if(!isset($valid)) $vaild=false;
				else{
					GROUPUP::updateUser($r['user']['uid'],array('$set'=>array('creds.coinbase.funding'=>$save)));
				}
				$out=array('success'=>true,'sources'=>$valid);
				if(isset($r['qs']['sendto'])){
					$u=GROUPUP::getUser($r['qs']['sendto'],array('name','pic','aka','creds'));
					$out['sendto']=array(
						'name'=>$u['name'],
						'pic'=>$u['pic'],
						'aka'=>$u['aka'],
						'uid'=>$r['qs']['sendto'],
						'ebank'=>(isset($u['creds']['coinbase']))?1:0
					);
				}
				if(isset($r['qs']['balance'])){
					$balance=self::getBalance($r);
					$out['balance']=$balance['balance'];
				}
				return $out;
			}else{
				return array('error'=>'coinbase_not_linked');
			}
		}

		public static function getBalance($r,$retry=false){//only called internally,refresh if needed
			if(!self::$creds) self::$creds=self::getCreds();
			if(isset($r['user']['creds']['coinbase']['access_token'])&&isset($r['user']['creds']['coinbase']['refresh_token'])){
				$primary=self::getPrimaryAccount($r);
				if(isset($primary['errors'])){
					if(($primary['errors'][0]['id']=='invalid_token'||$primary['errors'][0]['id']=='expired_token')&&!$retry){
						$r=self::refreshToken($r);
						return self::getBalance($r,1);
					}else{
						return array('error'=>$primary['errors'][0]['message']);
					}
				}
				$balance=array('balance'=>$primary['balance'],'native_balance'=>$primary['native_balance']);
				return array('balance'=>$balance);
			}else{
				return array('error'=>'coinbase_not_linked');
			}
		}
		public static function refreshToken($r){
			$url='https://api.coinbase.com/oauth/token';
			$postopts=array(
				'grant_type'=>'refresh_token',
				'client_id'=>self::$creds['client_id'],
				'client_secret'=>self::$creds['client_secret'],
				'refresh_token'=>$r['user']['creds']['coinbase']['refresh_token']
			);
			$resp=phi::curl($url,$postopts);
			if(isset($resp['access_token'])){
				$r['user']['creds']['coinbase']['access_token']=$resp['access_token'];
				$r['user']['creds']['coinbase']['refresh_token']=$resp['refresh_token'];
				GROUPUP::updateUser($r['user']['uid'],array('$set'=>array('creds.coinbase.access_token'=>phi::encrypt($resp['access_token']),'creds.coinbase.refresh_token'=>phi::encrypt($resp['refresh_token']))));
				return $r;
			}else{
				phi::log('coinbase auth error');
				phi::log($resp);
				return false;
			}
		}
		public static function getAuthUrl($r,$redir){
			$scopes=array('wallet:user:read','wallet:user:email','wallet:accounts:read','wallet:transactions:send','wallet:transactions:send','wallet:buys:create','wallet:payment-methods:read');
			$state=phi::niceGUID(array(
				'len'=>7,
				'pre'=>'P',
				'unique'=>array('collection'=>'groupup','table'=>'user_creds','field'=>'temp_creds.coinbasestate')
			));
			$cbopts=array(
				'token'=>$r['qs']['token']
			);
			if(isset($r['qs']['location'])&&$r['qs']['location']){
				$cbopts['location']=$r['qs']['location'];
			}
			if(isset($r['qs']['iframe'])&&$r['qs']['iframe']){
				$cbopts['iframe']=$r['qs']['iframe'];
			}
			if(isset($r['qs']['phonegap'])&&$r['qs']['phonegap']){
				$cbopts['phonegap']=1;
			}
			if(isset($r['qs']['gid'])&&$r['qs']['gid']){
				$cbopts['gid']=$r['qs']['gid'];
			}
			GROUPUP::updateUser($r['user']['uid'],array('$set'=>array('temp_creds.coinbasestate'=>$state,'temp_creds.coinbaseopts'=>$cbopts)));
			if(PROD) $meta='&meta[send_limit_amount]=100&meta[send_limit_currency]=USD&meta[send_limit_period]=day';
			else $meta='&meta[send_limit_amount]=1&meta[send_limit_currency]=USD&meta[send_limit_period]=day';
			return 'https://www.coinbase.com/oauth/authorize?state='.$state.'&client_id='.self::$creds['client_id'].'&redirect_uri='.urlencode($redir).'&response_type=code&scope='.urlencode(implode(',', $scopes)).$meta.'&r=57df7da2d2b2cc6956962c76';//this is my referral link
		}
	}
?>
