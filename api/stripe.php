<?php
	class stripe{
		public static $store='';
		public static $testing=0;
		public static function handleRequest($r){
			self::$store=$r['path'][2];
			include_once(ROOT.'/sites/one_core/one_core.api');
			if(!isset($r['auth'])&&isset($r['qs']['appid'])) $r=API::authUser($r,$r['qs']['appid']);
			try{
				switch ($r['path'][3]) {
					case 'link':
						$out=self::link($r);
					break;
					case 'nextcycle':
						$out=self::nextCycle($r);
					break;
					case 'dashboard':
						$out=self::dashboard($r);
					break;
					case 'loadsettings':
						$out=self::loadSettings($r);
					break;
					case 'requestlink':
						$out=self::requestLink($r);
					break;
					case 'retrylink':
						$out=self::retryLink($r);
					break;
					case 'payinvoice':
						$out=self::payInvoice($r);
					break;
					case 'return':
						$out=self::return($r);
					break;
					case 'refresh':
						$out=self::refresh($r);
					break;
					case 'addcard':
						$out=self::addCard($r);
					break;
					case 'load':
						$out=self::load($r);
					break;
					case 'stop':
						$out=self::stop($r);
					break;
					case 'addanoncard':
						$out=self::addAnonCard($r);
					break;
					case 'updatesubscription':
						$out=self::updateSubscription($r);
					break;
					case 'webhook':
						$out=self::webhook($r);
					break;
					default:
					 	$out=array('error'=>'invalid_request');
					break;
				}
				return $out;
			}catch(Exception $e){
				$out=array('error'=>'internal_error');
				if(!phi::$conf['prod']) $out['message']=$e->getMessage();
				return $out;
			}
		}
		public static function loadSettings($r){
			$u=db2::findOne(DB,'user',['id'=>$r['auth']['uid']],['projection'=>['id'=>1,'name'=>1,'pic'=>1]]);
			if(!$u) return ['error'=>'invalid_page'];
			//get pages they are admin for
			$pages=db2::toOrderedList(db2::find(DB,'page',['hidden'=>['$exists'=>false],'admins'=>['$in'=>[$u['id']]]],['projection'=>['id'=>1,'name'=>1,'pic'=>1]]));
			if($pages){
				$ids=$pages['order'];
			}
			$ids[]=$u['id'];
			$accounts=db2::toOrderedList(db2::find(DB,'stripe',['id'=>['$in'=>$ids]]));
			$data['express']['list'][$u['id']]=$u;
			$data['express']['order'][]=$u['id'];
			if(isset($accounts['list'][$u['id']])) $data['express']['list'][$u['id']]['account']=$accounts['list'][$u['id']];
			if($pages){
				foreach ($pages['list'] as $k => $v) {
					$data['express']['list'][$v['id']]=$v;
					$data['express']['order'][]=$v['id'];
					if(isset($accounts['list'][$v['id']])) $data['express']['list'][$v['id']]['account']=$accounts['list'][$v['id']];
				}
			}
			$data['cards']=self::getCards($r['auth']['uid']);
			include_once(ROOT.'/api/class/formbuilder.php');
			$data['invoices']=formbuilder::feed([
				'auth'=>$r['auth'],
				'qs'=>[
					'schema'=>'invoice'
				]
			],[
				'page.id'=>$r['auth']['uid']
			]);
			db2::toOrderedList(db2::find(DB,'invoice',['page.id'=>$u['id'],'paid'=>0]));
			return array('success'=>true,'data'=>$data);
		}
		public static function refresh($r){
			$uid=$r['path'][4];
			phi::log('stripe refresh ['.$uid.']');
			$u=db2::findOne(DB,'user',['id'=>$uid]);
			if(!$u) $u=db2::findOne(DB,'page',['id'=>$uid]);
			if(!$u) return ['error'=>'invalid_page'];
			$current=db2::findOne(DB,'stripe',['id'=>$uid]);
			$stripe = self::getStripeKeys();
			\Stripe\Stripe::setApiKey($stripe['secret_key']);
			$account_links = \Stripe\AccountLink::create([
			  'account' => $current['express']['id'],
			  'refresh_url' => 'https://api.'.phi::$conf['domain'].'/stripe/one_core/refresh/'.$u['id'],
			  'return_url' => 'https://api.'.phi::$conf['domain'].'/stripe/one_core/return/'.$u['id'],
			  'type' => 'account_onboarding',
			]);
			if(isset($account_links['url'])) phi::redir($account_links['url']);
			return ['error'=>'error creating account link'];
		}
		public static function retryLink($r){
			$d=phi::ensure($r,['id']);
			$current=db2::findOne(DB,'stripe',['id'=>$d['id']]);
			$current=self::validatePayoutAccount($current);
			if(!isset($current['express']['linked'])){
				return ['error'=>'Payout account not linked'];
			}
			return ['success'=>true,'data'=>$current];
		}
		public static function requestLink($r){
			$d=phi::ensure($r,['invoice']);
			$invoice=db2::findOne(DB,'invoice',['id'=>$d['invoice']]);
			$last=db2::findOne(DB,'invoice_link',['id'=>$invoice['page']['id']]);
			if($last&&$last['ts']>(time()-(60*60*24*1))){
				return ['error'=>'Already sent within last day'];
			}
			phi::emitHook(phi::$conf['dbname'],time(),array(
				'id'=>'invoice_link_account',
				'data'=>array(
					'app_id'=>$r['qs']['appid'],
					'to'=>$invoice['page'],
					'for'=>(isset($invoice['link']))?$invoice['link']:false,
					'invoice'=>$invoice['id']
				)
			));
			db2::update(DB,'invoice_link',['id'=>$invoice['page']['id']],['$set'=>['id'=>$invoice['page']['id'],
				'ts'=>time()]],['upsert'=>true]);
			return ['success'=>true];
		}
		public static function validatePayoutAccount($current){
			phi::log('⚠️ validatePayoutAccount');
			$stripe = self::getStripeKeys();
			$stripe = new \Stripe\StripeClient($stripe['secret_key']);
			$capability=$stripe->accounts->retrieveCapability(
			  $current['express']['id'],
			  'transfers',
			  []
			);
			if($capability['status']=='active'){
				$current['express']['linked']=1;
				unset($current['express']['code']);
				db2::update(DB,'stripe',['id'=>$current['id']],['$set'=>['express.linked'=>1],'$unset'=>['express.code'=>1]]);
				phi::log('🔥Update Payout to Active');
			}
			return $current;
		}
		public static function payInvoice($r){
			$invoice=db2::findOne(DB,'invoice',['id'=>$r['qs']['invoice_id']]);
			if(!$invoice) return array('error'=>'invalid_invoice');
			if(isset($invoice['transfer_id'])) return array('error'=>'Invoice has already been paid!');
			$current=db2::findOne(DB,'stripe',['id'=>$invoice['page']['id']]);
			if(!isset($current['express']['linked'])){
				if(isset($current['express']['code'])){
					//see if just not returned
					$current=self::validatePayoutAccount($current);
					if(!isset($current['express']['linked'])){
						return ['error'=>'Payout account not linked'];
					}
				}else{
					return ['error'=>'Payout account not linked'];
				}
			}
			$stripe = self::getStripeKeys();
			$stripe = new \Stripe\StripeClient($stripe['secret_key']);
			$capability=$stripe->accounts->retrieveCapability(
			  $current['express']['id'],
			  'transfers',
			  []
			);
			if($capability['status']!='active'){
				if(phi::$conf['prod']){
					phi::log('transfers not enabled yet: '.json_encode($capability));
					return ['error'=>'Transfer capability not enabled yet'];
				}
			}
			if($capability['status']=='active'){
				$res=json_decode(json_encode($stripe->transfers->create([
				  'amount' => $invoice['total'],
				  'currency' => 'usd',
				  'destination' => $current['express']['id']
				])),1);
			}
			if(isset($res['id'])||($capability['status']!='active'&&!phi::$conf['prod'])){
				include_once(ROOT.'/api/class/formbuilder.php');
				if(isset($res['id'])){
					db2::update(DB,'stripe_transfer',['id'=>$res['id']],['$set'=>$res],['upsert'=>true]);
					db2::update(DB,'invoice',['id'=>$invoice['id']],['$set'=>[
						'paid'=>1,
						'paid_info'=>[
							'by'=>[
								'id'=>$r['auth']['uid'],
								'type'=>'user'
							],
							'ts'=>time()
						],
						'transfer_id'=>$res['id']
					]]);
				}else if(!phi::$conf['prod']){//dev testing
					db2::update(DB,'invoice',['id'=>$invoice['id']],['$set'=>[
						'paid'=>1,
						'paid_info'=>[
							'by'=>[
								'id'=>$r['auth']['uid'],
								'type'=>'user'
							],
							'ts'=>time()
						]
					]]);
				}
				phi::emitHook(phi::$conf['dbname'],time(),array(
					'id'=>'invoice_paid',
					'data'=>array(
						'app_id'=>$r['qs']['appid'],
						'to'=>$invoice['page'],
						'from'=>[
							'id'=>'one_boulder',
							'type'=>'page'
						],
						'invoice'=>$invoice['id']
					)
				));
				//update invoice!
				$r['auth']['internal']=true;
				$data=formbuilder::load([
					'auth'=>$r['auth'],
					'qs'=>[
						'schema'=>'invoice',
						'id'=>$invoice['id']
					]
				]);
				phi::push('','admin_balance',array('type'=>'balance'));
				return ['success'=>true,'data'=>$data['current']];
			}else{
				phi::log('error with transfer: '.json_encode($res));
				return ['error'=>'error with transfer'];
			}
		}
		public static function dashboard($r){
			$uid=(isset($r['qs']['page']))?$r['qs']['page']:'';
			$u=db2::findOne(DB,'user',['id'=>$uid]);
			if(!$u){
				$u=db2::findOne(DB,'page',['id'=>$uid]);
				if(!in_array($r['auth']['uid'], $u['admins'])) return ['error'=>'must be admin to link account'];
			}
			if(!$u) return ['error'=>'invalid_page'];
			$current=db2::findOne(DB,'stripe',['id'=>$uid]);
			$stripe = self::getStripeKeys();
			\Stripe\Stripe::setApiKey($stripe['secret_key']);
			$links=\Stripe\Account::createLoginLink($current['express']['id']);
			if(isset($links['url'])) return ['success'=>true,'data'=>$links];
			return ['error'=>'error getting link to dashboard, please try again'];
			#die(json_encode($links));
		}
		public static function return($r){
			$uid=(isset($r['path'][4]))?$r['path'][4]:'';
			$code=(isset($r['path'][5]))?$r['path'][5]:'';
			$u=db2::findOne(DB,'user',['id'=>$uid]);
			if(!$u) $u=db2::findOne(DB,'page',['id'=>$uid]);
			if(!$u) return ['error'=>'invalid_page'];
			$current=db2::findOne(DB,'stripe',['id'=>$uid]);
			if(!$code||$current['express']['code']!=$code){
				if(phi::$conf['prod']) return ['error'=>'invalid_code'];
			}
			$stripe = self::getStripeKeys();
			$stripe = new \Stripe\StripeClient($stripe['secret_key']);
			$account['id']=$current['express']['id'];
			$account_data=$stripe->accounts->retrieve(
			  $account['id'],
			  []
			);
			#die(json_encode($account_data));
			if(isset($account_data['details_submitted'])&&$account_data['details_submitted']){
				phi::log('🚀 '.$u['name'].' Linked a Stripe Express account');
				db2::update(DB,'stripe',['id'=>$uid],['$set'=>['express.linked'=>1],'$unset'=>['express.code'=>1]]);
				//try to pay out any invoices!!!
				self::payoutInvoices($uid,'2366d44c84409765d9a00619aea4c1234');//appid not set
				phi::redir('https://app.'.phi::$conf['domain'].'#response=stripe_linked');
			}else{
				return ['error'=>'Error linking account'];
			}
		}
		public static function payoutInvoices($uid,$appid){
			$invoices=db2::toOrderedList(db2::find(DB,'invoice',['page.id'=>$uid,'paid'=>0]));
			if(isset($invoices['list'])){
				foreach($invoices['list'] as $k => $v){
					$res=self::payInvoice([
						'auth'=>['uid'=>$uid],
						'qs'=>[
							'invoice_id'=>$v['id'],
							'appid'=>$appid
						]
					]);
					phi::log('🚀 payout on stripe link!!! '.json_encode($res));
				}
			}else{
				phi::log('nothing to pay out');
			}
		}
		public static function link($r){
			$page_id=$r['qs']['page'];
			phi::log('try to link stripe to : '.$page_id);
			$u=db2::findOne(DB,'user',['id'=>$page_id]);
			if(!$u){
				$u=db2::findOne(DB,'page',['id'=>$page_id]);
				//ensure they are an admin!
				if(!in_array($r['auth']['uid'], $u['admins'])) return ['error'=>'must be admin to link account'];
			}
			if(!isset($u['email'])) return ['error'=>'Page needs to have an email associated with it. Please contact an admin.'];
			$current=db2::findOne(DB,'stripe',['id'=>$page_id]);
			if(isset($current['express']['linked'])){
				if(phi::$conf['prod']) return ['error'=>'Account Already Linked'];
			}
			$stripe = self::getStripeKeys();
			\Stripe\Stripe::setApiKey($stripe['secret_key']);
			$stripe = new \Stripe\StripeClient($stripe['secret_key']);
			if(isset($current['express'])){
				$account['id']=$current['express']['id'];
				//check the account
				$account_data=$stripe->accounts->retrieve(
				  $account['id'],
				  []
				);
				if(isset($account_data['details_submitted'])&&$account_data['details_submitted']){
					return ['error'=>'Account Already Linked'];
				}
			}else{
				$account=$stripe->accounts->create([
				  'type' => 'express',
				  'country' => 'US',
				  'email' => $u['email'],
				  'capabilities' => [
				    'card_payments' => ['requested' => true],
	    			'transfers' => ['requested' => true]
				  ]
				]);
				if(!isset($account['id'])) return ['error'=>'error creating account'];
				db2::update(DB,'stripe',['id'=>$page_id],['$set'=>['express'=>['id'=>$account['id']]]],['upsert'=>true]);
			}
			$code=md5(time().AUTH_SALT.$r['auth']['uid']);
			db2::update(DB,'stripe',['id'=>$page_id],['$set'=>['express.code'=>$code]]);
			$account_links = \Stripe\AccountLink::create([
			  'account' => $account['id'],
			  'refresh_url' => 'https://api.'.phi::$conf['domain'].'/stripe/one_core/refresh/'.$u['id'].'/'.$code,
			  'return_url' => 'https://api.'.phi::$conf['domain'].'/stripe/one_core/return/'.$u['id'].'/'.$code,
			  'type' => 'account_onboarding',
			  'collect' => 'eventually_due'
			]);
			if(isset($account_links['url'])) return ['success'=>true,'data'=>$account_links];
			phi::log('account: '.json_encode($account_links));
			return ['error'=>'error creating account link'];
		}
		public static function stop($r,$uid=false,$from_stripe=false){
			if(!$uid){
				$uid=$r['auth']['uid'];
			}
			$current=db2::findOne(DB,'subscription',array('page.id'=>$uid,'status'=>'active'));
			if(!$current) return array('error'=>'No Subscription to Cancel');
			if(!$from_stripe){
				$stripe = self::getStripeKeys();
				$client=\Stripe\Stripe::setApiKey($stripe['secret_key']);
				$sub = \Stripe\Subscription::retrieve($current['stripe']['id']);
			}
			if($from_stripe||!$sub['canceled_at']){
				ONE_CORE::update('current_subscription_info',array('page.id'=>$uid),array(
					'canceled'=>time()
				));//must happne before webhook
				if(!$from_stripe) $sub->cancel();
				//flag the subscription!
				ONE_CORE::update('subscription',array('id'=>$current['id']),array(
					'status'=>'canceled'
				));
				//bump back down to explorer
				//wait till their valid_until expires, handled in admin
				// ONE_CORE::update('user',array('id'=>$uid),array(
				// 	'level'=>'explorer'
				// ));
				//more login later, with other integrations
				self::stopCobotMember($uid);
			}else{
				phi::log('Plan already canceled');
				return array('error'=>'Plan Already Canceled');
			}
			return array('success'=>true);
		}
		public static function load($r){
			$data['cards']=self::getCards($r['auth']['uid']);
			$u=db2::findOne(DB,'user',array('id'=>$r['auth']['uid']));
			$data['membership']=self::getMembershipRanges($u);
			$current=db2::findOne(DB,'current_subscription_info',array('page.id'=>$r['auth']['uid']));
			$data['status']=self::getCurrentStatus($current);
			$data['current']=$current;
			$data['subscription']=db2::findOne(DB,'subscription',array('page.id'=>$r['auth']['uid'],'status'=>'active'));
			$data['prePayActive']=false;
			if($current){
				$data['nextCycleAmount']=self::getPaymentAmount($current,$current['valid_until']);
				$data['prePayActive']=self::isPrepayActive($current);
			}
			return array('success'=>true,'data'=>$data);
		}
		public static function nextCycle($r){
			$d=phi::ensure($r,['current']);
			$current=db2::findOne(DB,'current_subscription_info',array('page.id'=>$r['auth']['uid']));
			if($d['current']&&$current){
				$data['nextCycleAmount']=self::getPaymentAmount($d['current'],$current['valid_until']);
			}else{
				$data['nextCycleAmount']=false;
			}
			return array('success'=>true,'data'=>$data);
		}
		public static function stopCobotMember($uid){
			include_once(phi::$conf['root'].'/api/oauth2.php');
			$accounts=db2::findOne(DB,'user_account',['id'=>$uid]);
			if(!isset($accounts['cobot']['id'])){
				phi::log($uid.' - couldnt cancel cobot membership, doesnt exist');
				return false;
			}
			$current_info=db2::findOne(DB,'current_subscription_info',array('page.id'=>$uid));
			$date=DateTime::createFromFormat( 'U', $current_info['valid_until'] );
			$anchor=$date->format('Y/m/d');
			$res=OAUTH2::get(array(
				'app'=>'one',
				'uid'=>'admin',
				'app_id'=>'cobot',
				'type'=>'POST',
				'url'=>'https://XXXXX.cobot.me/api/memberships/'.$accounts['cobot']['id'].'/cancellation',
				'data'=>array(
					'date'=>$anchor,
					'delete_all_bookings_on_cancellation'=>false
				),
				'force_app_token'=>true
			));
			if(isset($res['id'])){
				$accounts['cobot']['canceled']=1;
				ONE_CORE::update('user_account',array('id'=>$uid),array(
					'cobot'=>$accounts['cobot']
				));
				phi::log('successfully canceled cobot for ['.$uid.']');
				return true;
			}else{
				phi::log('error canceling cobot for ['.$uid.']');
				phi::log('resp : '.json_encode($res));
				return false;
			}
		}
		public static function ensureCobotMember($uid,$plan_id,$change_date=false){
			include_once(phi::$conf['root'].'/api/oauth2.php');
			// if(!phi::$conf['prod']){
			// 	phi::log('cobot member linking disabled in dev');
			// 	return true;
			// }
			$u=db2::findOne(DB,'user',['id'=>$uid]);
			$accounts=db2::findOne(DB,'user_account',['id'=>$uid]);
			$created=false;
			if(isset($accounts['cobot'])) $created=true;
			// $date = new DateTime('now');
			// $date->modify('first day of next month');
			// $date->setTime(12,0,0);//noon
			// $anchor=$date->format('Y/m/d');
			//die('anchor '.$anchor);
			if(!$created){
				$res=OAUTH2::get(array(
					'app'=>'one',
					'uid'=>'admin',
					'app_id'=>'cobot',
					'type'=>'POST',
					'url'=>'https://XXXXX.cobot.me/api/memberships',
					'data'=>array(
						'address'=>[
							'company'=>'ONE|Boulder',
							'name'=>(phi::$conf['prod'])?$u['name']:$u['name'].' (DEV)'
						],
						'email'=>$u['email'],
						// 'first_invoice_at'=>$anchor,
						// 'prorate_first_invoice'=>true,
						'pre_approved'=>true,
						'plan'=>[
							'id'=>$plan_id
						]
					),
					'force_app_token'=>true
				));
				if(isset($res['id'])){
					#phi::log('successful cobot membership creation! '.json_encode($res));
					$res2=OAUTH2::get(array(
						'app'=>'one',
						'uid'=>'admin',
						'app_id'=>'cobot',
						'type'=>'PUT',
						'url'=>'https://XXXXX.cobot.me/api/memberships/'.$res['id'].'/picture',
						'data'=>array(
							'url'=>phi::getImg($u['pic'],'square')
						),
						'force_app_token'=>true
					));
					$res3=OAUTH2::get(array(
						'app'=>'one',
						'uid'=>'admin',
						'app_id'=>'cobot',
						'type'=>'POST',
						'url'=>'https://XXXXX.cobot.me/api/memberships/'.$res['id'].'/invitations',
						'force_app_token'=>true
					));
					$url=$res3['user_url'];
					ONE_CORE::update('user_account',array('id'=>$uid),array(
						'cobot'=>[
							'id'=>$res['id'],
							'plan'=>$plan_id,
							'pending'=>true,
							'invite_url'=>$url
						]
					));
					return array('create_url'=>$url);
				}else{
					phi::alertAdmin('Error creating cobot membership!');
					return false;
				}
			}else{
				if(isset($accounts['cobot']['canceled'])){
				//remove any cancelations if there are any - this may not have happened on our side
					$res5=OAUTH2::get(array(
						'app'=>'one',
						'uid'=>'admin',
						'app_id'=>'cobot',
						'type'=>'DELETE',
						'url'=>'https://XXXXX.cobot.me/api/memberships/'.$accounts['cobot']['id'].'/cancellation',
						'force_app_token'=>true
					));
					if(isset($res5['id'])){
						unset($accounts['cobot']['canceled']);
						phi::log('successfully un-canceled');
					}else{
						phi::log('error unanceling cobot plan for ['.$uid.']');
					}
				}
				if($accounts['cobot']['plan']==$plan_id){
					phi::log('plan already up-to-date');
				}else{
					if($change_date){
						phi::log('keep old membership until: '.date('Y-m-d',$change_date));
						$res4=OAUTH2::get(array(
							'app'=>'one',
							'uid'=>'admin',
							'app_id'=>'cobot',
							'type'=>'POST',
							'url'=>'https://XXXXX.cobot.me/api/memberships/'.$accounts['cobot']['id'].'/plans',
							'data'=>[
								'plan_id'=>$plan_id,
								"change_date"=>date('Y-m-d',$change_date)//"2011-10-30",
							],
							'force_app_token'=>true
						));
					}else{
						$res4=OAUTH2::get(array(
							'app'=>'one',
							'uid'=>'admin',
							'app_id'=>'cobot',
							'type'=>'POST',
							'url'=>'https://XXXXX.cobot.me/api/memberships/'.$accounts['cobot']['id'].'/plans',
							'data'=>[
								'plan_id'=>$plan_id
							],
							'force_app_token'=>true
						));
					}
					if(!isset($res4['name'])){
						phi::log('error updating membership account for ['.$uid.'] to ['.$plan_id.']');
						phi::alertAdmin('error updating membership account for ['.$uid.'] to ['.$plan_id.']');
					}else{
						$accounts['cobot']['plan']=$plan_id;
						ONE_CORE::update('user_account',array('id'=>$uid),array(
							'cobot'=>$accounts['cobot']
						));
					}
				}
				return false;
			}
		}
		public static function getMembershipRanges(){
			$data['membership']['list']['one_boulder']=array(
				'id'=>'one_boulder',
				'name'=>'ONE|Boulder Player Membership',
				'noplan'=>'No Plan Selected',
				'required'=>true,
				'noselect'=>true,
				'category'=>'one_boulder',
				'hooks'=>[
					'onStart'=>'startPlayer'
				],
				'plans'=>array(
					'list'=>array(
						'player'=>array(
							'id'=>'player',
							'level'=>'player',
							'name'=>'Player',
							'value'=>1100,
							'split'=>array(
								//'one_riverside'=>800,
								'one_boulder'=>1100
							),
							'content_id'=>'ob_plan_player',
							// 'link'=>array(
							// 	'type'=>'cobot',
							// 	'value'=>800,
							// 	'plan_id'=>'80b74f262d3f1ba6acdf4d69bc62ffb0'
							// )
						)
					),
					'order'=>array('player')
				)
			);
			$data['membership']['list']['one_boulder']['plans']=db2::graph(DB,$data['membership']['list']['one_boulder']['plans'],array(
				'content_id'=>array(
					'coll'=>'app_text',
					'match'=>'id',
					'to'=>'content'
				)
			));
			$data['membership']['order'][]='one_boulder';
			$data['membership']['list']['one_pass']=[
				'id'=>'one_pass',
				'name'=>'ONE|Pass',
				'noplan'=>'Not enabled',
				'canstop'=>1,
				'hooks'=>[
					'onStart'=>'startOnepass',
					'onRenew'=>'renewOnepass',
					'onStop'=>'stopOnepass'
				],
				'plans'=>[
					'list'=>array(
						'basic'=>array(
							'id'=>'basic',
							'name'=>'ONE|Pass',
							'value'=>1100,
							'split'=>array(
								'one_boulder'=>1100
							),
							'content_id'=>'onepass_plan'
						),
					),
					'order'=>['basic']
				]
			];
			$data['membership']['list']['one_pass']['plans']=db2::graph(DB,$data['membership']['list']['one_pass']['plans'],array(
				'content_id'=>array(
					'coll'=>'app_text',
					'match'=>'id',
					'to'=>'content'
				)
			));
			$data['membership']['order'][]='one_pass';
			$data['membership']['list']['events']=[
				'id'=>'events',
				'name'=>'Producer: Add Events to the Calendar',
				'noplan'=>'Not enabled',
				'canstop'=>1,
				'hooks'=>[
					'onStart'=>'startProducer'
				],
				'plans'=>[
					'list'=>array(
						'basic'=>array(
							'id'=>'basic',
							'name'=>'Producer: Add Events to the Calendar',
							'value'=>1100,
							'split'=>array(
								'one_boulder'=>1100
							),
							'content_id'=>'ob_plan_events_basic'
						),
					),
					'order'=>['basic']
				]
			];
			$data['membership']['list']['events']['plans']=db2::graph(DB,$data['membership']['list']['events']['plans'],array(
				'content_id'=>array(
					'coll'=>'app_text',
					'match'=>'id',
					'to'=>'content'
				)
			));
			$data['membership']['order'][]='events';
			if(!phi::$conf['prod']){
			$data['membership']['list']['fundraisers']=[
				'id'=>'fundraisers',
				'name'=>'Creator: Add Fundraising Campaigns',
				'noplan'=>'Not enabled',
				'canstop'=>1,
				'hooks'=>[
					'onStart'=>'startCreator'
				],
				'plans'=>[
					'list'=>array(
						'basic'=>array(
							'id'=>'basic',
							'name'=>'Creator: Add Fundraising Campaigns',
							'value'=>1100,
							'split'=>array(
								'one_boulder'=>1100
							),
							'content_id'=>'ob_plan_creator_basic'
						),
					),
					'order'=>['basic']
				]
			];
			$data['membership']['list']['fundraisers']['plans']=db2::graph(DB,$data['membership']['list']['fundraisers']['plans'],array(
				'content_id'=>array(
					'coll'=>'app_text',
					'match'=>'id',
					'to'=>'content'
				)
			));
			$data['membership']['order'][]='fundraisers';
			}
			$data['membership']['list']['services']=[
				'id'=>'services',
				'name'=>'Provider: Add Services to the Directory',
				'noplan'=>'Not enabled',
				'canstop'=>1,
				'hooks'=>[
					'onStop'=>'stopService',
					'onStart'=>'startService'
				],
				'plans'=>[
					'list'=>array(
						'basic'=>array(
							'id'=>'basic',
							'name'=>'Provider: Add Services to the Directory',
							'value'=>1100,
							'split'=>array(
								'one_boulder'=>1100
							),
							'content_id'=>'ob_plan_services_basic'
						),
					),
					'order'=>['basic']
				]
			];
			$data['membership']['list']['services']['plans']=db2::graph(DB,$data['membership']['list']['services']['plans'],array(
				'content_id'=>array(
					'coll'=>'app_text',
					'match'=>'id',
					'to'=>'content'
				)
			));
			$data['membership']['order'][]='services';
			return $data['membership'];
		}
		public static function isPrepayActive($info,$ts=false){
			if(!$ts) $ts=time();
			$active=false;
			foreach($info['membership'] as $k=>$v){
				if(!isset($v['stop'])){
					if(isset($info['prepay'][$k])&&$ts>$info['prepay'][$k]['start']&&$ts<$info['prepay'][$k]['end']){
						$active=true;
					}
				}
			}
			return $active;
		}
		public static function getPaymentAmount($info,$ts=false){
			if(!$ts) $ts=time();
			$total=0;
			foreach($info['membership'] as $k=>$v){
				if(!isset($v['stop'])){
					if(isset($info['prepay'][$k])&&$ts>$info['prepay'][$k]['start']&&$ts<$info['prepay'][$k]['end']){
						//phi::clog('prepay time!');
					}else{
						$total+=$v['value'];
					}
				}
			}
			if(isset($info['donation'])){
				$total+=$info['donation'];
			}
			if(isset($info['discount'])){
				$total-=$info['discount']['total'];
			}
			return $total;
		}
		public static function startOnepass($r,$user,$valid_until){//dont remove!
			phi::log('🚀 Start ONE|PASS hook set ['.$user['id'].'] to ['.$valid_until.']');
			//notify admins
			$stewards=ONE_CORE::getStewards();
			$total=db2::count(DB,'current_subscription_info',['membership.one_pass'=>['$exists'=>true],'canceled'=>['$exists'=>false],'stopped'=>['$exists'=>false]]);
			foreach($stewards as $k=>$v){
				$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),[
					'id'=>'start_onepass',
					'data'=>array(
						'app_id'=>$r['qs']['appid'],
						'total'=>$total,
						'to'=>[
							'id'=>$v,
							'type'=>'user'
						],
						'from'=>[
							'id'=>$user['id'],
							'type'=>'user'
						]
					)
				],1);
			}
			if(sizeof($hooks)) phi::saveHooks($hooks);
			$resp=ONE_CORE::update('user',array('id'=>$user['id']),[
				'onepass'=>$valid_until
			]);
		}
		public static function renewOnepass($r,$user,$valid_until){
			phi::log('🚀 RENEW ONE|PASS hook set ['.$user['id'].'] to ['.$valid_until.']');
			$resp=ONE_CORE::update('user',array('id'=>$user['id']),[
				'onepass'=>$valid_until
			]);
		}
		public static function startProducer($r,$user,$valid_until){//dont remove!
			phi::log('startProducer hook ['.$user['id'].']');
			$total=db2::count(DB,'current_subscription_info',['membership.events'=>['$exists'=>true],'canceled'=>['$exists'=>false],'stopped'=>['$exists'=>false]]);
			$stewards=ONE_CORE::getStewards();
			foreach($stewards as $k=>$v){
				$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),[
					'id'=>'start_producer',
					'data'=>array(
						'app_id'=>$r['qs']['appid'],
						'total'=>$total,
						'to'=>[
							'id'=>$v,
							'type'=>'user'
						],
						'from'=>[
							'id'=>$user['id'],
							'type'=>'user'
						]
					)
				],1);
			}
			if(sizeof($hooks)) phi::saveHooks($hooks);
		}
		public static function startPlayer($r,$user,$valid_until){//dont remove!
			phi::log('startPlayer hook ['.$user['id'].']');
			$total=db2::count(DB,'current_subscription_info',['membership.one_boulder'=>['$exists'=>true],'canceled'=>['$exists'=>false],'stopped'=>['$exists'=>false]]);
			$stewards=ONE_CORE::getStewards();
			foreach($stewards as $k=>$v){
				$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),[
					'id'=>'start_player',
					'data'=>array(
						'app_id'=>$r['qs']['appid'],
						'total'=>$total,
						'to'=>[
							'id'=>$v,
							'type'=>'user'
						],
						'from'=>[
							'id'=>$user['id'],
							'type'=>'user'
						]
					)
				],1);
			}
			if(sizeof($hooks)) phi::saveHooks($hooks);
		}
		public static function startService($r,$user,$valid_until){//dont remove!
			phi::log('startService hook ['.$user['id'].']');
			db2::update(DB,'service',['page.id'=>$user['id']],['$set'=>['disabled'=>0]],['multi'=>true]);
			$total=db2::count(DB,'current_subscription_info',['membership.services'=>['$exists'=>true],'canceled'=>['$exists'=>false],'stopped'=>['$exists'=>false]]);
			$stewards=ONE_CORE::getStewards();
			foreach($stewards as $k=>$v){
				$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),[
					'id'=>'start_provider',
					'data'=>array(
						'app_id'=>$r['qs']['appid'],
						'total'=>$total,
						'to'=>[
							'id'=>$v,
							'type'=>'user'
						],
						'from'=>[
							'id'=>$user['id'],
							'type'=>'user'
						]
					)
				],1);
			}
			if(sizeof($hooks)) phi::saveHooks($hooks);
		}
		public static function stopService($uid){//dont remove
			phi::log('stopservice hook ['.$uid.']');
			db2::update(DB,'service',['page.id'=>$uid],['$set'=>['disabled'=>1]],['multi'=>true]);
		}
		public static function stopOnepass($uid){//dont remove
			phi::log('stoponepass hook ['.$uid.']');
		}
		public static function getCurrentStatus($current){
			if(!$current||!isset($current['valid_until'])) return 'not_active';
			if(time()<$current['valid_until']) return 'active';
			if(time()>=$current['valid_until']) return 'overdue';
		}
		public static function updateUsage($opts){
			$res=\Stripe\SubscriptionItem::createUsageRecord(
			  $opts['subscription'],
			  [
			    'quantity' => $opts['total'],
			    'timestamp'=>time(),
			    'action' => 'set'
			  ]
			);
			//update settings
			return true;
		}
		public static function getSingleSplitTotal($total,$splits){
			//aggregate and apply
			foreach ($splits as $k => $v) {
				foreach ($v as $tk => $tv) {
					if(!isset($outsplits[$tk])) $outsplits[$tk]=0;
					$outsplits[$tk]+=$tv;
				}
			}
			$split['stripe']=self::calcFee($total,1);
			$remainingToSplit=$total-$split['stripe'];
			$toremove=0;
			$tosplitto=array_keys($outsplits);
			$tosplit=ceil($toremove/sizeof($tosplitto));
			foreach ($outsplits as $k => $v) {
				$split[$k]=$v-$tosplit;
			}
			$calctotal=0;
			foreach ($split as $k => $v) {
				$calctotal+=$v;
			}
			$diff=$total-$calctotal;
			if($diff){
				$split['one_boulder']+=$diff;
			}
			return $split;
		}
		public static function calcSingleSplit($topay,$membership){
			foreach ($membership['split'] as $tk => $tv) {
				if(!isset($splits[$tk])) $splits[$tk]=0;
				$splits[$tk]+=floor($tv*($topay/$membership['value']));
			}
			return $splits;
		}
		public static function calcSplit($total,$memberships,$donation=0){
			$expectedTotal=0;
			//take 1 percent
			$split['stripe']=self::calcFee($total,1);
			$remainingToSplit=$total-$split['stripe']-$donation;
			foreach ($memberships as $k => $v) {
				foreach ($v['split'] as $tk => $tv) {
					if(!isset($splits[$tk])) $splits[$tk]=0;
					$splits[$tk]+=$tv;
					$expectedTotal+=$tv;
				}
			}
			foreach ($splits as $k => $v) {
				$p=$v/$expectedTotal;
				$split[$k]=floor($p*$remainingToSplit);
			}
			if($donation) $split['one_boulder']+=$donation;
			$calctotal=0;
			foreach ($split as $k => $v) {
				$calctotal+=$v;
			}
			$diff=$total-$calctotal;
			if($diff){
				$split['one_boulder']+=$diff;
			}
			return $split;
		}
		public static function getMembershipPages($membership){
			$order=array_keys($membership);
			foreach ($membership as $k => $v) {
				if(isset($v['split'])){
					foreach ($v['split'] as $tk => $tv) {
						if(!in_array($tk, $order)) $order[]=$tk;
					}
				}
			}
			return $order;
		}
		public static function updateSubscription($r){
			try{
			$d=phi::ensure($r,array('settings'),true,array('self::write::account'));
			$current=db2::findOne(DB,'subscription',array('page.id'=>$r['auth']['uid'],'status'=>'active'));
			$user=db2::findOne(DB,'user',array('id'=>$r['auth']['uid']),array('projection'=>array('id'=>1,'name'=>1,'level'=>1)));
			$membershipRanges=self::getMembershipRanges($user);
			$current_info=db2::findOne(DB,'current_subscription_info',array('page.id'=>$r['auth']['uid']));
			if(isset($current_info['prepay'])){
				$d['settings']['prepay']=$current_info['prepay'];
			}
			$updated=false;
			if($current_info) $updated=true;
			//validate!
			$total=0;
			$level='explorer';
			if(isset($d['settings']['plans'])&&$d['settings']['plans']){
				foreach ($d['settings']['plans'] as $k => $v) {
					if($v=='current'){
						if(isset($current_info['membership'][$k])){
							$d['settings']['membership'][$k]=$current_info['membership'][$k];
							//$total+=$d['settings']['membership'][$k]['value'];
						}else{
							API::toHeaders(['error'=>'invalid plan settings']);
						}
					}else if($v=='stop'){
						if(isset($current_info['membership'][$k])){
							$d['settings']['membership'][$k]=$current_info['membership'][$k];
							//check prepay!!!
							if(isset($current_info['prepay'][$k])){
								$d['settings']['membership'][$k]['stop']=$current_info['prepay'][$k]['end'];
							}else{//normal!
								$d['settings']['membership'][$k]['stop']=$current_info['valid_until'];
							}
							//$total+=$d['settings']['membership'][$k]['value'];
						}else{
							API::toHeaders(['error'=>'invalid plan settings']);
						}
					}else if(isset($membershipRanges['list'][$k]['plans']['list'][$v])){
						$plan=$membershipRanges['list'][$k]['plans']['list'][$v];
						//die(json_encode($plan));
						//$total+=$plan['value'];
						//save a copy/snapshot of this plan
						$d['settings']['membership'][$k]=phi::keepFields($plan,['id','name','value','split','link']);
						$d['settings']['membership'][$k]['ts']=time();
					}else{
						API::toHeaders(['error'=>'invalid plan settings']);
					}
				}
			}
			//apply discounts!
			$discount=0;
			// if(isset($d['settings']['membership']['one_pass'])&&!isset($d['settings']['membership']['one_pass']['stop'])){
			// 	$discount+=1100;
			// 	$discount_list['one_pass']=[
			// 		'ts'=>time(),
			// 		'amount'=>1100
			// 	];
			// }
			if($discount){
				$d['settings']['discount']=[
					'total'=>$discount,
					'info'=>$discount_list
				];
			}
			$total=self::getPaymentAmount($d['settings'],time());
			#die(json_encode($d['settings']));
			//$total-=$discount;
			$donation=0;
			if(isset($d['settings']['donation'])&&(int) $d['settings']['donation']){
				$donation=(int) $d['settings']['donation'];
				//$total+=$donation;
			}
			if(!isset($d['settings']['membership']['one_boulder'])) return array('error'=>'A ONE|Boulder membership is required');
			//get appropriate level
			$level='player';//regenerator and steward are backend
			//get links!
			$links=false;
			foreach ($membershipRanges['order'] as $k => $v) {
				if(isset($d['settings']['membership'][$v]['id'])&&isset($membershipRanges['list'][$v]['plans']['list'][$d['settings']['membership'][$v]['id']]['link'])){
					$link=$membershipRanges['list'][$v]['plans']['list'][$d['settings']['membership'][$v]['id']]['link'];
					$links[$link['type']]=$link;
				}
			}
			#die(json_encode($d['settings']['membership']));
			if(!isset($d['settings']['membership'])) return array('error'=>'Please select a plan');
			$stripe_info=db2::findOne(DB,'stripe',array('id'=>$r['auth']['uid']));
			if(!isset($stripe_info['stripe_id'])) return array('error'=>'Please add a credit card');
			//validate/save membership data!
			//used to determine if there is already a subscription
			$anchor=false;
			if(isset($current_info['valid_until'])){
				if(time()<$current_info['valid_until']&&((time()+(60*60*24*30))>$current_info['valid_until'])) $anchor=$current_info['valid_until'];
			}
			if($current_info&&isset($current_info['valid_until'])&&$current_info['valid_until']>time()){
				$lasttotal=0;
				$prorated=0;
				$thisdate = time();
				$enddate=$current_info['valid_until'];
				$tlast=DateTime::createFromFormat( 'U', $current_info['valid_until'] );
				$lastt=$tlast->modify('-1 month');
				$start=$lastt->getTimestamp();
				$diff=$enddate-$start;
				$percent_used=($thisdate-$start)/$diff;
				if($percent_used<5) $percent_used=0;
				$percent_remaining=1-$percent_used;
				//run per
				foreach ($d['settings']['membership'] as $k => $v) {
					$new[$k]=$v['value'];
				}
				//die(json_encode($current_info['membership']));
				foreach ($current_info['membership'] as $k => $v) {
					$last[$k]=$v['value'];
				}
				//add in difference of donation
				if(isset($current_info['donation'])){
					$prorated+=($donation-$current_info['donation']);
				}else{
					$prorated+=$donation;
				}
				foreach ($new as $k => $v) {
					if(isset($last[$k])){
						if($last[$k]<$new[$k]){
							$remaining_credit=floor($last[$k]*$percent_remaining);
							$topay=floor($new[$k]*$percent_remaining)-$remaining_credit;
							//add splits
							$splits[]=self::calcSingleSplit($topay,$d['settings']['membership'][$k]);
							$prorated+=$topay;
						}else{//lowered membership, no worries

						}
					}else{//full amount
						$topay=floor($new[$k]*$percent_remaining);
						//add splits
						$splits[]=self::calcSingleSplit($topay,$d['settings']['membership'][$k]);
						$prorated+=$topay;
					}
				}
				#die('prorated '.$prorated);
				#die(json_encode($splits));
				if(isset($splits)){
					$split=self::getSingleSplitTotal($prorated,$splits);
				}else{
					$split['stripe']=self::calcFee($prorated,1);
					$split['one_boulder']=$prorated-$split['stripe'];
				}
				#die(json_encode($split));
			}else{
				$prorated=$total;
				//full split we can use our "normal"
				$split=self::calcSplit($prorated,$d['settings']['membership'],$donation);
			}
			$stripe = self::getStripeKeys();
			$client=\Stripe\Stripe::setApiKey($stripe['secret_key']);
			$price=db2::findOne(DB,'subscription_info',array('id'=>'one-subscription','env'=>phi::$conf['env']));
			if(!$price) API::toHeaders(['error'=>'subscription_info not configured for this environment']);
			//do this first payment to test the card!
			//do the first charge!
			#phi::log($topts);
			if($prorated>100&&!isset($d['settings']['onboard'])){//close to last day of month, or downgrading plan
			  	$charge = \Stripe\Charge::create(array(
			      'amount'   => $prorated,
			      'source'=>$d['settings']['source'],
			      'customer' => $stripe_info['stripe_id'],
			      'currency' => 'usd',
			      'description'=>'ONE|Subscription',
			      'statement_descriptor'=>'ONE|Boulder Membership'
			  	));
			  	if(!isset($charge['id'])) return array('error'=>'Card Failure');
			  	$stripe=$split['stripe'];
			  	unset($split['stripe']);
			  	ONE_CORE::save('payment_info',array(
			  		'description'=>$current_info?'Subscription for ONE|Boulder (Update)':'Subscription for ONE|Boulder',
					'page'=>array(
						'id'=>$r['auth']['uid'],
						'type'=>'user'
					),
					'to'=>array(
						'id'=>'one_boulder',
						'type'=>'page'
					),
					'charge_info'=>array(
						'type'=>'charge',
						'id'=>$charge['id']
					),
					'fees'=>[
						'cc_processing'=>[
							'id'=>'stripe',
							'type'=>'page',
							'tag'=>'cc_processing',
							'amount'=>$stripe
						]
					],
					'tag'=>'subscription',
					'subscription_info'=>$d['settings']['membership'],
					'total'=>$prorated,
					'net'=>$prorated-$stripe,
					'split'=>$split,
					'ts'=>time()
				));
				ONE_CORE::emitGameHook([
					'auth'=>[
						'uid'=>$r['auth']['uid']
					]
				],'membership_payment',[
					'amount'=>$prorated
				]);
				db2::update(DB,'paid_charge',array('id'=>$charge['id']),array('$set'=>json_decode(json_encode($charge),1)),array('upsert'=>true));
			}else{
				$prorated=false;
				//phi::log('no need to prorate: '.$prorated);
			}
			if(!$current||!isset($current['stripe']['items']['data'][0]['id'])){
				//create subscription!
				$create=[
				  "customer" => $stripe_info['stripe_id'],
				  "default_payment_method" => $d['settings']['source'],
				  //"billing_cycle_anchor"=>(time()+20),//see if subscription comes back with proper update (DEV)
				  "items" => [
				    ["price" => $price['stripe_id']],
				  ]
				];
				if($anchor){
					 $create["billing_cycle_anchor"]=$anchor;
				}
				$subscription = \Stripe\Subscription::create($create);
				$current['stripe']=json_decode(json_encode($subscription),1);
				phi::log('✅✅✅ Successfull Start of Subscription for ['.$total.'] ['.$user['name'].'] ['.json_encode($d['settings']['membership']).']');
				phi::alertAdmin('✅✅✅ Successfull Start of Subscription: ['.$user['name'].'] for ['.$total.'] ['.json_encode($d['settings']['membership']).']',false,[
					'nikkojoyce@gmail.com'
				]);
				ONE_CORE::save('subscription',array(
					'page'=>array(
						'id'=>$r['auth']['uid'],
						'type'=>'user'
					),
					'status'=>'active',
					'ts'=>time(),
					'stripe'=>$current['stripe']
				));
			}else{
				phi::log('✅✅✅ Successfull update of Subscription for ['.$total.'] ['.json_encode($d['settings']['membership']).'] ['.$user['name'].']');
				phi::alertAdmin('✅✅✅ Successfull update of Subscription: ['.$user['name'].'] for ['.$total.'] donation ['.$donation.'] ['.json_encode($d['settings']['membership']).']',false,[
					'nikkojoyce@gmail.com'
				]);
				//update card!
				// \Stripe\SubscriptionItem::createUsageRecord
				$res=\Stripe\Subscription::update($current['stripe']['items']['data'][0]['subscription'],[
					'default_source'=>$d['settings']['source'],
					'default_payment_method' => $d['settings']['source']
				]);
			}
			$valid_until=($anchor)?$anchor:$current['stripe']['current_period_end'];
			//should be updated after whatever charges happen
			$update=array(
				'page'=>array(
					'id'=>$r['auth']['uid'],
					'type'=>'user'
				),
				'card'=>$d['settings']['source'],
				'donation'=>$donation,
				'valid_until'=>$valid_until,//+32 days
				'membership'=>$d['settings']['membership'],
				'membership_order'=>self::getMembershipPages($d['settings']['membership']),
				'ts'=>time()
			);
			if(isset($d['settings']['discount'])){
				$update['discount']=$d['settings']['discount'];
			}
			$sub=ONE_CORE::update('current_subscription_info',array('page.id'=>$r['auth']['uid']),$update,false,false,array(
				'canceled'=>1,
				'overdue'=>1,
				'stopped'=>1
			));
			//clear out overdue status!
			ONE_CORE::update('user',array('id'=>$r['auth']['uid']),array(
				'status.overdue'=>0,
				'status.active'=>1,
				'status.stopped'=>0,
				'status.amount'=>$total,
				'status.validUntil'=>$valid_until
			));
			ONE_CORE::save('subscription_info_history',array(
				'page'=>array(
					'id'=>$r['auth']['uid'],
					'type'=>'user'
				),
				'membership'=>$d['settings']['membership'],
				'membership_order'=>self::getMembershipPages($d['settings']['membership']),
				'ts'=>time()
			));
			//always set to player!
			if($user['level']!='steward'&&$user['level']!='regenerator'){
				phi::log('Set level for user ['.$user['name'].'] to ['.$level.']');
				//set to appropriate level
				ONE_CORE::update('user',array('id'=>$r['auth']['uid']),array(
					'level'=>$level
				));
			}else{
				$level=$user['level'];
				phi::log('dont update admins level: '.$level);
			}
			#phi::log('updateusage: '.$total);
			self::updateUsage(array(
				'total'=>$total,
				'subscription'=>$current['stripe']['items']['data'][0]['id']
			));
			//update card!
			//determine if there is any start/stop happening and run hooks
			if($current_info){
				if(isset($current_info['membership'])) foreach($current_info['membership'] as $k=>$v){
					$info[$k]=[
						'id'=>$v['id'],//if it is in current_info memberships, it will
						'status'=>''
					];
					if(isset($v['stop'])) $info[$k]['stopped']=1;
				}
			}
			#die(json_encode($current_info));
			foreach($d['settings']['membership'] as $tk=>$tv){
				if(!isset($tv['stop'])){
					if(!isset($info[$tk])||(isset($info[$tk]['stopped']))){
						$info[$tk]=[
							'id'=>$tv['id'],
							'status'=>'onStart'
						];	
					}else{
						if($info[$tk]['id']==$tv['id']){
							$info[$tk]['status']='nochange';
						}else{
							$info[$tk]['status']='onChange';
						}
					}
				}else{
					if(isset($current_info['membership'][$tk])){
						if(!isset($current_info['membership'][$tk]['stop'])){
							$info[$tk]['status']='onStop';
						}else{
							$info[$tk]['status']='nochange';
						}
					}else{
						phi::log('membership hook: shouldnt happen stripe.php');
					}
				}
				$info[$tk]['id']=$tv['id'];
			}
			foreach($info as $k=>$v){
				if($v['status']!='nochange'&&$v['status']!='onStop'){//onStop hook will run on daily cron cleanup!
					if(isset($membershipRanges['list'][$k]['hooks'][$v['status']])){
						//phi::log('RUN!!!!');
						self::{$membershipRanges['list'][$k]['hooks'][$v['status']]}($r,$user,$valid_until);
					}
				}
			}
			#phi::log('info: '.json_encode($info));

			//ensure membership in coworking space
			// if($links){
			// 	foreach ($links as $k => $link) {
			// 		switch($link['type']){
			// 			case 'cobot':
			// 				$isdowngrading=0;
			// 				if(isset($d['settings']['membership']['one_riverside'])){
			// 					$newvalue=$d['settings']['membership']['one_riverside']['link']['value'];
			// 				}else{//could be removing a one_riverside coworking, downgrading to community multipass
			// 					if(isset($d['settings']['membership']['one_boulder']['link'])){
			// 						$newvalue=$d['settings']['membership']['one_boulder']['link']['value'];
			// 					}else{
			// 						break;
			// 					}
			// 				}
			// 				$lastvalue=0;
			// 				if(isset($current_info['membership']['one_riverside'])){
			// 					$lastvalue=$current_info['membership']['one_riverside']['link']['value'];
			// 				}
			// 				if($newvalue<$lastvalue){
			// 					phi::log('downgrading plan!');
			// 					$isdowngrading=true;
			// 				}
			// 				$member=self::ensureCobotMember($r['auth']['uid'],$link['plan_id'],($isdowngrading)?$anchor:false);
			// 			break;
			// 		}
			// 	}
			// }
			$resp=array('success'=>true);
			if(isset($member)) $resp['coworking_info']=$member;
			if($updated) $resp['updated']=1;
			if($prorated) $resp['prorated']=$prorated;
			$resp['level_info']=db2::findOne(DB,'levels',['id'=>'player']);
			//login!
			$resp['login']=ONE_CORE::login([
				'auth'=>$r['auth'],
				'qs'=>[
					'appid'=>$r['qs']['appid'],
					'token'=>$r['qs']['token']
				]
			]);
			return $resp;
			}catch(Exception $e){
				phi::log($e->getMessage(),'stripe');
				return ['error'=>$e->getMessage()];
			}
		}
		public static function changeEmail($uid,$email){
			$cu=db2::findOne(DB,'stripe',array('id'=>$uid));
			if(!isset($cu['stripe_id'])){
				phi::log('invalid stripe_id updating email');
				return false;
			}
			$stripe = self::getStripeKeys();
			$client=\Stripe\Stripe::setApiKey($stripe['secret_key']);
			$customer = \Stripe\Customer::update($cu['stripe_id'],array(
			    'email' => $email
			));
		}
		public static function getPayments($uid,$max=10,$last=false){
			$q=array('uid'=>$uid);
			if($last){
				$q['_id']=array('$gt'=>db2::toId($last));
			}
			$data=db2::toOrderedList(db2::find(DB,self::getChargeTable(),$q,array('sort'=>array('_id'=>-1),'limit'=>$max)),false,'_id');
			$data=db2::graph(DB,$data,array(
				'id'=>array(
					'coll'=>'transaction',
					'match'=>'charge_id',
					'to'=>'transaction'	
				)
			));
			return $data;
			// $u=db2::findOne(DB,'stripe',array('id'=>$uid));
			// if(!$u) return array('error'=>'invalid_customer');
			// $q=array('limit'=>$max,'customer'=>$u['stripe_id']);
			// if($last) $q['starting_after']=$last;
			// $stripe = self::getStripeKeys();
			// $client=\Stripe\Stripe::setApiKey($stripe['secret_key']);
			// $d=\Stripe\Charge::all($q);
			// if(isset($d['data'])&&sizeof($d['data'])){
			// 	foreach ($d['data'] as $k => $v) {
			// 		$out['order'][]=$v['id'];
			// 		$out['list'][$v['id']]=$v;
			// 		$last=$v['id'];
			// 	}
			// 	$out['last']=$last;
			// 	return $out;
			// }else{
			// 	return false;
			// }
		}
		public static function getSampleUser($r){
			// $products=array_keys(db2::toList(db2::find(DB,'products',array()),false,'id'));
			// if(!in_array($r['qs']['testPlan'], $products)) return array('error'=>'invalid_test_plan');
			//sample a user with this plan
			$plan=$r['qs']['testPlan'];
			if(!isset($r['qs']['force_uid'])){
				$p=db2::findOne(DB,'plan',array('plan'=>$plan));
				if(!$p) API::toHeaders(array('error'=>'no_users_with_plan'));
				$uid=$p['id'];
			}else{
				$uid=$r['qs']['force_uid'];
			}
			return $uid;
		}
		public static function addAnonCard($r){
			//create an anon account for this user!  might want to use later
		}
		public static function addCard($r){
			$d=phi::ensure($r,array('stripe_token'),true,array('self::write::account'));
			$uid=$r['auth']['uid'];
			if(!phi::$conf['prod']&&isset($r['qs']['testPlan'])) $uid=self::getSampleUser($r);//testing
			$u=db2::findOne(DB,'stripe',array('id'=>$uid));
			$stripe = self::getStripeKeys();
			$client=\Stripe\Stripe::setApiKey($stripe['secret_key']);
			if(!$u||!isset($u['stripe_id'])){//create user!
				$tu=db2::findOne(DB,'user',array('id'=>$uid));
				//create user!
				//create user on stripe
				try{
					$customer = \Stripe\Customer::create(array(
					    'source' => $d['stripe_token'],
					    'email' => $tu['email']
					));
				}catch(Exception $e){
					phi::log('bad stripe email, trying an internal email');
					$customer = \Stripe\Customer::create(array(
					    'source' => $d['stripe_token'],
					    'email' => $tu['id'].'@oneboulder.one'
					));
				}
				//$zip=$customer['sources']['data'][0]['address_zip'];
				// foreach ($customer['sources']['data'] as $k => $v) {
				// 	$savecust['cards.'.$v['id']]=array(
				// 		'brand'=>$v['brand'],
				// 		'customer'=>$v['customer'],
				// 		'last4'=>$v['last4']
				// 	);
				// }
				$savecust['default_source']=$customer['default_source'];
				$savecust['stripe_id']=$customer['id'];
				$savecust['id']=$uid;
				db2::update(DB,'stripe',array('id'=>$savecust['id']),array('$set'=>$savecust),array('upsert'=>true));
				$card_id=$customer['default_source'];
			}else{//add to their account!
				$card = \Stripe\Customer::createSource(
				  $u['stripe_id'],array('source'=>$d['stripe_token'])
				);
				// $savecust['cards.'.$card['id']]=array(
				// 	'brand'=>$card['brand'],
				// 	'customer'=>$card['customer'],
				// 	'last4'=>$card['last4']
				// );
				//set as default, assume default!
				//if(isset($r['qs']['defualt'])&&$r['qs']['defualt']){
					//stripe set to default
					$ud=\Stripe\Customer::update(
					  $u['stripe_id'],array('default_source'=>$card['id'])
					);
					$savecust['default_source']=$card['id'];
				//}
				$card_id=$card['id'];
				db2::update(DB,'stripe',array('id'=>$uid),array('$set'=>$savecust),array('upsert'=>true));
			}
			return array('success'=>true,'cards'=>self::getCards($uid),'card_id'=>$card_id);
		}
		public static function getBalance(){
			$stripe = self::getStripeKeys();
			$client=\Stripe\Stripe::setApiKey($stripe['secret_key']);
			$balance=\Stripe\Balance::retrieve();
			return $balance;
		}
		public static function getMethods($uid){
			$cards=stripe::getCards($uid);
			if(isset($cards['data'])){
				foreach ($cards['data'] as $k => $v) {
					$methods[]=$v;
				}
			}
			if(!isset($methods)) return false;
			$c=db2::findOne(DB,'stripe',['id'=>$uid]);
			//die(json_encode($c));
			return array(
				'methods'=>$methods,
				'default_source'=>(isset($c['default_source']))?$c['default_source']:false
			);
		}
		public static function calcFee($total,$absorb=false){
			if(!$total) return 0;//no fee if free
			if($absorb){
				return ceil($total*.029+30);
			}else{
				return ceil((($total+30)/(1-.029))-$total);
			}
		}
		public static function getCards($uid){
			$u=db2::findOne(DB,'stripe',array('id'=>$uid));
			if(!$u||!isset($u['stripe_id'])) return false;//customer hasnt been created
			$stripe = self::getStripeKeys();
			//$client=\Stripe\Stripe::setApiKey($stripe['secret_key']);
			$stripe = new \Stripe\StripeClient($stripe['secret_key']);
			//die(json_encode(\Stripe\Customer::retrieve($u['stripe_id'])));
			$cards = $stripe->customers->allSources($u['stripe_id'],array("object" => "card"));
			// $cards = \Stripe\Customer::listSources(
			//   $u['stripe_id'],
			//   array(
			//     'limit' => 10,
			//     'object' => 'card'
			//   )
			// );
			//die(var_dump($cards));
			if(isset($cards['data'])) return array(
				'data'=>$cards['data'],
				'default_source'=>(isset($u['default_source']))?$u['default_source']:''
			);
			return false;
		}
		public static function isPlan($plan){
			$stripe = self::getStripeKeys();
			$client=\Stripe\Stripe::setApiKey($stripe['secret_key']);
			try{
				$plan=\Stripe\Plan::retrieve($plan);
				if(isset($plan['id'])) return true;
				return false;
			}catch(Exception $e){
				phi::clog($e->getMessage(),1);
				return false;
			}
		}
		public static function refund($charge_id,$refund_amount=false){
			$stripe = self::getStripeKeys();
			$client=\Stripe\Stripe::setApiKey($stripe['secret_key']);
			$req=array(
				'charge'=>$charge_id
			);
			if($refund_amount){
				$req['amount']=$refund_amount;
			}
			try{
				$re = \Stripe\Refund::create($req);
				if(isset($re['id'])){
					return array('success'=>true,'refund_id'=>$re['id']);
				}else{
					return array('error'=>'invalid_response');
				}
			}catch(Exception $e){
				phi::log('Error refunding '.$e->getMessage(),'stripe');
				return array('error'=>'Error refunding '.$e->getMessage());
			}
		}
		public static function refundCharge($uid,$charge_id,$description,$amount=0){
			if(db2::findOne(DB,'refund',array('charge_id'=>$charge_id))){
				return false;
			}
			$req=array(
				'charge'=>$charge_id
			);
			if($amount){
				$req['amount']=$amount;
			}
			$stripe = self::getStripeKeys();
			$client=\Stripe\Stripe::setApiKey($stripe['secret_key']);
			try{
				$re = \Stripe\Refund::create($req);
				if(isset($re['id'])){
					phi::log($re);
					$re['uid']=$uid;
					db2::save(DB,'refund',array(
						'id'=>$re['id'],
						'charge_id'=>$charge_id,
						'uid'=>$uid
					));
					$savecharge=array(
						'id'=>$re['id'],
					 	'info'=>array(
					 		'type'=>'refund',
					 		'charge'=>$charge_id,
					 		'amount'=>$amount,
					 		'description'=>$description
					 	),
					 	'uid'=>$uid
					);
					db2::save(DB,self::getChargeTable(),$savecharge);
					return $re;
				}else{
					phi::alertAdmin('Error with Refund for ['.$charge_id.'] ['.$uid.']');
					return $re;
				}
			}catch(Exception $e){
				phi::log('Error refunding '.$e->getMessage(),'stripe');
				return false;
			}
		}
		public static function getRefund($uid,$frac=1){
			$current=self::getCurrentSubscription($uid);
			$last=self::getLastInvoice($uid);//can only refund max of last invoice charge!
			if($last&&$last['data']['object']['charge']){
				//ensure it hasnt be refunded already
				if(db2::findOne(DB,'refund',array('charge_id'=>$last['data']['object']['charge']))){
					return array(//do not allow a refund if they havent been charged yet!
						'refund'=>0,
						'refundMonths'=>0
					);
				}
			}
			if(!$current) return array('error'=>'Unable to get subscription, please try again or contact us.');
			if(!isset($current['plan']['interval'])||$current['plan']['interval']!='year') return array(//do not allow a refund if they are on a monthly membership
				'refund'=>0,
				'refundMonths'=>0
			);
			$lastyearly=self::isYearly($last);
			if($current['billing_cycle_anchor']>time()&&!$lastyearly) return array(//do not allow a refund if they havent been charged yet!
				'refund'=>0,
				'refundMonths'=>0
			);
			$l=db2::toList(db2::find(DB,self::getBreakdownTable(),array('uid'=>$uid,'ts'=>array('$gt'=>time()))));
			if(!$l) return array(//do not allow a refund if they havent been charged yet!
				'refund'=>0,
				'refundMonths'=>0
			);
			$total=0;
			$data['refundMonths']=sizeof($l);
			foreach ($l as $k => $v){
				$total+=($v['amount']*$frac);
			}
			$data['refund']=$total;
			//it cant be more than the last subscription charge
			if($data['refund']>$last['data']['object']['amount_paid']) $data['refund']=$last['data']['object']['amount_paid'];
			//based on upcoming payments, determine refund
			// //add up from payment_breakdown table
			// $start=$current['current_period_start'];
			// //die(json_encode($current));
			// //ensure that most recent invoice includes this 
			// //get most recent paid webhook! needed for chargeback
			// $now=time();
			// $diffM=($now-$start)/(60*60*24*30);
			// $refund=12-ceil($diffM);
			// $refundPercent=$refund/12;
			// $total=$current['plan']['amount'];
			// $data['refundMonths']=$refund;
			// $data['refund']=floor($total*$refundPercent);
			return $data;
		}
		public static function getLastInvoice($uid){
			$last=db2::toList(db2::find(DB,self::getHookTable(),array('uid'=>$uid,'type'=>'invoice.payment_succeeded'),array('sort'=>array('_id'=>-1),'limit'=>1)));
			if($last){
				$ks=array_keys($last);
				return $last[$ks[0]];
			}else return false;
		}
		public static function getCurrentSubscription($uid,$force=false){
			$subscription=db2::findOne(DB,'subscription',array('page.id'=>$uid,'status'=>'active'));
			if(!$subscription) return false;
			$stripe = self::getStripeKeys();
			$client=\Stripe\Stripe::setApiKey($stripe['secret_key']);
			try{
				if($force){
					$current=\Stripe\Subscription::retrieve($subscription['stripe']['id']);
					#die(json_encode($current));
					db2::update(DB,'subscription',array('page.id'=>$uid),array('$set'=>array('stripe'=>json_decode(json_encode($current),1),'tsu'=>db2::tsToTime(time()))),array('upsert'=>true));
				}else{//cached!
					$d=db2::findOne(DB,'subscription',array('page.id'=>$uid));
					//die(json_encode($d));
					if($d){
						$current=$d['stripe'];
						#die(json_encode($current));
					}else{
						$current=false;
					}
				}
				if(!$current){//fallback
					$current=\Stripe\Subscription::retrieve($subscription['stripe']['id']);
					//go ahead and cache for future use :D!
					db2::update(DB,'subscription',array('page.id'=>$uid),array('$set'=>array('stripe'=>json_decode(json_encode($current),1),'tsu'=>db2::tsToTime(time()))),array('upsert'=>true));
				}
				//cache! needed if person stoppes membership to know how long their account it valid until
				//db2::update(DB,'subscription_info',array('id'=>$uid),array('$set'=>array('data'=>$current)),array('upsert'=>true));
				return $current;
			}catch(Exception $e){
				phi::log('getCurrentSubscription: '.$e->getMessage());
				return false;
			}
		}
		public static function updateMembership($subscription,$opts){
			try{
				if(!$subscription) return false;
				if(!isset($subscription['subscription_id'])) return array('error'=>'invalid_subscription_id');
				$stripe = self::getStripeKeys();
				$client=\Stripe\Stripe::setApiKey($stripe['secret_key']);
				\Stripe\Subscription::update($subscription['subscription_id'],$opts);
				return true;
			}catch(Exception $e){
				phi::log('Error updating subscription '.$e->getMessage());
				return false;
			}
		}
		public static function stopUserMembership($uid){
			try{
				$subscription=db2::findOne(DB,'subscription',array('id'=>$uid));//subscription should exist, if not, we have not collected cc info
				if(!$subscription){//still stop!
					$plan=db2::findOne(DB,'plan',array('id'=>$uid));
					if(!isset($plan['stopped'])){
						db2::update(DB,'plan',array('id'=>$uid),array('$set'=>array('stopped'=>time()),'$unset'=>array('pages'=>1)));
						self::setStatus($uid);
						phi::alertAdmin('User ['.$uid.'] just canceled their plan');
						db2::save(DB,'plan_cancel',array('uid'=>$uid));//for timeline
						return array('success'=>true);
					}else{
						return array('success'=>true,'no_subscription'=>true);
					}
				}
				//if(!$subscription) return array('error'=>'invalid_subscription');
				if(!isset($subscription['subscription_id'])) return array('error'=>'invalid_subscription_id');
				$stripe = self::getStripeKeys();
				$client=\Stripe\Stripe::setApiKey($stripe['secret_key']);
				$sub = \Stripe\Subscription::retrieve($subscription['subscription_id']);
				if(!$sub['canceled_at']){
					$sub->cancel();
				}
				$plan=db2::findOne(DB,'plan',array('id'=>$uid));
				if(isset($plan['pages'])&&sizeof($plan['pages'])){
					foreach ($plan['pages'] as $k => $v) {
						//stop each page!
						self::stopPage($v);
					}
				}
				db2::update(DB,'subscription',array('id'=>$uid),array('$set'=>array('stopped'=>time())));
				db2::update(DB,'plan',array('id'=>$uid),array('$set'=>array('stopped'=>time()),'$unset'=>array('pages'=>1)));
				self::setStatus($uid);
				phi::alertAdmin('User ['.$uid.'] just canceled their plan');
				db2::save(DB,'plan_cancel',array('uid'=>$uid));//for timeline
				return array('success'=>true);
			}catch(Exception $e){
				phi::log('Error Canceling subscription '.$e->getMessage());
				return array('error'=>$e->getMessage());
			}
		}
		public static function stopMembership($r){
			if(isset($r['qs']['refund'])){//check refund!
				$refund=self::getRefund($r['auth']['uid']);
				if(isset($refund['error'])) return $refund;
				if($refund['refund']){
					$last=self::getLastInvoice($r['auth']['uid']);
					if($last&&isset($last['data']['object']['charge'])){
						self::refundCharge($r['auth']['uid'],$last['data']['object']['charge'],'Partial refund for yearly membership',$refund['refund']);
					}
				}//else no refund
			}
			self::clearBreakdowns($r['auth']['uid']);
			//clear out any future payments, this is only valid for yearly, but wont hurt anything
			return self::stopUserMembership($r['auth']['uid']);
		}
		public static function getCustomerFromWebhook($data){
			$id=false;
			if($data['data']['object']['object']=='customer'){
				$id=$data['data']['object']['id'];
			}else if(isset($data['data']['object']['customer'])){
				$id=$data['data']['object']['customer'];
			}else{
				$id=false;
				phi::log('could not get customer for stripe '.json_encode($data),'stripe');
			}
			return $id;
		}
		public static function getUID($cust){
			$c=db2::findOne(DB,'stripe',array('stripe_id'=>$cust));
			if($c) return $c['id'];
			else return '';
		}
		public static function playWebhook($id,$force=false){
			if($force) self::$testing=true;//force to use stripe_webhook table
			$w=db2::findOne(DB,self::getHookTable(),array('id'=>$id));
			if(!$w) return false;
			if(self::webhook(false,$w)) return true;
		}
		public static function setStatus($uid,$debug=false){
			$status=self::status($uid,$debug);
			if($debug) phi::clog($uid.' - '.json_encode($status,JSON_PRETTY_PRINT),1);
			ONE_CORE::update('user',array('id'=>$uid),array('status'=>$status));
			return $status;
		}
		public static function status($uid,$debug=false){
			//$u=db2::findOne(DB,'user',['id'=>$uid]);
			$sub=db2::findOne(DB,'current_subscription_info',array('page.id'=>$uid));
			if(!$sub){
				$status['active']=0;
				$status['overdue']=0;
				$status['stopped']=0;
			}else if($sub['valid_until']<time()){
				$status['active']=0;
				$status['validUntil']=$sub['valid_until'];
				$status['stopped']=1;
				if(isset($sub['overdue'])){
					$status['overdue']=1;
				}else{
					$status['overdue']=0;
				}
			}else{
				$status['active']=1;
				$status['overdue']=0;
				$status['validUntil']=$sub['valid_until'];
				if(isset($sub['canceled'])){
					$status['stopped']=1;
				}else{
					$status['stopped']=0;
				}
			}
			#die(json_encode(['sub'=>$sub,'status'=>$status]));
			return $status;
		}
		public static function ensurePlan($plan,$product,$create=false){
			$stripe = self::getStripeKeys();
			$client=\Stripe\Stripe::setApiKey($stripe['secret_key']);
			$opts=array(
				'id'=>$plan['id'],
			    'currency' => 'usd',
			    'interval' => ($plan['cycle']=='monthly')?'month':'year',
			    'product' => $product,
			    'nickname' => $plan['plan_title'],
			    'amount' => $plan['price'],
			);
			$tplan = \Stripe\Plan::create($opts);
			if(isset($tplan['id'])){
				phi::clog('successfully created plan ['.$plan['plan_title'].']',1);
			}else{
				phi::clog('Error Creating Plan ['.json_encode($opts).'] ['.json_encode($tplan).']',1);
			}
		}
		public static function getPlans(){
			$stripe = self::getStripeKeys();
			$client=\Stripe\Stripe::setApiKey($stripe['secret_key']);
			return \Stripe\Plan::all(array('limit'=>50));
		}
		public static function getProducts(){
			$stripe = self::getStripeKeys();
			$client=\Stripe\Stripe::setApiKey($stripe['secret_key']);
			return \Stripe\Product::all(array('limit'=>50));
		}
		public static function getRate($count,$currentPlan){
			if(isset($currentPlan['oracle'])) return .3;
			switch(true){
				case $count<=20:
					$rate=.2;
				break;
				case $count>20&&$count<100:
					$rate=.25;
				break;
				case $count>=100:
					$rate=.3;
				break;
			}
			return $rate;
		}
		public static function getType($count,$currentPlan){
			if(isset($currentPlan['oracle'])) return 'oracle';
			switch(true){
				case $count<=20:
					$type='butterfly';
				break;
				case $count>20&&$count<100:
					$type='honeybee';
				break;
				case $count>=100:
					$type='hummingbird';
				break;
			}
			return $type;
		}
		public static function getTieredReferals(){

		}
		public static function getCharge($charge_id,$env=false){
			$stripe = self::getStripeKeys($env);
			$client=\Stripe\Stripe::setApiKey($stripe['secret_key']);
			$charge=\Stripe\Charge::retrieve($charge_id);
			return $charge;
		}
		public static function chargeCard($chargeOpts){
			//get customer
			$stripe = self::getStripeKeys();
			try{
				$client=\Stripe\Stripe::setApiKey($stripe['secret_key']);
				if(isset($chargeOpts['from_token'])){
					$topts=array(
				      'amount'   => $chargeOpts['amount'],
				      'source'=>$chargeOpts['from_token'],
				      'currency' => 'usd',
				      'description'=>(isset($chargeOpts['description']))?$chargeOpts['description']:'Credit Card Charge'
				  	);
				  	if(isset($chargeOpts['statement_descriptor_suffix'])){
				  		$topts['statement_descriptor_suffix']=$chargeOpts['statement_descriptor_suffix'];
				  	}
				  	if(isset($chargeOpts['statement_descriptor'])){
				  		$topts['statement_descriptor']=$chargeOpts['statement_descriptor'];
				  	}
				  	#phi::log($topts);
				  	$charge = \Stripe\Charge::create($topts);
				  	if(isset($charge['id'])){
						//yay!
						db2::update(DB,'paid_charge',array('id'=>$charge['id']),array('$set'=>json_decode(json_encode($charge),1)),array('upsert'=>true));
						$split['stripe']=self::calcFee($chargeOpts['amount'],1);
						$split['one_boulder']=$chargeOpts['amount']-$split['stripe'];
						if(isset($chargeOpts['platformFee'])){
							$net=$split['one_boulder']-$chargeOpts['platformFee'];
						}else{
							$net=$split['one_boulder'];
							$chargeOpts['platformFee']=0;
						}
						$fees=[
							'cc_processing'=>[
								'id'=>'stripe',
								'type'=>'page',
								'tag'=>'cc_processing',
								'amount'=>$split['stripe']
							]
						];
						if($chargeOpts['platformFee']){
							$fees[(isset($chargeOpts['platformFeeTag']))?$chargeOpts['platformFeeTag']:'general_platform_fee']=[
								'id'=>'one_boulder',
								'type'=>'page',
								'tag'=>(isset($chargeOpts['platformFeeTag']))?$chargeOpts['platformFeeTag']:'general_platform_fee',
								'amount'=>$chargeOpts['platformFee']
							];
						}
						$pi=array(
							'description'=>(isset($chargeOpts['description']))?$chargeOpts['description']:'Adding funds from Credit Card',
							'page'=>array('id'=>$chargeOpts['from_anon_id'],'type'=>$chargeOpts['from_anon_type']),
							'to'=>$chargeOpts['to'],
							'charge_info'=>array(
								'type'=>'charge',
								'id'=>$charge['id']
							),
							'fees'=>$fees,
							//'split'=>$split,
							'net'=>$net,
							//'platformFee'=>$chargeOpts['platformFee'],
							'total'=>$chargeOpts['amount'],
							'ts'=>time()
						);
						if(isset($chargeOpts['tag'])) $pi['tag']=$chargeOpts['tag'];
						$info=ONE_CORE::save('payment_info',$pi);
						return array('success'=>true,'charge_id'=>$charge['id'],'payment_info_id'=>$info['id']);
					}else{
						phi::log('error charging card: '.json_encode($charge));
						return array('error'=>'Error Charging Card');
					}
				}else{
					$cust=db2::findOne(DB,'stripe',array('id'=>$chargeOpts['from']));
					if($cust){
						$stripe_id=$cust['stripe_id'];
					}else{
						return array('error'=>'invalid_customer_id');
					}
					$topts=array(
				      'customer' => $stripe_id,
				      'amount'   => $chargeOpts['amount'],
				      "source"=>(isset($chargeOpts['method']))?$chargeOpts['method']:'',
				      'description'=>(isset($chargeOpts['description']))?$chargeOpts['description']:'Credit Card Charge',
				      'currency' => 'usd'
				  	);
				  	if(isset($chargeOpts['statement_descriptor_suffix'])){
				  		$topts['statement_descriptor_suffix']=$chargeOpts['statement_descriptor_suffix'];
				  	}
				  	if(isset($chargeOpts['statement_descriptor'])){
				  		$topts['statement_descriptor']=$chargeOpts['statement_descriptor'];
				  	}
					$charge = \Stripe\Charge::create($topts);
					//phi::log('charge: '.json_encode($charge));
					if(isset($charge['id'])){
						db2::update(DB,'paid_charge',array('id'=>$charge['id']),array('$set'=>json_decode(json_encode($charge),1)),array('upsert'=>true));
						$split['stripe']=self::calcFee($chargeOpts['amount'],1);
						$split['one_boulder']=$chargeOpts['amount']-$split['stripe'];
						if(isset($chargeOpts['platformFee'])){
							$net=$split['one_boulder']-$chargeOpts['platformFee'];
						}else{
							$net=$split['one_boulder'];
							$chargeOpts['platformFee']=0;
						}
						$fees=[
							'cc_processing'=>[
								'id'=>'stripe',
								'type'=>'page',
								'tag'=>'cc_processing',
								'amount'=>$split['stripe']
							]
						];
						if($chargeOpts['platformFee']){
							$fees[(isset($chargeOpts['platformFeeTag']))?$chargeOpts['platformFeeTag']:'general_platform_fee']=[
								'id'=>'one_boulder',
								'type'=>'page',
								'tag'=>(isset($chargeOpts['platformFeeTag']))?$chargeOpts['platformFeeTag']:'general_platform_fee',
								'amount'=>$chargeOpts['platformFee']
							];
						}
						$pi=array(
							'description'=>(isset($chargeOpts['description']))?$chargeOpts['description']:'Adding funds from Credit Card',
							'page'=>array('id'=>$chargeOpts['from'],'type'=>ONE_CORE::getIdType($chargeOpts['from'])),
							'to'=>$chargeOpts['to'],
							'charge_info'=>array(
								'type'=>'charge',
								'id'=>$charge['id']
							),
							'net'=>$net,
							//'platformFee'=>$chargeOpts['platformFee'],
							//'split'=>$split,
							'fees'=>$fees,
							'total'=>$chargeOpts['amount'],
							'ts'=>time()
						);
						if(isset($chargeOpts['tag'])) $pi['tag']=$chargeOpts['tag'];
						$info=ONE_CORE::save('payment_info',$pi);
						return array('success'=>true,'charge_id'=>$charge['id'],'payment_info_id'=>$info['id']);
					}
					else{
						return array('error'=>'failed','msg'=>$charge);
					}
				}
			}catch(Exception $e){
				return array('error'=>$e->getMessage());
			}
		}
		public static function calcReferal($uid,$dry=false){
			//get affiliate sign up list!
			$l=db2::toList(db2::find(DB,'referal',array('refered_by'=>$uid)),false,'user_id');
			$currentPlan=db2::findOne(DB,'plan',array('id'=>$uid));
			//if(!self::$testing||phi::$conf['prod']){
			if(!$currentPlan){
				#phi::log('no plan set in calcReferal!');//supress, happens on new user, otherwise shouldnt worry
				return false;
			}
			if(!isset($currentPlan['pollinator'])||isset($currentPlan['pollinator']['disabled'])){
				phi::log('pollinator not set!');
				return false;
			}
			if(isset($currentPlan['stopped'])){
				phi::log('plan stopped, dont calcReferal!');
				return false;
			}
			//}
			$record=array(
				'uid'=>$uid,
				'total'=>0,
			);//default;
			if($l){
				$k=array_keys($l);
				//agregate!
				//get last period for this user! if no last period, limit to a month
				$currentL=db2::toList(db2::find(DB,'referal_receipt',array('uid'=>$uid),array('sort'=>array('_id'=>-1),'limit'=>1)));
				if($currentL){
					$currentk=array_keys($currentL);
					$current=$currentL[$currentk[0]];
					$start=$current['end'];//use the end time from the last record!
					$record['rate']=self::getRate(sizeof($currentL),$currentPlan);
					$record['type']=self::getType(sizeof($currentL),$currentPlan);
				}else{
					if(isset($currentPlan['pollinator']['set'])&&(!self::$testing||phi::$conf['prod'])){
						$start=$currentPlan['pollinator']['set'];//use when it was set!
					}else{
						if(!self::$testing||phi::$conf['prod']) phi::alertAdmin('Pollinator ['.$uid.'] set time not set!');
						$start=time()-(60*60*24*31);//default to last 31 days
					}
					$record['rate']=self::getRate(0,$currentPlan);
					$record['type']=self::getType(0,$currentPlan);
				}
				$end=time();//to now!
				$q=array(
					'ts'=>array('$gte'=>$start,'$lt'=>$end)
				);
				if(!phi::$conf['prod']){
					if(!self::$testing||phi::$conf['prod']) $q['uid']=array('$in'=>$k);
					else $q['uid']=array('$exists'=>true,'$ne'=>'');//dev only
				}else{
					$q['uid']=array('$in'=>$k);
				}
				#phi::log('data- '.json_encode($q));
				//data.object.amount_paid
				//$q['data.object.amount_paid']=array('$gt'=>0);//only count invoices that are actually paid
				$pipeline[]=array(
					'$match'=>$q
				);
				$pipeline[]=array(
					'$group'=>array(
						'_id'=>null,
						'total'=>array('$sum'=>'$amount')
					)
				);
				$pipeline2[]=array(
					'$match'=>$q
				);
				$pipeline2[]=array(
					'$group'=>array(
						'_id'=>array(
							'uid'=>'$uid'
						),
						'count'=>array('$sum'=>1)
					)
				);
				#die(json_encode($pipeline));
				$res=db2::aggregate(DB, self::getBreakdownTable(),$pipeline);
				//die(json_encode($res));
				$res2=db2::aggregate(DB, self::getBreakdownTable(),$pipeline2);
				//die(json_encode($res2));
				if(isset($res[0]['total'])){
					$record['total']=$res[0]['total'];
					$record['payout']=floor($record['total']*$record['rate']);//must be whole number
				}else{
					$record['payout']=0;
				}
				if($res2){
					$record['active']=sizeof($res2);
				}else{
					$record['active']=0;
				}
				$record['signups']=sizeof($k);
				//die(json_encode($record));
				$record['start']=$start;
				$record['end']=$end;
				if(!$dry){
					db2::save(DB,'referal_receipt',$record);
					//add to bank!
					if($record['payout']){
						include_once(ROOT.'/api/bank.php');
						$resp=bank::addTransaction(array(
							'to'=>array('id'=>$uid,'type'=>'user'),
							'from'=>array('id'=>DB,'type'=>'page'),
							'amount'=>$record['payout'],
							'description'=>'Pollinator Program Payout'
						));
						if(isset($resp['error'])){
							phi::log('Failed to add Pollinator Program Payout ['.$resp['error'].']');
						}
					}
				}

			}
			return $record;
		}
		public static function testReferal($uid,$dry=false){
			return self::calcReferal($uid,$dry);
		}
		public static function testBreakdown($webhook_id){
			return self::addBreakdown(db2::findOne(DB,self::getHookTable(),array('id'=>$webhook_id)));
		}
		public static function isYearly($data){
			if($data['data']['object']['lines']['data'][0]['plan']['interval']=='year'){
				$yearly=true;
			}else{
				$yearly=false;
			}
			return $yearly;
		}
		public static function addProrateBreakdown($uid,$type,$amount){
			$table=self::getBreakdownTable();
			if($type=='monthly'){
				$chunks[]=array(
					'uid'=>$uid,
					'amount'=>$amount,
					'ts'=>time()
				);
				db2::bulkInsert(DB,$table,$chunks);//go ahead and add...
			}else{
				//count how many are more than now
				$future=db2::count(DB,self::getBreakdownTable(),array('uid'=>$uid,'ts'=>array('$gt'=>time())));
				if($future){
					$monthly_amount=floor($amount/$future);
					phi::log('updateBreakdown: ['.$uid.'] ['.$monthly_amount.']');
					self::updateBreakdown($uid,$monthly_amount);
				}else{
					$chunks[]=array(
						'uid'=>$uid,
						'amount'=>$amount,
						'ts'=>time()
					);
					db2::bulkInsert(DB,$table,$chunks);//go ahead and add...
				}
			}
		}
		public static function addBreakdown($data){
			//determine yearly/monthly
			$yearly=self::isYearly($data);
			$table=self::getBreakdownTable();
			$amount=$data['data']['object']['amount_paid'];
			if(!$yearly){//add directly, one chunk
				$chunks[]=array(
					'uid'=>$data['uid'],
					'amount'=>$amount,
					'ts'=>time()
				);
			}else{//split into 12 chunks
				$per_month=floor($amount/12);
				$c=0;
				$start=time();
				while($c<12){
					$ts=strtotime('+ '.$c.' months');
					$chunks[]=array(
						'uid'=>$data['uid'],
						'amount'=>$per_month,
						'ts'=>$ts
					);
					$c++;
				}
			}
			db2::bulkInsert(DB,$table,$chunks); 
		}
		public static function clearBreakdowns($uid){//yearly only
			db2::remove(DB,self::getBreakdownTable(),array('uid'=>$uid,'ts'=>array('$gt'=>time())),true);
			return true;
		}
		public static function updateBreakdown($uid,$add){//yearly only
			db2::update(DB,self::getBreakdownTable(),array('uid'=>$uid,'ts'=>array('$gt'=>time())),array('$inc'=>array('amount'=>$add)),array(),false);
		}
		public static function renewHooks($uid,$valid_until){
			$ranges=self::getMembershipRanges();
			$current_info=db2::findOne(DB,'current_subscription_info',array('page.id'=>$uid));
			if(!$current_info) return false;
			foreach($current_info['membership'] as $k=>$v){
				if(isset($ranges['list'][$k]['hooks']['onRenew'])&&!isset($v['stop'])){
					self::{$ranges['list'][$k]['hooks']['onRenew']}(false,['id'=>$uid],$valid_until);
				}
			}
		}
		public static function webhook($r,$cached=false){
			#phi::log('stripe webhook!');
			$sig_header = false;
			if(isset($_SERVER['HTTP_STRIPE_SIGNATURE'])) $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'];
			// $stripe=self::getStripeKeys();
			// //$verify=
			// try {
			//     $event = \Stripe\Webhook::constructEvent(
			//         $payload, $sig_header, $endpoint_secret
			//     );
			// } catch(\UnexpectedValueException $e) {
			//     // Invalid payload
			//     http_response_code(400);
			//     exit();
			// } catch(\Stripe\Exception\SignatureVerificationException $e) {
			//     // Invalid signature
			//     http_response_code(400);
			//     exit();
			// }
			//return false;
			if(!$cached){
				$json = file_get_contents('php://input');
				$data = json_decode($json, true);
			}else{
				$data=$cached;
			}
			if(isset($r['qs']['id'])&&isset($r['qs']['replay'])){
				phi::log('⚠️⚠️ replay webhook');
				$data=$r['qs'];
			}
			#phi::log($data);
			if(isset($data['type'])){
				if(!$cached){//ensure this happens right away, if later code throws error we still have record
					db2::save(DB,'stripe_webhook',$data);
				}
				$nocustomer=array('balance.available','plan.created','customer.created','payment_method.attached','customer.source.created','payment_intent.created','charge.succeeded','payment_intent.succeeded','customer.updated','account.updated');
				if(!in_array($data['type'], $nocustomer)){
					$data['customer_id']=self::getCustomerFromWebhook($data);
					//die(json_encode($data));
					$stripe=db2::findOne(DB,'stripe',array('stripe_id'=>$data['customer_id']));
					if(!$stripe){
						phi::log('⚠️ Stripe account not found for data: '.json_encode($data));
						return ['error'=>'stripe_account_not_found'];
					}
					$data['user']=$stripe['id'];//UID for user
				}
				$isAccount=['account.updated'];
				if(in_array($data['type'], $isAccount)){
					$stripe=db2::findOne(DB,'stripe',array('express.id'=>$data['data']['object']['id']));
					if($stripe) $data['user']=$stripe['id'];//UID for user
				}
				switch($data['type']){//do things!
					case 'account.updated':
						if($data['livemode']&&phi::$conf['prod']){
							phi::log('PROD: account updated: '.json_encode($data));
						}else{
							phi::log('DEV: account updated: '.json_encode($data));
						}
						if(isset($data['user'])){
							db2::update(DB,'stripe_account',['id'=>$data['user']],['$set'=>$data['object']],['upsert'=>true]);
						}else{
							phi::log('account not found');
						}
					break;
					case 'balance.available':
						#phi::log('balance: '.json_encode($data));
						phi::push('','admin_balance',array('type'=>'balance'));
					break;
					case 'invoice.upcoming'://hint to send email saying a 
					break;
					case 'invoice.payment_succeeded':
						phi::log('Stripe Webhook ['.$data['type'].'] for user ['.$data['user'].']');
						//save a snapshot!
						//if total is not 0! the inital 
						if($data['data']['object']['total']==0){
							phi::log('Start of a metered subscription!');
						}else{
							$sub=db2::findOne(DB,'current_subscription_info',array('page.id'=>$data['user']));
							if(!$sub){
								phi::log('invalid current_subscription_info for ['.$data['user'].'] '.json_encode($data));
							}
							$split=self::calcSplit($data['data']['object']['total'],$sub['membership'],(isset($sub['donation']))?$sub['donation']:0);
							$stripe=$split['stripe'];
							unset($split['stripe']);
							ONE_CORE::save('payment_info',array(
								'description'=>'Subscription for ONE|Boulder',
								'page'=>array(
									'id'=>$data['user'],
									'type'=>'user'
								),
								'to'=>array(
									'id'=>'one_boulder',
									'type'=>'page'
								),
								'tag'=>'subscription',
								'charge_info'=>array(
									'type'=>'subscription',
									'id'=>$data['data']['object']['id']
								),
								'fees'=>[
									'cc_processing'=>[
										'id'=>'stripe',
										'type'=>'page',
										'tag'=>'cc_processing',
										'amount'=>$stripe
									]
								],
								'net'=>$data['data']['object']['total']-$stripe,
								'split'=>$split,
								'subscription_info'=>$sub['membership'],
								'total'=>$data['data']['object']['total'],
								'ts'=>time()
							));
							db2::update(DB,'paid_subscription',array('id'=>$data['data']['object']['id']),array('$set'=>$data['data']['object']),array('upsert'=>true));
							//get the latest subscription and update current_period_end
							$csub=self::getCurrentSubscription($data['user'],1);
							ONE_CORE::emitGameHook([
								'auth'=>[
									'uid'=>$data['user']
								]
							],'membership_payment',[
								'amount'=>$data['data']['object']['total']
							]);
							if($csub){
								$valid_until=$csub['current_period_end']+(60*60*24*1);
								phi::log('invoice.payment_succeeded ['.$data['user'].']: new end period '.$csub['current_period_end']);
								ONE_CORE::update('current_subscription_info',array('page.id'=>$data['user']),array(
									'valid_until'=>$valid_until//+1 days
								),false,false,array(
									'canceled'=>1,
									'overdue'=>1
								));
								ONE_CORE::update('user',array('id'=>$data['user']),array(
									'status.overdue'=>0,
									'status.active'=>1,
									'status.stopped'=>0,
									'status.amount'=>$data['data']['object']['total'],
									'status.validUntil'=>$valid_until
								));
								//run hooks!!!!
								self::renewHooks($data['user'],$valid_until);
								#self::setStatus($uid);
							}else{
								phi::log('Error getting current subscription for ['.$data['user'].']');
							}
							phi::log('✅✅✅ Successfull Monthly Subscription for ['.$data['data']['object']['total'].']');
						}
					break;
					case 'invoice.payment_failed'://notify user that their payment failed
						//https://stripe.com/docs/billing/lifecycle
						phi::log('⚠️ invoice.payment_failed ['.$data['id'].']','stripe');
						// ONE_CORE::update('current_subscription_info',array('page.id'=>$uid),array(
						// 	'canceled'=>time()
						// ));//must happne before webhook
						// ONE_CORE::update('user',array('id'=>$data['id']),array(
						// 	'canceled'=>time()
						// ));//must happne before webhook
					break;
					case 'customer.subscription.deleted':
						//phi::log('data : '.json_encode($data));
						$current=$current_info=db2::findOne(DB,'current_subscription_info',array('page.id'=>$data['user']));
						if($current&&!isset($current['canceled'])){
							phi::log('subscription deleted from STRIPE!!!');
							self::stop(false,$data['user'],1);
						}
					break;
					case 'customer.subscription.updated':
					case 'customer.subscription.created'://we handle this syncronously
						//this might happen bec
					break;
				}
				//default just store, might need to re-process anyways
			}else{
				phi::log('invalid webhook for stripe','stripe');
			}
			if(!$cached){
				http_response_code(200);
				die();
			}else{
				return true;
			}
		}
		public static function getLastBreakdowns($uids,$force_dev=false){
			//get the last charge breakdown that has happened in the last month!
			$gt=time()-(60*60*24*31);
			$q=array('uid'=>array('$in'=>$uids));
			$q['ts']=array('$gt'=>$gt,'$lt'=>time());
			$ol=db2::toOrderedList(db2::find(DB,self::getBreakdownTable($force_dev),$q,array('sort'=>array('ts'=>-1))));
			if($ol){
				$out=array();
				foreach ($ol['order'] as $k => $v) {
					$data=$ol['list'][$v];
					if(!isset($out[$data['uid']])){
						$out[$data['uid']]=$data;
					}
				}
			}
			if(!isset($out)) $out=false;
			return $out;
		}
		public static function getBreakdownTable($force_dev=false){
			if($force_dev&&!phi::$conf['prod']) return 'charge_breakdown_dev';
			if(phi::$conf['prod']||self::$testing) return 'charge_breakdown';
			else return 'charge_breakdown_dev';
		}
		public static function getHookTable($force_dev=false){
			if($force_dev&&!phi::$conf['prod']) return 'stripe_webhook_dev';
			if(phi::$conf['prod']||self::$testing) return 'stripe_webhook';
			else return 'stripe_webhook_dev';
		}
		public static function getChargeTable($force_dev=false){
			if($force_dev&&!phi::$conf['prod']) return 'charge_dev';
			if(phi::$conf['prod']||self::$testing) return 'charge';
			else return 'charge_dev';
		}
		public static function stopPage($pid){
			db2::update(DB,'plan',array('id'=>$pid),array('$set'=>array('id'=>$pid,'stopped'=>time())),array('upsert'=>true));
			db2::save(DB,'plan_cancel',array('page'=>$pid));//for timeline
		}
		public static function cacheSubscription($uid){
			$current=self::getCurrentSubscription($uid,1);
		}
		public static function getActivePageCount($plan){
			if(isset($plan['pages'])) $pages=sizeof($plan['pages']);
			$pages++;//personal
			return $pages;
		}
		public static function handleOauthReturn($r){
			return array('success'=>true);
		}
		public static function oAuth2($r){
			$stripe = self::getStripeKeys();
			$client=\Stripe\Stripe::setApiKey($stripe['secret_key']);
			$account = \Stripe\Account::create([
			  'country' => 'US',
			  'type' => 'standard',
			]);
			$current=db2::findOne(DB,'stripe_onboard',array('uid'=>$r['auth']['uid']));
			if(!$current){
				$code=db2::niceGUID(array(
					'len'=>14,
					'pre'=>'S',
					'unique'=>array('collection'=>DB,'table'=>'stripe_onboard','field'=>'id')
				));
				$account_links = \Stripe\AccountLink::create([
				  'account' => $account['id'],
				  'refresh_url' => 'https://api.'.phi::$conf['domain'].'/oauth2/refresh',
				  'return_url' => 'https://api.'.phi::$conf['domain'].'/oauth2/return?provider=stripe&code='.$code,
				  'type' => 'account_onboarding'
				]);
				//temporary cache Account/user info?
				$set['id']=$code;
				$set['uid']=$r['auth']['uid'];
				$set['links']=$account_links;
				db2::update(DB,'stripe_onboard',array('id'=>$code),array('$set'=>$set));
			}else{
				$account_links=$current['links'];
			}
			$authorizationUrl=$account_links['url'];
			if(isset($r['qs']['api'])){
				return array('success'=>true,'url'=>$authorizationUrl);
			}else{
				// redirect the browser to the authorization endpoint (with a 302)
				http_response_code(302);
				header(sprintf('Location: %s', $authorizationUrl));
			}
			return array('success'=>true,'');
		}
		public static function getStripeKeys($env=false){
			if($env){
				if(!isset(phi::$conf['stripe'][$env])) die('invalid stripe keys, check config.json in HOME');
				return phi::$conf['stripe'][$env];
			}else{
				if(!isset(phi::$conf['stripe'])) die('invalid stripe keys, check config.json in HOME');
				return phi::$conf['stripe'];
			}
		}
	}
?>