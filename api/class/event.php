<?php
	class event{
		public static $event='';
		public static function handleRequest($r){
			self::$event=$r['path'][4];
			switch ($r['path'][5]){
				case "load":
				#sleep(10);
					$out=self::load($r);
				break;
				case "cancel":
					$out=self::cancel($r);
				break;
				case "delete":
					$out=self::delete($r);
				break;
				case "rsvp"://check
					$out=self::rsvp($r);
				break;
				// case "qrcheckin":
				// 	$out=self::qrcheckin($r);
				// break;
				case "makeinvoice"://check
					$out=self::makeInvoice($r);
				break;
				case "calctempinvoice"://check
					$out=self::calcTempInvoice($r);
				break;
				case "sendpayments"://check
					$out=self::sendPayments($r);
				break;
				case "publish"://check
					$out=self::publish($r);
				break;
				case "removefromguestlist":
					$out=self::removeFromGuestlist($r);
				break;
				case "scan":
					$out=self::scan($r);
				break;
				case "checkin":
					$out=self::checkin($r);
				break;
				case "scanned":
					$out=self::scanned($r);
				break;
				case "searchtickets":
					$out=self::searchTickets($r);
				break;
				case "tickets":
					$out=self::tickets($r);
				break;
				case "orders":
					$out=self::orders($r);
				break;
				case "exportcsv":
					$out=self::exportCSV($r);
				break;
				case "exportordercsv":
					$out=self::exportOrderCSV($r);
				break;
				case "ticketlist":
					$out=self::ticketList($r);
				break;
				case "discounts":
					$out=self::discounts($r);
				break;
				case "guestlist":
					$out=self::guestList($r);
				break;
				case "exportorders":
					$out=self::exportOrders($r);
				break;
				case "stats":
					$out=self::stats($r);
				break;
				case "recalc":
					$out=self::recalc($r);
				break;
				case "archive":
					$out=self::archive($r);
				break;
				case "unarchive":
					$out=self::unarchive($r);
				break;
				case "clone":
					$out=self::cloneEvent($r);
				break;
				case "refund":
					$out=self::refund($r);
				break;
				case "dashboard":
					$out=self::dashboard($r);
				break;
				case "saveresponses":
					$out=self::saveResponses($r);
				break;
				case "useonepass":
					$out=self::useOnepass($r);
				break;
				case "setresponsestatus":
					$out=self::setResponseStatus($r);
				break;
			}
			return $out;
		}
		public static function removeFromGuestlist($r){
			$d=phi::ensure($r,['id']);
			$t=db2::findOne(DB,'ticket_receipt',['id'=>$d['id']]);
			if(!$t) return ['error'=>'Ticket not found'];
			db2::remove(DB,'ticket_receipt',['id'=>$d['id']]);
			return ['success'=>true];
		}
		public static function eventStartUnique($r,$d){
			if(isset($d['current']['start'])){
				if(!isset($d['last']['start_unique'])){//this will trigger if a clone too!
					$d['current']['start_unique']=phi::getUniqueNumber();
					phi::log('update start_unique '.$d['current']['start_unique']);
				}
			}
			return $d;
		}
		public static function setResponseStatus($r){
			include_once(ROOT.'/api/class/formbuilder.php');
			$d=phi::ensure($r,['id','status']);
			//run hooks
			return formbuilder::save([//will do parital update
				'auth'=>$r['auth'],
				'qs'=>[
					'schema'=>'ticket_response',
					'current'=>[
						'id'=>$d['id'],
						'status'=>$d['status']
					]
				]
			]);
		}
		public static function saveResponses($r){
			include_once(ROOT.'/api/class/formbuilder.php');
			$d=phi::ensure($r,['current','schema']);
			$save['user']=$d['current']['user'];
			$save['eid']=$d['current']['eid'];
			if(isset($d['current']['payment'])){
				$save['payment']=$d['current']['payment'];
			}
			//if donation based, ensure donation is set!!!
			$settings=db2::findOne(DB,'ticket_settings',['id'=>$save['eid']]);
			//die(json_encode($settings));
			if(isset($d['current']['donation'])&&$d['current']['donation']&&$d['current']['donation']!='NaN'){
				$save['donation']=$d['current']['donation'];
			}
			//die(json_encode($save));
			if(isset($settings['approval_donation'])){
				if(!isset($save['donation'])){//eventually do range checking!
					return ['error'=>'Suggested Donation Required'];
				}
			}
			$remove=['user','eid','payment','donation'];
			foreach($d['schema']['order'] as $k=>$v){
				if(!in_array($v,$remove)){
					$save['responses']['order'][]=$v;
					$save['responses']['list'][$v]=[
						'response'=>$d['current'][$v],
						'question'=>$d['schema']['fields'][$v]['name']
					];
				}
			}
			#die(json_encode($save));
			$resp=formbuilder::save([
				'auth'=>$r['auth'],
				'qs'=>[
					'schema'=>'ticket_response',
					'current'=>$save
				]
			]);
			//die(json_encode($save));
			return ['success'=>true];
		}
		public static function useOnepass($r){
			include_once(ROOT.'/api/class/formbuilder.php');
			include_once(ROOT.'/api/class/ticket_checkout.php');
			$d=phi::ensure($r,['ticket']);
			$u=db2::findOne(DB,'user',['id'=>$r['auth']['uid']]);
			$e=db2::findOne(DB,'event',['id'=>self::$event]);
			if(!isset($u['onepass'])||$u['onepass']<time()){
				return ['error'=>'ONE|Pass not active'];
			}
			$ticket=db2::findOne(DB,'ticket_receipt',['purchaser.id'=>$r['auth']['uid'],'event'=>self::$event,'onepass'=>1]);
			if($ticket){
				return ['error'=>'ONE|Pass already used'];
			}
			$t=db2::findOne(DB,'ticket',['id'=>$d['ticket']]);
			if(!$t) return ['error'=>'Ticket Not Found'];
			//create event_ticket
			$event_ticket=[
				"user"=>[
					'id'=>$r['auth']['uid'],
					'type'=>'user'
				],
				"event"=>self::$event,
				"ticket"=>$d['ticket'],
				"status"=>"active",
				"start"=>$e['start']
			];
			$resp=formbuilder::save([
				'auth'=>$r['auth'],
				'qs'=>[
					'schema'=>'event_ticket',
					'current'=>$event_ticket
				]
			]);
			//die(json_encode($resp));
			$receipt=[
				"purchaser"=>[
					'id'=>$r['auth']['uid'],
					'type'=>'user'
				],
				"tickets"=>[$d['ticket']],
				"ticket_ids"=>[$resp['data']['id']],
				"event"=>self::$event,
				"amount"=>0,
				"onepass"=>1,
				"total"=>0
			];
			$resp2=formbuilder::save([
				'auth'=>$r['auth'],
				'qs'=>[
					'schema'=>'ticket_receipt',
					'current'=>$receipt
				]
			]);
			$url='https://api.'.phi::$conf['domain'].'/one_core/module/ticket_checkout/sendemail';
			#phi::log('url: '.$url);
			phi::scheduleJob(md5($url.time()),time(),array(
				'url'=>$url,
				'type'=>'url',
				'data'=>array(
					'internal'=>1,
					'reservation'=>$resp2['data']['id']
				)
			));
			$url='https://api.'.phi::$conf['domain'].'/one_core/module/ticket_checkout/notifyadmins';
			#phi::log('url: '.$url);
			phi::scheduleJob(md5($url.time()),time(),array(
				'url'=>$url,
				'type'=>'url',
				'data'=>array(
					'internal'=>1,
					'reservation'=>$resp2['data']['id']
				)
			));
			//cache ticket counts!
			ticket_checkout::getEventTicketCounts(self::$event);
			//RSVP!!!
			event::rsvp([
				'auth'=>$r['auth'],
				'qs'=>[
					'appid'=>$r['qs']['appid'],
					'token'=>$r['qs']['token'],
					'rsvp'=>'going'
				]
			],1);
			#die(json_encode($resp2));
			return ['success'=>true];
		}
		public static function calcTempInvoice($r,$event_id=false){
			if(!$event_id) $event_id=self::$event;
			#phi::log('calcTempInvoice');
			//ensure we know who it is going to!
			$ev=db2::findOne(DB,'event',['id'=>$event_id]);
			//
			if(isset($ev['payout'])){
				phi::log('payouts already made! ['.$event_id.']');
				return ['error'=>'payouts already made!'];
			}
			$summarypipeline=array(
				array(
					'$match'=>array(
						"to.id"=>$event_id,
						//'refunded.by.id'=>['$exists'=>false]
					)
				),
				array(
					'$group'=>array(
						"_id"=>['event'=>'$to.id'],
					    "count"=>array(
					    	'$sum'=>'$net'
					    )
					)
				)
			);
			$summary=db2::aggregate(DB,'payment_info',$summarypipeline);
			if(isset($summary[0]['count'])&&$summary[0]['count']){
				$invoice=[
					'id'=>$event_id,
					'type'=>'event',
					'page'=>[
						'type'=>'event',
						'id'=>$event_id
					],
					'start'=>time(),
					'key'=>$event_id,
					'paid'=>0,
					'updated'=>time(),
					'status'=>'temporary',
					'total'=>$summary[0]['count'],
					'description'=>'[Placeholder] Payout for Event: '.$ev['name']
				];
				$invoice=ONE_CORE::update('invoice',['id'=>$invoice['id']],$invoice);
			}else{
				// $invoice=[
				// 	'id'=>$event_id,
				// 	'type'=>'event',
				// 	'page'=>[
				// 		'type'=>'event',
				// 		'id'=>$event_id
				// 	],
				// 	'start'=>time(),
				// 	'key'=>$event_id,
				// 	'paid'=>0,
				// 	'status'=>'temporary',
				// 	'total'=>0,
				// 	'description'=>'[Placeholder] Payout for Event: '.$ev['name']
				// ];
				// $invoice=ONE_CORE::update('invoice',['id'=>$invoice['id']],$invoice);
				//remove invoice!
				db2::remove(DB,'invoice',['id'=>$event_id]);
			}
			return [
				'success'=>true,
				'data'=>[
					'total'=>(isset($summary[0]['count']))?$summary[0]['count']:0
				]
			];
		}
		public static function publish($r){
			$d=phi::ensure($r,array('from'));
			$ev=db2::findOne(DB,'event',array('id'=>self::$event));
			if(!$ev) return array('error'=>'invalid_event');
			//invite every user based on permission
			$l=db2::toOrderedList(db2::find(DB,'user',array(),array('projection'=>array('id'=>1))));
			if(phi::$conf['prod']){
				//bulk insert hooks!
				if(isset($l['order'])){
					foreach ($l['order'] as $k => $v) {
						$hooks[]=phi::emitHook(DB,time(),array(
							'id'=>'event_invite',
							'data'=>array(
								'app_id'=>$r['qs']['appid'],
								'to'=>array(
									'type'=>'user',
									'id'=>$v
								),
								'from'=>phi::keepFields($d['from'],array('id','type')),
								'event'=>$ev['id']
							)
						),1);
					}
					//save hooks
					phi::saveHooks($hooks);
					$resp['sent']=sizeof($l['order']);
				}else{
					$resp['sent']=0;
				}
			}else{//dev mode
				phi::emitHook(DB,time(),array(
					'id'=>'event_invite',
					'data'=>array(
						'app_id'=>$r['qs']['appid'],
						'to'=>array(
							'type'=>'user',
							'id'=>$r['auth']['uid']
						),
						'from'=>phi::keepFields($d['from'],array('id','type')),
						'event'=>$ev['id']
					)
				));
				$resp['sent']=1;
				$resp['to_send']=sizeof($l['order']);
			}
			db2::update(DB,'event',array('id'=>self::$event),array('$set'=>array('published'=>1)));
			return array('success'=>true,'data'=>$resp);
		}
		public static function unarchive($r){
			$ev=db2::findOne(DB,'event',array('id'=>self::$event));
			if(!$ev) return array('error'=>'invalid_event');
			//ensure admin/host
			$hosts=self::getHosts($ev);
			if(!in_array($r['auth']['uid'], $hosts)) return array('error'=>'invalid_permissions');
			ONE_CORE::update('event',array('id'=>self::$event),array('archived'=>0));
			return array('success'=>true);
		}
		public static function archive($r){
			$ev=db2::findOne(DB,'event',array('id'=>self::$event));
			if(!$ev) return array('error'=>'invalid_event');
			//ensure admin/host
			$hosts=self::getHosts($ev);
			if(!in_array($r['auth']['uid'], $hosts)) return array('error'=>'invalid_permissions');
			ONE_CORE::update('event',array('id'=>self::$event),array('archived'=>1));
			return array('success'=>true);
		}
		public static function refund($r){
			include_once(ROOT.'/api/stripe.php');
			include_once(ROOT.'/api/bank.php');
			$d=phi::ensure($r,array('id'));
			$ev=db2::findOne(DB,'event',array('id'=>self::$event));
			if(!self::checkPerms($r,$ev,'ticket_scan')) return array('error'=>'invalid_permissions');
			if(!isset($r['qs']['force_refund_payment'])){
				if(isset($ev['payout'])) return ['error'=>'Payout already processed.  You cannot give refunds at this time.'];
				if(($ev['start']+(60*60*24*5))<time()) return ['error'=>'Refunds are disabled 5 days after the start of the event'];
			}
			$res=db2::findOne(DB,'ticket_receipt',array('id'=>$d['id']));
			if(!$res) return array('error'=>'invalid_order');
			if(isset($res['refunded'])) return array('error'=>'already_refunded');
			if(!isset($res['payment_info_id'])){
				return array('error'=>'Sorry this cant be refunded, we do not have a transaction to refund');
			}
			$info=db2::findOne(DB,'payment_info',['id'=>$res['payment_info_id']]);
			if(!$info){
				return array('error'=>'Sorry this cant be refunded, we do not have a transaction to refund');
			}
			if(isset($info['charge_info']['id'])){
				$refund_amount=$info['total'];
				if(isset($r['qs']['refund_amount'])&&$r['qs']['refund_amount']) $refund_amount=(int) $r['qs']['refund_amount'];
				$refund_amount=(int) $refund_amount;
				if($refund_amount>$info['total']){
					return ['error'=>'Refund amount cant be greater than the receipt cost $'.phi::formatMoney($info['total'])];
				}
				$out=stripe::refund($info['charge_info']['id'],$refund_amount);
				if(isset($out['success'])){//update bank transaction
					db2::update(DB,'ticket_receipt',array('id'=>$res['id']),array('$set'=>array('refunded'=>array('by'=>array('id'=>$r['auth']['uid'],'type'=>'user'),'ts'=>time(),'amount'=>$refund_amount))));
					if(isset($res['payment_info_id'])){
						$new_net=$info['total']-$refund_amount-$info['fees']['cc_processing']['amount'];//-$info['fees']['ticket_platform_fee']['amount'];
						//phi::log('new net: '.$new_net);
						ONE_CORE::update('payment_info',['id'=>$res['payment_info_id']],[
							'net'=>$new_net,
							'refunded'=>array('by'=>array('id'=>$r['auth']['uid'],'type'=>'user'),'ts'=>time(),'amount'=>$refund_amount)
						]);
					}
				}else{
					return $out;
				}
			}else{
				phi::log('shouldnt get here');
			}
			//refund the payment_info
			self::ensureTicketCounts();
			self::calcTempInvoice(false,self::$event);
			return array('success'=>true);
		}
		// public static function ensureCheckoutNotifications($r,$d,$key,$opts){
		// 	if(isset($d['current']['ticket']['type'])&&$d['current']['ticket']['type']=='hosted'&&(!isset($d['last']['ticket']['type'])||$d['last']['ticket']['type']!='hosted')){
		// 		//$list[]=$r['auth']['uid'];//could be steward but whatever
		// 		if($d['current']['page']['type']=='user'){
		// 			if(!in_array($d['current']['page']['id'], $list)) $list[]=$d['current']['page']['id'];
		// 		}
		// 		if(isset($d['current']['cohost'])){
		// 			foreach ($d['current']['cohost'] as $k => $v) {
		// 				if(!in_array($v, $list)) $list[]=$v;
		// 			}
		// 		}
		// 		phi::log('update admin notifications for event ['.$d['current']['name'].'] to '.json_encode($list));
		// 		ONE_CORE::update('ticket_settings',['id'=>$d['current']['id']],[
		// 			'notify_list'=>$list
		// 		]);
		// 	}
		// 	//return $d;
		// }
		public static function ensureDescriptionVersion($r,$d,$key,$opts,$type,$fieldOpts){
			if(phi::$conf['prod']){
				phi::log('autosave disabled in prod');
				return $d;
			}
			if(isset($fieldOpts['form']['autosave'])){
				$lastVersion=(isset($d['last'][$fieldOpts['form']['autosave']['versionField']]))?$d['last'][$fieldOpts['form']['autosave']['versionField']]:0;
				$currentVersion=(isset($d['current'][$fieldOpts['form']['autosave']['versionField']]))?$d['current'][$fieldOpts['form']['autosave']['versionField']]:0;
				if($lastVersion!=$currentVersion){
					API::toHeaders(['error'=>'version_mismatch']);
				}else{
					$d['current'][$opts['form']['autosave']['versionField']]++;
					phi::log('set version: '.$d['current'][$opts['form']['autosave']['versionField']]);
				}
			}
			return $d;
		}
		public static function ensureDescriptionLinks($r,$d,$key,$opts){
			$text=$d['current'][$key];
			//phi::log('text: '.$text);
			$text=strtolower($text);
			if(strpos($text, 'venmo')!==false){
				API::toHeaders(['error'=>'Ticket sales through Venmo are not allowed.  Please use the built in ticketing platform.']);
			}
			if(strpos($text, 'eventbrite.com')!==false){
				API::toHeaders(['error'=>'Ticket sales through Eventbrite are not allowed.  Please use the built in ticketing platform.']);
			}
			if(strpos($text, 'facebook.com/events/')!==false||strpos($text, 'fb.me/e/')!==false){
				API::toHeaders(['error'=>'Linking to Facebook is not allowed.  Please use the built in ticketing platform.']);
			}
		}
		public static function ensureUniqueDiscountName($r,$d,$key,$opts){
			$found=db2::findOne(DB,'ticket_discount',['code'=>$d['current']['code']]);
			if($found&&$found['id']!=$d['current']['id']) API::toHeaders(['error'=>'Discount Code Already in Use. Please choose another one.']);
		}
		public static function ensureTags($r,$d,$key,$opts){
			if(isset($d['current'][$opts['dataField']])) ONE_CORE::ensureTags($r,$d['current'][$opts['dataField']],$opts['collection']);//saves any ta
			return $d;
		}
		public static function ensureTicketCounts(){
			include_once(ROOT.'/api/class/ticket_checkout.php');
			return ticket_checkout::getEventTicketCounts(self::$event);//caches ticket counts!
		}
		public static function dashboard($r){
			$q=array('eid'=>self::$event);
			self::ensureTicketCounts();
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				$q['_id']=array('$lt'=>db2::toId($r['qs']['last']));
			}
			if(isset($r['qs']['after'])&&$r['qs']['after']){
				$q['_id']=array('$gt'=>db2::toId($r['qs']['after']));
			}
			$opts=array('sort'=>array('_id'=>-1),'limit'=>100);
			$data['tickets']=db2::toOrderedList(db2::find(DB,'ticket',$q,$opts),false,true);
			//discounts!
			$data['discounts']=db2::toOrderedList(db2::find(DB,'ticket_discount',array('eid'=>self::$event)));
			//do counts for discounts!
			$pipeline[]=array(
				'$match'=>array(
					'event'=>self::$event,
					'discount'=>array('$exists'=>true),
					//'refunded.by.id'=>array('$exists'=>false)
				)
			);
			$pipeline[]=array(
				'$group'=>array(
					'_id'=>array(
						'id'=>'$discount.data.id'
					),
					'orders'=>array(
						'$sum'=>1
					),
					'discounted'=>array(
						'$sum'=>'$discount.discount'
					)
				)
			);
			$tr=db2::aGroupToList(db2::aggregate(DB,'ticket_receipt',$pipeline),'_id','_id',function($d){
				return $d['_id']['id'];
			});
			if($tr){
				foreach ($tr['list'] as $k => $v) {
					if(isset($data['discounts']['list'][$k])){
						$data['discounts']['list'][$k]['stats']=$v;
					}
				}
			}
			$summarypipeline=array(
				array(
					'$match'=>array(
						"to.id"=>self::$event,
						//'refunded.by.id'=>['$exists'=>false]
					)
				),
				array(
					'$group'=>array(
						"_id"=>['event'=>'$to.id'],
					    "count"=>array(
					    	'$sum'=>'$net'
					    )
					)
				)
			);
			// $refundsummarypipeline=array(
			// 	array(
			// 		'$match'=>array(
			// 			"to.id"=>self::$event,
			// 			'refunded.by.id'=>['$exists'=>true]
			// 		)
			// 	),
			// 	array(
			// 		'$group'=>array(
			// 			"_id"=>['event'=>'$to.id'],
			// 		    "count"=>array(
			// 		    	'$sum'=>'$refunded.amount'
			// 		    )
			// 		)
			// 	)
			// );
			//die(json_encode(db2::toOrderedList(db2::find(DB,'payment_info',$summarypipeline[0]['$match']))));
			// $l=db2::toOrderedList(db2::find(DB,'payment_info',$summarypipeline[0]['$match']));
			// foreach($l['list'] as $k=>$v){
			// 	$nets[]=[
			// 		'net'=>$v['net'],
			// 		'fees'=>$v['fees']
			// 	];
			// }
			// die(json_encode($nets));
			#die(json_encode($summarypipeline));
			$summary=db2::aggregate(phi::$conf['dbname'],'payment_info',$summarypipeline);
			#die(json_encode($summarypipeline));
			//$refundsummary=db2::aggregate(phi::$conf['dbname'],'payment_info',$refundsummarypipeline);
			
			//ticket_receipt
			if(isset($summary[0]['count'])){
				$data['balance']=$summary[0]['count'];
			}else{
				$data['balance']=0;
			}
			//include line item for 
			// if(isset($refundsummary[0]['count'])){
			// 	$data['refunds']=$refundsummary[0]['count'];
			// 	$data['balance']=$data['balance']-$refundsummary[0]['count'];
			// }
			include_once(ROOT.'/api/class/formbuilder.php');
			$data['breakdown']=formbuilder::feed([
				'auth'=>$r['auth'],
				'qs'=>[
					'id'=>' ',
					'schema'=>'event_breakdown',
					'max'=>1000
				]
			],[
				'event'=>self::$event
			],false,'id');
			$data['invoice']=ONE_CORE::load($r,self::$event,'invoice');
			$data['event']=ONE_CORE::load($r,self::$event,'event');
			return array('success'=>true,'data'=>$data);
		}
		public static function canDeleteBreakdown($r,$d,$key,$opts){
			//if event payout has happened, dont allow delete!
			$e=db2::findOne(DB,'event',['id'=>$d['current']['event']]);
			if(isset($e['payout'])) API::toHeaders(['error'=>'Payout Already Sent.  Cannot remove breakdown']);
		}
		public static function getBreakdowns($breakdowns,$total){
			if(!isset($breakdowns['data']['list'])) return false;
			//remove expenses
			$profit=$total;
			foreach($breakdowns['data']['list'] as $k=>$v){
				if($v['type']=='expense'){
					$profit-=$v['amount_flat'];
				}
			}
			foreach($breakdowns['data']['list'] as $k=>$v){
				if($v['type']=='percent'){
					$breakdowns['data']['list'][$k]['amount_flat']=floor(($v['amount_percent']/100)*$profit);
				}
			}
			return $breakdowns;
		}
		public static function sendPayments($r){
			include_once(ROOT.'/api/class/formbuilder.php');
			$ev=db2::findOne(DB,'event',['id'=>self::$event]);
			//disable until 3 days after event
			//die(($ev['start']+(60*60*24*3)). ' time '.time());
			//if(($ev['start']+(60*60*24*1))<time()) return ['error'=>'Payouts will become available 3 days after the event.'];
			if(isset($ev['payout'])) return ['error'=>'Payout Already Sent'];
			//create invoices for each item
			$summarypipeline=array(
				array(
					'$match'=>array(
						"to.id"=>self::$event,
						//'refunded.by.id'=>['$exists'=>false]
					)
				),
				array(
					'$group'=>array(
						"_id"=>['event'=>'$to.id'],
					    "count"=>array(
					    	'$sum'=>'$net'
					    )
					)
				)
			);
			$refundsummarypipeline=array(
				array(
					'$match'=>array(
						"to.id"=>self::$event,
						'refunded.by.id'=>['$exists'=>true]
					)
				),
				array(
					'$group'=>array(
						"_id"=>['event'=>'$to.id'],
					    "count"=>array(
					    	'$sum'=>'$refunded.amount'
					    )
					)
				)
			);
			$summary=db2::aggregate(phi::$conf['dbname'],'payment_info',$summarypipeline);
			//$refundsummary=db2::aggregate(phi::$conf['dbname'],'payment_info',$refundsummarypipeline);
			//ticket_receipt
			if(isset($summary[0]['count'])){
				$balance=$summary[0]['count'];
			}else{
				$balance=0;
			}
			// if(isset($refundsummary[0]['count'])){
			// 	$refunds=$refundsummary[0]['count'];
			// 	$balance=$balance-$refundsummary[0]['count'];
			// }
			$breakdowns=formbuilder::feed([
				'auth'=>$r['auth'],
				'qs'=>[
					'id'=>' ',
					'schema'=>'event_breakdown',
					'max'=>1000
				]
			],[
				'event'=>self::$event
			],false,'id');
			$breakdowns=self::getBreakdowns($breakdowns,$balance);
			//die(json_encode($balance));
			$total=0;
			if($breakdowns&&isset($breakdowns['data']['list'])&&$breakdowns['data']['list']){
				//calculate
				foreach($breakdowns['data']['list'] as $k=>$v){
					//"order":["id","page","total","start","end","status","key","type","transfer_id","paid","description","link","paid_info"],
					//"order":["id","page","total","start","end","status","key","type","transfer_id","paid","description","link","paid_info"],
					$invoices[]=[
						'id'=>$v['id'],
						'page'=>$v['page'],
						'total'=>$v['amount_flat'],
						'status'=>'finalized',
						'paid'=>0,
						'link'=>[
							'type'=>'event',
							'id'=>self::$event
						],
						'description'=>(isset($v['description'])&&$v['description'])?$v['description']:'Payout for event: '.$ev['name']
					];
					$total+=$v['amount_flat'];
				}
			}
			if($total!=$balance) return ['error'=>'balance does not equal distribution ['.$balance.'] vs ['.$total.']'];
			$auth=$r['auth'];
			$auth['internal']=1;
			foreach($invoices as $k=>$v){
				$saved_invoices[]=formbuilder::save([
					'auth'=>$auth,
					'qs'=>[
						'schema'=>'invoice',
						'current'=>$v
					]
				]);
			}
			//clear temp invoice
			db2::remove(DB,'invoice',['id'=>self::$event]);
			include_once(ROOT.'/api/stripe.php');
			//try to send any invoices that have the payer linked!
			foreach($saved_invoices as $k => $d){
				if(isset($d['data'])){
					$invoice=$d['data'];
					#phi::log('invoice: '.json_encode($invoice));
					$current=db2::findOne(DB,'stripe',['id'=>$invoice['page']['id']]);
					if($current&&isset($current['express']['linked'])){//send it!!!
						stripe::payInvoice([
							'auth'=>$r['auth'],
							'qs'=>[
								'appid'=>$r['qs']['appid'],
								'invoice_id'=>$invoice['id']
							]
						]);
					}else{
						//notification to link account!
						$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),array(
							'id'=>'invoice_link_account',
							'data'=>array(
								'app_id'=>$r['qs']['appid'],
								'to'=>$invoice['page'],
								'for'=>[
									'id'=>$ev['id'],
									'type'=>'event'
								],
								'invoice'=>$invoice['id']
							)
						),1);
						db2::update(DB,'invoice_link',['id'=>$invoice['page']['id']],['$set'=>['id'=>$invoice['page']['id'],'ts'=>time()]],['upsert'=>true]);
					}
				}else{
					phi::log('issues saving '.json_encode($d));
				}
			}
			if(isset($hooks)) phi::saveHooks($hooks);
			//update!
			ONE_CORE::update('event',['id'=>self::$event],[
				'payout'=>[
					'ts'=>time(),
					'by'=>[
						'type'=>'user',
						'id'=>$r['auth']['uid']
					]
				]
			]);
			return ['success'=>true,'invoices'=>$invoices];
		}
		public static function makeInvoice($r){
			$c=db2::findOne(DB,'invoice',['key'=>self::$event]);
			if($c&&phi::$conf['prod']) return ['error'=>'Invoice aleady created'];
			//ensure we know who it is going to!
			$ev=db2::findOne(DB,'event',['id'=>self::$event]);
			$settings=db2::findOne(DB,'ticket_settings',array('id'=>self::$event));
			if(!isset($settings['payout_to'])){
				return ['error'=>'Invoice payout to is not set, please set this in your ticket settings.'];
			}
			$summarypipeline=array(
				array(
					'$match'=>array(
						"to.id"=>self::$event,
						'refunded.by.id'=>['$exists'=>false]
					)
				),
				array(
					'$group'=>array(
						"_id"=>['event'=>'$to.id'],
					    "count"=>array(
					    	'$sum'=>'$net'
					    )
					)
				)
			);
			$summary=db2::aggregate(phi::$conf['dbname'],'payment_info',$summarypipeline);
			if(isset($summary[0]['count'])&&$summary[0]['count']){
				$invoice=[
					'id'=>self::$event,
					'type'=>'event',
					'page'=>$settings['payout_to'],
					'start'=>time(),
					'key'=>self::$event,
					'paid'=>0,
					'link'=>[
						'type'=>'event',
						'id'=>self::$event
					],
					'status'=>'finalized',
					'total'=>$summary[0]['count'],
					'description'=>'Payout for Event: '.$ev['name']
				];
				$invoice=ONE_CORE::update('invoice',['id'=>$invoice['id']],$invoice);
				return ['success'=>true,'data'=>$invoice];
			}else{
				return ['error'=>'No ticket sales to create an invoice for'];
			}
		}
		public static function checkUpdatePermissions($r,$event=false,$event_id=false){
			return true;//anyone can create an event
			if($event_id){//ensure
				$event=db2::findOne(DB,'event',array('id'=>$event_id));
				if(!$event) return false;
			}
			if(!$event) return true;//anyone can create an event
			//explicit
			//if(ONE_CORE::isAdmin($r['auth']['uid'])) return true;
			if(isset($event['cohost'])&&in_array($r['auth']['uid'], $event['cohost'])) return true;//explicit
			$valid=false;
			switch ($event['page']['type']) {
				case 'user':
					if($r['auth']['uid']==$event['page']['id']) $valid=true;
				break;
				case 'page':
					include_once(ROOT.'/api/class/page.php');
					if(page::hasPermission($r,array('page::admin'),$event['page']['id'])) $valid=true;
				break;
			}
			$u=db2::findOne(DB,'user',array('id'=>$r['auth']['uid']));
			if(isset($u['roles'])&&(in_array('admin', $u['roles'])||in_array('steward', $u['roles']))) $valid=true;
			return $valid;
		}
		public static function eventEnsuretime($r,$d,$key,$opts){
			if($d['last']){//only do if its an update!
				if($d['last']['start']!=$d['current']['start']){
					//notify everyone who rsvp'd
					self::onTimeChange($r,$d['current'],$d['last']);
				}
			}
		}
		public static function sendTicketContactList($r,$d,$key,$opts){
			//generate list!
			//phi::log('url: '.'https://api.'.phi::$conf['domain'].'/one_core/module/ticket_checkout/massemail?id='.$d['current']['id'].'&token='.phi::$conf['admin_token'].'&appid='.$r['qs']['appid']);
			//return false;
			phi::scheduleJob(md5($d['current']['id'].time()),time(),array(
				'url'=>'https://api.'.phi::$conf['domain'].'/one_core/module/ticket_checkout/massemail?id='.$d['current']['id'].'&token='.phi::$conf['admin_token'].'&appid='.$r['qs']['appid'],
				'type'=>'url'
			));
		}
		public static function hasPermission(){
			return true;
		}
		public static function discounts($r){
			$q=array('eid'=>self::$event);
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				$q['_id']=array('$lt'=>db2::toId($r['qs']['last']));
			}
			if(isset($r['qs']['after'])&&$r['qs']['after']){
				$q['_id']=array('$gt'=>db2::toId($r['qs']['after']));
			}
			$limit=(isset($r['qs']['max'])&&$r['qs']['max'])?(int) $r['qs']['max']:10;
			$opts=array('sort'=>array('_id'=>-1),'limit'=>$limit);
			$data=db2::toOrderedList(db2::find(DB,'ticket_discount',$q,$opts),false,true);
			return array('success'=>true,'data'=>$data);
		}
		public static function ticketList($r){
			$q=array('eid'=>self::$event);
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				$q['_id']=array('$lt'=>db2::toId($r['qs']['last']));
			}
			if(isset($r['qs']['after'])&&$r['qs']['after']){
				$q['_id']=array('$gt'=>db2::toId($r['qs']['after']));
			}
			if(isset($r['qs']['search'])){
				$q['name']=new MongoDB\BSON\Regex($r['qs']['search'],'i');
			}
			$limit=(isset($r['qs']['max'])&&$r['qs']['max'])?(int) $r['qs']['max']:20;
			$limit=100;
			$opts=array('sort'=>array('_id'=>-1),'limit'=>$limit);
			include_once(ROOT.'/api/class/formbuilder.php');
			return formbuilder::feed([
				'auth'=>$r['auth'],
				'qs'=>[
					'id'=>' ',
					'schema'=>'ticket',
					'max'=>$limit
				]
			],$q,$opts,'id');
			//$data=db2::toOrderedList(db2::find(DB,'ticket',$q,$opts),false,true);
			//return array('success'=>true,'data'=>$data);
		}
		public static function delete($r){
			$ev=db2::findOne(DB,'event',array('id'=>self::$event));
			if(!$ev) return array('error'=>'invalid_event');
			//ensure admin/host
			$hosts=self::getHosts($ev);
			if(!in_array($r['auth']['uid'], $hosts)) return array('error'=>'invalid_permissions');
			//dont allow removal if tickets?
			//remove RSVP's
			db2::remove(DB,'event_rsvp',array('eid'=>self::$event),1);
			//remove invites
			db2::remove(DB,'event_invite',array('event'=>self::$event),1);
			//remove event
			db2::remove(DB,'event',array('id'=>self::$event));
			return array('success'=>true);
		}
		public static function exportOrderCSV($r){
			$ev=db2::findOne(DB,'event',array('id'=>self::$event));
			if(!$ev) return array('error'=>'invalid_event');
			if(!self::checkPerms($r,$ev,'tickets')) return array('error'=>'invalid_permissions');
			$orders=self::orders(array(
				'auth'=>array('scope'=>'*'),
				'qs'=>array(
					'max'=>'none',//speical key
					'sort'=>'name'
				)
			),$ev['id']);
			foreach ($orders['data']['list'] as $k => $v) {
				$order='';
				if(isset($list)) unset($list);
				if(isset($ticketlist)) unset($ticketlist);
				foreach($v['tickets'] as $tk => $tv) {
					if(!isset($list[$tv])) $list[$tv]=0;
					$list[$tv]++;
				}
				foreach ($list as $tk => $tv) {
					$ticketlist[]=$tv.' - '.$v['ticket_info'][$tk]['name'];
				}
				if(!isset($ticketlist)) $ticketlist='';
				$orders['data']['list'][$k]['order']=implode(', ',$ticketlist);
				if(isset($v['refunded'])) $orders['data']['list'][$k]['refunded']='Refunded by '.$v['refunded']['by']['data']['name']. ' on '.phi::formatTime($v['refunded']['ts'],'eventdate');
			}
			#die(json_encode($orders['data']));
			$csv=db2::toCSV($orders['data'],array('user.name'=>'name','user.email'=>'email','amount'=>'amount','order'=>'order','refunded'=>'refunded_info'));
			phi::exportCSV($csv,phi::sanitize($ev['name']).'_contact_export.csv');
			//die(json_encode($orders));
		}
		public static function exportCSV($r){
			$ev=db2::findOne(DB,'event',array('id'=>self::$event));
			if(!$ev) return array('error'=>'invalid_event');
			if(!self::checkPerms($r,$ev,'tickets')) return array('error'=>'invalid_permissions');
			$orders=self::orders(array(
				'auth'=>array('scope'=>'*'),
				'qs'=>array(
					'max'=>'none',//speical key
					'sort'=>'name'
				)
			),$ev['id']);
			//die(json_encode($orders['data']));
			$csv=db2::toCSV($orders['data'],array('user.name'=>'name','user.email'=>'email'));
			phi::exportCSV($csv,phi::sanitize($ev['name']).'_contact_export.csv');
			//die(json_encode($orders));
		}
		public static function exportOrders($r){
			$ev=db2::findOne(DB,'event',array('id'=>self::$event));
			if(!$ev) return array('error'=>'invalid_event');
			if(!self::checkPerms($r,$ev,'tickets')) return array('error'=>'invalid_permissions');
			$out='/tmp/'.md5($ev['id'].time()).'.pdf';
			$data=array(
				'url'=>'https://render.'.phi::$conf['domain'].'/ticket_orders/'.$ev['id'].'?token='.phi::$conf['admin_token'],
				'out'=>$out
			);
			if(isset($r['qs']['preview'])){
				die(file_get_contents($data['url']));
			}
			#phi::log($data['url']);
			#die(json_encode($data));
			$res=phi::execNode2('/usr/bin/node '.ROOT.'/node/pdf.js [data]',$data);
			//put to headers!
			if(is_file($out)){
				phi::outputFileToHeaders(array('src'=>$out,'filename'=>'export_orders.pdf'));
				if(is_file($out)) unlink($out);
			}else{
				return array('error'=>'error building');
			}
		}
		public static function orders($r,$ev_id=false){
			if($ev_id) self::$event=$ev_id;
			$ev=db2::findOne(DB,'event',array('id'=>self::$event));
			if(!$ev) return array('error'=>'invalid_event');
			if(!self::checkPerms($r,$ev,'ticket_scan')) return array('error'=>'invalid_permissions');
			$q=array('event'=>self::$event,'expires'=>array('$exists'=>false));
			if(!isset($r['qs']['search'])){
				if(isset($r['qs']['last'])&&$r['qs']['last']){
					$q['_id']=array('$lt'=>db2::toId($r['qs']['last']));
				}
				if(isset($r['qs']['after'])&&$r['qs']['after']){
					$q['_id']=array('$gt'=>db2::toId($r['qs']['after']));
				}
			}
			if(isset($r['qs']['max'])&&$r['qs']['max']=='none'){
				$limit=100000000;
			}else{
				$limit=(isset($r['qs']['max'])&&$r['qs']['max'])?(int) $r['qs']['max']:10;
			}
			if(isset($r['qs']['sort'])||isset($r['qs']['search'])){
				if(isset($r['qs']['last'])&&$r['qs']['last']){
					$skip=(int) $r['qs']['last'];
				}else{
					$skip=0;
				}
				$ts=ONE_CORE::getSchema('ticket_receipt');
				foreach ($ts['order'] as $k => $v) {
					$oproject[$v]=$project[$v]=1;
				}
				$pipeline[]=array(
					'$match'=>$q
				);
				$pipeline[]=array(
					'$lookup'=>array(
						'from'=>'user',
						'localField'=>'purchaser.id',
						'foreignField'=>'id',
						'as'=>'user_login'
					)
				);
				$pipeline[]=array(
					'$lookup'=>array(
						'from'=>'ticket_anon',
						'localField'=>'purchaser.id',
						'foreignField'=>'id',
						'as'=>'user_anon'
					)
				);
				$pipeline[]=array(
					'$unwind'=>array(
						'path'=>'$user_login',
						"preserveNullAndEmptyArrays"=>true
					)
				);
				$pipeline[]=array(
					'$unwind'=>array(
						'path'=>'$user_anon',
						"preserveNullAndEmptyArrays"=>true
					)
				);
				$project['user']=array(
					'$cond'=>array(
						'if'=>array('$gt'=>array('$user_anon',null)),
						'then'=>'$user_anon',
						'else'=>'$user_login'
					)
				);
				$pipeline[]=array(
					'$project'=>$project
				);
				$oproject['user.id']=1;
				$oproject['user.name']=1;
				// $oproject['user.nameparts']=array(
				// 	'$split'=>array('$user.name',' ')
				// );
				$oproject['user.nameparts']=[
					'$cond'=>array( 
						'if'=>array('$gt'=>array('$user', null)), 
						'then'=>array(
							'$split'=>array('$user.name',' ')
						), 
						'else'=>[]
					)
				];
				$oproject['user.email']=1;
				$oproject['user.pic']=1;
				if(isset($r['qs']['search'])) $oproject['user.lowername']=array('$toLower'=>'$user.name');
				$pipeline[]=array(
					'$project'=>$oproject
				);
				if(isset($r['qs']['sort'])){
					unset($oproject['user.nameparts']);
					$oproject['user.lastname']=array(
						'$toLower'=>array(
							'$arrayElemAt'=>array('$user.nameparts',array('$subtract'=>array(array('$size'=>'$user.nameparts'),1)))
						)
					);
					// $pipeline[]=array(
					// 	'$project'=>$oproject
					// );
					$pipeline[]=array(
						'$sort'=>array('user.name'=>1)
					);
					$last=false;
				}
				if(isset($r['qs']['search'])){
					//die('here');
					$oproject['user.match_name']=array('$indexOfBytes'=>array('$user.lowername', strtolower($r['qs']['search'])));
					$pipeline[]=array(
						'$project'=>$oproject
					);
					unset($oproject['user.match_name']);
					$oproject['weight']=array(
						'$cond'=>array( 
							'if'=>array('$eq'=>array('$user.match_name', 0)), 
							'then'=>5, 
							'else'=>array(
								'$cond'=>array(
									'if'=>array('$eq'=>array('$user.match_name',-1)),
									'then'=>-1,
									'else'=>1
								)
							)
						)
					);
					$pipeline[]=array(
						'$project'=>$oproject
					);
					$pipeline[]=array(
						'$match'=>array('weight'=>array('$gt'=>0))
					);
					$pipeline[]=array(
						'$sort'=>array('weight'=>-1)
					);
					if($skip){
						$pipeline[]=array(
							'$skip'=>$skip
						);
					}
					$pipeline[]=array(
						'$limit'=>$limit
					);
					$last=true;
				}
				//die(json_encode($pipeline));
				$data=db2::aToList(db2::aggregate(DB,'ticket_receipt',$pipeline));
				#die(json_encode($data));
				if($last&&$data){
					$data['last']=$skip+sizeof($data['order']);
				}
				$data=db2::graph(DB,$data,array(
					'tickets'=>array(
						'coll'=>'ticket',
						'to'=>'ticket_info',
						'match'=>'id',
						'collapseList'=>true
					),
					'ticket_ids'=>array(
						'coll'=>'ticket_scan',
						'to'=>'ticket_scans',
						'match'=>'ticket_id',
						'collapseList'=>true
					),
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
							'ticket_anon'=>array(
								'coll'=>'ticket_anon',
								'match'=>'id',
								'clearOnNull'=>true,
								'fields'=>array('id'=>1,'name'=>1,'pic'=>1,'email'=>1)
							)
						)
					),
					'guestof.id'=>array(
						'coll'=>array(
							'field'=>'guestof.type',
							'id'=>'guestof.id'
						),
						'to'=>'guestof.data',
						'opts'=>array(
							'user'=>array(
								'coll'=>'user',
								'match'=>'id',
								'clearOnNull'=>true,
								'fields'=>array('id'=>1,'name'=>1,'pic'=>1)
							),
							'page'=>array(
								'coll'=>'page',
								'match'=>'id',
								'clearOnNull'=>true,
								'fields'=>array('id'=>1,'name'=>1,'pic'=>1)
							)
						)
					),
					'refunded.by.id'=>array(
						'coll'=>array(
							'field'=>'refunded.by.type',
							'id'=>'refunded.by.id'
						),
						'to'=>'refunded.by.data',
						'opts'=>array(
							'user'=>array(
								'coll'=>'user',
								'match'=>'id',
								'clearOnNull'=>true,
								'fields'=>array('id'=>1,'name'=>1,'pic'=>1)
							)
						)
					)
				));
				return array('success'=>true,'data'=>$data);
			}else{
				$data=db2::toOrderedList(db2::find(DB,'ticket_receipt',$q,array('sort'=>array('_id'=>-1),'limit'=>$limit)),false,1);
				$data=db2::graph(DB,$data,array(
					'tickets'=>array(
						'coll'=>'ticket',
						'to'=>'ticket_info',
						'match'=>'id',
						'collapseList'=>true
					),
					'ticket_ids'=>array(
						'coll'=>'ticket_scan',
						'to'=>'ticket_scans',
						'match'=>'ticket_id'
					),
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
								'fields'=>array('id'=>1,'name'=>1,'pic'=>1)
							),
							'ticket_anon'=>array(
								'coll'=>'ticket_anon',
								'match'=>'id',
								'clearOnNull'=>true,
								'fields'=>array('id'=>1,'name'=>1,'pic'=>1)
							)
						)
					),
					'guestof.id'=>array(
						'coll'=>array(
							'field'=>'guestof.type',
							'id'=>'guestof.id'
						),
						'to'=>'guestof.data',
						'opts'=>array(
							'user'=>array(
								'coll'=>'user',
								'match'=>'id',
								'clearOnNull'=>true,
								'fields'=>array('id'=>1,'name'=>1,'pic'=>1)
							),
							'page'=>array(
								'coll'=>'page',
								'match'=>'id',
								'clearOnNull'=>true,
								'fields'=>array('id'=>1,'name'=>1,'pic'=>1)
							)
						)
					),
					'refunded.by.id'=>array(
						'coll'=>array(
							'field'=>'refunded.by.type',
							'id'=>'refunded.by.id'
						),
						'to'=>'refunded.by.data',
						'opts'=>array(
							'user'=>array(
								'coll'=>'user',
								'match'=>'id',
								'clearOnNull'=>true,
								'fields'=>array('id'=>1,'name'=>1,'pic'=>1)
							)
						)
					)
				));
			}
			return array('success'=>true,'data'=>$data);
		}
		public static function tickets($r){
			$ev=db2::findOne(DB,'event',array('id'=>self::$event));
			if(!$ev) return array('error'=>'invalid_event');
			if(!self::checkPerms($r,$ev,'tickets')) return array('error'=>'invalid_permissions');
			$q=array('event'=>self::$event);
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				$q['_id']=array('$lt'=>db2::toId($r['qs']['last']));
			}
			if(isset($r['qs']['after'])&&$r['qs']['after']){
				$q['_id']=array('$gt'=>db2::toId($r['qs']['after']));
			}
			$data=db2::toOrderedList(db2::find(DB,'event_ticket',$q,array('sort'=>array('_id'=>-1))),false,1);
			$data=db2::graph(DB,$data,array(
				'ticket'=>array(
					'coll'=>'ticket',
					'to'=>'ticket',
					'match'=>'id'
				),
				'user.id'=>array(
					'coll'=>array(
						'field'=>'user.type',
						'id'=>'user.id'
					),
					'to'=>'user.data',
					'opts'=>array(
						'user'=>array(
							'coll'=>'user',
							'match'=>'id',
							'clearOnNull'=>true,
							'fields'=>array('id'=>1,'name'=>1,'pic'=>1)
						),
						'ticket_anon'=>array(
							'coll'=>'ticket_anon',
							'match'=>'id',
							'clearOnNull'=>true,
							'fields'=>array('id'=>1,'name'=>1,'pic'=>1)
						)
					)
				)
			));
			return array('success'=>true,'data'=>$data);
		}
		public static function searchTickets($r){
			$d=phi::ensure($r,array('search'));
			//ensure admin
			$ev=db2::findOne(DB,'event',array('id'=>self::$event));
			if(!$ev) return array('error'=>'invalid_event');
			if(!self::checkPerms($r,$ev,'ticket_scan')) return array('error'=>'invalid_permissions');
			//do aggregation
			$ts=ONE_CORE::getSchema('event_ticket');
			foreach ($ts['order'] as $k => $v) {
				$project[$v]=1;
			}
			//$project['user.name']=1;
			$pipeline[]=array(
				'$match'=>array(
					'event'=>self::$event
				)
			);
			$pipeline[]=array(
				'$lookup'=>array(
					'from'=>'user',
					'localField'=>'user.id',
					'foreignField'=>'id',
					'as'=>'user_login'
				)
			);
			$pipeline[]=array(
				'$lookup'=>array(
					'from'=>'ticket_anon',
					'localField'=>'user.id',
					'foreignField'=>'id',
					'as'=>'user_anon'
				)
			);
			$pipeline[]=array(
				'$unwind'=>array(
					'path'=>'$user_login',
					"preserveNullAndEmptyArrays"=>true
				)
			);
			$pipeline[]=array(
				'$unwind'=>array(
					'path'=>'$user_anon',
					"preserveNullAndEmptyArrays"=>true
				)
			);
			$project['user_search']=array(
				'$cond'=>array(
					'if'=>array('$gt'=>array('$user_anon',null)),
					'then'=>'$user_anon',
					'else'=>'$user_login'
				)
			);
			$pipeline[]=array(
				'$project'=>$project
			);
			// //run match!
			$pipeline[]=array(
				'$match'=>array(
					'$or'=>array(
						array(	
							'user_search.name'=>new MongoDB\BSON\Regex($r['qs']['search'],'i')
						),
						array(
							'user_search.email'=>new MongoDB\BSON\Regex($r['qs']['search'],'i')
						)
					)
				)
			);
			unset($project['user_search']);
			unset($project['user_anon']);
			unset($project['user_login']);
			$pipeline[]=array(
				'$project'=>$project
			);
			$pipeline[]=array(
				'$sort'=>array('_id'=>-1)
			);
			$pipeline[]=array(
				'$limit'=>10
			);
			#die(json_encode($pipeline));
			$data=db2::aToList(db2::aggregate(DB,'event_ticket',$pipeline));
			$data=db2::graph(DB,$data,array(
				'ticket'=>array(
					'coll'=>'ticket',
					'to'=>'ticket',
					'match'=>'id'
				),
				'user.id'=>array(
					'coll'=>array(
						'field'=>'user.type',
						'id'=>'user.id'
					),
					'to'=>'user.data',
					'opts'=>array(
						'user'=>array(
							'coll'=>'user',
							'match'=>'id',
							'clearOnNull'=>true,
							'fields'=>array('id'=>1,'name'=>1,'pic'=>1,'email'=>1)
						),
						'ticket_anon'=>array(
							'coll'=>'ticket_anon',
							'match'=>'id',
							'clearOnNull'=>true,
							'fields'=>array('id'=>1,'name'=>1,'pic'=>1,'email'=>1)
						)
					)
				)
			));
			return array('success'=>true,'data'=>$data);
		}
		public static function checkResponseStatus($r,$d,$key,$opts){
			if(isset($d['current']['status'])&&$d['current']['status']=='approved'&&(!$d['last']||(isset($d['last']['status'])&&$d['last']['status']!='approved')||!isset($d['last']['status']))){
				if(isset($opts['checkPayment'])){
					phi::log('check payment!');
					//get ticket settings!
					$ts=db2::findOne(DB,'ticket_settings',['id'=>$d['last']['eid']]);
					if(isset($ts['approval_donation'])){
						//ensure we have card info!
						if(!isset($d['last']['donation'])||!$d['last']['donation']||!isset($d['last']['payment'])||!$d['last']['payment']['data']['card']){
							phi::log('invalid settings for payout');
							return ['error'=>'invalid data saved to do donation payment'];
						}
						if(isset($d['last']['receipt_id'])){
							return ['error'=>'Donation already Charged, do not charge again!'];
						}
						//reserve?!??!
						include_once(ROOT.'/api/class/ticket_checkout.php');
						$resp=ticket_checkout::reserve([
							'auth'=>[
								'uid'=>$d['last']['user']['id']
							],
							'force_questionaire'=>1,
							'qs'=>[
								'event'=>$d['last']['eid'],
								'tickets'=>[
									['id'=>'donation','quantity'=>1]
								]
							]
						]);
						if(isset($resp['error'])) API::toHeaders($resp);
						$original_total=$total=$d['last']['donation'];
						//absorb fees
						$fees=ceil(ticket_checkout::getFees($total,1));
						$total-=$fees;
						$pfee=ceil(ticket_checkout::getPlatformFees($total,1));
						$total-=$pfee;
						$resp2=ticket_checkout::send([
							'auth'=>[
								'uid'=>$d['last']['user']['id']
							],
							'qs'=>[
								'receipt'=>[
									'donationAmount'=>$d['last']['donation'],
									'original_total'=>$original_total,
									'total'=>$original_total,
									'platformFee'=>$pfee,
									'total_discount'=>0,
									'discount'=>0,
									'fee'=>0,
									'tickets'=>[
										['id'=>'donation','quantity'=>1,'data'=>['id'=>'donation']]
									],
									'event'=>$d['last']['eid']
								],
								'event'=>$d['last']['eid'],
								'reservation'=>$resp['data']['id'],
								'method'=>$d['last']['payment']['data']['card']
							]
						]);
						if(isset($resp2['error'])) API::toHeaders($resp2);
						//phi::log('resp2 '.json_encode($resp2));
						$d['current']['receipt_id']=$resp['data']['id'];
					}else{
						phi::log('no doation...');
					}
					$d['current']['approved_by']=[
						'id'=>$r['auth']['uid'],
						'type'=>'user',
						'ts'=>time()
					];
				}else{
					if(isset($d['current']['receipt_id'])&&$d['current']['receipt_id']){
						phi::emitHook(DB,time(),array(
							'id'=>'ticket_donation_approved',
							'data'=>array(
								'app_id'=>$r['auth']['appid'],
								'to'=>phi::keepFields($d['current']['user'],['id','type']),
								'from'=>array(
									'type'=>'user',
									'id'=>$r['auth']['uid']
								),
								'event'=>$d['current']['eid']
							)
						));
					}else{
						phi::emitHook(DB,time(),array(
							'id'=>'ticket_request_approved',
							'data'=>array(
								'app_id'=>$r['auth']['appid'],
								'to'=>phi::keepFields($d['current']['user'],['id','type']),
								'from'=>array(
									'type'=>'user',
									'id'=>$r['auth']['uid']
								),
								'event'=>$d['current']['eid']
							)
						));
					}
				}
			}else{
				#phi::log('status did not change: checkResponseStatus');
			}
			return $d;
		}
		public static function onNewQuestionaire($r,$d,$key,$opts){
			#die(json_encode($r));
			#phi::log('onNewQuestionaire');
			$e=db2::findOne(DB,'event',['id'=>$d['current']['eid']]);
			$hosts=self::getHosts($e);
			//phi::log('hosts! '.json_encode($hosts));
			//hosts or event creator
			foreach ($hosts as $k => $v) {
				if($r['auth']['uid']!=$v||!phi::$conf['prod']){//notify hosts, but dont notify self.
					//ONE_CORE::notify($r['auth']['uid'],$v,'event_rsvp',array('event_id'=>$e['id']));
					$hooks[]=phi::emitHook(DB,time(),array(
						'id'=>'ticket_request',
						'data'=>array(
							'app_id'=>$r['auth']['appid'],
							'to'=>array(
								'type'=>'user',
								'id'=>$v
							),
							'from'=>array(
								'type'=>'user',
								'id'=>$r['auth']['uid']
							),
							'event'=>$d['current']['eid']
						)
					),1);
				}
			}
			#if(isset($hooks)) phi::log(json_encode($hooks));
			if(isset($hooks)) phi::saveHooks($hooks);
		}
		public static function ensurePrivacy($r,$d){
			if(!isset($d['current']['privacy'])&&!isset($d['last']['privacy'])){
				#phi::log('update event privacy');
				$d['current']['privacy']='public';	
			}
			return $d;
		}
		public static function checkPerms($r,$ev,$perm){
			$hosts=self::getHosts($ev);
			#phi::log('hosts '.json_encode($hosts));
			//if(!phi::$conf['prod']) return true;
			if($r['auth']['scope']=='*') return true;
			if(in_array($r['auth']['uid'], $hosts)) return true;
			if(isset($ev['page']['id'])&&$ev['page']['id']==$r['auth']['uid']) return true;
			//if(self::checkUpdatePermissions($r,$ev)) return true;
			//could have other logic, eg ticket permission could include those granted scanner abilities
			if($perm=='ticket_scan'){
				$s=db2::findOne(DB,'ticket_settings',array('id'=>$ev['id']));
				#phi::log('settings ['.$r['auth']['uid'].'] '.json_encode($s));
				if(isset($s['scanlist'])&&in_array($r['auth']['uid'], $s['scanlist'])) return true;
			}
			$u=db2::findOne(DB,'user',['id'=>$r['auth']['uid']]);
			if($u&&$u['level']=='steward') return true;
			if(isset($u['roles'])&&in_array('event_steward', $u['roles'])) return true;
			if(isset($u['roles'])&&in_array('admin', $u['roles'])) return true;
			return false;
		}
		public static function scanned($r){
			if(isset($r['qs']['max'])&&$r['qs']['max']) $max=(int) $r['qs']['max'];
			$q=array('event'=>self::$event);
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				$q['_id']=array('$lte'=>db2::toId($r['qs']['last']));
			}
			if(!self::checkPerms($r,db2::findOne(DB,'event',array('id'=>self::$event)),'ticket_scan')) return array('error'=>'invalid_permissions');
			$data=db2::toOrderedList(db2::find(DB,'ticket_scan',$q,array('sort'=>array('_id'=>-1),'limit'=>$max)),1,'_id');
			$data=db2::graph(DB,$data,array(
				'by'=>array(
					'coll'=>'user',
					'to'=>'by_info',
					'match'=>'id',
					'filter'=>array('name','pic','id')
				),
				'user.id'=>array(
					'coll'=>array(
						'field'=>'user.type',
						'id'=>'user.id'
					),
					'to'=>'user.data',
					'opts'=>array(
						'user'=>array(
							'coll'=>'user',
							'match'=>'id',
							'clearOnNull'=>true,
							'fields'=>array('id'=>1,'name'=>1,'pic'=>1)
						),
						'ticket_anon'=>array(
							'coll'=>'ticket_anon',
							'match'=>'id',
							'clearOnNull'=>true,
							'fields'=>array('id'=>1,'name'=>1,'pic'=>1)
						)
					)
				),
				'ticket'=>array(
					'coll'=>'ticket',
					'to'=>'ticket',
					'match'=>'id'
				)
			));
			return array('success'=>true,'data'=>$data);
		}
		public static function checkin($r){
			$d=phi::ensure($r,array('tickets'));
			$e=db2::findOne(DB,'event',array('id'=>self::$event));
			if(!$e) return array('error'=>'invalid_event');
			// $hosts=self::getHosts($e);
			// if(!in_array($r['auth']['uid'], $hosts)) return array('error'=>'invalid_permissions');
			if(!self::checkPerms($r,$e,'ticket_scan')) return array('error'=>'invalid_permissions');
			if(time()<($e['start']-(60*60*24))){
				return ['error'=>'Checkins are only available the day of the event and after'];
			}

			foreach ($d['tickets'] as $k => $v) {
				$ticket=db2::findOne(DB,'event_ticket',array('id'=>$v));
				if($ticket){
					$scan=array(
						'ticket_id'=>$v,
						'event'=>$e['id'],
						'ticket'=>$ticket['ticket'],
						'user'=>$ticket['user'],
						'by'=>$r['auth']['uid']
					);
					$scan=ONE_CORE::save('ticket_scan',$scan);
				}
			}
			//check in for the person!
			if($ticket['user']['type']=='user'){
				include_once(ROOT.'/api/class/formbuilder.php');
				$tdata=formbuilder::save(array(
					'auth'=>[
						'uid'=>$ticket['user']['id']
					],
					'qs'=>array(
						'appid'=>$r['qs']['appid'],
						'schema'=>'checkin',
						'current'=>[
							"location"=>[
								'id'=>$e['id'],
								'type'=>'event'
							],
							"page"=>$ticket['user']
						]
					)
				));
				//die('mk');
				#die('mk');
				#phi::log(json_encode($tdata));
			}
			return ['success'=>true,'data'=>db2::toOrderedList(db2::find(DB,'ticket_scan',['ticket_id'=>['$in'=>$d['tickets']]]))];
		}
		public static function scan($r){
			//ensure only people can do this!
			$d=phi::ensure($r,array('ticket'));
			$e=db2::findOne(DB,'event',array('id'=>self::$event));
			if(!$e) return array('error'=>'invalid_event');
			// $hosts=self::getHosts($e);
			// if(!in_array($r['auth']['uid'], $hosts)) return array('error'=>'invalid_permissions');
			if(!self::checkPerms($r,$e,'ticket_scan')) return array('error'=>'invalid_permissions');
			$c=db2::findOne(DB,'ticket_scan',array('ticket_id'=>$d['ticket']));
			if(!$c){//allow in dev
				//validate ticket!
				$ticket=db2::findOne(DB,'event_ticket',array('id'=>$d['ticket']));
				if(!$ticket) return array('error'=>'invalid_ticket');
				$scan=array(
					'ticket_id'=>$d['ticket'],
					'event'=>$e['id'],
					'ticket'=>$ticket['ticket'],
					'user'=>$ticket['user'],
					'by'=>$r['auth']['uid']
				);
				$scan=ONE_CORE::save('ticket_scan',$scan);
				$scan=db2::graphOne(DB,$scan,array(
					'ticket'=>array(
						'coll'=>'ticket',
						'to'=>'ticket',
						'match'=>'id'
					),
					'user.id'=>array(
						'coll'=>array(
							'field'=>'user.type',
							'id'=>'user.id'
						),
						'to'=>'user.data',
						'opts'=>array(
							'user'=>array(
								'coll'=>'user',
								'match'=>'id',
								'clearOnNull'=>true,
								'fields'=>array('id'=>1,'name'=>1,'pic'=>1)
							),
							'ticket_anon'=>array(
								'coll'=>'ticket_anon',
								'match'=>'id',
								'clearOnNull'=>true,
								'fields'=>array('id'=>1,'name'=>1,'pic'=>1)
							)
						)
					)
				));
				$resp['scan']=$scan;
				$resp['valid']=true;
			}else{
				return array('error'=>'This ticket has already been used');
			}
			$resp['success']=true;
			return $resp;
		}
		public static function recalc($r){
			return array('success'=>true,'data'=>self::ensureTicketCounts());
		}
		public static function cloneEvent($r){
			$e=db2::findOne(DB,'event',array('id'=>self::$event));
			$oid=self::$event;
			unset($e['id']);
			unset($e['_id']);
			if(isset($e['url_name'])) unset($e['url_name']);
			if(isset($e['cancelled'])) unset($e['cancelled']);
			include_once(ROOT.'/api/class/formbuilder.php');
	  		$resp['event']=formbuilder::save(array(
	  			'qs'=>array(
	  				'current'=>$e,
	  				'schema'=>'event'
	  			),
	  			'auth'=>$r['auth']
	  		));
	  		if(!isset($resp['event']['success'])) return $resp['event'];
	  		//clone other settings too!
	  		$other_settings=array('event_ticketconfirmation','event_ticketemail','event_advanced','ticket_settings');
	  		foreach ($other_settings as $k => $v) {
	  			$c=db2::findOne(DB,$v,array('id'=>$oid));
	  			if($c){
	  				//phi::log('clone event setting: '.$v);
	  				$c['id']=$resp['event']['data']['id'];
	  				//die(json_encode($c));
	  				if($v=='ticket_settings'){
	  					if(isset($c['stoptime'])) unset($c['stoptime']);
	  				}
		  			$resp[$v]=formbuilder::save(array(
			  			'qs'=>array(
			  				'current'=>$c,
			  				'schema'=>$v
			  			),
			  			'auth'=>$r['auth']
			  		));
		  		}
	  		}
	  		#die(json_encode($resp));
			return $resp['event'];
		}
		public static function stats($r){
			$e=db2::findOne(DB,'event',array('id'=>self::$event));
			if(!$e) return array('error'=>'invalid_event');
			return array('success'=>true,'data'=>self::getEventStats($e,$r['auth']['uid']));
		}
		public static function guestList($r){
			$d=phi::ensure($r,array('type'));
			$types=array('going','interested','invited','cantgo');
			if(!in_array($d['type'], $types)) return array('error'=>'invalid_type');
			$ev=db2::findOne(DB,'event',array('id'=>self::$event));
			if(!$ev) return array('error'=>'invalid_event');
			switch ($d['type']) {
				case 'going':
				case 'interested':
				case 'cantgo':
					$coll='event_rsvp';
					$ekey='eid';
					$ukey='uid';
				break;
				case 'invited':
					$coll='event_invite';
					$ekey='event';
					$ukey='to';
				break;
			}
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				$l=db2::findOne(DB,$coll,array('_id'=>db2::toId($r['qs']['last'])));
				if(!$l) return array('error'=>'invalid_last_post');
				$q['_id']=array('$lt'=>db2::toId($l['_id']));
			}
			if(isset($r['qs']['after'])&&$r['qs']['after']){
				$a=db2::findOne(DB,$coll,array('_id'=>db2::toId($r['qs']['after'])));
				if(!$a) return array('error'=>'invalid_after_post');
				$q['_id']=array('$gt'=>db2::toId($a['_id']));
			}
			$limit=(isset($r['qs']['max'])&&$r['qs']['max'])?(int) $r['qs']['max']:10;
			$opts=array('sort'=>array('_id'=>-1),'limit'=>$limit);
			$q[$ekey]=$ev['id'];
			switch ($d['type']) {
				case 'going':
					$q['rsvp']='going';
				break;
				case 'interested':
					$q['rsvp']='interested';
				break;
				case 'cantgo':
					$q['rsvp']='cantgo';
				break;
				case 'invited':
					//and not rsvpd
					$tl=db2::toList(db2::find(DB,'event_rsvp',array('eid'=>self::$event)),false,'uid');
					if($tl){
						$list=array_keys($tl);
						$q[$ukey]=array('$nin'=>$list);
					}
				break;
			}
			$odata=db2::toOrderedList(db2::find(DB,$coll,$q,$opts),false,true,$ukey);
			if($odata){
				$data['last']=$odata['last'];
				$data['order']=$odata['order'];
				$data['list']=db2::toList(db2::find(DB,'user',array('id'=>array('$in'=>$data['order'])),array('projection'=>array('id'=>1,'name'=>1,'pic'=>1))));
			}else{
				$data=false;
			}
			//translate to user
			return array('success'=>true,'data'=>$data);
		}
		public static function cancel($r){
			//inform everyone the event was canceled!
			$ev=db2::findOne(DB,'event',array('id'=>self::$event));
			if(!$ev) return array('error'=>'invalid_event');
			if(isset($ev['cancelled'])) return array('error'=>'event already cancelled');
			$hosts=self::getHosts($ev);//
			//die(json_encode($hosts));
			//if(!in_array($r['auth']['uid'], $hosts)) return array('error'=>'invalid_permissions');
			//db2::update(DB,'event',array('id'=>self::$event),array('$set'=>array('cancelled'=>array('ts'=>time(),'by'=>$r['auth']['uid']))));
			ONE_CORE::update('event',array('id'=>self::$event),array('cancelled'=>array('ts'=>time(),'by'=>$r['auth']['uid'])));//must happne before webhook
			//notify everyone who rsvp'd
			$sent=[];
			$tickets=self::getTicketList($ev['id']);
			if($tickets){
				foreach ($tickets as $k => $v) {
					if(!in_array($v['id'], $sent)){
						$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),array(
							'id'=>'event_cancelled_ticket',
							'data'=>array(
								'app_id'=>$r['qs']['appid'],
								'to'=>$v,
								'event'=>$ev['id']
							)
						),1);
						$sent[]=$v['id'];
					}
				}
			}
			$going=self::getList($ev['id'],'going');
			if($going){
				foreach ($going as $k => $v) {
					if(!in_array($v, $sent)){
						$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),array(
							'id'=>'event_cancelled_going',
							'data'=>array(
								'app_id'=>$r['qs']['appid'],
								'to'=>array(
									'type'=>'user',
									'id'=>$v
								),
								'event'=>$ev['id']
							)
						),1);
						$sent[]=$v;
					}
				}
			}
			$interested=self::getList($ev['id'],'interested');
			if($interested){
				foreach ($interested as $k => $v) {
					if(!in_array($v, $sent)){
						$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),array(
							'id'=>'event_cancelled_interested',
							'data'=>array(
								'app_id'=>$r['qs']['appid'],
								'to'=>array(
									'type'=>'user',
									'id'=>$v
								),
								'event'=>$ev['id']
							)
						),1);
						$sent[]=$v;
					}
				}
			}
			if(isset($hooks)) phi::saveHooks($hooks);
			return array('success'=>true,'data'=>array(
				'ts'=>time(),
				'by'=>$r['auth']['uid'],
				'by_info'=>db2::findOne(DB,'user',['id'=>$r['auth']['uid']],['projection'=>['id'=>1,'name'=>1,'pic'=>1]])
			));
		}
		public static function getList($eid,$type){
			$list=db2::toList(db2::find(DB,'event_rsvp',array('eid'=>$eid,'rsvp'=>$type)));
			if($list){
				foreach ($list as $k => $v) {
					$tlist[]=$v['uid'];
				}
				return $tlist;
			}else return false;
		}
		public static function getTicketList($eid){
			$l=db2::toOrderedList(db2::find(DB,'ticket_receipt',['event'=>$eid]));
			if($l){
				foreach ($l['list'] as $k => $v) {
					$out[$v['purchaser']['id']]=$v['purchaser'];
				}
				return $out;
			}else return false;
		}
		public static function onTimeChange($r,$newevent,$oldevent){
			$sent=[];
			$tickets=self::getTicketList($newevent['id']);
			if($tickets){
				foreach ($tickets as $k => $v) {
					if(!in_array($v['id'], $sent)){
						$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),array(
							'id'=>'event_timechange_ticket',
							'data'=>array(
								'app_id'=>$r['qs']['appid'],
								'to'=>$v,
								'event'=>$newevent['id']
							)
						),1);
						$sent[]=$v['id'];
					}
				}
			}
			$going=self::getList($newevent['id'],'going');
			if($going){
				foreach ($going as $k => $v) {
					if(!in_array($v, $sent)){
						$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),array(
							'id'=>'event_timechange_going',
							'data'=>array(
								'app_id'=>$r['qs']['appid'],
								'to'=>array(
									'type'=>'user',
									'id'=>$v
								),
								'event'=>$newevent['id']
							)
						),1);
						$sent[]=$v;
					}
				}
			}
			$interested=self::getList($newevent['id'],'interested');
			if($interested){
				foreach ($interested as $k => $v) {
					if(!in_array($v, $sent)){
						$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),array(
							'id'=>'event_timechange_interested',
							'data'=>array(
								'app_id'=>$r['qs']['appid'],
								'to'=>array(
									'type'=>'user',
									'id'=>$v
								),
								'event'=>$newevent['id']
							)
						),1);
						$sent[]=$v;
					}
				}
			}
			if(isset($hooks)) phi::saveHooks($hooks);
			//update all the Tickets's with the proper start time
			db2::update(DB,'event_ticket',array('event'=>$newevent['id']),array('$set'=>array('start'=>$newevent['start'])),array(),false);
			//update all the RSVP's with the proper start time
			db2::update(DB,'event_rsvp',array('eid'=>$newevent['id']),array('$set'=>array('tsu'=>db2::tsToTime(time()),'start'=>db2::tsToTime($newevent['start']))),array(),false);
		}
		public static function onNewPost($post){
			phi::log('neweventpost');
			phi::time('neweventpost');
			$ev=db2::findOne(DB,'event',array('id'=>$post['page']['id']));
			if(!$ev){
				phi::log('invalid event onNewPost ['.$post['page']['id'].']');
				return false;
			}
			$hosts=self::getHosts($ev);//for now
			$from=$post['by']['id'];
			$fromdata=ONE_CORE::getUser($from);
			$msg=array(
				'from'=>$from,//can be on behalf of
				'from_data'=>$fromdata,
				'mode'=>'mirror',
				'skip'=>array($from),
				'to'=>$hosts,
				'type'=>'post_added_event_host',
				'data'=>array(
					'event_id'=>$ev['id'],
					'post_id'=>$post['id']
				)
			);
			db2::save(DB,'broadcast',$msg);
			$fl=db2::findOne(DB,'user_friends',array('id'=>$post['by']['id']),array('projection'=>array('friends'=>1)));
			if($fl&&isset($fl['friends'])){
				//find friends also rsvp'd going to this event!
				$l=db2::toList(db2::find(DB,'event_rsvp',array('eid'=>$ev['id'],'uid'=>array('$in'=>$fl['friends']),'rsvp'=>'going')));
				if($l){
					foreach ($l as $k => $v) {
						if(!in_array($v['uid'], $hosts)){
							$friends[]=$v['uid'];
						}
					}
					if(isset($friends)){
						//notify friends of post!
						$tskip=$hosts;
						$tskip[]=$from;
						$msg=array(
							'from'=>$from,//can be on behalf of
							'from_data'=>$fromdata,
							'mode'=>'mirror',
							'to'=>$friends,
							'skip'=>$tskip,
							'type'=>'post_added_event_friend',
							'data'=>array(
								'event_id'=>$ev['id'],
								'post_id'=>$post['id']
							)
						);
						db2::save(DB,'broadcast',$msg);
					}
				}
			}
			phi::time('neweventpost');
			//notify hosts that a new post was added
			//notify friends who also rsvp'd to this event?
		}
		public static function getHosts($event){
			//$hosts=array($event['uid']);
			$hosts=array();
			if($event['page']['type']=='user'){
				$hosts[]=$event['page']['id'];
			}else if($event['page']['type']=='page'){
				$p=db2::findOne(DB,'page',['id'=>$event['page']['id']]);
				$hosts=$p['admins'];
			}
			if(isset($event['cohost'])&&sizeof($event['cohost'])){
				foreach ($event['cohost'] as $k => $v) {
					if(!in_array($v, $hosts)) $hosts[]=$v;
				}
			}
			return $hosts;
		}
		public static function rsvp($r,$silent=false){
			$d=phi::ensure($r,array('rsvp'),1,array('self::write::rsvp'));
			$e=db2::findOne(DB,'event',array('id'=>self::$event));
			if(!$e) return array('error'=>'invalid_event');
			$id=self::$event.'_'.$r['auth']['uid'];
			$current=db2::findOne(DB,'event_rsvp',array('id'=>$id));
			if($d['rsvp']!='clear'){
				$valid=array('going','interested','cantgo');
				if(!in_array($d['rsvp'], $valid)) return array('error'=>'invalid_rsvp');
				$set=array(
					'id'=>$id,
					'rsvp'=>$d['rsvp'],
					'uid'=>$r['auth']['uid'],
					'eid'=>self::$event,
					'start'=>db2::tsToTime((int) $e['start']),
					'tsu'=>db2::tsToTime(time())
				);
				db2::update(DB,'event_rsvp',array('id'=>$id),array('$set'=>$set),array('upsert'=>true));
				if($d['rsvp']=='going'){
					$hosts=self::getHosts($e);
					//hosts or event creator
					foreach ($hosts as $k => $v) {
						if($r['auth']['uid']!=$v){//notify hosts, but dont notify self.
							//ONE_CORE::notify($r['auth']['uid'],$v,'event_rsvp',array('event_id'=>$e['id']));
							if(!$silent) $hooks[]=phi::emitHook(DB,time(),array(
								'id'=>'event_rsvp_going',
								'data'=>array(
									'app_id'=>$r['qs']['appid'],
									'to'=>array(
										'type'=>'user',
										'id'=>$v
									),
									'from'=>array(
										'type'=>'user',
										'id'=>$r['auth']['uid']
									),
									'event'=>$e['id']
								)
							),1);
						}
					}
					if(isset($hooks)) phi::saveHooks($hooks);
				}
				//ensure lists are correct
				$add[$d['rsvp']]=$r['auth']['uid'];
				if($d['rsvp']=='going'){
					$pull['interested'][]=$r['auth']['uid'];
					$pull['cantgo'][]=$r['auth']['uid'];
				}
				if($d['rsvp']=='interested'){
					$pull['cantgo'][]=$r['auth']['uid'];
					$pull['going'][]=$r['auth']['uid'];
				}
				if($d['rsvp']=='cantgo'){
					$pull['interested'][]=$r['auth']['uid'];
					$pull['going'][]=$r['auth']['uid'];
				}
				db2::update(DB,'event_list',array('id'=>self::$event),array('$addToSet'=>$add,'$pullAll'=>$pull),array('upsert'=>true));
			}else{
				$set=array(
					'id'=>$id,
					'rsvp'=>'notgoing',
					'uid'=>$r['auth']['uid'],
					'eid'=>self::$event,
					'start'=>db2::tsToTime((int) $e['start']),
					'tsu'=>db2::tsToTime(time())
				);
				db2::update(DB,'event_rsvp',array('id'=>$id),array('$set'=>$set),array('upsert'=>true));
				//db2::remove(DB,'event_rsvp',array('id'=>$id));
				//remove from list
				$pull['going'][]=$r['auth']['uid'];
				$pull['interested'][]=$r['auth']['uid'];
				db2::update(DB,'event_list',array('id'=>self::$event),array('$pullAll'=>$pull),array('upsert'=>true));
			}
			ONE_CORE::createStat([
				'page'=>[
					'type'=>'user',
					'id'=>$r['auth']['uid']
				],
				'unique_key'=>$r['auth']['uid'].'_rsvp_'.self::$event,
				'action'=>'event_rsvp',
				'link'=>[
					'type'=>'event',
					'id'=>self::$event
				]
			]);
			$data=self::getEventStats($e,$r['auth']['uid']);
			phi::push('','event_'.$e['id'],array('rsvp'=>true,'from'=>$r['auth']['uid']));
			return self::load($r);
		}
		public static function getEventStats($event,$uid){
			//going or interested including friends
			$l=db2::toOrderedList(db2::find(DB,'event_rsvp',array('eid'=>$event['id'],'rsvp'=>array('$in'=>array('going','interested'))),array('sort'=>array('_id'=>-1))),false,false,'uid');
			if($l){
				$max=6;
				foreach ($l['list'] as $k => $v) {
					if(!isset($stats[$v['rsvp']])) $stats[$v['rsvp']]=0;
					$stats[$v['rsvp']]++;
				}
				$stats['invited']=db2::count(DB,'event_invite',array('event'=>$event['id']));
				$ks=$l['order'];
				foreach ($ks as $k => $v) {
					$ids[]=$uid.'_'.$v;
				}
				// $fl=db2::toList(db2::find(DB,'friend',array('id'=>array('$in'=>$ids))));
				// if($fl){
				// 	$stats['friends']['count']=0;
				// 	foreach ($ks as $k => $v) {
				// 		$id=$uid.'_'.$v;
				// 		if(isset($fl[$id])){
				// 			if(!isset($stats['friends']['order'])) $stats['friends']['order']=array();
				// 			if(sizeof($stats['friends']['order'])<$max){
				// 				$stats['friends']['order'][]=$v;
				// 			}
				// 			$stats['friends']['count']++;
				// 		}
				// 	}
				// 	if(isset($stats['friends']['order'])){
						
				// 	}
				// }
				if(!isset($stats['friends']['order'])||sizeof($stats['friends']['order'])<8){//fill out!
					if(!isset($stats['friends'])) $stats['friends']=array(
						'order'=>array()
					);
					foreach ($l['list'] as $k => $v) {
						if(!in_array($v['uid'], $stats['friends']['order'])) $stats['friends']['order'][]=$v['uid'];
					}
				}
				if(isset($stats['friends']['order'])){
					$stats['friends']['list']=db2::toList(db2::find(DB,'user',array('id'=>array('$in'=>$stats['friends']['order']))),array('name','pic','id'),'id');
					if($stats['friends']['list']) foreach ($stats['friends']['list'] as $k => $v) {
						if(isset($l['list'][$v['id']])){
							$stats['friends']['list'][$k]['status']=$l['list'][$v['id']]['rsvp'];
						}
					}
				}
			}else{
				$stats=false;
			}
			return $stats;
		}
		public static function ensureTimezone($r,$d,$key,$opts){
			
		}
		public static function getEventTimeZone($event){
			if(isset($event['timezone'])){
				return $event['timezone'];
			}else{
				return 'America/Denver';//default
			}
		}
		public static function areTicketsActive($event,$settings=false,$eid=false){
			if(!$event&&$eid){
				$event=db2::findOne(DB,'event',array('id'=>$eid));
			}
			if(!$settings){
				$settings=db2::findOne(DB,'ticket_settings',array('id'=>$event['id']));
			}
			if(isset($settings['stopsales'])&&$settings['stopsales']&&isset($settings['stoptime'])){
				$tz=self::getEventTimeZone($event);
				date_default_timezone_set($tz);
				if($settings['stoptime']<time()){
					return false;
				}
			}
			return true;
		}
		public static function load($r,$event_id=false,$src='event'){
			//load primary categories!
			if($event_id) self::$event=$event_id;
			$data['event']=ONE_CORE::load($r,self::$event,'event');
			if(!$data['event']) return array('error'=>'404');
			// $data['event']['hosts']=self::getHosts($data['event']);
			if(!empty($data['event']['archived'])&&!in_array($r['auth']['uid'], $data['event']['hosts'])){
				return array('error'=>'404');
			}

			$data['event']['stats']=self::getEventStats(array(
				'id'=>self::$event
			),(isset($r['auth']['uid']))?$r['auth']['uid']:'');
			//add my tickets!
			if(isset($r['auth']['uid'])&&$r['auth']['uid']){
				$data['tickets']=db2::toOrderedList(db2::find(DB,'event_ticket',array('user.id'=>$r['auth']['uid'],'event'=>self::$event,'status'=>'active')));
				$data['tickets']=db2::graph(DB,$data['tickets'],array(
					'ticket'=>array(
						'coll'=>'ticket',
						'to'=>'ticket_info',
						'match'=>'id'
					)
				));
			}
			$adv=db2::findOne(DB,'event_advanced',array('id'=>self::$event));
			if($adv){
				$keep=array('dont_show_rsvp');
				$data['event']['advanced']=phi::keepFields($adv,$keep);
			}
		//if(isset($data['event']['ticket']['type'])&&$data['event']['ticket']['type']=='hosted'){
			$data['event']['ticket']['tickets']=db2::toOrderedList(db2::find(DB,'ticket',array('eid'=>self::$event,'available'=>1),['sort'=>['price'=>1]]));
			$data['event']['ticket_settings']=db2::findOne(DB,'ticket_settings',array('id'=>self::$event));
			if(isset($data['ticket_settings']['scanlist'])&&$r['auth']&&in_array($r['auth']['uid'], $data['ticket_settings']['scanlist'])){
				$data['event']['isScanner']=1;
			}
		$data['event']['ticket_settings']=phi::keepFields($data['event']['ticket_settings'],array('showremaining','stopsales','stoptime','stopmessage','onboard','absorb_fees','require_approval','approval_visibility','approval_donation','approval_donation_min','approval_donation_max'));
			if(isset($data['event']['ticket_settings']['require_approval'])&&$data['event']['ticket_settings']['require_approval']){
				$data['event']['ticket_settings']['questions']=db2::toOrderedList(db2::find(DB,'ticket_question',['eid'=>$data['event']['id']]));
				if(isset($r['auth']['uid'])&&$r['auth']['uid']) $data['event']['ticket_response']=db2::findOne(DB,'ticket_response',['user.id'=>$r['auth']['uid'],'eid'=>$data['event']['id']]);
			}
			$data['event']['ticket_settings']['tickets_active']=self::areTicketsActive($data['event'],$data['event']['ticket_settings']);
				//$data['ticket_settings']=$data['event']['ticket_settings'];
			//}
			// ONE_CORE::pageLoad($r,array(
			// 	'type'=>'event',
			// 	'id'=>$data['event']['id']
			// ));
			ONE_CORE::pageLoad($r,$src,$data['event']['id']);
			$data=$data['event'];
			$data['pretty_time']=phi::formatTime($data['start'],'event',(isset($data['end']))?$data['end']:false);
			if(isset($r['auth']['uid'])&&$r['auth']['uid']){
				$ticket=db2::findOne(DB,'ticket_receipt',['purchaser.id'=>$r['auth']['uid'],'event'=>self::$event,'onepass'=>1]);
				if($ticket){
					$data['onepassStatus']='used';
				}else{
					$u=db2::findOne(DB,'user',['id'=>$r['auth']['uid']]);
					if(isset($u['onepass'])&&$u['onepass']>time()){
						$data['onepassStatus']='available';
					}else{
						$data['onepassStatus']='not_available';
					}
				}
			}else{
				$data['onepassStatus']='not_available';
			}
			//return cache and build there
			return array('success'=>true,'data'=>$data);
		}
	}
?>