<?php
	class donation_checkout{
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
						$out=self::testgetEventTicketCounts($r);
					}
				break;
				case "sendemail":
					$out=self::sendEmail($r);
				break;
				case "previewemail":
					$out=self::previewEmail($r);
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
		public static function recalc($r){
			$d=phi::ensure($r,array('fundraiser'));
			if($r['qs']['token']!=phi::$conf['admin_token']){
				return array('error'=>'invlid_permissions');
			}
			$data=self::getDonationCounts($d['fundraiser']);
			return array('success'=>true);
		}
		public static function massEmail($r){
			include_once(ROOT.'/sites/nectar/api.php');
			$d=phi::ensure($r,array('id'));
			if($r['qs']['token']!=phi::$conf['admin_token']){
				return array('error'=>'invlid_permissions');
			}
			//get all tickets!
			$em=db2::findOne(DB2,'fundraiser_contact_list',array('id'=>$d['id']));
			$em['reply_to']['data']=db2::findOne(DB2,$em['reply_to']['type'],array('id'=>$em['reply_to']['id']),array(
				'projection'=>array('id'=>1,'email'=>1,'name'=>1)));
			$l=db2::toOrderedList(db2::find(DB2,'fundraiser_receipt',array('fundraiser'=>$em['fid'],'expires'=>array('$exists'=>false))));
			$l=db2::graph(DB2,$l,array(
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
				)
			));
			$fundraiser=db2::findOne(DB2,'fundraiser',array('id'=>$em['fid']));
			$settings=db2::findOne(DB2,'fundraiser_successemail',array('id'=>$fundraiser['id']));
			$sendto=array();
			if($l) foreach ($l['list'] as $k => $v) {
				if(in_array($v['purchaser']['data']['email'], $sendto)) continue;
				$save=phi::mail(DB2,'fundraiser_email_list_'.$d['id'],array(
					'sitepath'=>ROOT.'/sites/one_core',
					'template'=>'fundraiser_email_list.txt',
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
					'from'=>NECTAR::$noreply,
					'replyTo'=>$em['reply_to']['data']['email'],
					'returnEmail'=>true
				));
				$tosave[]=$save;
				$sendto[]=$v['purchaser']['data']['email'];
			}
			if(isset($tosave)){
				phi::log('send ['.sizeof($tosave).'] fundraiser emails');
				db2::bulkInsert(DB2,'notice',$tosave);
			}
			//make the post
			$post=array(
				'by'=>$em['reply_to']['data'],
				'rich_message'=>$em['message'],
				'headline'=>$em['subject'],
				'page'=>array(
					'id'=>$fundraiser['id'],
					'type'=>'fundraiser'
				),
				'perms'=>array('public')
			);
			include_once(ROOT.'/sites/nectar/api.php');
			$resp=feed::updatePost(array(
				'auth'=>$r['auth'],
				'qs'=>array(
					'post'=>$post,
					'channel'=>'feed_'.$fundraiser['id'],
					'context'=>'post'
				)
			));
			//die(json_encode($resp));
			phi::log('post resp: '.json_encode($resp));
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
			$d=phi::ensure($r,array('tickets','fundraiser'));
			include_once(ROOT.'/api/class/fundraiser.php');
			$settings=db2::findOne(DB2,'donation_settings',array('id'=>$d['fundraiser']));
			$active=fundraiser::areTicketsActive(false,$settings,$d['fundraiser']);
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
			//if there are any tickets currently reserved by this person, remove them..
			db2::remove(DB2,'fundraiser_receipt',array('purchaser.id'=>$purchaser['id'],'expires'=>array('$exists'=>true)),true);
			$receipt=array(
				'purchaser'=>$purchaser,
				'fundraiser'=>$d['fundraiser'],
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
			$tl=db2::toList(db2::find(DB2,'donation',array('id'=>array('$in'=>$gettickets))));
			$data=self::getDonationCounts($d['fundraiser'],1);
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
			$receipt=NECTAR::save('fundraiser_receipt',$receipt);
			#die(json_encode($receipt));
			$data=self::getDonationCounts($d['fundraiser']);
			//recalc
			//add a job!
			$jobid=$receipt['id'];
			$t=(phi::$conf['prod'])?'+11 minutes':'+3 minutes';
			//phi::log('new job: '.$jobid.' in '.$t);
			phi::scheduleJob($jobid,$t,array(
				'url'=>'https://'.phi::$conf['api'].'/nectar/module/donation_checkout/recalc',
				'type'=>'url',
				'data'=>array(
					'internal'=>1,
					'fundraiser'=>$d['fundraiser']
				)
			));
			$resp=array('success'=>true,'data'=>$receipt);
			$resp['absorb_fees']=(isset($settings['absorb_fees'])&&$settings['absorb_fees'])?1:0;
			if(!phi::$conf['prod']) $resp['extra']=$data;
			$resp['terms']=phi::cache('ticket_terms',function(){
				$td=db2::findOne(DB2,'termdata',array('id'=>'ticket'));
				return $td['html'];
			},false);
			$adv=db2::findOne(DB2,'fundraiser',array('id'=>$d['fundraiser']));
			if($adv) $resp['advanced']=phi::keepFields($adv,array('fundraiser','fundraiser_for'));
			return $resp;
		}
		public static function methods($r){
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
				$dbtickets=db2::toList(db2::find(DB2,'donation',array('id'=>array('$in'=>$tickets))));
				$fees=1;//could be a setting in futur
				foreach ($receipt['tickets'] as $k => $v) {
					$ticket=$dbtickets[$v['data']['id']];
					$total+=((int) $v['quantity'])*$ticket['price'];
				}
			}
			if(!$withoutfees){
				if($absorb){
					if($force){
						$total-=ceil(self::getFees($total,1));
					}
				}else{
					$total+=ceil(self::getFees($total));
				}
			}
			return $total;
		}
		public static function getDiscount($receipt,$discount,$total){
			if(!self::$discount) self::$discount=db2::findOne(DB2,'ticket_discount',array('id'=>$discount));
			//phi::log('apply: '.json_encode($discount));
			$to_discount=0;
			if(isset(self::$discount['discount_percent'])){
				$to_discount=floor((self::$discount['discount_percent']/100)*$total);
			}
			return $to_discount;
		}
		public static function getTickets($receipt){
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
		public static function getFees($total,$absorb=false){
			include_once(ROOT.'/api/stripe.php');
			return stripe::calcFee($total,$absorb);
			//return ceil($total*.029+30);
		}
		public static function getDonationCounts($fundraiser_id,$nocache=false){
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
			$res=db2::aToList(db2::aggregate(DB2,'fundraiser_receipt',$pipeline),'_id.ticket',false,false);
			#die(json_encode($res));
			$donations=db2::toOrderedList(db2::find(DB2,'donation',array('fid'=>$fundraiser_id)));
			$updates=false;
			if($donations) foreach ($donations['list'] as $k => $v) {
				if(!isset($res['list'][$k])){
					$set=array('sold'=>0,'pending'=>0,'all'=>0);
				}else{
					$set=array('sold'=>$res['list'][$k]['sold'],'pending'=>$res['list'][$k]['pending'],'all'=>$res['list'][$k]['all']);
				}
				$data[$k]=$set;
				$updates[]=array(array('id'=>$k),array('$set'=>$set));
			}
			#die(json_encode($updates));
			if(!$nocache&&sizeof($updates)) $res=db2::bulkUpdate(DB2,'donation',$updates);
			if(isset($res[0])){
				foreach ($res as $k => $v) {
					$set=array('sold'=>$v['sold'],'pending'=>$v['pending'],'all'=>$v['all']);
					$data[$v['_id']['ticket']]=$set;
					$updates[]=array(array('id'=>$v['_id']['ticket']),array('$set'=>$set));
				}
				if(!$nocache) $res=db2::bulkUpdate(DB2,'ticket',$updates);
			}else{
				$data=false;
			}
			return $data;
		}
		public static function send($r){
			if(isset($r['auth']['uid'])&&!isset($r['qs']['anon'])){
				$d=phi::ensure($r,array('receipt','method','fundraiser','reservation'),array('self::write::bank'));
				$anon=false;
			}else{
				$d=phi::ensure($r,array('receipt','stripe_token','anon','fundraiser','reservation'));
				$anon=db2::findOne(DB2,'ticket_anon',array('id'=>$d['anon']));
				if(!$anon) return array('error'=>'invalid_anon_user');
			}
			//get reservation
			$res=db2::findOne(DB2,'fundraiser_receipt',array('id'=>$d['reservation']));
			if(!$res) return array('error'=>'invalid_reservation');
			if(!isset($res['expires'])) return array('error'=>'reservation_used');
			$fundraiser=db2::findOne(DB2,'fundraiser',array('id'=>$d['fundraiser']));
			if(!$fundraiser){
				return array('error'=>'invalid_fundraiser');
			}
			$fundraiser_settings=db2::findOne(DB2,'fundraiser_settings',array('id'=>$d['fundraiser']));
			//die(json_encode($d));
			include_once(ROOT.'/api/stripe.php');
			include_once(ROOT.'/api/bank.php');
			$ctotal=self::getTotal($d['receipt'],false,(isset($r['qs']['discount']))?$r['qs']['discount']:'',$fundraiser_settings);
			$total=self::getTotal($d['receipt'],false,(isset($r['qs']['discount']))?$r['qs']['discount']:'',$fundraiser_settings,true);
			$d['receipt']['total']=(int) $d['receipt']['total'];
			if($ctotal!=$d['receipt']['total']){
				phi::log('totals dont match calc ['.$ctotal.'] v receipt ['.$d['receipt']['total'].'] '.json_encode($d['receipt']));
				return array('error'=>'totals dont match calc ['.$ctotal.'] v receipt ['.$d['receipt']['total'].']');
			}
			if($anon){
				$charge=array(
					'from_token'=>$d['stripe_token'],
					'from_anon_id'=>$d['anon'],
					'from_anon_type'=>'ticket_anon',
					'to'=>$d['receipt']['to'],
					'amount'=>$d['receipt']['total'],
					'description'=>'Payment for donation to fundraiser: '.$fundraiser['name']
				);
				$from=array('id'=>$d['anon'],'type'=>'ticket_anon');
			}else{
				$charge=array(
					'from'=>$r['auth']['uid'],
					'to'=>$d['receipt']['to'],
					'method'=>$d['method'],
					'amount'=>$ctotal,
					'description'=>'Payment for donation to fundraiser: '.$fundraiser['name']
				);
				$settings=db2::findOne(DB2,'bank_settings',array('id'=>$charge['from']));
				$from=array('id'=>$charge['from'],'type'=>'user');
			}
			if(!isset($d['method'])||$d['method']!='nectar'){//add funds first through a cc
				if(isset($fundraiser_settings['statement_descriptor'])&&$fundraiser_settings['statement_descriptor']){
					$charge['statement_descriptor']=$fundraiser_settings['statement_descriptor'];
				}
				$resp=stripe::chargeCard($charge);
				if(isset($resp['error'])){
					return $resp;
				}else{
					$charge_id=$resp['charge_id'];
					$charge_transaction=$resp['transaction_id'];
					#phi::log($resp);
				}
			}else{
				$charge_id='';
				$charge_transaction='';
			}
			//if successful! add transaction between users
			$amount=self::getTotal($d['receipt'],1,(isset($r['qs']['discount']))?$r['qs']['discount']:'',$fundraiser_settings,1);
			$absorb=0;
			if(isset($fundraiser_settings['absorb_fees'])&&$fundraiser_settings['absorb_fees']) $absorb=1;
			if(!isset($d['method'])||$d['method']!='nectar'){
				$tresp=bank::addTransaction(array(
					'to'=>array('id'=>$charge['to'],'type'=>'fundraiser'),
					'from'=>$from,
					'absorb'=>$absorb,
					'fees'=>self::getFees($amount,$absorb),
					'amount'=>$amount,
					'description'=>'Payment for tickets to '.$fundraiser['name']
				),1);
			}else{
				$tresp=bank::addTransaction(array(
					'to'=>array('id'=>$charge['to'],'type'=>'fundraiser'),
					'from'=>$from,
					'amount'=>$amount,
					'description'=>'Payment for tickets to '.$fundraiser['name']
				));
			}
			if($absorb){
				$amount-=self::getFees($amount,$absorb);
			}
			if(!isset($d['anon'])){
				if(!isset($settings['preferred'])){
					db2::update(DB2,'bank_settings',array('id'=>$charge['from']),array('$set'=>array('preferred'=>$d['method'])),array('upsert'=>true));
				}
			}
			foreach (self::getTickets($d['receipt']) as $k => $v) {
				if(isset($d['anon'])){
					$save[]=array(
						'user'=>array('id'=>$d['anon'],'type'=>'ticket_anon'),
						'ticket'=>$v,
						'fundraiser'=>$fundraiser['id'],
						'start'=>$fundraiser['start'],
						'status'=>'active'
					);
				}else{
					$save[]=array(
						'user'=>array('id'=>$r['auth']['uid'],'type'=>'user'),
						'ticket'=>$v,
						'fundraiser'=>$fundraiser['id'],
						'start'=>$fundraiser['start'],
						'status'=>'active'
					);
				}
			}
			$save=NECTAR::bulkSave('fundraiser_ticket',$save,1);
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
			$update['$set']['amount']=$amount;
			$update['$set']['tickets']=self::getTickets($d['receipt']);
			$update['$set']['ticket_ids']=$ticketids;
			if($charge_id){//may not happen
				$update['$set']['charge_id']=$charge_id;
			}
			if($charge_transaction){//may not happen
				$update['$set']['charge_transaction']=$charge_transaction;
			}
			if($tresp){
				$update['$set']['transaction']=$tresp['transaction']['id'];
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
			// NECTAR::save('ticket_receipt',$receipt);
			//upgrade the purcahase token info
			if(isset($d['anon'])){
				$update['$set']['purchaser']=array(
					'id'=>$d['anon'],
					'type'=>'ticket_anon'
				);
			}
			//phi::log('set: '.json_encode($update));
			$td=db2::findOne(DB2,'termdata',array('id'=>'ticket'),array('projection'=>array('version'=>1)));
			if($td){
				$update['$set']['terms_version']=$td['version'];
			}
			db2::update(DB2,'fundraiser_receipt',array('id'=>$d['reservation']),$update);
			//add individual tickets
			$ticketdata=self::getDonationCounts($fundraiser['id']);
			//phi::log('Ticket Data for '.$event['name']. ' '.json_encode($ticketdata));
			phi::clearJob($d['reservation']);//alredy recalcd!
			//notify user!
			//send email!
			//schedule job for this!
			//$url='https://api.'.phi::$conf['domain'].'/nectar/module/donation_checkout/sendemail?reservation='.$d['reservation'].'&token='.phi::$conf['admin_token'];
			$url='https://api.'.phi::$conf['domain'].'/nectar/module/donation_checkout/sendemail';
			#phi::log('url: '.$url);
			phi::scheduleJob(md5($url.time()),time(),array(
				'url'=>$url,
				'type'=>'url',
				'data'=>array(
					'internal'=>1,
					'reservation'=>$d['reservation']
				)
			));
			//$url='https://api.'.phi::$conf['domain'].'/nectar/module/donation_checkout/notifyadmins?reservation='.$d['reservation'].'&token='.phi::$conf['admin_token'];
			$url='https://api.'.phi::$conf['domain'].'/nectar/module/donation_checkout/notifyadmins';
			#phi::log('url: '.$url);
			phi::scheduleJob(md5($url.time()),time(),array(
				'url'=>$url,
				'type'=>'url',
				'data'=>array(
					'internal'=>1,
					'reservation'=>$d['reservation']
				)
			));
			//self::sendTicketEmail($r,db2::findOne(DB2,'ticket_receipt',array('id'=>$d['reservation'])),$save);
			//emit ticketdata!
			//send push
			phi::push('',$fundraiser['id'].'_orderview',array('type'=>'create'));
			include_once(ROOT.'/api/class/fundraiser.php');
			fundraiser::$fundraiser=$fundraiser['id'];
			return array('success'=>true,'data'=>$ticketdata,'content'=>db2::findOne(DB2,'fundraiser_confirmation',array('id'=>$fundraiser['id'])),'fundraiserdata'=>fundraiser::load(array(
				'qs'=>array('',DB2,'module','fundraiser',$fundraiser['id'],'load'),
				'auth'=>(isset($r['auth']))?$r['auth']:false
			)));
		}
		public static function sendEmail($r){//
			$d=phi::ensure($r,array('reservation'));//admin token only
			$res=db2::findOne(DB2,'fundraiser_receipt',array('id'=>$d['reservation']));
			include_once(ROOT.'/api/class/fundraiser.php');
			fundraiser::$fundraiser=$res['fundraiser'];
			if(!$res) return array('error'=>'invalid:ticket_receipt');
			if($r['qs']['token']!=phi::$conf['admin_token']&&$res['purchaser']['id']!=$r['auth']['uid']){
				if(fundraiser::checkUpdatePermissions($r,false,$res['fundraiser'])){

				}else{
					return array('error'=>'invlid_permissions');
				}
			}
			$ts=db2::toOrderedList(db2::find(DB2,'fundraiser_ticket',array('id'=>array('$in'=>$res['ticket_ids']))));
			foreach ($ts['list'] as $k => $v) {
				$tickets[]=$v;
			}
			#phi::$debugEmail=true;
			self::sendTicketEmail($r,$res,$tickets);
			return array('success'=>true);
		}
		public static function previewEmail($r){//
			$d=phi::ensure($r,array('fundraiser'));//admin token only
			include_once(ROOT.'/api/class/fundraiser.php');
			fundraiser::$fundraiser=$d['fundraiser'];
			if(!FUNDRAISER::checkUpdatePermissions($r,false,$d['fundraiser'])) return array('error'=>'invalid_permissions');
			self::sendTicketEmail($r,array(
				'purchaser'=>array(
					'id'=>$r['auth']['uid'],
					'type'=>'user'
				),
				'fundraiser'=>$d['fundraiser']
			),false);
			return array('success'=>true);
		}
		public static function notifyAdmins($r){//
			if($r['qs']['token']!=phi::$conf['admin_token']) return array('error'=>'invlid_permissions');
			$d=phi::ensure($r,array('reservation'));//admin token only
			$res=db2::findOne(DB2,'fundraiser_receipt',array('id'=>$d['reservation']));
			if(!$res) return array('error'=>'invalid:fundraiser_receipt');
			//ensure admins want to be notified!
			$ev=db2::findOne(DB2,'fundraiser',array('id'=>$res['fundraiser']));
			$as=db2::findOne(DB2,'donation_settings',array('id'=>$res['fundraiser']));
			if($as&&isset($as['emaillist'])&&sizeof($as['emaillist'])){
				$ts=db2::toOrderedList(db2::find(DB2,'fundraiser_ticket',array('id'=>array('$in'=>$res['ticket_ids']))));
				foreach ($ts['list'] as $k => $v) {
					$tickets[]=$v;
				}
				foreach ($as['emaillist'] as $k => $v) {
					NECTAR::notify($res['purchaser']['id'],$v,'support_donation',array('fundraiser_id'=>$res['fundraiser'],'reservation_id'=>$d['reservation']));
				}
			}
			return array('success'=>true);
		}
		public static function sendTicketEmail($r,$receipt,$tickets){
			// if(phi::$conf['prod']){
			// 	phi::log('ticketing email disabled in production');
			// 	return true;
			// }
			include_once(ROOT.'/classes/ics.php');
			if($receipt['purchaser']['type']=='user'){
				$u=db2::findOne(DB2,'user',array('id'=>$receipt['purchaser']['id']),array('projection'=>array('id'=>1,'name'=>1,'pic'=>1,'email'=>1)));
				$email=$u['email'];
			}else if($receipt['purchaser']['type']=='ticket_anon'){
				$u=db2::findOne(DB2,'ticket_anon',array('id'=>$receipt['purchaser']['id']));
				$email=$u['email'];
			}
			$fundraiser=db2::findOne(DB2,'fundraiser',array('id'=>$receipt['fundraiser']));
			//add location
			if(isset($fundraiser['fundraiser'])&&$fundraiser['fundraiser']){
				$n=$fundraiser['name'];
			}else{
				$n='Donation for '.$fundraiser['name'];
			}
			$td=array(
				'to'=>array($email),
				'subject'=>(isset($settings['email_subject']))?$settings['email_subject']:$n,
				'from'=>nectar::$noreply
			);
			$settings=db2::findOne(DB2,'fundraiser_successemail',array('id'=>$fundraiser['id']));
			#die(json_encode($settings));
			phi::mail(DB2,'fundraiser_checkout_'.$fundraiser['id'],array(
				'user'=>$u,
				'settings'=>$settings,
				'fundraiser'=>$fundraiser,
				'tickets'=>$tickets,
				'preview'=>(isset($receipt['id']))?0:1
			),$td,array(
				'container'=>'email',
				'templatefiles'=>array(
					ROOT.'/sites/nectar/_email_js/fundraiser.template'
				),
				'vars'=>array(
				)
			));
			//clean up!
			if(isset($out)&&is_file($out)) unlink($out);
			if(isset($outics)&&is_file($outics)) unlink($outics);
		}
	}
?>