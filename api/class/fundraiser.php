<?php
	class fundraiser{
		public static $fundraiser='';
		public static function handleRequest($r){
			self::$fundraiser=$r['path'][4];
			switch ($r['path'][5]){
				case "load":
					$out=self::load($r);
				break;
				case "cancel":
					$out=self::cancel($r);
				break;
				case "delete":
					$out=self::delete($r);
				break;
				case "makeinvoice"://check
					$out=self::makeInvoice($r);
				break;
				case "publish"://check
					$out=self::publish($r);
				break;
				case "searchcontributions":
					$out=self::searchContributions($r);
				break;
				case "contributions":
					$out=self::contributions($r);
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
				case "contributionlist":
					$out=self::contributionList($r);
				break;
				case "goals":
					$out=self::goals($r);
				break;
				case "exportorders":
					$out=self::exportOrders($r);
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
					$out=self::clone($r);
				break;
				case "refund":
					$out=self::refund($r);
				break;
				case "dashboard":
					$out=self::dashboard($r);
				break;
			}
			return $out;
		}
		public static function publish($r){
			$d=phi::ensure($r,array('from'));
			$fundraiser=db2::findOne(DB,'fundraiser',array('id'=>self::$fundraiser));
			if(isset($fundraiser['published'])&&$fundraiser['published']) return array('error'=>'alread_published');
			if(!$fundraiser) return array('error'=>'invalid_fundraiser');
			//invite every user based on permission
			$l=db2::toOrderedList(db2::find(DB,'user',array(),array('projection'=>array('id'=>1))));
			if(phi::$conf['prod']){
				//bulk insert hooks!
				if(isset($l['order'])){
					foreach ($l['order'] as $k => $v) {
						$hooks[]=phi::emitHook(DB,time(),array(
							'id'=>'fundraiser_invite',
							'data'=>array(
								'app_id'=>$r['qs']['appid'],
								'to'=>array(
									'type'=>'user',
									'id'=>$v
								),
								'from'=>phi::keepFields($d['from'],array('id','type')),
								'fundraiser'=>$fundraiser['id']
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
					'id'=>'fundraiser_invite',
					'data'=>array(
						'app_id'=>$r['qs']['appid'],
						'to'=>array(
							'type'=>'user',
							'id'=>$r['auth']['uid']
						),
						'from'=>phi::keepFields($d['from'],array('id','type')),
						'fundraiser'=>$fundraiser['id']
					)
				));
				$resp['sent']=1;
				$resp['to_send']=sizeof($l['order']);
			}
			db2::update(DB,'fundraiser',array('id'=>self::$fundraiser),array('$set'=>array('published'=>1)));
			return array('success'=>true,'data'=>$resp);
		}
		public static function unarchive($r){
			$fundraiser=db2::findOne(DB,'fundraiser',array('id'=>self::$fundraiser));
			if(!$fundraiser) return array('error'=>'invalid_fundraiser');
			//ensure admin/host
			$hosts=self::getHosts($fundraiser);
			if(!in_array($r['auth']['uid'], $hosts)) return array('error'=>'invalid_permissions');
			ONE_CORE::update('fundraiser',array('id'=>self::$fundraiser),array('archived'=>0));
			return array('success'=>true);
		}
		public static function archive($r){
			$fundraiser=db2::findOne(DB,'fundraiser',array('id'=>self::$fundraiser));
			if(!$fundraiser) return array('error'=>'invalid_fundraiser');
			//ensure admin/host
			$hosts=self::getHosts($fundraiser);
			if(!in_array($r['auth']['uid'], $hosts)) return array('error'=>'invalid_permissions');
			ONE_CORE::update('fundraiser',array('id'=>self::$fundraiser),array('archived'=>1));
			return array('success'=>true);
		}
		public static function refund($r){
			include_once(ROOT.'/api/stripe.php');
			include_once(ROOT.'/api/bank.php');
			$d=phi::ensure($r,array('id'));
			$res=db2::findOne(DB,'fundraiser_receipt',array('id'=>$d['id']));
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
					db2::update(DB,'fundraiser_receipt',array('id'=>$res['id']),array('$set'=>array('refunded'=>array('by'=>array('id'=>$r['auth']['uid'],'type'=>'user'),'ts'=>time(),'amount'=>$refund_amount))));
					if(isset($res['payment_info_id'])){
						$new_net=$info['total']-$refund_amount-$info['fees']['cc_processing']['amount']-$info['fees']['fundraiser_platform_fee']['amount'];
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
			self::ensureCounts();
			return array('success'=>true);
		}
		public static function ensureCounts(){
			include_once(ROOT.'/api/class/fundraiser_checkout.php');
			return fundraiser_checkout::getCounts(self::$fundraiser);
		}
		public static function dashboard($r){
			$q=array('fid'=>self::$fundraiser);
			self::ensureCounts();
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				$q['_id']=array('$lt'=>db2::toId($r['qs']['last']));
			}
			if(isset($r['qs']['after'])&&$r['qs']['after']){
				$q['_id']=array('$gt'=>db2::toId($r['qs']['after']));
			}
			$opts=array('sort'=>array('_id'=>-1),'limit'=>100);
			$data['contributions']=db2::toOrderedList(db2::find(DB,'contribution',$q,$opts),false,true);
			//discounts!
			//do counts for discounts!
			$pipeline[]=array(
				'$match'=>array(
					'fundraiser'=>self::$fundraiser
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
			$tr=db2::aGroupToList(db2::aggregate(DB,'fundraiser_receipt',$pipeline),'_id','_id',function($d){
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
						"to.id"=>self::$fundraiser
					)
				),
				array(
					'$group'=>array(
						"_id"=>['fundraiser'=>'$to.id'],
					    "count"=>array(
					    	'$sum'=>'$net'
					    )
					)
				)
			);
			// $refundsummarypipeline=array(
			// 	array(
			// 		'$match'=>array(
			// 			"to.id"=>self::$fundraiser,
			// 			//'refunded.by.id'=>['$exists'=>true]
			// 		)
			// 	),
			// 	array(
			// 		'$group'=>array(
			// 			"_id"=>['fundraiser'=>'$to.id'],
			// 		    "count"=>array(
			// 		    	'$sum'=>'$refunded.amount'
			// 		    )
			// 		)
			// 	)
			// );
			$summary=db2::aggregate(phi::$conf['dbname'],'payment_info',$summarypipeline);
			//$refundsummary=db2::aggregate(phi::$conf['dbname'],'payment_info',$refundsummarypipeline);
			
			//fundraiser_receipt
			if(isset($summary[0]['count'])){
				$data['balance']=$summary[0]['count'];
			}else{
				$data['balance']=0;
			}
			// if(isset($refundsummary[0]['count'])){
			// 	$data['refunds']=$refundsummary[0]['count'];
			// 	$data['balance']=$data['balance']-$refundsummary[0]['count'];
			// }
			$data['invoice']=ONE_CORE::load($r,self::$fundraiser,'invoice');
			return array('success'=>true,'data'=>$data);
		}
		public static function makeInvoice($r){
			$c=db2::findOne(DB,'invoice',['key'=>self::$fundraiser]);
			if($c&&phi::$conf['prod']) return ['error'=>'Invoice aleady created'];
			//ensure we know who it is going to!
			$fundraiser=db2::findOne(DB,'fundraiser',['id'=>self::$fundraiser]);
			$settings=db2::findOne(DB,'fundraiser_settings',array('id'=>self::$fundraiser));
			if(!isset($settings['payout_to'])){
				return ['error'=>'Invoice payout to is not set, please set this in your contribution settings.'];
			}
			$summarypipeline=array(
				array(
					'$match'=>array(
						"to.id"=>self::$fundraiser,
						//'refunded.by.id'=>['$exists'=>false]
					)
				),
				array(
					'$group'=>array(
						"_id"=>['fundraiser'=>'$to.id'],
					    "count"=>array(
					    	'$sum'=>'$net'
					    )
					)
				)
			);
			$summary=db2::aggregate(phi::$conf['dbname'],'payment_info',$summarypipeline);
			if(isset($summary[0]['count'])&&$summary[0]['count']){
				$invoice=[
					'id'=>self::$fundraiser,
					'type'=>'fundraiser',
					'page'=>$settings['payout_to'],
					'start'=>time(),
					'key'=>self::$fundraiser,
					'paid'=>0,
					'link'=>[
						'type'=>'fundraiser',
						'id'=>self::$fundraiser
					],
					'status'=>'finalized',
					'total'=>$summary[0]['count'],
					'description'=>'Payout for Fundraiser: '.$fundraiser['name']
				];
				$invoice=ONE_CORE::update('invoice',['id'=>$invoice['id']],$invoice);
				return ['success'=>true,'data'=>$invoice];
			}else{
				return ['error'=>'No contribution sales to create an invoice for'];
			}
		}
		public static function checkUpdatePermissions($r,$fundraiser=false,$fundraiser_id=false){
			return true;
			if($fundraiser_id){//ensure
				$fundraiser=db2::findOne(DB,'fundraiser',array('id'=>$fundraiser_id));
				if(!$fundraiser) return false;
			}
			if(!$fundraiser) return true;
			//explicit
			//if(ONE_CORE::isAdmin($r['auth']['uid'])) return true;
			if(isset($fundraiser['cohost'])&&in_array($r['auth']['uid'], $fundraiser['cohost'])) return true;//explicit
			$valid=false;
			switch ($fundraiser['page']['type']) {
				case 'user':
					if($r['auth']['uid']==$fundraiser['page']['id']) $valid=true;
				break;
				case 'page':
					include_once(ROOT.'/api/class/page.php');
					if(page::hasPermission($r,array('page::admin'),$fundraiser['page']['id'])) $valid=true;
				break;
			}
			$u=db2::findOne(DB,'user',array('id'=>$r['auth']['uid']));
			if(isset($u['roles'])&&(in_array('admin', $u['roles'])||in_array('steward', $u['roles']))) $valid=true;
			return $valid;
		}
		public static function ensureTime($r,$d,$key,$opts){
			if($d['last']){//only do if its an update!
				if($d['last']['start']!=$d['current']['start']){
					//notify fundraisereryone who rsvp'd
					self::onTimeChange($r,$d['current'],$d['last']);
				}
			}
		}
		public static function sendContactList($r,$d,$key,$opts){
			phi::scheduleJob(md5($d['current']['id'].time()),time(),array(
				'url'=>'https://api.'.phi::$conf['domain'].'/one_core/module/fundraiser_checkout/massemail?id='.$d['current']['id'].'&token='.phi::$conf['admin_token'],
				'type'=>'url'
			));
		}
		public static function hasPermission(){
			return true;
		}
		public static function goals($r){
			$q=array('fundraiser'=>self::$fundraiser);
			$opts=array('sort'=>array('goal'=>1));
			include_once(ROOT.'/api/class/formbuilder.php');
			return formbuilder::feed([
				'auth'=>$r['auth'],
				'qs'=>[
					'id'=>' ',
					'schema'=>'fundraiser_goal'
				]
			],$q,$opts,'id');
		}
		public static function contributionList($r){
			$q=array('fid'=>self::$fundraiser);
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				$q['_id']=array('$lt'=>db2::toId($r['qs']['last']));
			}
			if(isset($r['qs']['after'])&&$r['qs']['after']){
				$q['_id']=array('$gt'=>db2::toId($r['qs']['after']));
			}
			if(isset($r['qs']['search'])){
				$q['name']=new MongoDB\BSON\Regex($r['qs']['search'],'i');
			}
			$limit=(isset($r['qs']['max'])&&$r['qs']['max'])?(int) $r['qs']['max']:10;
			$opts=array('sort'=>array('_id'=>-1),'limit'=>$limit);
			include_once(ROOT.'/api/class/formbuilder.php');
			return formbuilder::feed([
				'auth'=>$r['auth'],
				'qs'=>[
					'id'=>' ',
					'schema'=>'contribution'
				]
			],$q,$opts,'id');
		}
		public static function delete($r){
			$fundraiser=db2::findOne(DB,'fundraiser',array('id'=>self::$fundraiser));
			if(!$fundraiser) return array('error'=>'invalid_fundraiser');
			//ensure admin/host
			$hosts=self::getHosts($fundraiser);
			if(!in_array($r['auth']['uid'], $hosts)) return array('error'=>'invalid_permissions');
			//remove RSVP's
			//remove invites
			db2::remove(DB,'fundraiser_invite',array('fundraiser'=>self::$fundraiser),1);
			db2::remove(DB,'fundraiser',array('id'=>self::$fundraiser));
			return array('success'=>true);
		}
		public static function exportOrderCSV($r){
			$fundraiser=db2::findOne(DB,'fundraiser',array('id'=>self::$fundraiser));
			if(!$fundraiser) return array('error'=>'invalid_fundraiser');
			if(!self::checkPerms($r,$fundraiser,'contributions')) return array('error'=>'invalid_permissions');
			$orders=self::orders(array(
				'auth'=>array('scope'=>'*'),
				'qs'=>array(
					'max'=>'none',//speical key
					'sort'=>'name'
				)
			),$fundraiser['id']);
			foreach ($orders['data']['list'] as $k => $v) {
				$order='';
				if(isset($list)) unset($list);
				if(isset($contributionlist)) unset($contributionlist);
				foreach($v['contributions'] as $tk => $tv) {
					if(!isset($list[$tv])) $list[$tv]=0;
					$list[$tv]++;
				}
				foreach ($list as $tk => $tv) {
					$contributionlist[]=$tv.' - '.$v['contribution_info'][$tk]['name'];
				}
				if(!isset($contributionlist)) $contributionlist='';
				$orders['data']['list'][$k]['order']=implode(', ',$contributionlist);
				if(isset($v['refunded'])) $orders['data']['list'][$k]['refunded']='Refunded by '.$v['refunded']['by']['data']['name']. ' on '.phi::formatTime($v['refunded']['ts'],'eventdate');
			}
			#die(json_encode($orders['data']));
			$csv=db2::toCSV($orders['data'],array('user.name'=>'name','user.email'=>'email','amount'=>'amount','order'=>'order','refunded'=>'refunded_info'));
			phi::exportCSV($csv,phi::sanitize($fundraiser['name']).'_contact_export.csv');
			//die(json_encode($orders));
		}
		public static function exportCSV($r){
			$fundraiser=db2::findOne(DB,'fundraiser',array('id'=>self::$fundraiser));
			if(!$fundraiser) return array('error'=>'invalid_fundraiser');
			if(!self::checkPerms($r,$fundraiser,'contributions')) return array('error'=>'invalid_permissions');
			$orders=self::orders(array(
				'auth'=>array('scope'=>'*'),
				'qs'=>array(
					'max'=>'none',//speical key
					'sort'=>'name'
				)
			),$fundraiser['id']);
			//die(json_encode($orders['data']));
			$csv=db2::toCSV($orders['data'],array('user.name'=>'name','user.email'=>'email'));
			phi::exportCSV($csv,phi::sanitize($fundraiser['name']).'_contact_export.csv');
			//die(json_encode($orders));
		}
		public static function exportOrders($r){
			$fundraiser=db2::findOne(DB,'fundraiser',array('id'=>self::$fundraiser));
			if(!$fundraiser) return array('error'=>'invalid_fundraiser');
			if(!self::checkPerms($r,$fundraiser,'contributions')) return array('error'=>'invalid_permissions');
			$out='/tmp/'.md5($fundraiser['id'].time()).'.pdf';
			$data=array(
				'url'=>'https://render.'.phi::$conf['domain'].'/contribution_orders/'.$fundraiser['id'].'?token='.phi::$conf['admin_token'],
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
		public static function orders($r,$fundraiser_id=false){
			if($fundraiser_id) self::$fundraiser=$fundraiser_id;
			$fundraiser=db2::findOne(DB,'fundraiser',array('id'=>self::$fundraiser));
			if(!$fundraiser) return array('error'=>'invalid_fundraiser');
			$q=array('fundraiser'=>self::$fundraiser,'expires'=>array('$exists'=>false));
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
				$ts=ONE_CORE::getSchema('fundraiser_receipt');
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
						'from'=>'fundraiser_anon',
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
				$oproject['user.nameparts']=array(
					'$split'=>array('$user.name',' ')
				);
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
					$pipeline[]=array(
						'$project'=>$oproject
					);
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
				$data=db2::aToList(db2::aggregate(DB,'fundraiser_receipt',$pipeline));
				if($last&&$data){
					$data['last']=$skip+sizeof($data['order']);
				}
				$data=db2::graph(DB,$data,array(
					'contributions'=>array(
						'coll'=>'contribution',
						'to'=>'contribution_info',
						'match'=>'id',
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
							'fundraiser_anon'=>array(
								'coll'=>'fundraiser_anon',
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
				$data=db2::toOrderedList(db2::find(DB,'fundraiser_receipt',$q,array('sort'=>array('_id'=>-1),'limit'=>$limit)),false,1);
				$data=db2::graph(DB,$data,array(
					'contributions'=>array(
						'coll'=>'contribution',
						'to'=>'contribution_info',
						'match'=>'id',
						'collapseList'=>true
					),
					// 'contribution_ids'=>array(
					// 	'coll'=>'contribution_scan',
					// 	'to'=>'contribution_scans',
					// 	'match'=>'contribution_id'
					// ),
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
							'fundraiser_anon'=>array(
								'coll'=>'fundraiser_anon',
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
		public static function contributions($r){
			$fundraiser=db2::findOne(DB,'fundraiser',array('id'=>self::$fundraiser));
			if(!$fundraiser) return array('error'=>'invalid_fundraiser');
			if(!self::checkPerms($r,$fundraiser,'contributions')) return array('error'=>'invalid_permissions');
			$q=array('fundraiser'=>self::$fundraiser);
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				$q['_id']=array('$lt'=>db2::toId($r['qs']['last']));
			}
			if(isset($r['qs']['after'])&&$r['qs']['after']){
				$q['_id']=array('$gt'=>db2::toId($r['qs']['after']));
			}
			$data=db2::toOrderedList(db2::find(DB,'fundraiser_contribution',$q,array('sort'=>array('_id'=>-1))),false,1);
			$data=db2::graph(DB,$data,array(
				'contribution'=>array(
					'coll'=>'contribution',
					'to'=>'contribution',
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
						'fundraiser_anon'=>array(
							'coll'=>'fundraiser_anon',
							'match'=>'id',
							'clearOnNull'=>true,
							'fields'=>array('id'=>1,'name'=>1,'pic'=>1)
						)
					)
				)
			));
			return array('success'=>true,'data'=>$data);
		}
		public static function searchContributions($r){
			$d=phi::ensure($r,array('search'));
			//ensure admin
			$fundraiser=db2::findOne(DB,'fundraiser',array('id'=>self::$fundraiser));
			if(!$fundraiser) return array('error'=>'invalid_fundraiser');
			if(!self::checkPerms($r,$fundraiser,'contributions')) return array('error'=>'invalid_permissions');
			//do aggregation
			$ts=ONE_CORE::getSchema('fundraiser_contribution');
			foreach ($ts['order'] as $k => $v) {
				$project[$v]=1;
			}
			//$project['user.name']=1;
			$pipeline[]=array(
				'$match'=>array(
					'fundraiser'=>self::$fundraiser
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
					'from'=>'fundraiser_anon',
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
			$data=db2::aToList(db2::aggregate(DB,'fundraiser_contribution',$pipeline));
			$data=db2::graph(DB,$data,array(
				'contribution'=>array(
					'coll'=>'contribution',
					'to'=>'contribution',
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
						'fundraiser_anon'=>array(
							'coll'=>'fundraiser_anon',
							'match'=>'id',
							'clearOnNull'=>true,
							'fields'=>array('id'=>1,'name'=>1,'pic'=>1,'email'=>1)
						)
					)
				)
			));
			return array('success'=>true,'data'=>$data);
		}
		public static function ensurePrivacy($r,$d){
			if(!isset($d['current']['privacy'])&&!isset($d['last']['privacy'])){
				$d['current']['privacy']='public';	
			}
			return $d;
		}
		public static function checkPerms($r,$fundraiser,$perm){
			$hosts=self::getHosts($fundraiser);
			#phi::log('hosts '.json_encode($hosts));
			//if(!phi::$conf['prod']) return true;
			if($r['auth']['scope']=='*') return true;
			if(in_array($r['auth']['uid'], $hosts)) return true;
			if(isset($fundraiser['page']['id'])&&$fundraiser['page']['id']==$r['auth']['uid']) return true;
			//if(self::checkUpdatePermissions($r,$fundraiser)) return true;
			if($perm=='contribution_scan'){
				$s=db2::findOne(DB,'fundraiser_settings',array('id'=>$fundraiser['id']));
				#phi::log('settings ['.$r['auth']['uid'].'] '.json_encode($s));
				if(isset($s['scanlist'])&&in_array($r['auth']['uid'], $s['scanlist'])) return true;
			}
			$u=db2::findOne(DB,'user',['id'=>$r['auth']['uid']]);
			if($u&&$u['level']=='steward') return true;
			return false;
		}
		public static function recalc($r){
			return array('success'=>true,'data'=>self::ensureCounts());
		}
		public static function clone($r){
			$f=db2::findOne(DB,'fundraiser',array('id'=>self::$fundraiser));
			$oid=self::$fundraiser;
			unset($f['id']);
			unset($f['_id']);
			if(isset($f['url_name'])) unset($f['url_name']);
			if(isset($f['cancelled'])) unset($f['cancelled']);
			$f['_clone']=1;
			include_once(ROOT.'/api/class/formbuilder.php');
	  		$resp['fundraiser']=formbuilder::save(array(
	  			'qs'=>array(
	  				'current'=>$f,
	  				'schema'=>'fundraiser'
	  			),
	  			'auth'=>$r['auth']
	  		));
	  		if(!isset($resp['fundraiser']['success'])) return $resp['fundraiser'];
			return $resp['fundraiser'];
		}
		public static function cancel($r){
			$fundraiser=db2::findOne(DB,'fundraiser',array('id'=>self::$fundraiser));
			if(!$fundraiser) return array('error'=>'invalid_fundraiser');
			if(isset($fundraiser['cancelled'])) return array('error'=>'fundraiser already cancelled');
			$hosts=self::getHosts($fundraiser);//
			//die(json_encode($hosts));
			//if(!in_array($r['auth']['uid'], $hosts)) return array('error'=>'invalid_permissions');
			//db2::update(DB,'fundraiser',array('id'=>self::$fundraiser),array('$set'=>array('cancelled'=>array('ts'=>time(),'by'=>$r['auth']['uid']))));
			ONE_CORE::update('fundraiser',array('id'=>self::$fundraiser),array('cancelled'=>array('ts'=>time(),'by'=>$r['auth']['uid'])));//must happne before webhook
			//notify everyone who rsvp'd
			return array('success'=>true,'data'=>array(
				'ts'=>time(),
				'by'=>$r['auth']['uid'],
				'by_info'=>db2::findOne(DB,'user',['id'=>$r['auth']['uid']],['projection'=>['id'=>1,'name'=>1,'pic'=>1]])
			));
		}
		public static function getList($fid){
			$l=db2::toOrderedList(db2::find(DB,'fundraiser_receipt',['fundraiser'=>$fid]));
			if($l){
				foreach ($l['list'] as $k => $v) {
					$out[$v['purchaser']['id']]=$v['purchaser'];
				}
				return $out;
			}else return false;
		}
		public static function onTimeChange($r,$newfundraiser,$oldfundraiser){
			db2::update(DB,'fundraiser_contribution',array('fundraiser'=>$newfundraiser['id']),array('$set'=>array('start'=>$newfundraiser['start'])),array(),false);
			//update all the RSVP's with the proper start time
		}
		public static function onNewPost($post){
			phi::log('newfundraiserpost');
			phi::time('newfundraiserpost');
			$fundraiser=db2::findOne(DB,'fundraiser',array('id'=>$post['page']['id']));
			if(!$fundraiser){
				phi::log('invalid fundraiser onNewPost ['.$post['page']['id'].']');
				return false;
			}
			$hosts=self::getHosts($fundraiser);//for now
			$from=$post['by']['id'];
			$fromdata=ONE_CORE::getUser($from);
			$msg=array(
				'from'=>$from,//can be on behalf of
				'from_data'=>$fromdata,
				'mode'=>'mirror',
				'skip'=>array($from),
				'to'=>$hosts,
				'type'=>'post_added_fundraiser_host',
				'data'=>array(
					'fundraiser_id'=>$fundraiser['id'],
					'post_id'=>$post['id']
				)
			);
			db2::save(DB,'broadcast',$msg);
			phi::time('newfundraiserpost');
			//notify hosts that a new post was added
		}
		public static function getHosts($fundraiser){
			//$hosts=array($fundraiser['uid']);
			if(isset($fundraiser['cohost'])&&sizeof($fundraiser['cohost'])){
				foreach ($fundraiser['cohost'] as $k => $v) {
					$hosts[]=$v;
				}
			}
			if(!isset($hosts)) $hosts=array();
			return $hosts;
		}
		public static function getTimeZone($fundraiser){
			if(isset($fundraiser['timezone'])){
				return $fundraiser['timezone'];
			}else{
				return 'America/Denver';//default
			}
		}
		public static function isActive($fundraiser,$settings=false,$eid=false){
			if(!$fundraiser&&$eid){
				$fundraiser=db2::findOne(DB,'fundraiser',array('id'=>$eid));
			}
			if(!$settings){
				$settings=db2::findOne(DB,'fundraiser_settings',array('id'=>$fundraiser['id']));
			}
			if(isset($settings['stopsales'])&&$settings['stopsales']&&isset($settings['stoptime'])){
				$tz=self::getTimeZone($fundraiser);
				date_default_timezone_set($tz);
				if($settings['stoptime']<time()){
					return false;
				}
			}
			return true;
		}
		public static function getProgress(){
			$summarypipeline=array(
				array(
					'$match'=>array(
						"to.id"=>self::$fundraiser
					)
				),
				array(
					'$group'=>array(
						"_id"=>['fundraiser'=>'$to.id'],
					    "count"=>array(
					    	'$sum'=>'$net'
					    )
					)
				)
			);
			$summary=db2::aggregate(phi::$conf['dbname'],'payment_info',$summarypipeline);
			
			//fundraiser_receipt
			if(isset($summary[0]['count'])){
				$data['balance']=$summary[0]['count'];
			}else{
				$data['balance']=0;
			}
			$data['goals']=db2::toOrderedList(db2::find(DB,'fundraiser_goal',array('fundraiser'=>self::$fundraiser),['sort'=>['goal'=>1]]));
			if($data['goals']){
				$last=false;
				foreach($data['goals']['order'] as $k=>$v){
					$item=$data['goals']['list'][$v];
					if($data['balance']<$item['goal']&&!$last){
						$last=$item;
					}
					if(!$last&&$data['balance']>$item['goal']){
						$last=$item;
					}
				}
				if($last){
					$data['currentGoal']=$last;
				}else{
					$data['completed']=1;
				}
			}
			return $data;
		}
		public static function load($r,$fundraiser_id=false,$src='fundraiser'){
			//load primary categories!
			if($fundraiser_id) self::$fundraiser=$fundraiser_id;
			$data['fundraiser']=ONE_CORE::load($r,self::$fundraiser,'fundraiser');
			if(!$data['fundraiser']) return array('error'=>'404');
			// $data['fundraiser']['hosts']=self::getHosts($data['fundraiser']);
			if(!empty($data['fundraiser']['archived'])&&!in_array($r['auth']['uid'], $data['fundraiser']['hosts'])){
				return array('error'=>'404');
			}
			if(isset($r['auth']['uid'])&&$r['auth']['uid']){
				$data['contributions']=db2::toOrderedList(db2::find(DB,'fundraiser_contribution',array('user.id'=>$r['auth']['uid'],'fundraiser'=>self::$fundraiser,'status'=>'active')));
				$data['contributions']=db2::graph(DB,$data['contributions'],array(
					'contribution'=>array(
						'coll'=>'contribution',
						'to'=>'contribution_info',
						'match'=>'id'
					)
				));
			}
			$data['fundraiser']['contribution']['contributions']=db2::toOrderedList(db2::find(DB,'contribution',array('fid'=>self::$fundraiser,'available'=>1)));
			$data['fundraiser']['fundraiser_settings']=db2::findOne(DB,'fundraiser_settings',array('id'=>self::$fundraiser));
			if(isset($data['fundraiser_settings']['scanlist'])&&$r['auth']&&in_array($r['auth']['uid'], $data['fundraiser_settings']['scanlist'])){
				$data['fundraiser']['isScanner']=1;
			}
			$data['fundraiser']['fundraiser_settings']=phi::keepFields($data['fundraiser']['fundraiser_settings'],array('showremaining','stopsales','stoptime','stopmessage','onboard','absorb_fees'));
			$data['fundraiser']['fundraiser_settings']['active']=self::isActive($data['fundraiser'],$data['fundraiser']['fundraiser_settings']);
			ONE_CORE::pageLoad($r,$src,$data['fundraiser']['id']);
			$data['fundraiser']['progress']=self::getProgress();
			$data=$data['fundraiser'];
			$data['pretty_time']=phi::formatTime($data['end'],'event',false,false);
			//return cache and build there
			return array('success'=>true,'data'=>$data);
		}
	}
?>