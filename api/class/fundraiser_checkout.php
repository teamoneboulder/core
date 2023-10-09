<?php
	class fundraiser_checkout{
		public static $discount='';
		public static function handleRequest($r){
			switch ($r['path'][4]){
				case "reserve":
					$out=self::reserve($r);
				break;
				case "send":
					$out=self::send($r);
				break;
				case "recalc":
					$out=self::recalc($r);
				break;
				case "methods":
					$out=self::methods($r);
				break;
				case "test":
					if(!phi::$conf['prod']){
						$out=self::testgetCounts($r);
					}
				break;
				case "sendemail":
					$out=self::sendEmail($r);
				break;
				case "previewemail":
					$out=self::previewEmail($r);
				break;
				case "checkdiscount":
					$out=self::checkDiscount($r);
				break;
				case "massemail":
					$out=self::massEmail($r);
				break;
				case "notifyadmins":
					$out=self::notifyAdmins($r);
				break;
				default:
					$out=array('error'=>'invalid method');
				break;
			}
			return $out;
		}
		public static function sendContact($r,$d,$k,$opts){
			//die(json_encode($d['current']));
			$d['current']['person']['data']=db2::findOne(DB,$d['current']['person']['type'],array('id'=>$d['current']['person']['id']),array('projection'=>array('id'=>1,'name'=>1,'email'=>1)));
			$d['current']['reply_to']['data']=db2::findOne(DB,$d['current']['reply_to']['type'],array('id'=>$d['current']['reply_to']['id']),array('projection'=>array('id'=>1,'name'=>1,'email'=>1)));
			$fundraiser=db2::findOne(DB,'fundraiser',array('id'=>$d['current']['fid']));
			$settings=db2::findOne(DB,'fundraiser_email',array('id'=>$fundraiser['id']));
			if($d['current']['person']['data']&&$d['current']['reply_to']['data']){
				#phi::$debugEmail=true;
				#die(json_encode($d['current']));
				phi::mail(DB,'contribution_email',array(
					'sitepath'=>ROOT.'/sites/one_core',
					'template'=>'contribution_email.txt',
					'vars'=>array(
						'user'=>$d['current']['person']['data'],
						'fundraiser'=>$fundraiser,
						'settings'=>$settings,
						'message'=>$d['current']['message'],
						'header_img'=>(isset($settings['email_header']))?phi::getImg($settings['email_header'],'header'):false
					)
				),array(
					'to'=>array($d['current']['person']['data']['email']),
					'subject'=>$d['current']['subject'],
					'from'=>phi::$conf['no_reply'],
					'replyTo'=>$d['current']['reply_to']['data']['email']
				));
			}else{
				phi::log('invalid person in sendContact');
			}
		}
		public static function ensureUser($r,$d,$k,$opts){
			if(isset($d['current'][$k]['type'])&&$d['current'][$k]['type']==$opts['anon_schema']){
				if(!isset($d['current']['fundraiser'])) API::toHeaders(array('error'=>'invalid_fundraiser_setting'));
				if(!isset($d['current'][$k]['data']['name'])) API::toHeaders(array('error'=>'invalid_name'));
				if(!isset($d['current'][$k]['data']['email'])) API::toHeaders(array('error'=>'invalid_email'));
				if(!isset($d['current'][$k]['id'])){
					$s=ONE_CORE::save($opts['anon_schema'],array(
						'eid'=>$d['current']['fundraiser'],
						'name'=>$d['current'][$k]['data']['name'],
						'email'=>$d['current'][$k]['data']['email'],
						'confirm_email'=>$d['current'][$k]['data']['email']
					));
					//die(json_encode($s));
					if(isset($s['id'])){
						$d['current'][$k]['id']=$s['id'];
					}else{
						API::toHeaders(array('error'=>'error saving anon user ['.json_encode($s).']'));
					}
				}else{//update with new data!
					db2::update(DB,$opts['anon_schema'],array('id'=>$d['current'][$k]['id']),array(
						'name'=>$d['current'][$k]['data']['name'],
						'email'=>$d['current'][$k]['data']['email']
					));
				}
			}
			return $d;
		}
		public static function recalc($r){
			$d=phi::ensure($r,array('fundraiser'));
			if($r['qs']['token']!=phi::$conf['admin_token']){
				return array('error'=>'invlid_permissions');
			}
			$data=self::getCounts($d['fundraiser']);
			return array('success'=>true);
		}
		public static function massEmail($r){
			include_once(ROOT.'/sites/one_core/one_core.api');
			$d=phi::ensure($r,array('id'));
			if($r['qs']['token']!=phi::$conf['admin_token']){
				return array('error'=>'invlid_permissions');
			}
			$em=db2::findOne(DB,'fundraiser_contact_list',array('id'=>$d['id']));
			$em['reply_to']['data']=db2::findOne(DB,$em['reply_to']['type'],array('id'=>$em['reply_to']['id']),array(
				'projection'=>array('id'=>1,'email'=>1,'name'=>1)));
			$l=db2::toOrderedList(db2::find(DB,'fundraiser_receipt',array('fundraiser'=>$em['fid'],'expires'=>array('$exists'=>false))));
			$l=db2::graph(DB,$l,array(
				'purchaser.id'=>array(
					'coll'=>array(
						'field'=>'purchaser.type',
						'id'=>'purchaser.id'
					),
					'to'=>'purchaser.data',
					'opts'=>array(
						'user'=>array(
							'coll'=>'user',
							'match'=>'id',
							'clearOnNull'=>true,
							'fields'=>array('id'=>1,'name'=>1,'pic'=>1,'email'=>1)
						),
						'fundraiser_anon'=>array(
							'coll'=>'fundraiser_anon',
							'match'=>'id',
							'clearOnNull'=>true,
							'fields'=>array('id'=>1,'name'=>1,'pic'=>1,'email'=>1)
						)
					)
				)
			));
			$fundraiser=db2::findOne(DB,'fundraiser',array('id'=>$em['fid']));
			$settings=db2::findOne(DB,'fundraiser_email',array('id'=>$fundraiser['id']));
			$sendto=array();
			if($l) foreach ($l['list'] as $k => $v) {
				if(!isset($v['purchaser']['data']['email'])){
					phi::log('no email found for mass fundraiser email: '.json_encode($v));
					continue;
				}
				if(in_array($v['purchaser']['data']['email'], $sendto)) continue;
				$save=phi::mail(DB,'fundraiser_email_list_'.$d['id'],array(
					'sitepath'=>ROOT.'/sites/one_core',
					'template'=>'contribution_email_list.txt',
					'vars'=>array(
						'user'=>$v['purchaser']['data'],
						'fundraiser'=>$fundraiser,
						'settings'=>$settings,
						'message'=>$em['message'],
						'header_img'=>(isset($settings['email_header']))?phi::getImg($settings['email_header'],'header'):false
					)
				),array(
					'to'=>array($v['purchaser']['data']['email']),
					'subject'=>$em['subject'],
					'from'=>phi::$conf['no_reply'],
					'replyTo'=>$em['reply_to']['data']['email'],
					'returnEmail'=>true
				));
				$tosave[]=$save;
				$sendto[]=$v['purchaser']['data']['email'];
			}
			if(isset($tosave)){
				phi::log('send ['.sizeof($tosave).'] fundraiser emails');
				db2::bulkInsert(DB,'notice',$tosave);
			}
			//make the post/comment
			$post=array(
				'by'=>$em['reply_to'],
				'rich_message'=>$em['message'],
				'headline'=>$em['subject'],
				'page'=>array(
					'id'=>$fundraiser['id'],
					'type'=>'fundraiser'
				),
				'perms'=>array('public')
			);
			//die(json_encode($post));
			//include_once(ROOT.'/sites/code/app/feed/feed.php');
			include_once(ROOT.'/sites/one_core/one_core.api');
			// phi::log('post resp: '.json_encode($resp));
			return array('success'=>true);
		}
		public static function getReserveExpiration(){
			if(!phi::$conf['prod']){
				return time()+((60*2));//2 minutes for dev
			}else{
				return time()+(60*10);//10 minutes
			}
		}
		public static function reserve($r){
			$d=phi::ensure($r,array('contributions','fundraiser'));
			include_once(ROOT.'/api/stripe.php');
			include_once(ROOT.'/api/class/fundraiser.php');
			$fundraiser=db2::findOne(DB,'fundraiser',array('id'=>$d['fundraiser']));
			if($fundraiser['end']<time()) return ['error'=>'Campaign Complete'];
			$settings=db2::findOne(DB,'fundraiser_settings',array('id'=>$d['fundraiser']));
			$active=fundraiser::isActive(false,$settings,$d['fundraiser']);
			if(!$active){
				return array('error'=>'fundraiser_closed','message'=>(isset($settings['stopmessage']))?$settings['stopmessage']:'');
			}
			if(!isset($r['auth']['uid'])){
				if(isset($r['qs']['uuid'])){
					$purchaser=array(
						'id'=>$r['qs']['uuid'],
						'type'=>'anon'
					);
				}else{
					return array('error'=>'invalid session');
				}
			}else{	
				$purchaser=array(
					'id'=>$r['auth']['uid'],
					'type'=>'user'
				);
			}
			db2::remove(DB,'fundraiser_receipt',array('purchaser.id'=>$purchaser['id'],'expires'=>array('$exists'=>true)),true);
			$receipt=array(
				'purchaser'=>$purchaser,
				'fundraiser'=>$d['fundraiser'],
				'expires'=>self::getReserveExpiration()
			);
			$getcontributions=array();
			foreach ($d['contributions'] as $k => $v) {
				$qty=(int) $v['quantity'];
				$tc=0;
				while($tc<$qty){
					$contributions[]=$v['id'];
					if(!in_array($v['id'], $getcontributions)) $getcontributions[]=$v['id'];
					if(!isset($contributioncount[$v['id']])) $contributioncount[$v['id']]=0;
					$contributioncount[$v['id']]++;
					$tc++;
				}
			}
			if(!isset($contributions)) return array('error'=>'invalid_quantity');
			$tl=db2::toList(db2::find(DB,'contribution',array('id'=>array('$in'=>$getcontributions))));
			$data=self::getCounts($d['fundraiser'],1);
			if($data) foreach ($data as $k => $v) {
				if(isset($tl[$k])){
					$t=$tl[$k];
					if(isset($t['quantity'])&&$t['quantity']){//quanitty 0
						$available=$t['quantity']-$v['all'];
						if(isset($contributioncount[$k])){
							if($contributioncount[$k]<=$available){
								//great!
							}else{
								return array('error'=>'contribution_not_available');
							}
						}
					}
				}
			}
			$receipt['contributions']=$contributions;
			#die(json_encode($receipt));
			$receipt=ONE_CORE::save('fundraiser_receipt',$receipt);
			#die(json_encode($receipt));
			$data=self::getCounts($d['fundraiser']);
			//recalc
			//add a job!
			$jobid=$receipt['id'];
			$t=(phi::$conf['prod'])?'+11 minutes':'+3 minutes';
			//phi::log('new job: '.$jobid.' in '.$t);
			phi::scheduleJob($jobid,$t,array(
				'url'=>'https://'.phi::$conf['api'].'/one_core/module/fundraiser_checkout/recalc',
				'type'=>'url',
				'data'=>array(
					'internal'=>1,
					'fundraiser'=>$d['fundraiser']
				)
			));
			$resp=array('success'=>true,'data'=>$receipt);
			$resp['absorb_fees']=(isset($settings['absorb_fees'])&&$settings['absorb_fees'])?1:0;
			if(!phi::$conf['prod']) $resp['extra']=$data;
			// $resp['terms']=(isset($tt['content']))?$tt['content']:'';
			if(!isset($r['auth']['uid'])){
				$resp['fundraiser_anon']=ONE_CORE::getSchema('fundraiser_anon');
			}
			#$resp['data']['methods']=stripe::getMethods($uid);
			// $resp['terms']=phi::cache('fundraiser_terms',function(){
			// 	$td=db2::findOne(DB,'termdata',array('id'=>'fundraiser'));
			// 	if($td) return $td['html'];
			// 	return '';
			// },false);
			$resp['terms']=file_get_contents(ROOT.'/_manage/fundraiser_terms.html');
			$resp['settings']=phi::keepFields($settings,['onboard']);
			return $resp;
		}
		public static function methods($r){
			include_once(ROOT.'/api/stripe.php');
			//usd
			if(isset($r['auth']['uid'])){
				return ['success'=>true,'data'=>stripe::getMethods($r['auth']['uid'])];
			}else{
				return ['success'=>true,'data'=>false];
			}
		}
		public static function bankMethods($r){
			include_once(ROOT.'/api/bank.php');
			return array('success'=>true,'data'=>bank::getMethods($r['auth']['uid'],(phi::$conf['prod'])?0:0));
		}
		public static function getTotal($receipt,$withoutfees=false,$discount=false,$fundraiser_settings=false,$force=false){
			$total=0;
			$absorb=false;
			if(isset($fundraiser_settings['absorb_fees'])&&$fundraiser_settings['absorb_fees']) $absorb=true;
			if(isset($receipt['donate_amount'])&&$receipt['donate_amount']){
				$total=(int) $receipt['donate_amount'];
			}else{
				foreach ($receipt['contributions'] as $k => $v) {
					$contribution=$v['data']['id'];
					$contributions[]=$contribution;
				}
				$dbcontribution=db2::toList(db2::find(DB,'contribution',array('id'=>array('$in'=>$contributions))));
				$fees=1;//could be a setting in futur
				foreach ($receipt['contributions'] as $k => $v) {
					$contribution=$dbcontribution[$v['data']['id']];
					$total+=((int) $v['quantity'])*$contribution['price'];
				}
				if(isset($receipt['donationAmount'])&&(int) $receipt['donationAmount']){
					$total+=(int) $receipt['donationAmount'];
				}
				//validate discount!
				// if(isset($receipt['onboard'])&&$receipt['onboard']){
				// 	$total-=1100;
				// }
			}
			if(!$withoutfees){
				if($absorb){
					if($force){
						$total-=ceil(self::getFees($total,1));
						$total-=ceil(self::getPlatformFees($total,1));
					}
				}else{
					$total+=ceil(self::getPlatformFees($total));
					$total+=ceil(self::getFees($total));
					//die('totlal '.$total);
				}
			}
			return $total;
		}
		public static function getContributions($receipt){
			foreach ($receipt['contributions'] as $k => $v){
				$q=(int) $v['quantity'];
				$c=0;
				while($c<$q){
					$contributions[]=$v['data']['id'];
					$c++;
				}
			}
			return $contributions;
		}
		public static function getPlatformFees($total,$absorb=false){
			return 100;
		}
		public static function getFees($total,$absorb=false){
			include_once(ROOT.'/api/stripe.php');
			return stripe::calcFee($total,$absorb);
			//return ceil($total*.029+30);
		}
		public static function testgetCounts($r){
			$d=phi::ensure($r,array('fundraiser'));
			return array('data'=>self::getCounts($d['fundraiser']));
		}
		public static function getCounts($fundraiser_id,$nocache=false){
			$q=array(
				'$and'=>array(
					array(
						'$or'=>array(
							array('expires'=>array('$gt'=>time())),
							array('expires'=>array('$exists'=>false))
						)
					),
					array(
						'fundraiser'=>$fundraiser_id
					),
					array(
						'refunded.by.id'=>array('$exists'=>false)
					)
				)
			);
			//$q=array('fundraiser'=>$fundraiser_id);
			#die(json_encode($q));
			$pipeline[]=array(
				'$match'=>$q
			);
			$pipeline[]=array(
				'$unwind'=>array(
					'path'=>'$contributions',
					'preserveNullAndEmptyArrays'=>false
				)
			);
			$pipeline[]=array(
				'$group'=>array(
					'_id'=>array(
						'contribution'=>'$contributions'
					),
					'sold'=>array(
						'$sum'=>array(
							'$cond'=>array(
								array('$ifNull'=>array('$amount',0)),1,0
							)
						)
					),
					'pending'=>array(
						'$sum'=>array(
							'$cond'=>array(
								array('$ifNull'=>array('$amount',0)),0,1
							)
						)
					),
					'all'=>array(
						'$sum'=>1
					)
				)
			);
			$res=db2::aToList(db2::aggregate(DB,'fundraiser_receipt',$pipeline),'_id.contribution',false,false);
			//die(json_encode($res));
			$fundraiser_contributions=db2::toOrderedList(db2::find(DB,'contribution',array('fid'=>$fundraiser_id)));
			if($fundraiser_contributions) foreach ($fundraiser_contributions['list'] as $k => $v) {
				if(!isset($res['list'][$k])){
					$set=array('sold'=>0,'pending'=>0,'all'=>0);
				}else{
					$set=array('sold'=>$res['list'][$k]['sold'],'pending'=>$res['list'][$k]['pending'],'all'=>$res['list'][$k]['all']);
				}
				$data[$k]=$set;
				if($k!='donation') $updates[]=array(array('id'=>$k),array('$set'=>$set));
			}
			#die(json_encode($updates));
			if(!$nocache&&isset($updates)&&sizeof($updates)) $res=db2::bulkUpdate(DB,'contribution',$updates);
			if(!isset($data)) $data=false;
			return $data;
		}
		public static function send($r){
			$created=false;
			$anon=false;
			$fundraiser=db2::findOne(DB,'fundraiser',array('id'=>$r['qs']['fundraiser']));
			if($fundraiser['end']<time()) return ['error'=>'Campaign Complete'];
			#die(json_encode($r['auth']));
			if(isset($r['qs']['welcome'])){
				$d=phi::ensure($r,array('receipt','stripe_token','reservation','fundraiser'));
				//create reservation!
				include_once(ROOT.'/api/stripe.php');
				//add card!
				$card=stripe::addCard([
					'auth'=>$r['auth'],
					'qs'=>[
						'appid'=>$r['qs']['appid'],
						'token'=>$r['qs']['token'],
						'stripe_token'=>$d['stripe_token']
					]
				]);
				$d['method']=$card['card_id'];
				$anon=false;
				if(isset($r['qs']['onboard'])){
					$sub_resp=stripe::updateSubscription([
						'auth'=>$r['auth'],
						'qs'=>[
							'appid'=>$r['qs']['appid'],
							'token'=>$r['qs']['token'],
							'settings'=>[
								'onboard'=>1,
								'plans'=>['one_boulder'=>'player'],
								'source'=>$d['method']
							]
						]
					]);
				}
				phi::log('fundraiser from welcome page!');
			}else if(isset($r['auth']['uid'])&&!isset($r['qs']['anon'])&&!isset($r['qs']['receipt']['onboard'])){
				$d=phi::ensure($r,array('receipt','method','fundraiser','reservation'));
				$anon=false;
			}else{
				if(isset($r['auth']['uid'])){
					$d=phi::ensure($r,array('receipt','fundraiser','reservation','method'));
				}else{
					$d=phi::ensure($r,array('receipt','stripe_token','anon','fundraiser','reservation'));
					$anon=db2::findOne(DB,'fundraiser_anon',array('id'=>$d['anon']));
					if(!$anon) return array('error'=>'invalid_anon_user');
				}
				if(isset($r['qs']['receipt']['onboard'])&&(int) $r['qs']['receipt']['onboard']){
					//die(json_encode($anon));
					if(!isset($r['auth']['uid'])){
						if(isset($r['qs']['debug'])){
							$anon['email'].='_'.time();
						}
						//create user!!!!
						$resp=ONE_CORE::create([
							'auth'=>false,
							'nologin'=>1,
							'qs'=>[
								'appid'=>$r['qs']['appid'],
								'data'=>[
									'name'=>$anon['name'],
									'email'=>$anon['email'],
									'source'=>'fundraiser',
									'pic'=>[
							            "path"=>"/static/blank_user",
							            "ext"=>"jpg",
							            "ar"=>1
							        ],
									'level'=>'player'
								]
							]
						]);
						phi::log('NEW Fundraiser USER: '.json_encode($resp['profile']));
						$created=$resp['profile'];
						$r['auth']['uid']=$resp['profile']['id'];
						$r['qs']['token']=$resp['profile']['_id'];
						phi::log('create user with uid ['.$r['auth']['uid'].']');
					}else{
						$created=false;
					}
					$anon=false;
					include_once(ROOT.'/api/stripe.php');
					//add card!
					if(isset($d['stripe_token'])){
						$card=stripe::addCard([
							'auth'=>$r['auth'],
							'qs'=>[
								'appid'=>$r['qs']['appid'],
								'token'=>$r['qs']['token'],
								'stripe_token'=>$d['stripe_token']
							]
						]);
						$d['method']=$card['card_id'];
					}
					#phi::log('create card ['.$d['method'].']');
					//charge!
					$sub_resp=stripe::updateSubscription([
						'auth'=>$r['auth'],
						'qs'=>[
							'appid'=>$r['qs']['appid'],
							'token'=>$r['qs']['token'],
							'settings'=>[
								'onboard'=>1,//do not charge!
								'plans'=>['one_boulder'=>'player'],
								'source'=>$d['method']
							]
						]
					]);
					#phi::log('SUB: '.json_encode($sub_resp));
				}
			}
			//get reservation
			$res=db2::findOne(DB,'fundraiser_receipt',array('id'=>$d['reservation']));
			if(!$res) return array('error'=>'invalid_reservation');
			if(!isset($res['expires'])) return array('error'=>'reservation_used');
			if(!$anon){//anon to login
				$res['purchaser']=[
					'id'=>$r['auth']['uid'],
					'type'=>'user'
				];
			}
			$fundraiser=db2::findOne(DB,'fundraiser',array('id'=>$d['fundraiser']));
			if(phi::$conf['prod']){
				if(($res['expires']+10)<time()){//give a little extra window.  fundraiser checkout has not time limit
					return array('error'=>'Reservation Expired.  Please try again.');
				}
			}
			if(!$fundraiser){
				return array('error'=>'invalid_fundraiser');
			}
			$fundraiser_settings=db2::findOne(DB,'fundraiser_settings',array('id'=>$d['fundraiser']));
			$firstContribution=db2::findOne(DB,'contribution',['id'=>$d['receipt']['contributions'][0]['id']]);
			if($firstContribution&&isset($firstContribution['type'])&&$firstContribution['type']=='donation'){
				$fundraiser_settings['absorb_fees']=1;
			}
			//die(json_encode($d));
			include_once(ROOT.'/api/stripe.php');
			$ctotal=self::getTotal($d['receipt'],false,(isset($r['qs']['discount']))?$r['qs']['discount']:'',$fundraiser_settings);
			$total=self::getTotal($d['receipt'],false,(isset($r['qs']['discount']))?$r['qs']['discount']:'',$fundraiser_settings,true);
			$d['receipt']['total']=(int) $d['receipt']['total'];
			#phi::log('receipt: '.json_encode($d['receipt']));
			if($ctotal!=$d['receipt']['total']){
				phi::log('totals dont match calc ['.$ctotal.'] v receipt ['.$d['receipt']['total'].'] '.json_encode($d['receipt']));
				return array('error'=>'totals dont match calc ['.$ctotal.'] v receipt ['.$d['receipt']['total'].']');
			}
			$amount=self::getTotal($d['receipt'],1,(isset($r['qs']['discount']))?$r['qs']['discount']:'',$fundraiser_settings,1);
			$absorb=0;
			if(isset($fundraiser_settings['absorb_fees'])&&$fundraiser_settings['absorb_fees']) $absorb=1;
			if($absorb){
				$fee=self::getFees($amount,$absorb);
				$pfee=self::getPlatformFees($amount,$absorb);
				$amount-=$fee;
				$amount-=$pfee;
			}else{
				$fee=self::getFees($amount,$absorb);
				$pfee=self::getPlatformFees($amount,$absorb);
			}
			if($total){
				if($anon){
					$charge=array(
						'from_token'=>$d['stripe_token'],
						'from_anon_id'=>$d['anon'],
						'from_anon_type'=>'fundraiser_anon',
						'to'=>[
							'type'=>'fundraiser',
							'id'=>$fundraiser['id']
						],
						'amount'=>$d['receipt']['total'],
						'platformFee'=>$pfee,
						'platformFeeTag'=>'fundraiser_platform_fee',
						'description'=>'Payment for fundraiser: '.$fundraiser['name']
					);
				}else{
					$charge=array(
						'from'=>$r['auth']['uid'],
						'to'=>[
							'type'=>'fundraiser',
							'id'=>$fundraiser['id']
						],
						'method'=>$d['method'],
						'amount'=>$ctotal,
						'platformFee'=>$pfee,
						'platformFeeTag'=>'fundraiser_platform_fee',
						'description'=>'Payment for fundraiser: '.$fundraiser['name']
					);
				}
				if(isset($fundraiser_settings['statement_descriptor'])&&$fundraiser_settings['statement_descriptor']){
					$charge['statement_descriptor']=$fundraiser_settings['statement_descriptor'];
				}
				$charge['tag']='fundraiser_contribution';
				//phi::log('charge: '.json_encode($charge));
				$resp=stripe::chargeCard($charge);
				if(isset($resp['error'])){
					return $resp;
				}else{
					$charge_id=$resp['charge_id'];
					$payment_info_id=$resp['payment_info_id'];
					#phi::log($resp);
				}
			}else{
				$charge_id='';
				$payment_info_id='';
			}
			foreach (self::getContributions($d['receipt']) as $k => $v) {
				if(isset($d['anon'])){
					$save[]=array(
						'user'=>array('id'=>$d['anon'],'type'=>'fundraiser_anon'),
						'contribution'=>$v,
						'fundraiser'=>$fundraiser['id'],
						'status'=>'active'
					);
				}else{
					$save[]=array(
						'user'=>array('id'=>$r['auth']['uid'],'type'=>'user'),
						'contribution'=>$v,
						'fundraiser'=>$fundraiser['id'],
						'status'=>'active'
					);
				}
			}
			$save=ONE_CORE::bulkSave('fundraiser_contribution',$save,1);
			//phi::log('contributions: '.json_encode($save));
			foreach ($save as $k => $v){
				$contributionids[]=$v['id'];
			}
			$update['$set']['fees']['stripe']=$fee;
			$update['$set']['fees']['one_boulder']=$pfee;
			$update['$set']['total']=$d['receipt']['total'];
			$update['$set']['amount']=$amount;
			$update['$set']['contributions']=self::getContributions($d['receipt']);
			$update['$set']['contribution_ids']=$contributionids;
			if(isset($d['receipt']['donationAmount'])&&(int) $d['receipt']['donationAmount']){
				$update['$set']['donation']=(int) $d['receipt']['donationAmount'];
			}
			// if($charge_id){//may not happen
			// 	$update['$set']['charge_id']=$charge_id;
			// }
			if($payment_info_id){//may not happen
				$update['$set']['payment_info_id']=$payment_info_id;
			}
			$update['$unset']['expires']=1;
			if(isset($r['qs']['discount'])){
				$disc=(int) $d['receipt']['discount'];
				if($disc){
					$update['$set']['discount']=array(
						'data'=>self::$discount,
						'discount'=>(int) $d['receipt']['discount'],
						'original_total'=>(int) $d['receipt']['original_total']
					);
				}
			}
			//upgrade the purcahase token info
			if(isset($d['anon'])){
				$update['$set']['purchaser']=array(
					'id'=>$d['anon'],
					'type'=>'fundraiser_anon'
				);
			}else{
				$update['$set']['purchaser']=array(
					'id'=>$r['auth']['uid'],
					'type'=>'user'
				);
			}
			//phi::log('set: '.json_encode($update));
			// if($td){
			// 	$update['$set']['terms_version']=$td['version'];
			// }
			db2::update(DB,'fundraiser_receipt',array('id'=>$d['reservation']),$update);
			$countdata=self::getCounts($fundraiser['id']);
			phi::clearJob($d['reservation']);//alredy recalcd!
			//notify user!
			//send email!
			//schedule job for this!
			$url='https://api.'.phi::$conf['domain'].'/one_core/module/fundraiser_checkout/sendemail';
			#phi::log('url: '.$url);
			phi::scheduleJob(md5($url.time()),time(),array(
				'url'=>$url,
				'type'=>'url',
				'data'=>array(
					'internal'=>1,
					'reservation'=>$d['reservation']
				)
			));
			$url='https://api.'.phi::$conf['domain'].'/one_core/module/fundraiser_checkout/notifyadmins';
			#phi::log('url: '.$url);
			phi::scheduleJob(md5($url.time()),time(),array(
				'url'=>$url,
				'type'=>'url',
				'data'=>array(
					'internal'=>1,
					'reservation'=>$d['reservation']
				)
			));
			//emit countdata!
			//send push
			phi::push('',$fundraiser['id'].'_orderview',array('type'=>'onCreate'));
			include_once(ROOT.'/api/class/fundraiser.php');
			fundraiser::$fundraiser=$fundraiser['id'];
			ONE_CORE::createStat([
				'page'=>[
					'type'=>'user',
					'id'=>(isset($r['auth']['uid']))?$r['auth']['uid']:'anon'
				],
				'action'=>'sale',
				'link'=>[
					'type'=>'fundraiser',
					'id'=>$fundraiser['id']
				]
			]);
			if(!isset($qrs)) $qrs=false;
			#phi::log('QRS: '.json_encode($qrs));
			return array('success'=>true,'data'=>$countdata,'qrs'=>$qrs,'created'=>$created,'content'=>db2::findOne(DB,'fundraiser_confirmation',array('id'=>$fundraiser['id'])),'fundraiser'=>fundraiser::load(array(
					'qs'=>array('','one_core','module','fundraiser',$fundraiser['id'],'load'),
					'auth'=>(isset($r['auth']))?$r['auth']:false
				)));
		}
		public static function sendEmail($r){//
			$d=phi::ensure($r,array('reservation'));//admin token only
			$res=db2::findOne(DB,'fundraiser_receipt',array('id'=>$d['reservation']));
			include_once(ROOT.'/api/class/fundraiser.php');
			fundraiser::$fundraiser=$res['fundraiser'];
			if(!$res) return array('error'=>'invalid:fundraiser_receipt');
			if($r['qs']['token']!=phi::$conf['admin_token']&&$res['purchaser']['id']!=$r['auth']['uid']){
				if(fundraiser::checkUpdatePermissions($r,false,$res['fundraiser'])){

				}else{
					return array('error'=>'invlid_permissions');
				}
			}
			$ts=db2::toOrderedList(db2::find(DB,'fundraiser_contribution',array('id'=>array('$in'=>$res['contribution_ids']))));
			foreach ($ts['list'] as $k => $v) {
				$contributions[]=$v;
			}
			#phi::$debugEmail=true;
			self::sendContributionEmail($r,$res,$contributions);
			return array('success'=>true);
		}
		public static function previewEmail($r){//
			$d=phi::ensure($r,array('fundraiser'));//admin token only
			include_once(ROOT.'/api/class/fundraiser.php');
			fundraiser::$fundraiser=$d['fundraiser'];
			if(!fundraiser::checkUpdatePermissions($r,false,$d['fundraiser'])) return array('error'=>'invalid_permissions');
			self::sendContributionEmail($r,array(
				'purchaser'=>array(
					'id'=>$r['auth']['uid'],
					'type'=>'user'
				),
				'fundraiser'=>$d['fundraiser']
			),false);
			return array('success'=>true);
		}
		public static function notifyAdmins($r){//
			#phi::log('request');
			if($r['qs']['token']!=phi::$conf['admin_token']) return array('error'=>'invlid_permissions');
			$d=phi::ensure($r,array('reservation'));//admin token only
			$res=db2::findOne(DB,'fundraiser_receipt',array('id'=>$d['reservation']));
			if(!$res) return array('error'=>'invalid:fundraiser_receipt');
			//ensure admins want to be notified!
			$ev=db2::findOne(DB,'fundraiser',array('id'=>$res['fundraiser']));
			$as=db2::findOne(DB,'fundraiser_settings',array('id'=>$res['fundraiser']));
			if($as&&isset($as['notify_list'])&&sizeof($as['notify_list'])){
				$ts=db2::toOrderedList(db2::find(DB,'fundraiser_contribution',array('id'=>array('$in'=>$res['contribution_ids']))));
				foreach ($ts['list'] as $k => $v) {
					$contributions[]=$v;
				}
				foreach ($as['notify_list'] as $k => $v) {
					$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),array(
						'id'=>'fundraiser_purchase',
						'data'=>array(
							'app_id'=>$r['qs']['appid'],
							'to'=>array(
								'type'=>'user',
								'id'=>$v
							),
							'purchaser'=>$res['purchaser'],
							'fundraiser'=>$res['fundraiser'],
							'fundraiser_receipt'=>$d['reservation']
						)
					),1);
				}
				#phi::log('hoos: '.json_encode($hooks));
				if(isset($hooks)) phi::saveHooks($hooks);
			}
			return array('success'=>true);
		}
		public static function hasPermission(){
			return true;
		}
		public static function getReplyTo($fundraiser){

		}
		public static function sendContributionEmail($r,$receipt,$contributions){
			//include_once(ROOT.'/classes/ics.php');
			if($receipt['purchaser']['type']=='user'){
				$u=db2::findOne(DB,'user',array('id'=>$receipt['purchaser']['id']),array('projection'=>array('id'=>1,'name'=>1,'pic'=>1,'email'=>1)));
				$email=$u['email'];
				$to=['id'=>$u['id'],'type'=>'user'];
			}else if($receipt['purchaser']['type']=='fundraiser_anon'){
				$u=db2::findOne(DB,'fundraiser_anon',array('id'=>$receipt['purchaser']['id']));
				$email=$u['email'];
				$to=['id'=>$u['id'],'type'=>'fundraiser_anon'];
			}
			phi::emitHook(phi::$conf['dbname'],time(),array(
				'id'=>'fundraiser_email',
				'data'=>array(
					'app_id'=>$r['qs']['appid'],
					'to'=>$to,
					'receipt'=>$receipt['id'],
					'fundraiser'=>$receipt['fundraiser']
				)
			));
		}
	}
?>