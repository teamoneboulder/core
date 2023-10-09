<?php
	class ticket_checkout{
		public static $discount='';
		public static $platformFeeCalculation='79+.02*[total]';//100;//'.70+.03*[total]';
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
						$out=self::testgetEventTicketCounts($r);
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
		public static function ensureGuestTickets($r,$d,$k,$opts){
			if(isset($d['current']['guestlist'])){
				//ensure counts!
				if(!isset($d['current']['purchaser'])) API::toHeaders(array('error'=>'Please select a person'));
				if(!isset($d['current']['tickets'])) API::toHeaders(array('error'=>'Please select tickets'));
				if(!isset($d['current']['event'])) API::toHeaders(array('error'=>'Event not set'));
				//die(var_dump($api));
				$tdata=self::getEventTicketCounts($d['current']['event'],1);
				//ensure there are enough tickets available!
				$gettickets=array();
				foreach ($d['current']['tickets'] as $k => $v) {
					$qty=1;
					$tc=0;
					while($tc<$qty){
						$tickets[]=$v;
						if(!in_array($v, $gettickets)) $gettickets[]=$v;
						if(!isset($ticketcount[$v])) $ticketcount[$v]=0;
						$ticketcount[$v]++;
						$tc++;
					}
				}
				$tl=db2::toList(db2::find(DB,'ticket',array('id'=>array('$in'=>$gettickets))));
				if($tdata) foreach ($tdata as $k => $v) {
					if(isset($tl[$k])){//only care about tickets they are trying to purchase
						$t=$tl[$k];
						if(isset($t['quantity'])&&$t['quantity']){
							$available=$t['quantity']-$v['all'];
							if(isset($ticketcount[$k])){
								if($ticketcount[$k]<=$available){
									//great!
								}else{
									API::toHeaders(array('error'=>'The tickets you are requesting are more than the alloted amount'));
								}
							}
						}
					}
				}
				$event=db2::findOne(DB,'event',array('id'=>$d['current']['event']));
				foreach($d['current']['tickets'] as $k => $v) {
					if($d['current']['purchaser']['type']!='user'){
						$save[]=array(
							'user'=>array('id'=>$d['current']['purchaser']['id'],'type'=>'ticket_anon'),
							'ticket'=>$v,
							'event'=>$d['current']['event'],
							'start'=>$event['start'],
							'status'=>'active'
						);
					}else{
						$save[]=array(
							'user'=>array('id'=>$d['current']['purchaser']['id'],'type'=>'user'),
							'ticket'=>$v,
							'event'=>$d['current']['event'],
							'start'=>$event['start'],
							'status'=>'active'
						);
					}
				}
				$save=ONE_CORE::bulkSave('event_ticket',$save,1);
				foreach ($save as $k => $v){
					$ticketids[]=$v['id'];
				}
				$d['current']['ticket_ids']=$ticketids;
				//send email!!!!
			}
			return $d;
		}
		public static function processGuestTickets($r,$d,$k,$opts){
			if(isset($d['current']['guestlist'])){
				//add tickets!
				#phi::log('processGuestTickets');
				$url='https://api.'.phi::$conf['domain'].'/one_core/module/ticket_checkout/sendemail';
				phi::scheduleJob(md5($url.time()),time(),array(
					'url'=>$url,
					'type'=>'url',
					'data'=>array(
						'internal'=>1,
						'reservation'=>$d['current']['id']
					)
				));
				$url='https://api.'.phi::$conf['domain'].'/one_core/module/ticket_checkout/notifyadmins';
				phi::scheduleJob(md5($url.time()),time(),array(
					'url'=>$url,
					'type'=>'url',
					'data'=>array(
						'internal'=>1,
						'reservation'=>$d['current']['id']
					)
				));
				phi::scheduleJob($d['current']['id'],time(),array(
					'url'=>'https://'.phi::$conf['api'].'/one_core/module/ticket_checkout/recalc',
					'type'=>'url',
					'data'=>array(
						'internal'=>1,
						'event'=>$d['current']['event']
					)
				));
			}
		}
		public static function sendTicketContact($r,$d,$k,$opts){
			//die(json_encode($d['current']));
			$d['current']['person']['data']=db2::findOne(DB,$d['current']['person']['type'],array('id'=>$d['current']['person']['id']),array('projection'=>array('id'=>1,'name'=>1,'email'=>1)));
			$d['current']['reply_to']['data']=db2::findOne(DB,$d['current']['reply_to']['type'],array('id'=>$d['current']['reply_to']['id']),array('projection'=>array('id'=>1,'name'=>1,'email'=>1)));
			$event=db2::findOne(DB,'event',array('id'=>$d['current']['eid']));
			$settings=db2::findOne(DB,'event_ticketemail',array('id'=>$event['id']));
			if($d['current']['person']['data']&&$d['current']['reply_to']['data']){
				#phi::$debugEmail=true;
				#die(json_encode($d['current']));
				phi::mail(DB,'ticket_email',array(
					'sitepath'=>ROOT.'/sites/one_core',
					'template'=>'ticket_email.txt',
					'vars'=>array(
						'user'=>$d['current']['person']['data'],
						'event'=>$event,
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
				phi::log('invalid person in sendTicketContact');
			}
		}
		public static function ensureUser($r,$d,$k,$opts){
			if(isset($d['current'][$k]['type'])&&$d['current'][$k]['type']==$opts['anon_schema']){
				if(!isset($d['current']['event'])) API::toHeaders(array('error'=>'invalid_event_setting'));
				if(!isset($d['current'][$k]['data']['name'])) API::toHeaders(array('error'=>'invalid_name'));
				if(!isset($d['current'][$k]['data']['email'])) API::toHeaders(array('error'=>'invalid_email'));
				if(!isset($d['current'][$k]['id'])){
					$s=ONE_CORE::save($opts['anon_schema'],array(
						'eid'=>$d['current']['event'],
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
		public static function checkDiscount($r){
			$d=phi::ensure($r,array('event','code'));
			$c=db2::findOne(DB,'ticket_discount',array('eid'=>$d['event'],'code'=>$d['code']));
			if(!$c) return array('error'=>'invalid_code');
			return array('success'=>true,'data'=>$c);
		}
		public static function recalc($r){
			$d=phi::ensure($r,array('event'));
			if($r['qs']['token']!=phi::$conf['admin_token']){
				return array('error'=>'invlid_permissions');
			}
			$data=self::getEventTicketCounts($d['event']);
			return array('success'=>true,'data'=>$data);
		}
		public static function massEmail($r){
			include_once(ROOT.'/sites/one_core/one_core.api');
			include_once(ROOT.'/api/class/event.php');
			#phi::log('request');
			$d=phi::ensure($r,array('id'));
			if($r['qs']['token']!=phi::$conf['admin_token']){
				return array('error'=>'invlid_permissions');
			}
			//get all tickets!
			$em=db2::findOne(DB,'ticket_contact_list',array('id'=>$d['id']));
			if(!$em) return ['error'=>'invalid ticket_contact_list item'];
			$em['reply_to']['data']=db2::findOne(DB,$em['reply_to']['type'],array('id'=>$em['reply_to']['id']),array(
				'projection'=>array('id'=>1,'email'=>1,'name'=>1)));
			//generate lists!
			$sendto=[
				'anon'=>[],
				'users'=>[]
			];
			if(in_array('ticket_holder', $em['to'])){
				$l=db2::toOrderedList(db2::find(DB,'ticket_receipt',array('event'=>$em['eid'],'expires'=>array('$exists'=>false))));
				foreach($l['list'] as $k=>$v){
					if($v['purchaser']['type']=='ticket_anon'){
						if(!in_array($v['purchaser']['id'],$sendto['anon'])) $sendto['anon'][]=$v['purchaser']['id'];
					}
					if($v['purchaser']['type']=='user'){
						if(!in_array($v['purchaser']['id'],$sendto['users'])) $sendto['users'][]=$v['purchaser']['id'];
					}
				}
			}
			if(in_array('rsvp_going', $em['to'])){
				$going=EVENT::getList($em['eid'],'going');
				if($going) foreach($going as $k=>$v){
					if(!in_array($v,$sendto['users'])) $sendto['users'][]=$v;
				}
			}
			if(in_array('rsvp_interested', $em['to'])){
				$interested=EVENT::getList($em['eid'],'interested');
				if($interested) foreach($interested as $k=>$v){
					if(!in_array($v,$sendto['users'])) $sendto['users'][]=$v;
				}
			}
			//die(json_encode($sendto));
			//make hooks for communication!!!
			if(sizeof($sendto['users'])){
				$hooks=false;
				foreach($sendto['users'] as $k=>$v){
					$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),array(
						'id'=>'event_communication',
						'data'=>array(
							'app_id'=>$r['qs']['appid'],
							'to'=>array(
								'type'=>'user',
								'id'=>$v
							),
							'event'=>$em['eid'],
							'communication'=>$d['id']
						)
					),1);
				}
				if(isset($hooks)) phi::saveHooks($hooks);
			}
			if(sizeof($sendto['anon'])){
				$hooks=false;
				foreach($sendto['anon'] as $k=>$v){
					$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),array(
						'id'=>'event_communication_anon',
						'data'=>array(
							'app_id'=>$r['qs']['appid'],
							'to'=>array(
								'type'=>'ticket_anon',
								'id'=>$v
							),
							'event'=>$em['eid'],
							'communication'=>$d['id']
						)
					),1);
				}
				//die(json_encode($hooks));
				if(isset($hooks)) phi::saveHooks($hooks);
			}
			return ['success'=>true];
			$settings=db2::findOne(DB,'event_ticketemail',array('id'=>$event['id']));
			$sendto=array();
			if($l) foreach ($l['list'] as $k => $v) {
				if(!isset($v['purchaser']['data']['email'])){
					phi::log('no email found for mass ticket email: '.json_encode($v));
					continue;
				}
				if(in_array($v['purchaser']['data']['email'], $sendto)) continue;
				$save=phi::mail(DB,'ticket_email_list_'.$d['id'],array(
					'sitepath'=>ROOT.'/sites/one_core',
					'template'=>'ticket_email_list.txt',
					'vars'=>array(
						'user'=>$v['purchaser']['data'],
						'event'=>$event,
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
				phi::log('send ['.sizeof($tosave).'] ticket emails');
				db2::bulkInsert(DB,'notice',$tosave);
			}
			//make the post/comment
			// $post=array(
			// 	'by'=>$em['reply_to'],
			// 	'rich_message'=>$em['message'],
			// 	'headline'=>$em['subject'],
			// 	'page'=>array(
			// 		'id'=>$event['id'],
			// 		'type'=>'event'
			// 	),
			// 	'perms'=>array('public')
			// );
			//die(json_encode($post));
			include_once(ROOT.'/sites/one_core/one_core.api');
			// $resp=feed::updatePost(array(
			// 	'auth'=>$r['auth'],
			// 	'qs'=>array(
			// 		'post'=>$post,
			// 		'channel'=>'feed_'.$event['id'],
			// 		'context'=>'post'
			// 	)
			// ));
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
			$d=phi::ensure($r,array('tickets','event'));
			include_once(ROOT.'/api/class/event.php');
			include_once(ROOT.'/api/stripe.php');
			$settings=db2::findOne(DB,'ticket_settings',array('id'=>$d['event']));
			$active=event::areTicketsActive(false,$settings,$d['event']);
			if(!$active){
				return array('error'=>'ticket_sales_closed','message'=>(isset($settings['stopmessage']))?$settings['stopmessage']:'');
			}
			//check questionaire!!!!
			if(isset($settings['require_approval'])&&$settings['require_approval']&&!isset($r['force_questionaire'])){
				if(!isset($r['auth']['uid'])||!$r['auth']['uid']) return ['error'=>'questionaire_require_login'];
				$resp=db2::findOne(DB,'ticket_response',['user.id'=>$r['auth']['uid'],'eid'=>$d['event']]);
				$respsettings=phi::keepFields($settings,['onboard','approval_donation','approval_donation_min','approval_donation_max']);
				if($resp){
					if(isset($resp['status'])&&$resp['status']=='approved'){
						//approved!
					}
					if(!isset($resp['status'])||$resp['status']!='approved'){
						return ['error'=>'questionaire_awaiting_response','settings'=>$respsettings,'questions'=>db2::toOrderedList(db2::find(DB,'ticket_question',['eid'=>$d['event']]))];
					}
				}else{
					return ['error'=>'questionaire_required','settings'=>$respsettings,'questions'=>db2::toOrderedList(db2::find(DB,'ticket_question',['eid'=>$d['event']]))];
				}
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
			//if there are any tickets currently reserved by this person, remove them..
			db2::remove(DB,'ticket_receipt',array('purchaser.id'=>$purchaser['id'],'expires'=>array('$exists'=>true)),true);
			$receipt=array(
				'purchaser'=>$purchaser,
				'event'=>$d['event'],
				'expires'=>self::getReserveExpiration()
			);
			$gettickets=array();
			foreach ($d['tickets'] as $k => $v) {
				$qty=(int) $v['quantity'];
				$tc=0;
				while($tc<$qty){
					$tickets[]=$v['id'];
					if(!in_array($v['id'], $gettickets)) $gettickets[]=$v['id'];
					if(!isset($ticketcount[$v['id']])) $ticketcount[$v['id']]=0;
					$ticketcount[$v['id']]++;
					$tc++;
				}
			}
			if(!isset($tickets)) return array('error'=>'invalid_ticket_quantity');
			$tl=db2::toList(db2::find(DB,'ticket',array('id'=>array('$in'=>$gettickets))));
			$data=self::getEventTicketCounts($d['event'],1);
			//ensure there are enough tickets available!
			if($data) foreach ($data as $k => $v) {
				if(isset($tl[$k])){//only care about tickets they are trying to purchase
					$t=$tl[$k];
					if(isset($t['quantity'])&&$t['quantity']){//quanitty 0
						$available=$t['quantity']-$v['all'];
						if(isset($ticketcount[$k])){
							if($ticketcount[$k]<=$available){
								//great!
							}else{
								return array('error'=>'tickets_quantity_not_available');
							}
						}
					}
				}
			}
			$receipt['tickets']=$tickets;
			#die(json_encode($receipt));
			$receipt=ONE_CORE::save('ticket_receipt',$receipt);
			#die(json_encode($receipt));
			$data=self::getEventTicketCounts($d['event']);
			//recalc
			//add a job!
			$jobid=$receipt['id'];
			$t=(phi::$conf['prod'])?'+11 minutes':'+3 minutes';
			//phi::log('new job: '.$jobid.' in '.$t);
			phi::scheduleJob($jobid,$t,array(
				'url'=>'https://'.phi::$conf['api'].'/one_core/module/ticket_checkout/recalc',
				'type'=>'url',
				'data'=>array(
					'internal'=>1,
					'event'=>$d['event']
				)
			));
			$resp=array('success'=>true,'data'=>$receipt);
			$resp['absorb_fees']=(isset($settings['absorb_fees'])&&$settings['absorb_fees'])?1:0;
			if(!phi::$conf['prod']) $resp['extra']=$data;
			// $tt=db2::findOne(DB,'app_text',['id'=>'ticket_terms']);
			// $resp['terms']=(isset($tt['content']))?$tt['content']:'';
			if(!isset($r['auth']['uid'])){
				$resp['ticket_anon']=ONE_CORE::getSchema('ticket_anon');
			}
			#$resp['data']['methods']=stripe::getMethods($uid);
			$resp['terms']=phi::cache('ticket_terms',function(){
				$td=db2::findOne(DB,'termdata',array('id'=>'ticket'));
				return $td['html'];
			},false);
			$resp['settings']=phi::keepFields($settings,['onboard','approval_donation','approval_donation_min','approval_donation_max']);
			$resp['platformFeeCalculation']=self::$platformFeeCalculation;
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
		public static function getTotal($receipt,$withoutfees=false,$discount=false,$ticket_settings=false,$force=false){
			$total=0;
			$absorb=false;
			if(isset($ticket_settings['absorb_fees'])&&$ticket_settings['absorb_fees']) $absorb=true;
			if(isset($receipt['donate_amount'])&&$receipt['donate_amount']){
				$total=(int) $receipt['donate_amount'];
			}else{
				foreach ($receipt['tickets'] as $k => $v) {
					$ticket=$v['data']['id'];
					$tickets[]=$ticket;
				}
				$dbtickets=db2::toList(db2::find(DB,'ticket',array('id'=>array('$in'=>$tickets))));
				$fees=1;//could be a setting in futur
				foreach ($receipt['tickets'] as $k => $v) {
					if(isset($dbtickets[$v['data']['id']])){
						$ticket=$dbtickets[$v['data']['id']];
						if(!isset($ticket['price'])) $ticket['price']=0;
						$total+=((int) $v['quantity'])*$ticket['price'];
					}
				}
				//validate discount!
				if($discount){
					$to_discount=self::getDiscount($receipt,$discount,$total);
					$total-=$to_discount;
				}
				// if(isset($receipt['onboard'])&&$receipt['onboard']){
				// 	$total-=1100;
				// }
				if(isset($receipt['donationAmount'])&&(int) $receipt['donationAmount']){
					$total+=(int) $receipt['donationAmount'];
				}
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
				}
			}
			return $total;
		}
		public static function getDiscount($receipt,$discount,$total){
			if(!self::$discount) self::$discount=db2::findOne(DB,'ticket_discount',array('id'=>$discount));
			//phi::log('apply: '.json_encode($discount));
			$to_discount=0;
			if(isset(self::$discount['discount_percent'])){
				$to_discount=floor((self::$discount['discount_percent']/100)*$total);
			}
			return $to_discount;
		}
		public static function getTickets($receipt){
			//die(json_encode($receipt['tickets']));
			foreach ($receipt['tickets'] as $k => $v){
				$q=(int) $v['quantity'];
				$c=0;
				while($c<$q){
					$tickets[]=$v['data']['id'];
					$c++;
				}
			}
			return $tickets;
		}
		public static function getPlatformFees($total,$absorb=false){
			if($total>200){
				try{
					$ca=floor(eval('return '.phi::parseString(self::$platformFeeCalculation,[
						'total'=>$total
					]).';'));
					return $ca;
				}catch(Exception $e){
					phi::log('🔥 getPlatformFees failed!');
				}
				// phi::log('calculated: '.$ca);
				// return 100;
			}else{
				return 0;
			}
		}
		public static function getFees($total,$absorb=false){
			include_once(ROOT.'/api/stripe.php');
			return stripe::calcFee($total,$absorb);
			//return ceil($total*.029+30);
		}
		public static function testgetEventTicketCounts($r){
			$d=phi::ensure($r,array('event'));
			return array('data'=>self::getEventTicketCounts($d['event']));
		}
		public static function getEventTicketCounts($event_id,$nocache=false){
			$q=array(
				'$and'=>array(
					array(
						'$or'=>array(
							array('expires'=>array('$gt'=>time())),
							array('expires'=>array('$exists'=>false))
						)
					),
					array(
						'event'=>$event_id
					),
					array(
						'refunded.by.id'=>array('$exists'=>false)
					)
				)
			);
			//$q=array('event'=>$event_id);
			#die(json_encode($q));
			$pipeline[]=array(
				'$match'=>$q
			);
			$pipeline[]=array(
				'$unwind'=>array(
					'path'=>'$tickets',
					'preserveNullAndEmptyArrays'=>false
				)
			);
			$pipeline[]=array(
				'$group'=>array(
					'_id'=>array(
						'ticket'=>'$tickets'
					),
					'sold'=>array(
						'$sum'=>array(
							'$cond'=>array(
								array('$ifNull'=>array('$expires',0)),0,1
							)
						)
					),
					'pending'=>array(
						'$sum'=>array(
							'$cond'=>array(
								array('$ifNull'=>array('$expires',0)),1,0
							)
						)
					),
					'onepass_count'=>array(
						'$sum'=>[
							'$cond'=>array(
								array('$ifNull'=>array('$onepass',0)),1,0
							)
						]
					),
					'all'=>array(
						'$sum'=>1
					)
				)
			);
			$res=db2::aToList(db2::aggregate(DB,'ticket_receipt',$pipeline),'_id.ticket',false,false);
			//die(json_encode($res));
			$event_tickets=db2::toOrderedList(db2::find(DB,'ticket',array('eid'=>$event_id)));
			if($event_tickets) foreach ($event_tickets['list'] as $k => $v) {
				if(!isset($res['list'][$k])){
					$set=array('sold'=>0,'pending'=>0,'all'=>0);
				}else{
					$set=array('sold'=>$res['list'][$k]['sold'],'pending'=>$res['list'][$k]['pending'],'all'=>$res['list'][$k]['all'],'onepass_count'=>$res['list'][$k]['onepass_count']);
				}
				$data[$k]=$set;
				if($k!='donation') $updates[]=array(array('id'=>$k),array('$set'=>$set));
			}
			#die(json_encode($updates));
			if(!$nocache&&isset($updates)&&sizeof($updates)) $res=db2::bulkUpdate(DB,'ticket',$updates);
			// if(isset($res[0])){
			// 	foreach ($res as $k => $v) {
			// 		$set=array('sold'=>$v['sold'],'pending'=>$v['pending'],'all'=>$v['all']);
			// 		$data[$v['_id']['ticket']]=$set;
			// 		$updates[]=array(array('id'=>$v['_id']['ticket']),array('$set'=>$set));
			// 	}
			// 	if(!$nocache) $res=db2::bulkUpdate(DB,'ticket',$updates);
			// }else{
			// 	$data=false;
			// }
			if(!isset($data)) $data=false;
			return $data;
		}
		public static function send($r){
			$created=false;
			$anon=false;
			//check to see if receipt is already done!
			
			#die(json_encode($r['auth']));
			if(isset($r['qs']['welcome'])){
				$d=phi::ensure($r,array('receipt','stripe_token','reservation','event'));
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
				// include_once(ROOT.'/api/class/formbuilder.php');
				// $tdata=formbuilder::save(array(
				// 	'auth'=>$r['auth'],
				// 	'qs'=>array(
				// 		'appid'=>$r['qs']['appid'],
				// 		'schema'=>'checkin',
				// 		'current'=>[
				// 			"location"=>[
				// 				'id'=>$d['event'],
				// 				'type'=>'event'
				// 			],
				// 			"page"=>[
				// 				"type"=>"user",
				// 				"id"=>$r['auth']['uid']
				// 			]
				// 		]
				// 	)
				// ));
				phi::log('ticket purchase from welcome page!');
			}else if(isset($r['auth']['uid'])&&!isset($r['qs']['anon'])&&!isset($r['qs']['receipt']['onboard'])){
				$d=phi::ensure($r,array('receipt','method','event','reservation'));
				$anon=false;
			}else{
				if(isset($r['auth']['uid'])){
					$d=phi::ensure($r,array('receipt','event','reservation'));
					if((int) $d['receipt']['total']>0){
						if(!isset($r['qs']['method'])) return ['error'=>'Please specify a method for payment'];
						$d['method']=$r['qs']['method'];
					}
				}else{
					$d=phi::ensure($r,array('receipt','stripe_token','anon','event','reservation'));
					$anon=db2::findOne(DB,'ticket_anon',array('id'=>$d['anon']));
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
									'source'=>'event',
									'pic'=>[
							            "path"=>"/static/blank_user",
							            "ext"=>"jpg",
							            "ar"=>1
							        ],
									'level'=>'player'
								]
							]
						]);
						phi::log('NEW EVENT USER: '.json_encode($resp['profile']));
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
			$res=db2::findOne(DB,'ticket_receipt',array('id'=>$d['reservation']));
			if(!$res) return array('error'=>'invalid_reservation');
			if(!isset($res['expires'])) return array('error'=>'reservation_used');
			if(!$anon){//anon to login
				$res['purchaser']=[
					'id'=>$r['auth']['uid'],
					'type'=>'user'
				];
			}
			$event=db2::findOne(DB,'event',array('id'=>$d['event']));
			$fundraiser=(!isset($event['fundraiser'])||!$event['fundraiser'])?0:1;
			if(phi::$conf['prod']){
				if(($res['expires']+10)<time()&&!$fundraiser){//give a little extra window.  fundraiser checkout has not time limit
					return array('error'=>'Reservation Expired.  Please select tickets again.');
				}
			}
			if(!$event){
				return array('error'=>'invalid_event');
			}
			$event_settings=db2::findOne(DB,'ticket_settings',array('id'=>$d['event']));
			//die(json_encode($d));
			include_once(ROOT.'/api/stripe.php');
			$firstTicket=db2::findOne(DB,'ticket',['id'=>$d['receipt']['tickets'][0]['id']]);
			if($firstTicket&&$firstTicket['type']=='donation'){
				$event_settings['absorb_fees']=1;
			}
			if($d['receipt']['tickets'][0]['id']=='donation'){
				$event_settings['absorb_fees']=1;//force absorb for donation!
			}
			$ctotal=self::getTotal($d['receipt'],false,(isset($r['qs']['discount']))?$r['qs']['discount']:'',$event_settings);
			$total=self::getTotal($d['receipt'],false,(isset($r['qs']['discount']))?$r['qs']['discount']:'',$event_settings,true);
			$d['receipt']['total']=(int) $d['receipt']['total'];
			if($ctotal!=$d['receipt']['total']){
				phi::log('totals dont match calc ['.$ctotal.'] v receipt ['.$d['receipt']['total'].'] '.json_encode($d['receipt']));
				return array('error'=>'totals dont match calc ['.$ctotal.'] v receipt ['.$d['receipt']['total'].']');
			}
			$amount=self::getTotal($d['receipt'],1,(isset($r['qs']['discount']))?$r['qs']['discount']:'',$event_settings,1);
			$absorb=0;
			if(isset($event_settings['absorb_fees'])&&$event_settings['absorb_fees']) $absorb=1;
			//phi::log('firstticket ['.$d['receipt']['tickets'][0]['id'].']: '.json_encode($firstTicket));
			if($absorb){
				$fee=self::getFees($amount,$absorb);
				$pfee=self::getPlatformFees($amount,$absorb);
				$amount-=$fee;
				$amount-=$pfee;
			}else{
				$fee=self::getFees($amount,$absorb);
				$pfee=self::getPlatformFees($amount,$absorb);
			}
			#die('fee '.$fee.' pfee '.$pfee );
			if($total){
				if($anon){
					$charge=array(
						'from_token'=>$d['stripe_token'],
						'from_anon_id'=>$d['anon'],
						'from_anon_type'=>'ticket_anon',
						'to'=>[
							'type'=>'event',
							'id'=>$event['id']
						],
						'amount'=>$d['receipt']['total'],
						'platformFee'=>$pfee,
						'platformFeeTag'=>'ticket_platform_fee',
						'description'=>'Payment for tickets to event: '.$event['name']
					);
				}else{
					$charge=array(
						'from'=>$r['auth']['uid'],
						'to'=>[
							'type'=>'event',
							'id'=>$event['id']
						],
						'method'=>$d['method'],
						'amount'=>$ctotal,
						'platformFee'=>$pfee,
						'platformFeeTag'=>'ticket_platform_fee',
						'description'=>'Payment for tickets to event: '.$event['name']
					);
				}
				if(isset($event_settings['statement_descriptor'])&&$event_settings['statement_descriptor']){
					$charge['statement_descriptor']=$event_settings['statement_descriptor'];
				}
				$charge['tag']='event_ticket';
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
		
			// $split['stripe']=self::getFees($amount,$absorb);
			// phi::log('save '.json_encode(array(
			// 	'description'=>'Payment for tickets to '.$event['name'],
			// 	'page'=>$from,
			// 	'charge_info'=>array(
			// 		'type'=>'charge',
			// 		'id'=>$charge_id
			// 	),
			// 	'split'=>$split,
			// 	'total'=>$total,
			// 	'ts'=>time()
			// )));
			// $info=ONE_CORE::save('payment_info',array(
			// 	'description'=>'Payment for tickets to '.$event['name'],
			// 	'page'=>$from,
			// 	'charge_info'=>array(
			// 		'type'=>'charge',
			// 		'id'=>$charge_id
			// 	),
			// 	'split'=>$split,
			// 	'total'=>$total,
			// 	'ts'=>time()
			// ));
			// $tresp=bank::addTransaction(array(
			// 	'to'=>array('id'=>$charge['to'],'type'=>'event'),
			// 	'from'=>$from,
			// 	'absorb'=>$absorb,
			// 	'fees'=>$split['stripe'],
			// 	'amount'=>$amount,
			// 	//'payment_info_id'=>$info['id'],
			// 	'description'=>'Payment for tickets to '.$event['name']
			// ),1);
			// if(!isset($d['anon'])){
			// 	if(!isset($settings['preferred'])){
			// 		db2::update(DB,'bank_settings',array('id'=>$charge['from']),array('$set'=>array('preferred'=>$d['method'])),array('upsert'=>true));
			// 	}
			// }
			foreach (self::getTickets($d['receipt']) as $k => $v) {
				if(isset($d['anon'])){
					$save[]=array(
						'user'=>array('id'=>$d['anon'],'type'=>'ticket_anon'),
						'ticket'=>$v,
						'event'=>$event['id'],
						'start'=>$event['start'],
						'status'=>'active'
					);
				}else{
					$save[]=array(
						'user'=>array('id'=>$r['auth']['uid'],'type'=>'user'),
						'ticket'=>$v,
						'event'=>$event['id'],
						'start'=>$event['start'],
						'status'=>'active'
					);
				}
			}
			$save=ONE_CORE::bulkSave('event_ticket',$save,1);
			foreach ($save as $k => $v){
				$ticketids[]=$v['id'];
			}
			// $receipt=array(
			// 	'purchaser'=>$charge['from'],
			// 	'event'=>$event['id'],
			// 	'tickets'=>self::getTickets($d['receipt']),
			// 	'ticket_ids'=>$ticketids,
			// 	'amount'=>$amount
			// );
			$update['$set']['fees']['stripe']=$fee;
			$update['$set']['fees']['one_boulder']=$pfee;
			$update['$set']['total']=$d['receipt']['total'];
			$update['$set']['amount']=$amount;
			$update['$set']['tickets']=self::getTickets($d['receipt']);
			$update['$set']['ticket_ids']=$ticketids;
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
			// ONE_CORE::save('ticket_receipt',$receipt);
			//upgrade the purcahase token info
			if(isset($d['anon'])){
				$update['$set']['purchaser']=array(
					'id'=>$d['anon'],
					'type'=>'ticket_anon'
				);
			}else{
				$update['$set']['purchaser']=array(
					'id'=>$r['auth']['uid'],
					'type'=>'user'
				);
			}
			//phi::log('set: '.json_encode($update));
			// $td=db2::findOne(DB,'termdata',array('id'=>'ticket'),array('projection'=>array('version'=>1)));
			// if($td){
			// 	$update['$set']['terms_version']=$td['version'];
			// }
			db2::update(DB,'ticket_receipt',array('id'=>$d['reservation']),$update);
			//add individual tickets
			$ticketdata=self::getEventTicketCounts($event['id']);
			//phi::log('Ticket Data for '.$event['name']. ' '.json_encode($ticketdata));
			phi::clearJob($d['reservation']);//alredy recalcd!
			//notify user!
			//send email!
			//schedule job for this!
			//$url='https://api.'.phi::$conf['domain'].'/nectar/module/ticket_checkout/sendemail?reservation='.$d['reservation'].'&token='.phi::$conf['admin_token'];
			$url='https://api.'.phi::$conf['domain'].'/one_core/module/ticket_checkout/sendemail';
			#phi::log('url: '.$url);
			phi::scheduleJob(md5($url.time()),time(),array(
				'url'=>$url,
				'type'=>'url',
				'data'=>array(
					'internal'=>1,
					'reservation'=>$d['reservation']
				)
			));
			//$url='https://api.'.phi::$conf['domain'].'/one_core/module/ticket_checkout/notifyadmins?reservation='.$d['reservation'].'&token='.phi::$conf['admin_token'];
			$url='https://api.'.phi::$conf['domain'].'/one_core/module/ticket_checkout/notifyadmins';
			#phi::log('url: '.$url);
			phi::scheduleJob(md5($url.time()),time(),array(
				'url'=>$url,
				'type'=>'url',
				'data'=>array(
					'internal'=>1,
					'reservation'=>$d['reservation']
				)
			));
			//self::sendTicketEmail($r,db2::findOne(DB,'ticket_receipt',array('id'=>$d['reservation'])),$save);
			//emit ticketdata!
			//send push
			phi::push('',$event['id'].'_orderview',array('type'=>'onCreate'));
			include_once(ROOT.'/api/class/event.php');
			event::$event=$event['id'];
			ONE_CORE::createStat([
				'page'=>[
					'type'=>'user',
					'id'=>(isset($r['auth']['uid']))?$r['auth']['uid']:'anon'
				],
				'action'=>'ticketsale',
				'link'=>[
					'type'=>'event',
					'id'=>$event['id']
				]
			]);
			foreach ($ticketids as $k => $v) {
				// phi::log('ticket: '.json_encode([
				// 	'action'=>'event_ticket_checkin',
				// 	'event'=>$event['id'],
				// 	'ticket'=>$v
				// ]));
				$tdata='action~'.base64_encode(json_encode([
					'action'=>'event_ticket_checkin',
					'event'=>$event['id'],
					'ticket'=>$v
				]));
				$qrs[]='https://img.'.phi::$conf['domain'].'/qr?content='.$tdata;
			}
			//RSVP
			if(isset($r['auth']['uid'])&&$r['auth']['uid']){
				event::rsvp([
					'auth'=>$r['auth'],
					'qs'=>[
						'appid'=>$r['qs']['appid'],
						'token'=>$r['qs']['token'],
						'rsvp'=>'going'
					]
				],1);
			}
			event::calcTempInvoice(false,$event['id']);
			if(!isset($qrs)) $qrs=false;
			#phi::log('QRS: '.json_encode($qrs));
			if(isset($d['anon'])){
				$rdata=[
					'user'=>phi::keepFields(db2::findOne(DB,'ticket_anon',['id'=>$d['anon']]),['id','name']),
					'event'=>phi::keepFields($event,['name'])
				];
			}else{
				$rdata=[
					'user'=>phi::keepFields(db2::findOne(DB,'user',['id'=>$r['auth']['uid']]),['id','name']),
					'event'=>phi::keepFields($event,['name'])
				];
			}
			$rdata['user']['firstname']=phi::getFirstName($rdata['user']['name']);
			return array('success'=>true,'data'=>$ticketdata,'renderdata'=>$rdata,'qrs'=>$qrs,'created'=>$created,'content'=>db2::findOne(DB,'event_ticketconfirmation',array('id'=>$event['id'])),'eventdata'=>event::load(array(
					'qs'=>array('','one_core','module','event',$event['id'],'load'),
					'auth'=>(isset($r['auth']))?$r['auth']:false
				)));
		}
		public static function sendEmail($r){//
			$d=phi::ensure($r,array('reservation'));//admin token only
			$res=db2::findOne(DB,'ticket_receipt',array('id'=>$d['reservation']));
			include_once(ROOT.'/api/class/event.php');
			event::$event=$res['event'];
			if(!$res) return array('error'=>'invalid:ticket_receipt');
			if($r['qs']['token']!=phi::$conf['admin_token']&&$res['purchaser']['id']!=$r['auth']['uid']){
				if(event::checkUpdatePermissions($r,false,$res['event'])){

				}else{
					return array('error'=>'invlid_permissions');
				}
			}
			$ts=db2::toOrderedList(db2::find(DB,'event_ticket',array('id'=>array('$in'=>$res['ticket_ids']))));
			foreach ($ts['list'] as $k => $v) {
				$tickets[]=$v;
			}
			#phi::$debugEmail=true;
			self::sendTicketEmail($r,$res,$tickets);
			return array('success'=>true);
		}
		public static function previewEmail($r){//
			$d=phi::ensure($r,array('event'));//admin token only
			include_once(ROOT.'/api/class/event.php');
			event::$event=$d['event'];
			if(!EVENT::checkUpdatePermissions($r,false,$d['event'])) return array('error'=>'invalid_permissions');
			self::sendTicketEmail($r,array(
				'purchaser'=>array(
					'id'=>$r['auth']['uid'],
					'type'=>'user'
				),
				'event'=>$d['event']
			),false);
			return array('success'=>true);
		}
		public static function notifyAdmins($r){//
			if($r['qs']['token']!=phi::$conf['admin_token']) return array('error'=>'invlid_permissions');
			$d=phi::ensure($r,array('reservation'));//admin token only
			$res=db2::findOne(DB,'ticket_receipt',array('id'=>$d['reservation']));
			if(!$res) return array('error'=>'invalid:ticket_receipt');
			//ensure admins want to be notified!
			$ev=db2::findOne(DB,'event',array('id'=>$res['event']));
			$as=db2::findOne(DB,'ticket_settings',array('id'=>$res['event']));
			if($as&&isset($as['notify_list'])&&sizeof($as['notify_list'])){
				$ts=db2::toOrderedList(db2::find(DB,'event_ticket',array('id'=>array('$in'=>$res['ticket_ids']))));
				foreach ($ts['list'] as $k => $v) {
					$tickets[]=$v;
				}
				foreach ($as['notify_list'] as $k => $v) {
					if(isset($res['guestlist'])){
						$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),array(
							'id'=>'ticket_guestlist',
							'data'=>array(
								'app_id'=>$r['qs']['appid'],
								'to'=>array(
									'type'=>'user',
									'id'=>$v
								),
								'purchaser'=>$res['purchaser'],
								'event'=>$res['event'],
								'ticket_receipt'=>$d['reservation']
							)
						),1);
					}else if(isset($res['onepass'])){
						$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),array(
							'id'=>'ticket_onepass',
							'data'=>array(
								'app_id'=>$r['qs']['appid'],
								'to'=>array(
									'type'=>'user',
									'id'=>$v
								),
								'purchaser'=>$res['purchaser'],
								'event'=>$res['event'],
								'ticket_receipt'=>$d['reservation']
							)
						),1);
					}else{
						$hooks[]=phi::emitHook(phi::$conf['dbname'],time(),array(
							'id'=>'ticket_purchase',
							'data'=>array(
								'app_id'=>$r['qs']['appid'],
								'to'=>array(
									'type'=>'user',
									'id'=>$v
								),
								'purchaser'=>$res['purchaser'],
								'event'=>$res['event'],
								'ticket_receipt'=>$d['reservation']
							)
						),1);
					}
				}
				if(isset($hooks)) phi::saveHooks($hooks);
			}
			return array('success'=>true);
		}
		public static function hasPermission(){
			return true;
		}
		public static function getReplyTo($event){

		}
		public static function sendTicketEmail($r,$receipt,$tickets){
			// if(phi::$conf['prod']){
			// 	phi::log('ticketing email disabled in production');
			// 	return true;
			// }
			//include_once(ROOT.'/classes/ics.php');
			if($receipt['purchaser']['type']=='user'){
				$u=db2::findOne(DB,'user',array('id'=>$receipt['purchaser']['id']),array('projection'=>array('id'=>1,'name'=>1,'pic'=>1,'email'=>1)));
				$email=$u['email'];
				$to=['id'=>$u['id'],'type'=>'user'];
			}else if($receipt['purchaser']['type']=='ticket_anon'){
				$u=db2::findOne(DB,'ticket_anon',array('id'=>$receipt['purchaser']['id']));
				$email=$u['email'];
				$to=['id'=>$u['id'],'type'=>'ticket_anon'];
			}
			//$event=db2::findOne(DB,'event',array('id'=>$receipt['event']));
			//add location
			// if(isset($event['fundraiser'])&&$event['fundraiser']){
			// 	$n=$event['name'];
			// }else{
			// 	$n='Tickets for '.$event['name'];
			// }
			// $td=array(
			// 	'to'=>array($email),
			// 	'subject'=>(isset($settings['email_subject']))?$settings['email_subject']:$n,
			// 	'from'=>phi::$conf['no_reply'],
			// 	//'replyTo'=>self::getReplyTo($event)
			// );
			// $fundraiser=(!isset($event['fundraiser'])||!$event['fundraiser'])?0:1;
			// if(isset($receipt['id'])&&!$fundraiser){
			// 	$out='/tmp/'.md5(time().$receipt['id']).'.pdf';
			// 	$outics='/tmp/'.md5(time().$receipt['id']).'.ics';
			// 	$data=array(
			// 		'url'=>'https://render.'.phi::$conf['domain'].'/ticket/'.$receipt['id'].'?token='.phi::$conf['admin_token'],
			// 		'out'=>$out
			// 	);
			// 	#phi::log($data);
			// 	if(!phi::$debugEmail) $res=phi::execNode2('/usr/bin/node /var/www/PROJECT/node/pdf.js [data]',$data);
			// 	$icsd=array(
			// 		'id'=>$event['id'],
			// 		'title'=>$event['name'],
			// 		'start'=>$event['start'],
			// 		'end'=>(isset($event['end']))?$event['end']:'',
			// 		'location'=>'',
			// 		'description'=>$event['description'],
			// 		'link'=>'https://'.phi::$conf['domain'].'/event/'.$event['id'],
			// 		'filename'=>$outics
			// 	);
			// 	if(!phi::$debugEmail) $ics=ICS::saveEvent($icsd);
			// 	if(is_file($out)) $attachments[]=array('file'=>$out,'name'=>'tickets.pdf');
			// 	if(is_file($outics)) $attachments[]=array('file'=>$outics,'name'=>'event.ics');
			// 	if(isset($attachments)) $td['attachments']=$attachments;
			// }
			//die(var_dump($res));
			//debug
			// header('Content-Type:application/pdf');
			// die(file_get_contents($out));
			//$tpl='tickets.template';

			//$settings=db2::findOne(DB,'event_ticketemail',array('id'=>$event['id']));
			#die(json_encode($settings));
			//emithook!
			phi::emitHook(phi::$conf['dbname'],time(),array(
				'id'=>'event_ticket_email',
				'data'=>array(
					'app_id'=>$r['qs']['appid'],
					'to'=>$to,
					'receipt'=>$receipt['id'],
					'event'=>$receipt['event']
				)
			));
			// phi::mail(DB,'ticket_checkout_'.$event['id'],array(//by event
			// 	'user'=>$u,
			// 	'settings'=>$settings,
			// 	'event'=>$event,
			// 	'tickets'=>$tickets,
			// 	'preview'=>(isset($receipt['id']))?0:1
			// ),$td,array(
			// 	'container'=>'email',
			// 	'templatefiles'=>array(
			// 		ROOT.'/sites/one_core/_email_js/'.$tpl
			// 	),
			// 	'vars'=>array(
			// 	)
			// ));
			//clean up!
			// if(isset($out)&&is_file($out)) unlink($out);
			// if(isset($outics)&&is_file($outics)) unlink($outics);
		}
	}
?>