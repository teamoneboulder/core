 <?php
 	use Seld\JsonLint\JsonParser;
	class ADMIN_API{
		public static $force=false;
		public static $force2=false;
		public static $arg1=false;
		public static $arg2=false;
		public static $arg3=false;
		public static function cliApi(){
			include_once(ROOT.'/sites/one_core/one_core.api');
			include_once(ROOT.'/sites/one_admin/one_admin.api');
			$action=$_SERVER["argv"][1];
			self::$arg1=self::$force=(isset($_SERVER["argv"][2]))?$_SERVER["argv"][2]:0;
			self::$arg2=self::$force2=(isset($_SERVER["argv"][3]))?$_SERVER["argv"][3]:0;
			self::$arg3=(isset($_SERVER["argv"][4]))?$_SERVER["argv"][4]:false;
			phi::clog('Running Admin CLI ['.$action.'] force ['.self::$force.']',1);
			switch ($action) {
				case 'testcron':	
					phi::log('TEST CRON!!!!');
				break;
				case 'forever':
					self::ensureForever();
				break;
				case 'exportstats':
					self::exportStats();
				break;
				case 'savevideo':
					self::savevideo($_SERVER["argv"][2],1);
				break;
				case 'isvideo':
					self::isVideo($_SERVER["argv"][2],1);
				break;
				case 'backup':
					self::backup();
				break;
				case 'restore':
					self::restore();
				break; 
				case 'encrypt':
					self::encrypt();
				break;
				case 'importzone':
					self::importZone();
				break;
				case 'importusers':
					self::importusers();
				break;
				case 'importusers2':
					self::importusers2();
				break;
				case 'sync':
					self::sync();
				break;
				case 'balance':
					self::reclacBalance();
				break;
				case 'balanceid':
					self::reclacBalanceForId();
				break;
				case 'distribute':
					self::distribute();
				break;
				case 'exportcsv':
					self::exportCsv();
				break;
				case 'ensuresubscription':
					self::ensureSubscription();
				break;
				case 'fix':
					self::fix();
				break;
				case 'clearsubscriptions':
					self::clearSubscriptions();
				break;
				case 'viewsubscription':
					self::viewCurrentSubscription();
				break;
				case 'testbulk':
					self::testBulk();
				break;
				case 'setvaliduntil':
					self::setValidUntil();
				break;
				case 'checkstatus':
					self::checkStatus();
				break;
				case 'movegenekeys':
					self::moveGeneKeys();
				break;
				case 'testgame':
					self::testGame();
				break;
				case 'calchotplayers':
					self::calcHotPlayers();
				break;
				case 'fixcheckins':
					self::fixCheckins();
				break;
				case 'cobot':
					self::cobot();
				break;
				case 'cancelcobot':
					self::cancelCobot();
				break;
				case 'onepass':
					self::onepass();
				break;
				case 'resetlevels':
					self::resetLevels();
				break;
				case 'calculateinvoices':
					self::calculateInvoices();
				break;
				case 'recalculateinvoices':
					self::recalcAllInvoices();
				break;
				case 'startgame':
					self::startGame();
				break;
				case 'fixpayments':
					self::fixPayments();
				break;
				case 'loadwallpapers':
					self::loadWallpapers();
				break;
				case 'fixbirthdays':
					self::fixBirthdays();
				break;
				case 'stripecapability':
					self::stripeCapability();
				break;
				case 'testinvoice':
					self::testInvoice();
				break;
				case 'testbalance':
					self::testBalance();
				break;
				case 'loadconfig':
					self::loadConfig();
				break;
				case 'broadcastevents':
					self::broadcastEvents();
				break;
				case 'calcchakras':
					self::calcChakras();
				break;
				case 'fixevents':
					self::fixEvents();
				break;
				case 'buildnews':
					self::buildnews();
				break;
				case 'calcreferals':
					self::calcReferals();
				break;
				case 'testpaymenthook':
					self::testPaymentHook();
				break;
				case 'forcecheckin':
					self::forceCheckin();
				break;
				case 'loadticketterms':
					self::loadTicketTerms();
				break;
				case 'loadfundraisingterms':
					self::loadFundraisingTerms();
				break;
				case 'fixmembership':
					self::fixMembership();
				break;
				case 'tagcashflow':
					self::tagCashFlow();
				break;
				case 'checkeventcheckins':
					self::checkEventCheckins();
				break;
				case 'reconsile':
					self::reconsile();
				break;
				case 'testupdate':
					self::testUpdate();
				break;
				case 'getemails':
					self::getEmails();
				break;
				case 'fixancestry':
					self::fixAncestry();
				break;
				case 'transition':
					self::transition();
				break;
				case 'fixreferal':
					self::fixReferal();
				break;
				case 'ensureprepaytime':
					self::ensurePrepayTime();
				break;
				case 'hasfeatures':
					self::hasFeatures();
				break;
				case 'fixroles':
					self::fixRoles();
				break;
				case 'payoutinvoices':
					self::payoutInvoices();
				break;
				case 'loaddesigns':
					self::loadDesigns();
				break;
				case 'fixonepass':
					self::fixOnepass();
				break;
				case 'notifyplayers':
					self::notifyPlayers();
				break;
				case 'stats':
					self::stats();
				break;
				case 'loadlogs':
					self::loadLogs();
				break;
				case 'fixcheckin':
					self::fixCheckin();
				break;
				case 'ensureservices':
					self::ensureServices();
				break;
				case 'processfile':
					self::processFile();
				break;
				case 'fixpaymentinfo':
					self::fixPaymentInfo();
				break;
				case 'fixinvoices':
					self::fixInvoices();
				break;
				case 'checkeventpayout':
					self::checkEventPayout();
				break;
				case 'emergencyemail':
					self::emergencyEmail();
				break;
				case 'fixskills':
					self::fixSkills();
				break;
				case 'modules':
					self::publishModules();
				break;
				default:
					phi::clog(array('error'=>'invalid_action'),1);
				break;
			}
			die();
		}
		// public static function ensureServices(){
		// 	$sl=db2::
		// }
		public static function exportStats(){
			$u=db2::toOrderedList(db2::find(DB,'user',[]));
			foreach($u['order'] as $k=>$v){
				$user=$u['list'][$v];
				$data=self::makeUserStat($user['id']);
				phi::clog($data);
				$out[]=$data;
				$updates[]=[['id'=>$user['id']],['$set'=>$data],['upsert'=>1]];
				die();
			}
			die();
			//exportcsv will output to API, not useful here on command line operations
			phi::exportCSV($out,'user_stats.csv');
			if(isset($updates)){
				db2::bulkUpdate(DB,'user_stats_2',$updates);
				phi::clog('updated ['.sizeof($updates).'] records!');
			}
		}
		public static function makeUserStat($uid){
			//graph in any information about this user id to data!
			$data['id']=$uid;
			//Explorer Start Date
			//Player Start Date
			//ONE|Pass Subscriber Start Date
			//Services Directory Provider Start Date
			//Producer Start Date
			//Subscription end date for all of the above^
			//Email Opt-Out
			//# of events hosted
			$events=db2::toOrderedList(db2::find(DB,'event',['$or'=>[
				['page.id'=>$uid],
				['cohost'=>['$in'=>[$uid]]]
			]]));
			$data['event_host_count']=(isset($events['order']))?count($events['order']):0;
			//# of tickets purchased
			//Total # of logins
			//Get metrics for how many people use the app.oneboulder.one web view vs mobile site. Who uses both? - Juicy tracking page loads in the app vs web
			//Get metrics for how many people see each post on the app in the homepage - heavy data analytics side, (seen by x people; in the post)
			//What percentage of web viewers download the app? - how many people click the link to view the app download page
			//how many times are people logging in and viewing things in the last 30 days?
			//Total referrals of other people to the platform
			return $data;
		}
		public static function publishModules(){
			include_once(phi::$conf['root'].'/api/api.php');
			$dirs=phi::getDirs(ROOT.'/sites/code/module');
			//make DNA
			$s3=phi::getS3();
			foreach($dirs as $k=>$v){
				$dna=API::getDNA('module',$k,1);
				//upload it!
				//save file conf
				$size=phi::objectToSize($dna,1);
				$hash=md5($dna);
				$version=1;
				$current=db2::findOne(DB,'module',['name'=>$k]);
				if($current){
					$version=$current['version'];
				}
				$changed=false;
				if($current&&$current['hash']!=$hash||!$current){
					$changed=true;
					if($current) $version++;
				}
				if($changed){
					phi::clog('['.$k.'] updating to ['.$version.']....');
					$s3->putObject(array(
					    'Bucket'     => phi::$conf['aws']['s3_bucket'],
					    'Key'        => 'source/'.phi::$conf['env'].'/module/'.$k.'/'.$version.'/'.$k.'.dna',
					    'Body' => $dna,
					    'ContentType'  => 'application/javascript',
					    'ACL'          => 'public-read',
					));
					$conf=[
						'type'=>'module',
						'name'=>$k,
						'hash'=>$hash,
						'version'=>$version
					];
					db2::update(DB,'module',['name'=>$k],['$set'=>$conf],['upsert'=>true]);
				}else{
					phi::clog('['.$k.'] ['.$version.'] already up-to-date');
				}
			}
			//save file for cache
			$modules=db2::toOrderedList(db2::find(DB,'module',[]));
			foreach($modules['list'] as $k=>$v){
				$save[$v['name']]=[
					'hash'=>$v['hash'],
					'version'=>$v['version']
				];
			}
			file_put_contents(ROOT.'/modules.json', json_encode($save));
			phi::clog('✅ cached modules!');
			//die(json_encode($out));
		}
		public static function fixSkills(){
			$u=db2::toOrderedList(db2::find(DB,'user',[]));
			foreach($u['list'] as $k=>$v){
				$game=db2::findOne(DB,'awards',['game'=>'profile_skills','page.id'=>$v['id']]);
				//if($game) die(json_encode($game));
				$skills=(isset($u['skills'])&&sizeof($u['skills']))?1:0;
				if($game&&!$skills){
					phi::clog('mismatch ['.$v['id'].']');
					db2::remove(DB,'awards',['game'=>'profile_skills','page.id'=>$v['id']]);
				}
			}
		}
		public static function emergencyEmail(){
			$subject='ONE|Boulder App Maintainence';
			$message='Hello ONE|Boulder Explorers, Players, Regenerators, and Stewards! <br/><br/>As you may be aware, the app is not operational today.  An issue made itself known with the DNS server and Tom has been working on getting everything back up and running. We expect to have the issue resolved by no later than noon tomorrow (Monday).  We sincerely apologize for any inconvenience this may have caused and appreciate your patience.  <br/><br/>Love,<br/></br>The ONE|Boulder Team';
			if(phi::$conf['prod']){
				$l=db2::toOrderedList(db2::find(DB,'user',[]));
				foreach($l['list'] as $k=>$v){
					$emails[]=$v['email'];
				}
			}else{
				$emails[]='tbassett44@gmail.com';
			}
			#die(json_encode($emails));
			$c=1;
			$t=sizeof($emails);
			foreach($emails as $k=>$v){
				//if($c>278){
					phi::clog('Sending '.$c.'/'.$t);
					try{
						phi::sendMail(array(
							'to'=>$v,
							'subject'=>$subject,
							'message'=>$message,
							'from'=>phi::$conf['no_reply'],
							'node'=>false
						));//send via php
					}catch(Exception $e){
						phi::clog('bad email to '.$v);
					}
				//}
				$c++;
			}
		}
		public static function checkEventPayout(){
			include_once(ROOT.'/api/class/event.php');
			$appid='2366d44c84409765d9a00619aea4c1234';
			$unpaid_invoices=db2::toOrderedList(db2::find(DB,'invoice',['page.type'=>'event','paid'=>0]));
			//$unpaid_invoices=db2::toOrderedList(db2::find(DB,'invoice',['page.type'=>'event','paid'=>0,'total'=>['$gte'=>0]]));
			//die('count: '.sizeof($unpaid_invoices['order']));
			if(isset($unpaid_invoices['order'])){
				$events=db2::toOrderedList(db2::find(DB,'event',['id'=>['$in'=>$unpaid_invoices['order']]],['projection'=>['id'=>1,'start'=>1,'name'=>1,'page'=>1]]));
				if(isset($events['list'])){
					foreach($events['list'] as $k =>$v){
						$invoice=(isset($unpaid_invoices['list'][$v['id']]))?$unpaid_invoices['list'][$v['id']]:false;
						//phi::log('invoice: '.json_encode($invoice));
						if(isset($invoice['total'])&&$invoice['total']<0){
							phi::log('⚠️ Total for invoice < 0, SKIP');
							phi::clog('⚠️ Total for invoice < 0, SKIP');
							continue;
						}
						if($v['start']<time()){//event has happened!
							$diff=time()-$v['start'];
							$days=floor($diff/((60*60*24)));
							#phi::clog('days: '.$days);
							if($diff<(60*60*24)){//1 day!
								phi::clog('1 day notice');
								phi::log('1 day notice for event for ['.$v['page']['id'].']['.$v['id'].']');
								$hooks[]=phi::emitHook(DB,time(),array(
									'id'=>'event_payout_success',
									'data'=>array(
										'app_id'=>$appid,
										'to'=>$v['page'],
										'event'=>$v['id'],
										'from'=>[
											'type'=>'page',
											'id'=>'one_boulder'
										]
									)
								),1);
							}else if($days>=3){
								//every day after 3 days, try to pay out!
								$resp=event::handleRequest([
									'auth'=>['internal'=>1,'uid'=>'UIAMPLAYER1'],
									'qs'=>[
										'appid'=>$appid
									],
									'path'=>['','','','',$v['id'],'sendpayments']
								]);
								if(isset($resp['success'])){
									phi::log('Successful Auto-Payout for Event ['.$v['id'].']['.$v['name'].']');
									phi::clog('Successful Auto-Payout for Event ['.$v['id'].']['.$v['name'].']');
								}
								if($days%3==0&&isset($resp['error'])){
									phi::clog('[cant send!] 3 day reminder');
									phi::log('[cant send!] 3 day reminder for ['.$v['page']['id'].']['.$v['id'].']');
									$hooks[]=phi::emitHook(DB,time(),array(
										'id'=>'event_payout_reminder',
										'data'=>array(
											'app_id'=>$appid,
											'to'=>$v['page'],
											'event'=>$v['id'],
											'from'=>[
												'type'=>'page',
												'id'=>'one_boulder'
											]
										)
									),1);
									//if event is set up, automagically send payout!
									//if not send notification
								}else{
									#phi::clog('[cant send!] dont send reminder');
								}
							}
						}
					}
				}
				if(isset($hooks)){
					phi::saveHooks($hooks);
					$hc=sizeof($hooks);
					phi::clog('send ['.$hc.'] notifications!');
				}
			}else{
				phi::clog('no invoices');
			}
			//die(json_encode($events));
		}
		public static function fixInvoices(){
			$pi=db2::toOrderedList(db2::find(DB,'invoice',[]));
			//$skip=false;
			foreach($pi['list'] as $k=>$v){
				if(isset($v['start'])){
					$updates[]=[
						['id'=>$v['id']],
						[
							'$set'=>[
								'updated'=>$v['start']
							]
						]
					];
				}else{
					phi::clog('no start');
				}
			}
			if(isset($updates)){
				db2::bulkUpdate(DB,'invoice',$updates);
				phi::clog('updated ['.sizeof($updates).'] records!');
			}
		}
		public static function fixPaymentInfo(){
			$pi=db2::toOrderedList(db2::find(DB,'payment_info',[]));
			//$skip=false;
			foreach($pi['list'] as $k=>$v){
				//update record!
				$v['fees']=[];
				$unset=false;
				//$ud=false;
				$unset['platformFee']=1;
				if(isset($v['tag'])&&$v['tag']=='subscription'){
					$v['fees']['cc_processing']=[
						'id'=>'stripe',
						'type'=>'page',
						'tag'=>'cc_processing',
						'amount'=>$v['split']['stripe']
					];
					//add net!
					$v['net']=$v['split']['one_boulder'];
					$v['to']=[
						'id'=>'one_boulder',
						'type'=>'page'
					];
					//$unset['split.stripe']=1;
					unset($v['split']['stripe']);//handled
					if(isset($v['platformFee'])) unset($v['platformFee']);
					//if refunded
					//add to? no because it could be split between multiple still
				}else if(isset($v['tag'])&&$v['tag']=='event_ticket'){
					if(isset($v['platformFee'])){
						$v['fees']['ticket_platform_fee']=[
							'id'=>'one_boulder',
							'type'=>'page',
							'tag'=>'ticket_platform_fee',
							'amount'=>$v['platformFee']
						];
					}
					$v['fees']['cc_processing']=[
						'id'=>'stripe',
						'type'=>'page',
						'tag'=>'cc_processing',
						'amount'=>$v['split']['stripe']
					];
					if(isset($v['split'])){
						unset($v['split']);
					}
					$v['net']=$v['total'];//net = total - fees
					foreach($v['fees'] as $tk=>$tv){
						$v['net']-=$tv['amount'];
					}
					$unset['split']=1;
					if(isset($v['platformFee'])) unset($v['platformFee']);
				}else if(isset($v['tag'])&&$v['tag']=='fundraiser_contribution'){
					if(isset($v['platformFee'])){
						$v['fees']['fundraiser_platform_fee']=[
							'id'=>'one_boulder',
							'type'=>'page',
							'tag'=>'fundraiser_platform_fee',
							'amount'=>$v['platformFee']
						];
					}
					$v['fees']['cc_processing']=[
						'id'=>'stripe',
						'type'=>'page',
						'tag'=>'cc_processing',
						'amount'=>$v['split']['stripe']
					];
					if(isset($v['split'])){
						unset($v['split']);
					}
					$v['net']=$v['total'];//net = total - fees
					foreach($v['fees'] as $tk=>$tv){
						$v['net']-=$tv['amount'];
					}
					$unset['split']=1;
					if(isset($v['platformFee'])) unset($v['platformFee']);
				}else{
					$v['fees']['cc_processing']=[
						'id'=>'stripe',
						'type'=>'page',
						'tag'=>'cc_processing',
						'amount'=>$v['split']['stripe']
					];
					//add net!
					$v['net']=$v['split']['one_boulder'];
					//$unset['split.stripe']=1;
					unset($v['split']['stripe']);
					$v['tag']='donation';
					if(isset($v['platformFee'])) unset($v['platformFee']);
					//phi::clog('unknown tag: ' .$v['tag']. ' '.json_encode($v));
					//donation!
				}
				if(isset($v['refunded'])){//net becomes the negative stripe fee
					phi::clog('refunded! setting net to -'.$v['fees']['cc_processing']['amount']);
					$v['net']=-$v['fees']['cc_processing']['amount'];
				}
				//if($ud&&!$skip){
					unset($v['_id']);//dont update _ID
					$updates[]=[
						['id'=>$v['id']],
						[
							'$set'=>$v,
							'$unset'=>$unset
						]
					];
					//$skip=true;
				//}
			}
			if(isset($updates)){
				db2::bulkUpdate(DB,'payment_info',$updates);
				phi::clog('updated ['.sizeof($updates).'] records!');
			}
		}
		public static function processFile(){
			foreach(phi::$conf as $k=>$v){
				if(is_string($v)){
					$data[$k]=$v;
				}
			}
			if(!is_dir(phi::$conf['home'].'/conf')) exec('mkdir -p '.phi::$conf['home'].'/conf');
			if(!is_file(self::$arg1)){
				die('file not found: '.self::$arg1);
			}
			$content=file_get_contents(self::$arg1);
			foreach ($data as $k => $v) {
				$content=str_replace('['.$k.']', $v, $content);
			}
			file_put_contents(phi::$conf['home'].'/conf/'.self::$arg2, $content);
		}
		public static function fixCheckin(){
			include_once(ROOT.'/api/class/checkin.php');
			$checkin=db2::findOne(DB,'checkin',['id'=>self::$force]);
			if(!$checkin) die('invalid checkin');
			CHECKIN::awardPoints([
				'auth'=>['uid'=>$checkin['page']['id']],
				'qs'=>['appid'=>'2366d44c84409765d9a00619aea4c1234']
			],[
				'current'=>$checkin
			],false,false);
		}
		public static function loadLogs(){
			$files=phi::getFiles('/var/log/'.phi::$conf['project']);
			//api!
			$map=array('api'=>array(
				'prefix'=>'api_',
				'collection'=>'api_stat',
				'headers'=>array('ts','path','rts','iip'),
				'transform'=>array(
					'ts'=>'int',
					'path'=>'path',
					'rts'=>'float',
					'iip'=>'string'
				)
			));
			foreach ($map as $mk => $mv) {
				foreach ($files['files'] as $k => $v) {
					if(strpos($v, $mv['prefix'])!==false){
						$mv['file']=$v;
						phi::readLogFile($v,50000,function($lines,$opts){
							foreach ($lines as $tk => $tv) {
								$lp=explode(',', $tv);
								if(isset($row)) unset($row);
								foreach ($lp as $lk => $lv) {
									$header=$opts['headers'][$lk];
									if(isset($opts['transform'][$header])){
										switch ($opts['transform'][$header]) {
											case 'string':
												$lv=str_replace(array("\r", "\n"), '', $lv);
											break;
											case 'int':
												$lv=(int) $lv;
											break;
											case 'float':
												$lv=(float) $lv;
											break;
										}
									}
									$row[$header]=$lv;
								}
								$save[]=$row;
							}
							if(isset($save)&&sizeof($save)){
								db2::bulkInsert(DB,$opts['collection'],$save);
								phi::clog('['.$opts['file'].' Successfully inserted ['.sizeof($save).'] items!',1);
							}
						},$mv);
					}
				}
			}
			phi::clog('Complete!',1);
		}
		public static function stats(){
			//load finances dashboard and get info!!!
			$fdata=ONE_ADMIN::cashFlowFinancesAll2([
				'qs'=>[
					'range'=>[//last 30 days
						'start'=>time()-(30*60*60*24),
						'end'=>time()
					]
				]
			]);
			$data=[
				'ts'=>db2::tsToTime(time()),
				'membership_player'=>db2::count(DB,'current_subscription_info',['membership.one_boulder'=>['$exists'=>true],'canceled'=>['$exists'=>false],'stopped'=>['$exists'=>false]]),
				'membership_producer'=>db2::count(DB,'current_subscription_info',['membership.events'=>['$exists'=>true],'canceled'=>['$exists'=>false],'stopped'=>['$exists'=>false]]),
				'membership_provider'=>db2::count(DB,'current_subscription_info',['membership.services'=>['$exists'=>true],'canceled'=>['$exists'=>false],'stopped'=>['$exists'=>false]]),
				'membership_onepass'=>db2::count(DB,'current_subscription_info',['membership.one_pass'=>['$exists'=>true],'canceled'=>['$exists'=>false],'stopped'=>['$exists'=>false]]),
				'user_count'=>db2::count(DB,'user',[]),
				'ticket_order_count'=>db2::count(DB,'ticket_receipt',[]),
				'finances_30day_total'=>(isset($fdata['data']['total']['data']['total']))?$fdata['data']['total']['data']['total']/100:0,
				'finances_30day_fee_ticket'=>(isset($fdata['data']['fees']['list']['one_boulder']['fees']['ticket_platform_fee']))?$fdata['data']['fees']['list']['one_boulder']['fees']['ticket_platform_fee']/100:0,//fees.list.one_boulder.fees.ticket_platform_fee
				'finances_30day_fee_fundraiser'=>(isset($fdata['data']['fees']['list']['one_boulder']['fees']['fundraiser_platform_fee']))?$fdata['data']['fees']['list']['one_boulder']['fees']['fundraiser_platform_fee']/100:0,
				'finances_30day_subscription'=>(isset($fdata['data']['subscription']['data']['total']))?$fdata['data']['subscription']['data']['total']/100:0,
				'finances_30day_tickets'=>(isset($fdata['data']['event_ticket']['data']['total']))?$fdata['data']['event_ticket']['data']['total']/100:0,
				'finances_30day_fundraiser'=>(isset($fdata['data']['fundraiser']['data']['total']))?$fdata['data']['fundraiser']['data']['total']/100:0
			];
			db2::save(DB,'daily_stat',$data);
			phi::log('Saved Daily Stats '.json_encode($data));
		}
		public static function notifyPlayers(){
			//notify all players that do not have a one_pass addon!
			$appid='2366d44c84409765d9a00619aea4c1234';
			$ul=db2::toOrderedList(db2::find(DB,'current_subscription_info',['valid_until'=>['$gte'=>time()]]));
			foreach($ul['list'] as $k=>$v){
				if(!isset($v['membership']['one_pass'])||(isset($v['membership']['one_pass']['stop'])&&$v['membership']['one_pass']['stop']<time())){
					$hooks[]=phi::emitHook(DB,time(),array(
						'id'=>'pick_onepass_location',
						'data'=>array(
							'app_id'=>$appid,
							'to'=>array(
								'type'=>'user',
								'id'=>$v['page']['id']
							),
							'from'=>[
								'type'=>'user',
								'id'=>'one_boulder'
							]
						)
					),1);
				}
			}
			if(isset($hooks)){
				phi::saveHooks($hooks);
				$hc=sizeof($hooks);
				phi::clog('send ['.$hc.'] notifications to players!');
				phi::log('🔥🔥🔥 send ['.$hc.'] notifications to players!');
				//die(json_encode($hooks[0],JSON_PRETTY_PRINT));
			}
		}
		public static function loadDesigns(){
			$subs=db2::toOrderedList(db2::find(DB,'user_profiles',[
				'humandesign'=>['$exists'=>true]
			]));
			$total=sizeof($subs['order']);
			$c=0;
			foreach($subs['list'] as $k => $v){
				$c++;
				phi::clog('Loading ['.$c.'] of ['.$total.']');
				$url=phi::$conf['s3'].$v['humandesign']['img']['path'].'/full.'.$v['humandesign']['img']['ext'];
				$exec='node /var/www/'.phi::$conf['project'].'/node/ocr.js '.$url;
				$res=phi::execNode($exec);
				phi::clog(json_encode($res));
				db2::update(DB,'user_profiles',['id'=>$v['id']],['$set'=>['humandesign.profile'=>$res]]);
				//die(json_encode($res,JSON_PRETTY_PRINT));
			}
		}
		public static function fixOnepass(){
			$subs=db2::toOrderedList(db2::find(DB,'current_subscription_info',[
				'membership.one_pass'=>['$exists'=>true]
			]));
			foreach($subs['list'] as $k=>$v){
				if(isset($v['prepay'])){
					db2::update(DB,'current_subscription_info',['page.id'=>$v['page']['id']],[
						'$unset'=>['discount'=>1],
						'$set'=>[
							'membership.one_pass.value'=>1100,
							'membership.one_pass.split.one_boulder'=>1100
						]
					]);
				}else{
					db2::update(DB,'current_subscription_info',['page.id'=>$v['page']['id']],[
						'$unset'=>['discount'=>1],
						'$set'=>[
							'membership.one_pass.value'=>1100,
							'membership.one_pass.split.one_boulder'=>1100
						]
					]);
				}
			}
			self::ensurePrepayTime();
			phi::clog('done!');
		}
		public static function payoutInvoices(){
			include_once(ROOT.'/api/stripe.php');
			stripe::payoutInvoices(ADMIN_UID,'2366d44c84409765d9a00619aea4c1234');
		}
		public static function fixRoles(){
			//remove explorer,player,producer,steward
			$remove=['explorer','player','producer','steward'];
			$l=db2::toOrderedList(db2::find(DB,'user',['roles'=>['$exists'=>true]]));
			foreach($l['list'] as $k=>$v){
				if(isset($v['roles'])){
					$setroles=array_values(array_diff($v['roles'],$remove));
					//phi::clog(json_encode($v['roles']));
					phi::clog(json_encode($setroles));
					db2::update(DB,'user',['id'=>$v['id']],['$set'=>['roles'=>$setroles]]);
				}
			}
		}
		public static function hasFeatures(){
			if(ONE_CORE::hasFeatures('UIAMPLAYER1',['steward'])){
				phi::clog('HAS');
			}else{
				phi::clog('DOESNT');
			}
		}
		public static function fixReferal(){
			$ul=db2::toOrderedList(db2::find(DB,'user',[]));
			foreach($ul['list'] as $k=>$v){
				if(isset($v['refered_by'])){
					$updates[]=[
						['id'=>$v['id']],
						['$set'=>[
							'refered_type'=>ONE_CORE::getIdType($v['refered_by'])
						]]
					];
					//phi::clog('type: '.ONE_CORE::getIdType($v['refered_by']));
				}else{
				}
			}
			db2::bulkUpdate(DB,'user',$updates);
			phi::clog('DONE!');
		}
		public static function ensurePrepayTime(){
			include_once(ROOT.'/api/stripe.php');
			$stripe = stripe::getStripeKeys();
			$client=\Stripe\Stripe::setApiKey($stripe['secret_key']);
			$subs=db2::toOrderedList(db2::find(DB,'current_subscription_info',[
				'prepay'=>['$exists'=>true]
			]));
			$project=(60*60*24*1);//ensure that subscription total updates before next cycle 
			if(self::$force) $project=strtotime('8/1/2022');//testing!
			if($subs) foreach($subs['list'] as $k=>$v){
				$currentTotal=stripe::getPaymentAmount($v,(time()+$project));
				if($currentTotal!=$v['currentTotal']){
					phi::log('PREPAY has changed ['.$v['page']['id'].']['.$currentTotal.']!!!!');
					phi::clog('set current usage ['.$v['page']['id'].']['.$currentTotal.']');
					$current=db2::findOne(DB,'subscription',array('page.id'=>$v['page']['id'],'status'=>'active'));
					if($current){
						stripe::updateUsage(array(
							'total'=>$currentTotal,
							'subscription'=>$current['stripe']['items']['data'][0]['id']
						));
					}else{
						phi::clog('no current subscription to update usage for ['.$v['page']['id'].']');
					}
					db2::update(DB,'current_subscription_info',[
						'_id'=>db2::toId($v['_id'])
					],[
						'$set'=>[
							'currentTotal'=>$currentTotal
						]
					]);
				}else{
					phi::clog('current total has not changed');
				}
			}
			phi::clog('done!');
			//phi::log('Completed ensurePrepayTime');
		}
		public static function transition(){
			//get onepass people
			include_once(ROOT.'/api/stripe.php');
			$onepass=db2::toOrderedList(db2::find(DB,'user',['onepass'=>['$exists'=>true]]));
			$stewards=ONE_CORE::getStewards();
			#die(json_encode($onepass['order']));
			//go over all current_subscription_info
			$subs=db2::toOrderedList(db2::find(DB,'current_subscription_info',[]));
			$stripe = stripe::getStripeKeys();
			$client=\Stripe\Stripe::setApiKey($stripe['secret_key']);
			foreach($subs['list'] as $k=>$v){
				//update ONE|pass
				$edit=false;
				if(in_array($v['page']['id'],$onepass['order'])){
					$v['prepay']=[
						// 'one_boulder'=>[
						// 	'start'=>strtotime('1/1/2022'),
						// 	'plan'=>'player',
						// 	'end'=>$onepass['list'][$v['page']['id']]['onepass']
						// ],
						'one_pass'=>[
							'start'=>strtotime('1/1/2022'),
							'plan'=>'basic',
							'end'=>$onepass['list'][$v['page']['id']]['onepass']
						]
					];
					$v['membership']['one_pass']=[
						'id'=>'one_pass',
						'name'=>'ONE|Pass',
						'value'=>5500,
						'split'=>[
							'one_boulder'=>5500
						],
						'ts'=>time()
					];
					$v['discount']=[
						'total'=>1100,
						'info'=>[
							'one_pass'=>[
								'amount'=>1100,
								'ts'=>time()
							]
						]
					];
					$edited[]=$v['page']['id'];
					$edit=true;
				}
				//Update Producer
				if(isset($v['membership']['one_boulder'])&&$v['membership']['one_boulder']['id']=='producer'){
					$v['membership']['one_boulder']=[
						'id'=>'player',
						'name'=>'Player',
						'value'=>1100,
						'split'=>[
							'one_boulder'=>1100
						],
						'ts'=>time()
					];
					$v['membership']['events']=[
						'id'=>'basic',
						'name'=>'Add Events to the Calendar',
						'value'=>1100,
						'split'=>array(
							'one_boulder'=>1100
						),
						'ts'=>time()
					];
					$edit=true;
					//update user profile
					if(!in_array($v['page']['id'],$stewards)){
						db2::update(DB,'user',['id'=>$v['page']['id']],['$set'=>['level'=>'player']]);
					}
				}
				if($edit){
					$id=$v['_id'];
					unset($v['_id']);
					$v['membership_order']=array_keys($v['membership']);
					$total=stripe::getPaymentAmount($v,time());
					$v['currentTotal']=$total;
					db2::update(DB,'current_subscription_info',[
						'_id'=>db2::toId($id)
					],[
						'$set'=>$v
					]);
					//ensure price is set properly
					phi::clog('set current usage ['.$v['page']['id'].']['.$total.']');
					$current=db2::findOne(DB,'subscription',array('page.id'=>$v['page']['id'],'status'=>'active'));
					if($current){
						stripe::updateUsage(array(
							'total'=>$total,
							'subscription'=>$current['stripe']['items']['data'][0]['id']
						));
					}else{
						phi::clog('no current subscription to update usage for ['.$v['page']['id'].']');
					}
				}
				//phi::clog('current payment ['.$current.']');
				//die(json_encode($v,JSON_PRETTY_PRINT));
			}
			$price=db2::findOne(DB,'subscription_info',array('id'=>'one-subscription'));
			foreach($onepass['list'] as $k=>$v){
				if(!in_array($v['id'], $edited)){
					phi::clog('missing: '.$v['id']);
					$add=[
						'donation'=>0,
						'membership_order'=>['one_boulder','one_pass'],
						'ts'=>time(),
						'valid_until'=>strtotime('2/1/2022'),
						'page'=>[
							'id'=>$v['id'],
							'type'=>'user'
						],
						'membership'=>[
							'one_pass'=>[
								'id'=>'one_pass',
								'name'=>'ONE|Pass',
								'value'=>5500,
								'split'=>[
									'one_boulder'=>5500
								],
								'ts'=>time()
							],
							'one_boulder'=>[
								'id'=>'player',
								'name'=>'Player',
								'value'=>1100,
								'split'=>[
									'one_boulder'=>1100
								],
								'ts'=>time()
							]
						],
						'prepay'=>[
							'one_pass'=>[
								'start'=>strtotime('1/1/2022'),
								'plan'=>'basic',
								'end'=>$v['onepass']
							]
						],
						'discount'=>[
							'total'=>1100,
							'info'=>[
								'one_pass'=>[
									'amount'=>1100,
									'ts'=>time()
								]
							]
						]
					];
					db2::update(DB,'current_subscription_info',['page.id'=>$add['page']['id']],['$set'=>$add],['upsert'=>true]);
					//add subscription!!!!
					//get stripe_id
					$stripe_info=db2::findOne(DB,'stripe',array('id'=>$add['page']['id']));
					if($stripe_info){
						$create=[
						  "customer" => $stripe_info['stripe_id'],
						  "default_payment_method" => $stripe_info['default_source'],
						  //"billing_cycle_anchor"=>(time()+20),//see if subscription comes back with proper update (DEV)
						  "items" => [
						    ["price" => $price['stripe_id']],
						  ]
					];
						$create["billing_cycle_anchor"]=strtotime('2/1/2022');
						$subscription = \Stripe\Subscription::create($create);
						$current['stripe']=json_decode(json_encode($subscription),1);
						ONE_CORE::save('subscription',array(
							'page'=>array(
								'id'=>$add['page']['id'],
								'type'=>'user'
							),
							'status'=>'active',
							'ts'=>time(),
							'stripe'=>$current['stripe']
						));
						//set usage
						stripe::updateUsage(array(
							'total'=>0,
							'subscription'=>$current['stripe']['items']['data'][0]['id']
						));
						phi::clog('successfully created subscription for ['.$add['page']['id'].']');
					}else{
						phi::clog('stripe info not found!');
					}
					//die(json_encode($add,JSON_PRETTY_PRINT));
				}
			}
			die('done!');

		}
		public static function onepass(){
			include_once(ROOT.'/api/stripe.php');
			if(!self::$force2) die('Time required [6/24/2022]');
			$ts=strtotime(self::$force2);
			if($ts<time()) die('time must be in future');
			if($ts>(time()+60*60*24*365)) die('time must be less than 1 yr in future');
			$uid=self::$force;
			// stripe::renewHooks($uid,$ts);
			// return false;
			$u=db2::findOne(DB,'user',['id'=>$uid]);
			if(!$u) die('invalid user');
			if($u['level']=='player'||$u['level']=='explorer'){
				$level='player';
			}else{
				$level=$u['level'];
			}
			if($u['level']=='player'){
				$stop=1;
			}else{
				$stop=0;
			}
			$resp=ONE_CORE::update('user',array('id'=>$uid),[
				'onepass'=>$ts,
				'status.overdue'=>0,
				'status.active'=>1,
				'status.stopped'=>0,
				'status.validUntil'=>$ts,
				'level'=>$level
			]);
			//if player, make sure player membership is paused
			//current_subscription_info
			// if($stop){
			// 	//get current subscription
			// 	$current=db2::findOne(DB,'subscription',array('page.id'=>$uid,'status'=>'active'));
			// 	if($current){
			// 		self::updateUsage(array(
			// 			'total'=>0,
			// 			'subscription'=>$current['stripe']['items']['data'][0]['id']
			// 		));
			// 	}
			// }
			// ONE_CORE::update('current_subscription_info',array('page.id'=>$uid),array(
			// 	'valid_until'=>$ts
			// ));//must happne before webhook
			//update profile!
			phi::clog('done!',1);
		}
		public static function getEmails(){
			$events=['EUYS2GNDM94CJ','EEA06Q7IMDRN9','E1DZXL92803A6'];
			$emails=[];
			include_once(ROOT.'/api/class/formbuilder.php');
			foreach($events as $k => $v){
				$data=db2::toOrderedList(db2::find(DB,'ticket_receipt',[
					'event'=>$v,
					'expires'=>['$exists'=>false]
				],array('sort'=>array('_id'=>-1),'limit'=>$limit)),false,1);
				$data=db2::graph(DB,$data,array(
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
				foreach($data['list'] as $k2 =>$v2 ){
					if(!in_array($v2['purchaser']['data']['email'], $emails)) $emails[]=$v2['purchaser']['data']['email'];
				}
			}
			$out=[
				'emails'=>$emails,
				'count'=>sizeof($emails)
			];
			die(json_encode($out));
		}
		public static function testUpdate(){
			// $res=ONE_CORE::update('user',array('id'=>ADMIN_UID),array(
			// 	'status.overdue'=>0,
			// 	'status.active'=>1,
			// 	'status.stopped'=>0,
			// 	'status.amount'=>1100,
			// 	'status.validUntil'=>time()+(60*60*24*30)
			// ),false,false);
			// $res=ONE_CORE::update('current_subscription_info',array('page.id'=>ADMIN_UID),array(
			// 	'ts'=>time(),
			// ),false,false,[
			// 	'canceled'=>1,
			// 	'overdue'=>1
			// ]);
			$current=array(
				'sent'=>0,
				'sent_count'=>0,
				'balance'=>100,
				'received'=>10,
				'received_count'=>0,
				'ratio'=>.89,
				'score'=>1.2,
				'volume'=>100,
				'tags'=>false
			);
			$resp=ONE_CORE::update('points',array('id'=>$user['id']),$current);
			phi::clog('score! '.json_encode($resp));
			//die(json_encode(['res'=>$res]));
		}
		public static function reconsile(){
			include_once(ROOT.'/api/stripe.php');
			stripe::setStatus('UMGPX298AUKJ',1);
			return false;
			#$csub=stripe::getCurrentSubscription('USHIV3XEMT50',1);
			#die(json_encode($csub));
			//return false;
			$l=db2::toOrderedList(db2::find(DB,'current_subscription_info',['canceled'=>['$exists'=>true],'valid_until'=>['$lte'=>time()]]));
			foreach($l['list'] as $k=>$v){
				$u=db2::findOne(DB,'user',['id'=>$v['page']['id']]);
				if($u){
					phi::clog('user: ['.$u['name'].'] level: ['.$u['level'].']');
					db2::update(DB,'user',['id'=>$u['id']],['$set'=>['level'=>'explorer']]);
				}
			}
			//build current status!!!!
			$u=db2::toOrderedList(db2::find(DB,'user',[]));
			foreach($u['list'] as $k=>$v){
				stripe::setStatus($v['id'],1);
			}
			phi::clog('done!');
		}
		public static function checkEventCheckins(){
			//find events in last 36 hours that havent been checked
			$events=db2::toOrderedList(db2::find(DB,'event',['start'=>['$gte'=>(time()-(60*60*36)),'$lt'=>time()],'checkin_checked'=>['$exists'=>false]]));
			if($events){
				foreach($events['order'] as $k=>$v){
					phi::clog('check event '.$v);
					$ev=$events['list'][$v];
					//find checkins
					$checkins=db2::toOrderedList(db2::find(DB,'checkin',['page.id'=>$v]));
					phi::clog('checkins '.json_encode($checkins));
					if($checkins){
						//compare agains donations and ticket sales
						$tickets=db2::toOrderedList(db2::find(DB,'ticket_receipt',['event'=>$v]));
						#phi::clog('tickets '.json_encode($tickets));
						$donations=db2::toOrderedList(db2::find(DB,'donation',['to.id'=>$v]));
						#phi::clog('donations '.json_encode($donations));

					}
					//update any events in this list
					//$updates[]=[['id'=>$v],['$set'=>['checkin_checked'=>1]]];
				}
				if(isset($updates)){
					db2::bulkUpdate(DB,'event',$updates);
				}
				phi::clog('Done!');
			}else{
				phi::clog('No events to check!');
			}
		}
		public static function tagCashFlow(){
			$l=db2::toOrderedList(db2::find(DB,'payment_info',[]));
			foreach ($l['list'] as $k => $v) {
				if(isset($v['subscription_info'])){
					$tag='subscription';
				}else if(isset($v['to'])){
					$tag='event_ticket';
				}
				phi::clog('tag; '.$tag);
				$updates[]=[['id'=>$v['id']],['$set'=>['tag'=>$tag]]];
			}
			#die(json_encode($updates));
			db2::bulkUpdate(DB,'payment_info',$updates);
			phi::clog('done!');
		}
		public static function fixMembership(){
			$l=db2::toOrderedList(db2::find(DB,'current_subscription_info',array()));
			include_once(ROOT.'/api/stripe.php');
			foreach ($l['list'] as $k => $v) {
				$update=false;
				if(isset($v['membership']['one_boulder'])){
					if(isset($v['membership']['one_boulder']['split']['one_riverside'])){
						$v['membership']['one_boulder']['split']['one_boulder']+=$v['membership']['one_boulder']['split']['one_riverside'];
						unset($v['membership']['one_boulder']['split']['one_riverside']);
						$update['$set']['membership.one_boulder.split']=$v['membership']['one_boulder']['split'];
					}
					if(isset($v['membership']['one_boulder']['link'])){
						$update['$unset']['membership.one_boulder.link']=1;
					}
				}
				if(isset($v['membership']['one_riverside'])){
					phi::clog('update one_riverside membership ['.$v['page']['id'].']');
					$update['$set']['membership_order']=['one_boulder'];
					$update['$unset']['membership.one_riverside']=1;
					//update stripe!!!
					$current=stripe::getCurrentSubscription($v['page']['id']);
					if($current){
						$total=$v['membership']['one_boulder']['split']['one_boulder'];
						phi::clog('UPDATe subscription ['.$current['items']['data'][0]['id'].'] : '.$total);
						stripe::updateUsage(array(
							'total'=>$total,
							'subscription'=>$current['items']['data'][0]['id']
						));
					}else{
						phi::clog('couldnt find stripe subscription');
					}
				}
				if($update){
					$updates[]=[
						['_id'=>db2::toId($v['_id'])],
						$update
					];
				}
			}
			if(isset($updates)){
				//phi::clog(json_encode($updates,JSON_PRETTY_PRINT));
				db2::bulkUpdate(DB,'current_subscription_info',$updates);
			}
			phi::clog('done!');
		}
		public static function forceCheckin(){
			include_once(ROOT.'/api/class/formbuilder.php');
			if(!self::$force||!db2::findOne(DB,'user',['id'=>self::$force])) return phi::clog('enter valid uid');
			$resp=formbuilder::save(array(
				'auth'=>array(
					'uid'=>self::$force
				),
				'qs'=>array(
					'appid'=>'2366d44c84409765d9a00619aea4c1234',
					'schema'=>'checkin',
					'current'=>[
						"location"=>[
							'id'=>'E54JXTK9PY08Z',
							'type'=>'event'
						],
						"page"=>[
							'id'=>self::$force,
							'type'=>'user'
						]
					]
				)
			));
			phi::clog('resp '.json_encode($resp));
		}
		public static function testPaymentHook(){
			ONE_CORE::emitGameHook([
				'auth'=>[
					'uid'=>ADMIN_UID
				]
			],'membership_payment',[
				'amount'=>1100
			]);
			phi::clog('done!');
		}
		public static function calcReferals(){

		}
		public static function buildnews(){
			exec('/usr/bin/node '.ROOT.'/node/buildnews.js');
		}
		public static function fixEvents(){
			$l=db2::toOrderedList(db2::find(DB,'event',[]));
			foreach ($l['list'] as $k => $v) {
				if(isset($v['start'])&&$v['start']){
					$updates[]=[
						['id'=>$v['id']],
						['$set'=>[
							'start_unique'=>phi::getUniqueNumber()
						]]
					];
				}else{
					$start=time()-(60*60*24*365);
					$updates[]=[
						['id'=>$v['id']],
						['$set'=>[
							'start'=>$start,
							'start_unique'=>phi::getUniqueNumber()
						]]
					];
				}
			}
			if(isset($updates)){
				db2::bulkUpdate(DB,'event',$updates);
				phi::clog('updated: '.sizeof($updates));
			}
		}
		public static function calcChakras(){
			$l=db2::toOrderedList(db2::find(DB,'user',array(),array('projection'=>array('id'=>1))));
			foreach ($l['list'] as $k => $v) {
				//calc!
				$chakras=[
					'crown'=>(float) number_format((rand(0,100)/100)*10,2),
					'thirdeye'=>(float) number_format((rand(0,100)/100)*10,2),
					'throat'=>(float) number_format((rand(0,100)/100)*10,2),
					'heart'=>(float) number_format((rand(0,100)/100)*10,2),
					'solarplexus'=>(float) number_format((rand(0,100)/100)*10,2),
					'sacral'=>(float) number_format((rand(0,100)/100)*10,2),
					'root'=>(float) number_format((rand(0,100)/100)*10,2),
				];
				$updates[]=[['id'=>$v['id']],['$set'=>['health'=>$chakras]]];
				$save[]=[
					'page'=>[
						'id'=>$v['id'],
						'type'=>'user'
					],
					'health'=>$chakras
				];
			}
			if(isset($updates)){
				db2::bulkUpdate(DB,'user',$updates);
			}
			if(isset($save)){
				db2::bulkInsert(DB,'user_health',$save);
			}
			phi::clog('Done!');
		}
		public static function broadcastEvents(){
			//find events that are less than 4 days from starting that havent been published and have a host that is a producer or above
			$list=db2::toOrderedList(db2::find(DB,'event',['published'=>['$ne'=>1],'cancelled'=>['$exists'=>false],'autopublish'=>1,'start'=>['$gte'=>time(),'$lte'=>(time()+(60*60*24*4))]],['projection'=>['page'=>1,'id'=>1,'start'=>1,'name'=>1]]));
			$list=db2::graph(DB,$list,[
				'page.id'=>[
					"coll"=>[
	                    "field"=>"page.type",
	                    "id"=>"page.id"
	                ],
	                "to"=>"page.data",
	                "opts"=>[
	                    "user"=>[
	                        "coll"=>"user",
	                        "match"=>"id",
	                        "fields"=>["id"=>1,"pic"=>1,"name"=>1,'level'=>1]
	                    ],
	                    "page"=>[
	                        "coll"=>"page",
	                        "match"=>"id",
	                        "fields"=>["id"=>1,"pic"=>1,"name"=>1]
	                    ]
	                ],
	                "match"=>"id"
				]
			]);
			$allow=['steward','producer'];
			$appid='2366d44c84409765d9a00619aea4c1234';
			$l=db2::toOrderedList(db2::find(DB,'user',array(),array('projection'=>array('id'=>1))));
			if($l&&isset($l['list'])&&$l['list']) foreach ($list['list'] as $k => $v) {
				if(isset($v['page']['data']['level'])&&in_array($v['page']['data']['level'], $allow)){
					$c=0;
					if(phi::$conf['prod']){
						if(isset($l['order'])){
							foreach ($l['order'] as $tk => $tv) {
								$c++;
								$hooks[]=phi::emitHook(DB,time(),array(
									'id'=>'event_invite',
									'data'=>array(
										'app_id'=>$appid,
										'to'=>array(
											'type'=>'user',
											'id'=>$tv
										),
										'from'=>phi::keepFields($v['page'],array('id','type')),
										'event'=>$v['id']
									)
								),1);
							}
							
						}
					}else{
						$c++;
						$hooks[]=phi::emitHook(DB,time(),array(
							'id'=>'event_invite',
							'data'=>array(
								'app_id'=>$appid,
								'to'=>array(
									'type'=>'user',
									'id'=>ADMIN_UID
								),
								'from'=>phi::keepFields($v['page'],array('id','type')),
								'event'=>$v['id']
							)
						),1);
					}
					$updates[]=[['id'=>$v['id']],['$set'=>['published'=>1]]];
					phi::clog('✅ Publish: '.$v['name'].' to '.$c.' people');
				}else{
					if(isset($v['page']['data']['level'])){
						phi::clog('dont publish '.$v['name'].' - ['.$v['page']['data']['name'].'] Level: '.$v['page']['data']['level']);
						phi::log('dont publish '.$v['name'].' - ['.$v['page']['data']['name'].'] Level: '.$v['page']['data']['level']);
					}else phi::clog('dont publish '.$v['name'].' - no level set ['.$v['page']['data']['name'].']');
				}
			}
			$ec=0;
			$hc=0;
			if(isset($updates)){
				db2::bulkUpdate(DB,'event',$updates);
				$ec=sizeof($updates);
			}
			if(isset($hooks)){
				phi::saveHooks($hooks);
				$hc=sizeof($hooks);
			}
			phi::clog('broadcastEvents published ['.$ec.'] events with ['.$hc.'] hooks');
			phi::log('✅ admin::broadcastEvents published ['.$ec.'] events with ['.$hc.'] hooks');
			//die(json_encode($list,JSON_PRETTY_PRINT));
		}
		public static function loadConfig(){
			$file=ROOT.'/_priv/'.phi::$conf['env'].'_config.json';
			if(is_file($file)){
				$parser = new JsonParser();
				try {
				   	$parser->parse(file_get_contents($file));
				} catch (Exception $e) {
				    $details = $e->getDetails();
				    die(json_encode($details,JSON_PRETTY_PRINT));
				}
				//do other stuff
				file_put_contents(HOME.'/priv/config.json', file_get_contents($file));
				phi::clog('✅ successfully loaded config.json to '.HOME.'/priv/config.json');
			}else{
				phi::clog('⚠️ '.$file.' not found!');
			}
		}
		public static function testBalance(){
			phi::push('','admin_balance',array('type'=>'balance','data'=>[]));
		}
		public static function testInvoice(){
			$tdata=[
				'id'=>ADMIN_UID.'_'.time(),
				'type'=>'singleton',
				'page'=>[
					'id'=>ADMIN_UID,
					'type'=>'user'
				],
				'start'=>time(),
				'status'=>'finalized',
				'total'=>100
			];
			$save[]=[['id'=>$tdata['id']],$tdata];
			$re=db2::bulkUpdate(DB,'invoice',$save);
			phi::clog('invoice added!');
		}
		public static function stripeCapability(){
			include_once(ROOT.'/api/stripe.php');
			$current=db2::findOne(DB,'stripe',['id'=>ADMIN_UID]);
			$stripe = stripe::getStripeKeys();
			$stripe = new \Stripe\StripeClient($stripe['secret_key']);
			$capability=$stripe->accounts->retrieveCapability(
			  $current['express']['id'],
			  'transfers',
			  []
			);
			if($capability['status']=='active'){
				$res=$stripe->transfers->create([
				  'amount' => 100,//1 doller at a time for testing
				  'currency' => 'usd',
				  'destination' => $current['express']['id']
				]);
				phi::clog('transfer response: '.json_encode($res,JSON_PRETTY_PRINT));
			}else{
				phi::clog('not active yet');
				die(json_encode($capability));
			}
		}
		public static function fixBirthdays(){
			$l=db2::toOrderedList(db2::find(DB,'user',[]));
			foreach ($l['list'] as $k => $v) {
				if(isset($v['birthday'])){
					$set['birthday.ts']=strtotime($v['birthday']['birthday']);
					$set['birthday.month'] = (int) date('m',$set['birthday.ts']);
					$set['birthday.year'] = (int) date('Y',$set['birthday.ts']);
					$set['birthday.day'] = (int) date('d',$set['birthday.ts']);
					db2::update(DB,'user',['id'=>$v['id']],['$set'=>$set]);
				}
			}
			phi::clog('done!');
		}
		public static function loadwallpapers(){
			include_once(ROOT.'/_img/resizer.php');
			db2::remove(DB,'wallpaper',[],['multi'=>true]);
			$c=0;
			$exists=true;
			while($exists){
				$url=phi::$conf['s3'].'/static/wallpapers/web/'.$c.'.jpeg?ts='.time();
				if(!file_get_contents($url)){
					$exists=false;
				}else{
					$id=md5($url);
					phi::clog('processing web ['.$c.'] !');
					db2::update(DB,'wallpaper',['id'=>$id],[
						'$set'=>[
							'id'=>$id,
							'type'=>'web',
							//'kenburns'=>1,
							'src'=>ImageResizer::base64Encode(['src'=>$url])
						]
					],['upsert'=>true]);
					$c++;
				}
			}
			$c=0;
			$exists=true;
			while($exists){
				$url=phi::$conf['s3'].'/static/wallpapers/phone/'.$c.'.jpeg?ts='.time();
				if(!file_get_contents($url)){
					$exists=false;
				}else{
					$id=md5($url);
					phi::clog('processing mobile ['.$c.'] !');
					db2::update(DB,'wallpaper',['id'=>$id],[
						'$set'=>[
							'id'=>$id,
							'type'=>'phone',
							//'kenburns'=>1,
							'src'=>ImageResizer::base64Encode(['src'=>$url])
						]
					],['upsert'=>true]);
					$c++;
				}
			}
			phi::clog('done!');
		}
		public static function fixPayments(){
			$ul=db2::toOrderedList(db2::find(DB,'payment_info',array()));
			foreach ($ul['list'] as $k => $v) {
				#die(json_encode($v));
				if(isset($set)) unset($set);
				if(isset($v['split']['actualize'])){
					$v['split']['one_boulder']+=$v['split']['actualize'];
					unset($v['split']['actualize']);
				}
				$set['split']=$v['split'];
				foreach ($v['subscription_info'] as $tk => $tv) {
					if(isset($tv['split']['actualize'])){
						$tv['split']['one_boulder']+=$tv['split']['actualize'];
						unset($tv['split']['actualize']);
					}
					$set['subscription_info'][]=$tv;
				}
				#die(json_encode($set));
				$res=db2::update(DB,'payment_info',['id'=>$v['id']],['$set'=>$set]);
			}
			//fix current_subscriptio info
			$ul=db2::toOrderedList(db2::find(DB,'current_subscription_info',array()));
			foreach ($ul['list'] as $k => $v) {
				if(isset($set)) unset($set);
				foreach ($v['membership'] as $tk => $tv) {
					if(isset($tv['split']['actualize'])){
						$tv['split']['one_boulder']+=$tv['split']['actualize'];
						unset($tv['split']['actualize']);
					}
					$set['membership'][$tk]=$tv;
				}
				if(in_array('actualize', $v['membership_order'])){
					$d=array_diff($v['membership_order'], ['actualize']);
					$set['membership_order']=$d;
				}
				$res=db2::update(DB,'current_subscription_info',['page.id'=>$v['page']['id']],['$set'=>$set]);
			}
		}
		public static function loadFundraisingTerms(){
			include_once(phi::$conf['root'].'/api/oauth2.php');
			$id='1Cb0wGx44_U0A5oWUwHLlv01jbTZ-C99A9XfdGuQ7LNg';
			$data=OAUTH2::get(array(
				'url'=>'https://www.googleapis.com/drive/v3/files/'.$id.'/export',
				'data'=>array(
					'mimeType'=>'text/html'
				),
				'dieUrl'=>1,
				'uid'=>'UIAMPLAYER1',
				'app'=>'one',
				'app_id'=>'google',
				'multiple'=>true
			));
			if(isset($data['error'])){
				die(json_encode($data));
			}
			$d = new DOMDocument;
			$mock = new DOMDocument;
			$d->loadHTML($data['body']);
			$body = $d->getElementsByTagName('body')->item(0);
			foreach ($body->childNodes as $child){
			    $mock->appendChild($mock->importNode($child, true));
			}
			$outhtml=$mock->saveHTML();
			$save=array(
				'id'=>'fundraiser',
				'html'=>$outhtml
			);
			db2::update(DB,'termdata',array('id'=>'fundraiser'),array('$set'=>$save,'$inc'=>array('version'=>1)),array('upsert'=>true));
			phi::cache('fundraiser_terms',function(){
				$td=db2::findOne(DB,'termdata',array('id'=>'fundraiser'));
				return $td['html'];
			},1);
			phi::clearCache('fundraiser_terms');
			$vd=db2::findOne(DB,'termdata',array('id'=>'fundraiser'),array('projection'=>array('version'=>1)));
			phi::clog('successfully cached fundraiser terms [version '.$vd['version'].']!',1);
		}

		public static function fixAncestry(){
			$l=db2::toOrderedList(db2::find(DB,'user',array(),array('sort'=>array('_id'=>1))));
			$counts=[];
			foreach ($l['order'] as $k => $v) {
				$item=$l['list'][$v];
				$ancestry=self::getAncestry($item);
				#die(json_encode($ancestry));
				if($ancestry){
					$ancestry=array_reverse($ancestry);//climbed in reverse order!
					phi::clog('Update ancestry for ['.$item['name'].'] to ['.json_encode($ancestry).']',1);
					db2::update(DB,'user',array('id'=>$item['id']),array('$set'=>array('ancestry'=>$ancestry)));
					if(!isset($counts[sizeof($ancestry)])) $counts[sizeof($ancestry)]=0;
					$counts[sizeof($ancestry)]++;
				}else{
					phi::clog('skipping '.$item['name'],1);
				}
			}
			phi::clog('complete: '.json_encode($counts),1);
			// //die(json_encode($test));
			// $ancestry=array_reverse(self::getAncestry($test));
			// die(json_encode($ancestry));
		}
		public static function getAncestry($referal){
			if(!isset($referal['refered_by'])) return false;
			$ret[]=$referal['refered_by'];
			$pr=db2::findOne(DB,'user',array('id'=>$referal['refered_by']));
			if($pr){
				$pret=self::getAncestry($pr);
				if($pret){
					foreach ($pret as $k => $v) {
						$ret[]=$v;
					}
				}
				return $ret;
			}else return $ret;
		}
		public static function loadTicketTerms(){
			include_once(phi::$conf['root'].'/api/oauth2.php');
			$id='1PmJmqoFIVN6uHcsMK2f2zea93j38WAuh8pbn4HH5qlQ';
			$data=OAUTH2::get(array(
				'url'=>'https://www.googleapis.com/drive/v3/files/'.$id.'/export',
				'data'=>array(
					'mimeType'=>'text/html'
				),
				'dieUrl'=>1,
				'uid'=>'UIAMPLAYER1',
				'app'=>'one',
				'app_id'=>'google',
				'multiple'=>true
			));
			if(isset($data['error'])){
				die(json_encode($data));
			}
			$d = new DOMDocument;
			$mock = new DOMDocument;
			$d->loadHTML($data['body']);
			$body = $d->getElementsByTagName('body')->item(0);
			foreach ($body->childNodes as $child){
			    $mock->appendChild($mock->importNode($child, true));
			}
			$outhtml=$mock->saveHTML();
			$save=array(
				'id'=>'ticket',
				'html'=>$outhtml
			);
			db2::update(DB,'termdata',array('id'=>'ticket'),array('$set'=>$save,'$inc'=>array('version'=>1)),array('upsert'=>true));
			phi::cache('ticket_terms',function(){
				$td=db2::findOne(DB,'termdata',array('id'=>'ticket'));
				return $td['html'];
			},1);
			phi::clearCache('ticket_terms');
			$vd=db2::findOne(DB,'termdata',array('id'=>'ticket'),array('projection'=>array('version'=>1)));
			phi::clog('successfully cached ticket terms [version '.$vd['version'].']!',1);
			//die(var_dump($data));
		}
		public static function startGame(){
			$games=db2::toList(db2::find(DB,'games',[]));
			$ul=db2::toOrderedList(db2::find(DB,'user',array()));
			foreach ($ul['list'] as $k => $v) {
				phi::clog('processing: '.$v['name']);
				$uid=$v['id'];
				$res=ONE_CORE::gameOnboard([
					'auth'=>['uid'=>$uid]
				]);
				if($res['data']['awarded']){
					foreach ($res['data']['awarded']['list'] as $k => $v) {
						$awarded[]=$v['game'];
					}
					$res['data']['awarded']=$awarded;
				}
				if(isset($res['data']['status'])){
					foreach ($res['data']['status'] as $k => $v){
						$game_type=$k;
						if(isset($games[$game_type])){
							$game=$games[$game_type];
							if($res['data']['awarded']&&in_array($k, $res['data']['awarded'])){
								$save=false;
							}else{
								if($k=='profile_questions'){
									if($v['total']==$v['answered']) $save=true;
									else $save=false;
								}else if($v){
									$save=true;
								}
							}
							if($save&&in_array($game_type, ['profile_genekey','profile_humandesign','profile_questions'])){
								phi::clog('user ['.$uid.'] got game ['.$game_type.']');
								$tosave[]=[['id'=>$uid.'_'.$game_type],[
									'id'=>$uid.'_'.$game_type,
									'page'=>array(
										'type'=>'user',
										'id'=>$uid
									),
									'game'=>$game_type,
									'points'=>$game['points']
								]];
								if(!isset($issue[$uid])) $issue[$uid]=0;
								//$issue[$uid]+=$game['points'];
							}
						}else{
							phi::clog('invalid game type : ['.$game_type.']');
						}
					}
				}
			}
			//phi::clog('===========> Sending points!');
			//include_once(ROOT.'/api/class/formbuilder.php');
			//if an account exists from an invite, just upate it!
			if(isset($tosave)){
				db2::bulkUpdate(DB,'awards',$tosave);
				// foreach ($issue as $k => $v) {
				// 	$data=formbuilder::save(array(
				// 		'auth'=>array(
				// 			'uid'=>'internal'
				// 		),
				// 		'qs'=>array(
				// 			'appid'=>'13662ad4404765d9aa4615ad8c1234',
				// 			'schema'=>'exchange',
				// 			'current'=>[
				// 				'to'=>[
				// 					'id'=>$k,
				// 					'type'=>'user'
				// 				],
				// 				'from'=>[
				// 					'id'=>'one_boulder',
				// 					'type'=>'page'
				// 				],
				// 				'amount'=>$v,
				// 				'message'=>'🚀 For supporting us in our early growth stage.',
				// 				'seed'=>1
				// 			]
				// 		)
				// 	));
				// 	if(!isset($data['success'])){
				// 		phi::clog('error with ['.$k.']');
				// 	}else{
				// 		phi::clog('Successfully sent points to ['.$k.']');
				// 	}
				// }
			}else{
				phi::clog('no awards to update');
			}
		}
		public static function recalcAllInvoices(){
			$month=1;
			$year=2021;
			$endMonth=date('n');
			$endYear=date('Y');
			while((($month<=$endMonth&&$year==$endYear)||($year<$endYear))&&$year<=$endYear){
				$recalc[]=['month'=>$month,'year'=>$year,'type'=>'startofmonth'];
				$recalc[]=['month'=>$month,'year'=>$year,'type'=>'halfmonth'];
				$month++;
				if($month>12){
					$month=1;
					$year++;
				}
			}
			foreach($recalc as $k=>$v){
				self::calculateInvoices($v['month'],$v['year'],$v['type']);
			}
			//die(json_encode($recalc,JSON_PRETTY_PRINT));
		}
		public static function calculateInvoices($month=false,$year=false,$time=false){
			//calc on 1st and 15th
			//get last nearest start 
			// $l=db2::find(DB,'invoice',[
			// 	'start'=>[
			// 		'$lte'=>time()
			// 	]
			// ],[
			// 	'sort'=>[
			// 		'end'=>-1
			// 	],
			// 	'limit'=>1
			// ]);
			$firstofmonth  = new DateTime;
			if($month){
				$firstofmonth_do=$firstofmonth->setDate($year,$month,1);
			}else{
				$firstofmonth_do=$firstofmonth->modify('first day of this month' );
			}
			$midmonth  = new DateTime;
			if($month){
				$midmonth_do=$firstofmonth->setDate($year,$month,1);
			}else{
				$midmonth_do= $firstofmonth->modify('first day of this month' );
			}
			$midmonth_do=$midmonth_do->modify('+15 days');
			$midmonth_do=$midmonth_do->modify('5am');
			$now   = new DateTime;
			if($month){
				$ts2=$now->setDate($year,$month,1);
			}else{
				$ts2=$now->modify('first day of this month');
			}
			//$ts2=$ts2->modify('+ 1 days' );
			$ts2=$ts2->modify('5am');
			//$ptsu=(int) $ts2->format('U');
			//$ts2=$ts2->modify('+ 1 days' );
			$lmtsu=(int) $ts2->format('U');
			//if time is less than 
			if($month){
				$ts=$now->setDate($year,$month,1);
			}else{
				$ts=$now->modify('first day of this month' );
			}
			$ts=$ts->modify('5am');
			//$ts=$ts->modify('+ 1 second');
			$tsu=(int) $ts->format('U');
			$lts=$ts->modify('+ 15 days' );
			$lts=$lts->modify('5am');
			$ltsu=(int) $lts->format('U');
			$lts2=$lts->modify('+ 1 second');
			$ltsu2=(int) $lts2->format('U');
			$ets=$ts->modify('first day of next month' );
			$ets=$ets->modify('5am');
			$etsu=(int) $ets->format('U');

			// $diff15=abs($ltsu-time());
			// $diff=abs($tsu-time());
			// $diffe=abs($etsu-time());
			/*
				0-2 5am - calc for previous month
				2 5:01 - 16 5am - calc for first half
				16 5:01 - EOM calc for second half
			*/
			if(self::$force) $time=self::$force;
			#die('ts : '.$lmtsu);
			if((time()<$lmtsu&&!$time)||$time==='lastmonth'){//calc final invoice for end of last month
				$now   = new DateTime;
				$et=$now->modify('first day of last month');
				$et=$et->modify('+ 15 days' );
				$et=$et->modify('5am');
				$et=$et->modify('+ 1 second');
				$start=(int) $et->format('U');
				$startmonth=strtolower($et->format('M_Y'));
				$end=$tsu-1;
				$name='halfmonth';
				$key=$startmonth.'_'.$name;
			}else if((time()>=$ltsu&&!$time)||$time==='halfmonth'){
				$name='halfmonth';
				$start=$ltsu2;
				$startmonth=strtolower($midmonth_do->format('M_Y'));
				$end=$etsu;
				$key=$startmonth.'_'.$name;
			}else if((time()<$ltsu&&!$time)||$time==='startofmonth'){
				$name='startofmonth';
				$start=$tsu;
				$end=$ltsu;
				$startmonth=strtolower($firstofmonth_do->format('M_Y'));
				$key=$startmonth.'_'.$name;
			}else if($time==='startoflastmonth'){
				$name='startofmonth';
				$start=$tsu;
				$end=$ltsu;
				$startmonth=strtolower($firstofmonth_do->format('M_Y'));
				$key=$startmonth.'_'.$name;
			}else{
				phi::clog('invalid range');
				die();
			}
			if(self::$force){
				phi::clog('calcuate invoice for range: '.json_encode(array(
					'key'=>$key,
					'start'=>$start,
					'start_time'=>date('m/d/y g:i a',$start),
					'end'=>$end,
					'end_time'=>date('m/d/y g:i a',$end),
				),JSON_PRETTY_PRINT));
			}
			//die('key: '.$key);
			//db2::remove(DB,'invoice',['key'=>$key],['multi'=>true]);
			$data=ONE_ADMIN::cashFlowFinances(['qs'=>[
				'range'=>array(
					'start'=>$start,
					'end'=>$end
				)
			]],'stats');
			if(time()>$end){
				$status='finalized';
			}else{
				$status='pending';
			}
			//die(json_encode($data));
			if(isset($data['list'])) foreach ($data['list'] as $k => $v) {
				$payoutinfo='';
				$subscription=$v['count'];
				if(isset($v['fees'])){
					foreach($v['fees'] as $tk=>$tv){
						switch($tk){
							case 'ticket_platform_fee':
								$subscription-=$tv;
								$payoutinfo.= ' <b>Ticket Platform Fees</b>: $'.phi::toMoney($tv);
							break;
							case 'fundraiser_platform_fee':
								$subscription-=$tv;
								$payoutinfo.= ' <b>Fundraiser Platform Fees</b>: $'.phi::toMoney($tv);
							break;
						}
					}
					$payoutinfo.= ' <b>Subscriptions</b>: $'.phi::toMoney($subscription);
				}
				if($v['page']['id']=='stripe'){
					$cstatus='finalized';
					$tdata=[
						'id'=>$v['page']['id'].'_'.$key,
						'type'=>$name,
						'page'=>[
							'id'=>$v['page']['id'],
							'type'=>$v['_id']['type']
						],
						'start'=>$start,
						'end'=>$end,
						'updated'=>time(),
						'paid'=>1,
						'status'=>$cstatus,
						'total'=>$v['count']
					];
				}else{
					$cstatus=$status;
					$tdata=[
						'id'=>$v['page']['id'].'_'.$key,
						'type'=>$name,
						'page'=>[
							'id'=>$v['page']['id'],
							'type'=>$v['_id']['type']
						],
						'description'=>'Invoice from '.phi::formatTime($start,'date',$end). ' '.$payoutinfo ,
						'start'=>$start,
						'end'=>$end,
						'key'=>$key,
						'updated'=>time(),
						'status'=>$cstatus,
						'total'=>$v['count']
					];
				}
				$save[]=[['id'=>$v['page']['id'].'_'.$key],[
					'$set'=>$tdata
				]];
			}
			if(isset($save)){
				if($month){
					#phi::clog(json_encode($save,JSON_PRETTY_PRINT));
				}
				$re=db2::bulkUpdate(DB,'invoice',$save);
				//phi::clog('updated ['.sizeof($save).'] invoices');
				//phi::log('updated ['.sizeof($save).'] invoices');
			}else{
				//phi::log('no invoices to update');
			}
			//process donation_page donations
			// die(json_encode([
			// 	'name'=>$name,
			// 	'range'=>array(
			// 		'start'=>$start,
			// 		'end'=>$end
			// 	)
			// ]));
			$data=ONE_ADMIN::cashFlowFinances(['qs'=>[
				'range'=>array(
					'start'=>$start,
					'end'=>$end
				)
			]],false,'donation_page');
			if(isset($data['data']['stats'])&&$data['data']['stats']&&sizeof($data['data']['stats'])){
				foreach($data['data']['stats'] as $k=>$v){
					$cstatus=$status;
					//$cstatus=$status='finalized';
					$tdata=[
						'id'=>$v['_id']['to'].'_'.$key,
						'type'=>$name,
						'page'=>[
							'id'=>$v['_id']['to'],
							'type'=>'page'
						],
						'description'=>'Donations from '.phi::formatTime($start,'date',$end),
						'start'=>$start,
						'end'=>$end,
						'key'=>$key,
						'updated'=>time(),
						'status'=>$cstatus,
						'total'=>$v['count']
					];
					$save2[]=[['id'=>$v['page']['id'].'_'.$key],[
						'$set'=>$tdata
					]];
				}
				if(isset($save2)){
					$re=db2::bulkUpdate(DB,'invoice',$save2);
					//phi::clog('updated ['.sizeof($save).'] invoices');
					//phi::log('updated ['.sizeof($save).'] invoices');
				}else{
					//phi::log('no invoices to update');
				}
			}
			//die(json_encode($save));
		}
		public static function resetLevels(){
			db2::remove(DB,'levels',[],true);
			$r=db2::update(DB,'user',['id'=>['$exists'=>true]],['$set'=>['level'=>'explorer']],['multi'=>true]);
			exec('loaddb');
		}
		public static function cancelCobot(){
			include_once(ROOT.'/api/stripe.php');
			if(stripe::cancelCobotMember((self::$force)?self::$force:ADMIN_UID)){
				phi::clog('successfullly canceled!');
			}else{
				phi::clog('error cancelling!');
			}
		}
		public static function cobot(){
			include_once(phi::$conf['root'].'/api/oauth2.php');
			include_once(phi::$conf['root'].'/api/api.php');
			$uid=(self::$force)?self::$force:ADMIN_UID;
			include_once(ROOT.'/api/stripe.php');
			stripe::ensureCobotMember($uid,'80b74f262d3f1ba6acdf4d69bc62ffb0');
		}
		public static function fixCheckins(){
			$l=db2::toOrderedList(db2::find(DB,'checkin',array()));
			foreach ($l['list'] as $k => $v) {	
				if(isset($v['user'])){//old data
					$save=$v;
					unset($save['user']);
					$save['page']=array(
						'id'=>$v['user'],
						'type'=>'user'
					);
					$save['location']=array(
						'type'=>'location',
						'id'=>$v['location']
					);
					db2::update(DB,'checkin',array('id'=>$save['id']),array('$set'=>$save,'$unset'=>array('user'=>1)));
					phi::clog('updating!! '.json_encode($save));
				}
			}
			phi::clog('done!');
		}
		public static function calcHotPlayers(){
			include_once(ROOT.'/api/class/exchange.php');
			// $c=EXCHANGE::recalcBalancForId('UIAMPLAYER1',time()-(60*60*24*30));
			// die(json_encode($c));
			$balances=db2::toOrderedList(db2::find(phi::$conf['dbname'],'points',array()));
			$info['sent']=0;
			$info['received']=0;
			$info['balance']=0;
			foreach ($balances['order'] as $k => $v) {
				$balance=$balances['list'][$v];
				$c=EXCHANGE::recalcBalancForId($balance['id'],time()-(60*60*24*30));
				//get 
				if(!isset($c['error'])){
					$info['sent']+=$c['sent'];
					$info['received']+=$c['received'];
					$info['balance']+=$c['balance'];
					if(isset($c['tags'])) unset($c['tags']);
					$bulk[]=array(
						'uid'=>$balance['id'],
						'points'=>$c,//points snapshot for last month
						'ts'=>time()
					);
				}else{
					phi::clog($balance['id'].' '.json_encode($c));
				}
			}
			if(isset($bulk)){
				db2::bulkInsert(DB,'points_month',$bulk);
			}
			//also count
			$ul=db2::toOrderedList(db2::find(DB,'user',[],['$projection'=>['id'=>1,'name'=>1]]));
			foreach ($ul['list'] as $k => $v) {
				$updates[]=array(array('id'=>$v['id']),array('$set'=>self::getScore($v['id'])));
			}
			$res=db2::bulkUpdate(DB,'user',$updates);
			if(self::$force==1) die(json_encode($info));
			return $info;
		}
		public static function getScore($id){
			//$time=0;
			$time=time()-(60*60*24*31);
			$gifts=db2::count(DB,'exchange',['_id'=>['$gte'=>db2::getIdFromTime($time)],'from.id'=>$id]);
			$referals=db2::count(DB,'user',['_id'=>['$gte'=>db2::getIdFromTime($time)],'referal'=>$id]);
			$offers=db2::count(DB,'offer',['_id'=>['$gte'=>db2::getIdFromTime($time)],'from.id'=>$id]);
			$requests=db2::count(DB,'need',['_id'=>['$gte'=>db2::getIdFromTime($time)],'from.id'=>$id]);
			$fulfilled=db2::count(DB,'request_fulfilled',['_id'=>['$gte'=>db2::getIdFromTime($time)],'by.id'=>$id,'approved'=>1]);
			$score=$gifts+$referals+$offers+$requests+$fulfilled;
			#phi::clog('Score: '.$score.' Gifts: '.$gifts.' referals '.$referals. ' offers: '.$offers. ' requests: '.$requests.' fulfilled '.$fulfilled);
			return [
				'score'=>$score
			];
		}
		public static function testGame(){
			ONE_CORE::emitGameHook(array(
				'auth'=>array(
					'uid'=>'UIAMPLAYER1'
				)
			),'profile_pic');
		}
		public static function moveGeneKeys(){
			$ul=db2::toOrderedList(db2::find(DB,'user',array()));
			$unset=array('genekeys'=>1);
			$keep=array('genekeys');
			foreach ($ul['order'] as $k => $v) {
				$d=$ul['list'][$v];
				db2::update(DB,'user',array('id'=>$d['id']),array('$unset'=>$unset));
				$toset=phi::keepFields($d,$keep);
				if($toset&&sizeof($toset)){
					phi::clog('updating ['.sizeof($toset).'] questions for ['.$d['id'].']');
					$toset['id']=$d['id'];
					ONE_CORE::update('user_profiles',array('id'=>$d[
						'id']),$toset);
				}
			}
			phi::clog('Done!');
		}
		public static function checkStatus(){
			include_once(ROOT.'/api/stripe.php');
			$current=db2::toOrderedList(db2::find(DB,'current_subscription_info',array('stopped'=>['$exists'=>false])),false,false,'_id');
			foreach($current['list'] as $k=>$v){
				$uid=$v['page']['id'];
				$update=false;
				$start[$uid]=array_keys($v['membership']);
			}
			$pastdue=db2::toOrderedList(db2::find(DB,'current_subscription_info',array('stopped'=>['$exists'=>false],'valid_until'=>array('$lt'=>time()))),false,false,'_id');
			if(!$pastdue){
				phi::log('0 people past due [Yay]!');
			}else{
				phi::log(sizeof($pastdue['order']).' people past due! ['.json_encode($pastdue['order']).']');
				foreach ($pastdue['list'] as $k => $v) {
					$uid=$v['page']['id'];
					phi::log('Stopping overdue account for ['.$uid.']');
					stripe::stop(false,$uid);
					if(!isset($v['canceled'])||isset($v['overdue'])){//add overdue flag in user
						phi::log('⚠️⚠️⚠️ CHECK OVERDUE STATUS MESSAGE!!!!');
						ONE_CORE::update('current_subscription_info',['page.id'=>$uid],[
							'overdue'=>1,
							'stopped'=>1
						]);
						ONE_CORE::update('user',array('id'=>$uid),array(
							'status.overdue'=>1,
							'status.active'=>0,
							'level'=>'explorer'
						));//must happne before webhook
					}else{
						ONE_CORE::update('current_subscription_info',['page.id'=>$uid],[
							'stopped'=>1
						]);
						ONE_CORE::update('user',array('id'=>$uid),array(
							'level'=>'explorer',
							'status.active'=>0,
							'status.overdue'=>0
						));
					}
				}
			}
			$ranges=STRIPE::getMembershipRanges();
			//remove any hanging add-ons
			$all=db2::toOrderedList(db2::find(DB,'current_subscription_info',array()),false,false,'_id');
			foreach($all['list'] as $k=>$v){
				$uid=$v['page']['id'];
				$update=false;
				$order=$v['membership_order'];
				$udorder=0;
				foreach($v['membership'] as $tk=>$tv){
					if(isset($tv['stop'])&&$tv['stop']<time()){
						#phi::clog('remove subscription ['.$uid.'] '.json_encode($tv));
						$update['$unset']['membership.'.$tk]=1;
						unset($all['list'][$k]['membership'][$tk]);
						$order=array_diff($order,[$tk]);
						$udorder=1;
					}
				}
				if($udorder){
					#die(json_encode($order));
					$update['$set']['membership_order']=$order;
				}
				if(isset($start[$uid])){
					$c=array_keys($all['list'][$k]['membership']);
					foreach($start[$uid] as $tk=>$tv){
						if(!in_array($tv,$c)){
							#phi::clog('turn off service ['.$uid.']: '.$tv);
							if(isset($ranges['list'][$tv]['hooks']['onStop'])){
								STRIPE::{$ranges['list'][$tv]['hooks']['onStop']}($uid);
							}
						}
					}
					unset($start[$uid]);
				}
				if($update){
					//phi::clog('update: '.json_encode($update));
					db2::update(DB,'current_subscription_info',['page.id'=>$uid],$update);
				}
			}
			if(sizeof($start)){//memberships that ended, disable everything!
				foreach($start as $uid=>$v){
					//phi::clog('turn off services (no longer active)['.$uid.']: '.json_encode($v));
					foreach($v as $tk=>$tv){
						#phi::clog('turn off services (no longer active)['.$uid.']: '.$tv);
						if(isset($ranges['list'][$tv]['hooks']['onStop'])){
							STRIPE::{$ranges['list'][$tv]['hooks']['onStop']}($uid);
						}
					}
				}
			}
		}
		public static function setValidUntil(){
			$uid=self::$force;
			$ts=(int) self::$force2;
			if(!$ts) $ts=time()+(60*60*30);
			$u=db2::findOne(DB,'user',array('id'=>$uid));
			if(!$u) die('invalid user!');
			if(!$ts) die('invalid timestamp!');
			$current=1100;
			ONE_CORE::update('current_subscription_info',array('page.id'=>$uid),array(
				'page'=>array(
					'id'=>$uid,
					'type'=>'user'
				),
				'membership'=>array(
					'oneboulder'=>$current
				),
				'valid_until'=>$ts,
				'ts'=>time()
			));
			phi::clog('Set!');
		}
		public static function viewCurrentSubscription(){
			include_once(ROOT.'/api/stripe.php');
			$csub=stripe::getCurrentSubscription((self::$force)?self::$force:'UIAMPLAYER1',1);
			die(json_encode($csub,JSON_PRETTY_PRINT));
		}
		public static function clearSubscriptions(){
			if(phi::$conf['prod']&&!self::$force) return phi::clog('Not available in production!!!!');
			db2::drop(DB,'payment_info');
			db2::drop(DB,'current_subscription_info');
			db2::drop(DB,'subscription_info_history');
			db2::drop(DB,'subscription');
			phi::clog('Done!');
		}
		public static function testBulk(){
			$data[]=array(
				'id'=>'test1'
			);
			$data[]=array(
				'id'=>'test2'
			);
			$data[]=array(
				'id'=>'test3'
			);
			db2::bulkInsert(DB,'testdata',$data);
			phi::clog('Done!');
		}
		public static function fix(){
			$h=phi::emitHook(phi::$conf['dbname'],time(),array(
				'id'=>'new_member_welcome',
				'data'=>array(
					'app_id'=>'2366d44c84409765d9a00619aea4c1234',
					'user'=>self::$force
				)
			));
		}
		public static function ensureSubscription(){
			//check to see
			include_once(ROOT.'/api/stripe.php');
			$keys = stripe::getStripeKeys();
			\Stripe\Stripe::setApiKey($keys['secret_key']);
			$stripe = new \Stripe\StripeClient($keys['secret_key']);
			$plan_id='one-subscription';
			try{
				$c=db2::findOne(DB,'subscription_info',array('id'=>$plan_id,'env'=>$keys['env']));
				if(!$c) throw new Exception('no_data');
				$current=$stripe->prices->retrieve(
				  $c['stripe_id'],
				  []
				);
				//ensure we have it!
				phi::clog('Subscription Exists!!!!');
				//create a subscription for stripe user?
			}catch(Exception $e){
				phi::clog('Price not found, creating!');
				$price = \Stripe\Price::create([
				  	'currency' => 'usd',
				  	'recurring' => [
				    	'interval' => 'month',
				    	'usage_type' => 'metered',
				    	'aggregate_usage'=>'last_ever'
				  	],
				  	'product_data' => [
				  		'id'=>$plan_id,
				    	'name' => 'Monthly Service Subscription',
				  	],
				  	'nickname' => 'Monthly Service Subscription',
				  	'unit_amount' => 1
				]);
				$set=array(
					'id'=>$plan_id,
					'env'=>$keys['env'],
					'stripe_id'=>$price['id']
				);
				db2::update(DB,'subscription_info',array('id'=>$plan_id),array('$set'=>$set),array('upsert'=>true));
				phi::clog('Created Plan: '.json_encode($set));
			}
		}
		public static function exportCsv(){
			if(!is_file(ROOT.'/_manage/tempdata/mobilize_members.csv')) die(ROOT.'/_manage/tempdata/mobilize_members.csv not found');
			$data=phi::loadCsvData(file_get_contents(ROOT.'/_manage/tempdata/mobilize_members.csv'));
			$map=array(
				'First Name'=>'first_name',
				'Last Name'=>'last_name',
				'Email'=>'email'
			);
			foreach ($data as $k => $v) {
				foreach ($map as $mk => $mv) {
					if($v[$mk]) $out[$k][$mv]=$v[$mk];
				}
			}
			$headers=array('first_name','last_name','email');
			$csv[]=implode(',', $headers);
			foreach ($out as $k => $v) {
				$d=array();
				foreach ($headers as $tk => $tv) {
					$d[]=$v[$tv];
				}
				$csv[]=implode(',', $d);
			}
			//add in our users!
			$l=db2::toOrderedList(db2::find(DB,'user',array()));
			foreach ($l['list'] as $k => $v) {
				$np=explode(' ', $v['name']);
				if($v['email']&&$np[0]) $csv[]=implode(',', array($np[0],$np[1],$v['email']));
			}
			die(implode(PHP_EOL,$csv));
		}
		public static function sync(){
			db2::sync(phi::$conf['dbname'],'need','dev_tom');
			die('done!');
		}
		public static function distribute(){
			include_once(ROOT.'/api/class/exchange.php');
			$sendto=db2::toOrderedList(db2::find(phi::$conf['dbname'],'page',array('distribute'=>array('$exists'=>true))));
			foreach ($sendto['list'] as $k => $v) {
				//add exchange!
				ONE_CORE::save('exchange',array(
					'to'=>array(
						'type'=>'page',
						'id'=>$v['id']
					),
					'seed'=>0,
					'from'=>array(
						'type'=>'page',
						'id'=>'one_boulder'//root account
					),
					'amount'=>$v['distribute']
				));
				phi::clog('Sending ['.$v['distribute'].'] points to ['.$v['name'].'] domain');
				phi::log('Sending ['.$v['distribute'].'] points to ['.$v['name'].'] domain');//keep visible log here so we can track multiple sends!
				EXCHANGE::recalcBalancForId($v['id']);
			}
			EXCHANGE::recalcBalancForId('one_boulder');
			phi::clog('Success!');
		}
		public static function reclacBalanceForId(){
			include_once(ROOT.'/api/class/exchange.php');
			$c=EXCHANGE::recalcBalancForId(self::$force);
			phi::clog(json_encode($c,JSON_PRETTY_PRINT));
			phi::clog('done!');
		}
		public static function reclacBalance(){
			//iterate over all current
			include_once(ROOT.'/api/class/exchange.php');
			$balances=db2::toOrderedList(db2::find(phi::$conf['dbname'],'points',array()));
			$info['sent']=0;
			$info['received']=0;
			$info['balance']=0;
			foreach ($balances['order'] as $k => $v) {
				$balance=$balances['list'][$v];
				$c=EXCHANGE::recalcBalancForId($balance['id']);
				if(!isset($c['error'])){
					$info['sent']+=$c['sent'];
					$info['received']+=$c['received'];
					$info['balance']+=$c['balance'];
				}else{
					phi::clog($balance['id'].' '.json_encode($c));
				}
			}
			if(self::$force==1) die(json_encode($info));
			return $info;
		}
		public static function importZone(){
			$content=phi::loadCsvData(file_get_contents(ROOT.'/_manage/zone.csv'),',',false,1);
			foreach ($content as $k => $v) {
				$update[]=array(array('id'=>$v['id']),array('$set'=>$v),array('upsert'=>true));
			}
			db2::bulkUpdate(DB,'timezone',$update);
			phi::clog('updated ['.sizeof($update).'] records',1);
		}
		public static function importusers(){
			include_once(ROOT.'/api/uploader.php');
			include_once(ROOT.'/api/class/exchange.php');
			if(!is_file(ROOT.'/_manage/tempdata/one.csv')) die(ROOT.'/_manage/tempdata/one.csv not found');
			$data=phi::loadCsvData(file_get_contents(ROOT.'/_manage/tempdata/one.csv'));
			#die(json_encode($data));
			$saved=0;
			if(self::$force==1){
				db2::remove(phi::$conf['dbname'],'user',array(),array('multi'=>true));
				db2::remove(phi::$conf['dbname'],'user_map',array(),array('multi'=>true));
				db2::remove(phi::$conf['dbname'],'exchange',array(),array('multi'=>true));
				db2::remove(phi::$conf['dbname'],'point',array(),array('multi'=>true));
				phi::clog('drop collections');
			}
			if(self::$force==2){
				db2::remove(phi::$conf['dbname'],'points',array(),array('multi'=>true));
				db2::remove(phi::$conf['dbname'],'exchange',array('from.id'=>'one_earth'),array('multi'=>true));
				db2::remove(phi::$conf['dbname'],'exchange',array('to.id'=>'one_earth'),array('multi'=>true));
				db2::remove(phi::$conf['dbname'],'exchange',array('seed'=>1),array('multi'=>true));
				db2::remove(phi::$conf['dbname'],'exchange',array('seed'=>1),array('multi'=>true));
			}
			$total['received']=0;
			$total['given']=0;
			foreach ($data as $k => $user) {
				if(isset($save)) unset($save);
				#phi::clog($u);
				foreach ($user as $tk => $tv) {
					switch($tk){
						case 'email':
							$tv=str_replace('"', '',strtolower(trim($tv)));
						break;
						case 'phone':
							if($tv) $tv=array(
								'code'=>'1',
								'number'=>substr($tv, 1),
								'iso2'=>'us'
							);
						break;
						case 'domains':
							if($tv) $tv=explode(';', $tv);
						break;
						case 'id':
							$keep=array('one_boulder','one_riverside','the_stand');
							if(in_array($tv, $keep)){
								//$tv=$current['id'];
							}else{
								$current=db2::findOne(phi::$conf['dbname'],'user_map',array('_id'=>$tv));
								if($user['email']=='tbassett44@gmail.com'){
									$tv='UIAMPLAYER1';
								}else if($current){
									$tv=$current['id'];
								}else{
									$tv=db2::niceGUID(array(
										'len'=>11,
										'pre'=>'U',
										'unique'=>array('collection'=>phi::$conf['dbname'],'table'=>'user','field'=>'id')
									));
								}
							}
						break;
					}
					if($tv) $save[$tk]=$tv;
				}
				//save
				if(self::$force!=2){
					if(isset($save['email'])){
						#phi::clog(json_encode($save));
						ONE_CORE::update('user',array('id'=>$save['id']),$save);
						db2::update(phi::$conf['dbname'],'user_map',array('_id'=>$user['id']),array('$set'=>array('id'=>$save['id'])),array('upsert'=>true));
						//do point transactions!
						$saved++;
					}
				}else{
					phi::clog('skipping user import!');
				}
				if($save['received']) $r=ONE_CORE::save('exchange',array(
					'to'=>array(
						'type'=>($save['id'][0]=='U')?'user':'page',
						'id'=>$save['id']
					),
					'from'=>array(
						'type'=>'page',
						'id'=>'one_boulder'
					),
					'seed'=>1,
					'amount'=>$save['received']
				));
				if($save['given']) ONE_CORE::save('exchange',array(
					'from'=>array(
						'type'=>($save['id'][0]=='U')?'user':'page',
						'id'=>$save['id']
					),
					'to'=>array(
						'type'=>'page',
						'id'=>'one_boulder'
					),
					'seed'=>1,
					'amount'=>$save['given']
				));
				if($save['given']||$save['received']){
					EXCHANGE::recalcBalancForId($save['id']);
				}
				if(isset($save['given'])&&$save['given']) $total['given']+=(int) $save['given'];
				if(isset($save['received'])&&$save['received']) $total['received']+=(int) $save['received'];
			}
			$info=self::reclacBalance();
			//balance things!
			ONE_CORE::save('exchange',array(
				'to'=>array(
					'type'=>'page',
					'id'=>'one_boulder'
				),
				'seed'=>1,
				'amount'=>-$info['balance']
			));
			// $info=self::reclacBalance();
			// ONE_CORE::save('exchange',array(
			// 	'to'=>array(
			// 		'type'=>'page',
			// 		'id'=>'one_boulder'
			// 	),
			// 	'from'=>array(
			// 		'type'=>'page',
			// 		'id'=>'one_earth'
			// 	),
			// 	'seed'=>1,
			// 	'amount'=>50000
			// ));
			//EXCHANGE::recalcBalancForId('one_boulder');
			//EXCHANGE::recalcBalancForId('one_earth');
			$info=self::reclacBalance();
			//die(json_encode($info));
			//balance the exchange!
			//EXCHANGE::recalcBalancForId('one_boulder');
			//$total['balance']=$total['given']-$total['received'];
			die(json_encode($info));
			phi::clog('updated '.$saved);
		}
		public static function importusers2(){
			include_once(ROOT.'/api/uploader.php');
			if(!is_file(ROOT.'/_manage/tempdata/one.json')) die(ROOT.'/_manage/tempdata/one.json not found');
			$users=json_decode(file_get_contents(ROOT.'/_manage/tempdata/one.json'),1);
			$saved=0;
			if(self::$force){
				db2::remove(phi::$conf['dbname'],'user',array(),array('multi'=>true));
				db2::remove(phi::$conf['dbname'],'user_map',array(),array('multi'=>true));
				phi::clog('drop collections');
			}
			foreach ($users as $k => $u) {
				//fields to save
				if(!isset($u['fields']['emails'][0]['address'])){
					phi::clog('no email for id ['.$u['id'].']');
					continue;
				}
				$email=$u['fields']['emails'][0]['address'];
				if($email=='repjackson@gmail.com'||$u['id']=='YFPxjXCgjhMYEPADS'||$u['id']=='f2XWHmABPuXL6DfwQ'||$u['id']=='7rYT6XYsbgtn9nbp9'||$u['id']=='RHgHGGRHYtwM63X7r'||$u['id']=='Da5yfvqk8ZQbQfyLk') continue;//skip e2 and one|/farmstand page/one|tech collective riverside
				$current=db2::findOne(phi::$conf['dbname'],'user_map',array('_id'=>$u['id']));
				if($current){
					$id=$current['id'];
				}else{
					$id=db2::niceGUID(array(
						'len'=>11,
						'pre'=>'U',
						'unique'=>array('collection'=>phi::$conf['dbname'],'table'=>'user','field'=>'id')
					));
				}
				if($email=='tbassett44@gmail.com'){
					$id='UIAMPLAYER1';
				}
				$user=array(
					'id'=>$id,
					'email'=>trim(strtolower($email)),
					'name'=>$u['fields']['first_name'].' '.$u['fields']['last_name']
				);
				if(isset($u['fields']['profile_image_id'])){
					$pic_url='https://res.cloudinary.com/facet/image/upload/c_fill,g_face,h_500,w_500/'.$u['fields']['profile_image_id'];
					$r=array(
						'qs'=>array(
							'url'=>$pic_url,
							'sizes'=>array('small','full'),
							'path'=>'/img/'
						)

					);
					phi::clog('saving image');
					$user['pic']=phi::keepFields(upload::uploadImage($r),array('path','ext','ar'));
				}
				phi::clog('SAVE: '.json_encode($user));
				db2::update(phi::$conf['dbname'],'user',array('id'=>$user['id']),array('$set'=>$user),array('upsert'=>true));
				db2::update(phi::$conf['dbname'],'user_map',array('_id'=>$u['id']),array('$set'=>array('id'=>$id)),array('upsert'=>true));
				$saved++;
			}
		}
		public static function backup(){
			if(strpos(phi::$conf['db'][phi::$conf['env']]['connection_string'],'localhost')!==false){//transitioning to localhost DB
				exec('mongodump --host localhost --db one --forceTableScan -o /tmp/dump/one');
			}else{
				exec('mongodump --uri '. phi::$conf['db'][phi::$conf['env']]['connection_string'].' --ssl --username '.phi::$conf['db'][phi::$conf['env']]['username'].' --password '.phi::$conf['db'][phi::$conf['env']]['password'].' --authenticationDatabase admin --db one --forceTableScan -o /tmp/dump/one');
			}
			//exec('mongodump --uri '. phi::$conf['db'][phi::$conf['env']]['connection_string'].' --ssl --username '.phi::$conf['db'][phi::$conf['env']]['username'].' --password '.phi::$conf['db'][phi::$conf['env']]['password'].' --authenticationDatabase admin --db one --forceTableScan -o /tmp/dump/one');
			//exec('backupdb2');
			//archive and upload!
			phi::clog('===> creating .tar',1);
			exec('tar -cvf /tmp/dump/one.tar /tmp/dump/one');
			// //upload!
			//exec('cp /tmp/dump/one.tar /tmp/one.tar');
			phi::clog('===> encrypting...',1);
			phi::encryptFile('/tmp/dump/one.tar','/tmp/dump/one.tar.enc');

			// phi::clog('===> decrypting...',1);//testing only
			// phi::decryptFile('/tmp/dump/one.tar.enc','/tmp/dump/one.tar.dec');


			//file_put_contents('/tmp/encrypted', $data);
			$s3=phi::getS3();
			$name=date('Y-m-d~H:i');
			$path='backup/'.phi::$conf['env'].'/'.$name.'.tar.enc';
			phi::$vars['t']=filesize('/tmp/dump/one.tar.enc');
			phi::$vars['total']=0;
			$uploader = new Aws\S3\MultipartUploader(phi::getS3(), '/tmp/dump/one.tar.enc', [
			    'bucket' => 'one-light',
			    'key'    =>$path,
			     'params' => [
			        '@http' => [
			            'progress' => function ($expectedDl, $dl, $expectedUl, $ul) {
			            	phi::$vars['total']+=($expectedUl/1000);
			            	$p=round((phi::$vars['total']/phi::$vars['t'])*100.2);
			            	if($p>100) phi::clog('100%...finalizing...',2);
			                else phi::clog($p.'% completed',2);
			            }
			        ]
			    ]
			]);
			phi::clog('===> uploading...',1);
			try {
			    $result = $uploader->upload();
			} catch (MultipartUploadException $e) {
			    phi::clog('erorr: '.$e->getMessage());
			    return false;
			}
			// Perform the upload.
			try {
			    $result = $uploader->upload();
			    phi::clog("Upload complete: {$result['ObjectURL']}",1);
			} catch (MultipartUploadException $e) {
			    phi::clog($e->getMessage(),1);
			    return false;
			}
			$save=array('url'=>'https://s3.amazonaws.com/one-light'.$path,'path'=>$path,'size'=>phi::$vars['t']);
			db2::save(phi::$conf['dbname'],'backup',$save);
			phi::clog('url: https://s3.amazonaws.com/one-light'.$path,1);
			phi::clog('path: '.$path,1);
			exec('rm -rf /tmp/dump');
		}
		public static function restore(){
			$s3=phi::getS3();
			chdir('/tmp');
			if(isset($_SERVER["argv"][2])&&$_SERVER["argv"][2]!="false"){
				$path=$_SERVER["argv"][2];
			}else{
				$backups=db2::toOrderedList(db2::find(phi::$conf['dbname'],'backup',array(),array('sort'=>array('_id'=>-1),'limit'=>1)));
				$closest=$backups['list'][$backups['order'][0]];
				$path=$closest['path'];
			}
			// //get FS
			// // HEAD object
			$headersObj = phi::getS3()->headObject(array(
			  "Bucket" => "one-light",
			  "Key" => $path
			));
			$headers=$headersObj->toArray();
			$filesize=(int) $headers['ContentLength'];
			phi::clog('===> downloading ['.$path.']...',1);//testing only
			if(strpos($path, '.enc')!==false){//new way of decrypting
				$sb=0;
				$batch=5000000;//bytes
				$downloading=true;
				$dest='/tmp/one_restore.enc';
				$fp = fopen($dest, 'w');
				$c=0;
				while($downloading){
					$eb=$sb+$batch; 
					// if($eb>$filesize){
					// 	$eb=$filesize;
					// }
					//phi::clog('Range '.'bytes='.$sb.'-'.$eb.' ' .$filesize,1);
					$result = $s3->getObject(array(
					    'Bucket'                     => 'one-light',
					    'Key'                        => $path,
					    'Range'						 =>	'bytes='.$sb.'-'.$eb,
					    'ResponseContentType'        => 'text/plain',
					    'ResponseContentLanguage'    => 'en-US',
					    'ResponseCacheControl'       => 'No-cache',
					));
					if($eb>=$filesize){
						$downloading=false;
					}
					$p=round(($eb/$filesize*100),2);
					if($p<100) phi::clog('Progress '.$p.'%',2);
					if($result['Body']){
						fwrite($fp, $result['Body']);
					}else{
						die('error downloading!');
					}
					$sb=$eb+1;
				}
				fclose($fp);
				phi::clog('Progress 100%',1);
			}else{
				$result = $s3->getObject(array(
				    'Bucket'                     => 'one-light',
				    'Key'                        => $path,
				    'ResponseContentType'        => 'text/plain',
				    'ResponseContentLanguage'    => 'en-US',
				    'ResponseCacheControl'       => 'No-cache',
				));
			}
			$decrypted='/tmp/one.tar';
			$uncompressed='/tmp/one';
			if(strpos($path, '.enc')!==false){//new way of decrypting
				phi::clog('===> decrypting...',1);//testing only
				phi::decryptFile($dest,$decrypted);
			}else{
				file_put_contents($decrypted, phi::aesDecryptFile($result['Body']));
			}
			//file_put_contents($decrypted, phi::aesDecryptFile($encrypted));
			//die('tar -xvf '.$decrypted);
			mkdir($uncompressed);
			phi::clog('====> Decompressing....this may take a few minutes',1);
			exec('tar -xvf '.$decrypted.' -C '.$uncompressed);
			//die(var_dump($result));
			if(self::$force2=="false"){
				phi::clog('===>not restoring...');
				die();
			}
 			chdir('/tmp/one/tmp');
 			if(self::$force2){
 				$exec='mongorestore --host localhost --dir /tmp/one/tmp/dump/one --nsInclude one.'.self::$force2;
 			}else if(strpos(phi::$conf['db'][phi::$conf['env']]['connection_string'], 'localhost')!==false){
				$exec='mongorestore --drop --host localhost --dir dump/one';
			}else{	
				$exec='mongorestore --drop --uri '.phi::$conf['db'][phi::$conf['env']]['connection_string'].' --ssl --username '.phi::$conf['db'][phi::$conf['env']]['username'].' --password '.phi::$conf['db'][phi::$conf['env']]['password'].' --authenticationDatabase admin';
			}

			// $exec='mongorestore --drop --uri '.phi::$conf['db'][phi::$conf['env']]['connection_string'].' --ssl --username '.phi::$conf['db'][phi::$conf['env']]['username'].' --password '.phi::$conf['db'][phi::$conf['env']]['password'].' --authenticationDatabase admin --dir dump/one';
			phi::clog('====> Restoring ['.$exec.']',1);
			die();
			exec($exec);
			phi::clog('Complete!',1);
		}
		public static function savevideo($url,$debug=false){
			$hash='video_'.md5($url).'_'.time();
			//ensure home is root directory, this is who is running ipfs daemon
			putenv("HOME=/mnt/groupup");
			//ensure proper permissions...
			//ps aux | grep ipfs
			if(!is_dir('/mnt/groupup/tmp/'.$hash)) exec('mkdir -p /mnt/groupup/tmp/'.$hash);
			$exec='youtube-dl -o /mnt/groupup/tmp/'.$hash.'/video.mp4 --write-thumbnail --write-info-json '.escapeshellarg($url);
			if($debug) passthru($exec);
			else exec($exec,$res);
			//create manifest!
			$files=phi::getFiles('/mnt/groupup/tmp/'.$hash);
			$posterformats=array('.jpg','.jpeg','.png');
			$videoformats=array('.mp4','.mp4.webm','.mkv');
			foreach ($files['files'] as $k => $v) {
				foreach ($posterformats as $tk => $tv) {
					if(strpos($v, $tv)!==false){
						$vd=explode('/', $v);
						$metadata['poster']=$vd[sizeof($vd)-1];
					}
				}
				foreach ($videoformats as $tk => $tv) {
					if(strpos($v, $tv)!==false){
						$vd=explode('/', $v);
						$metadata['video']=$vd[sizeof($vd)-1];
					}
				}
			}
			$json=json_decode(file_get_contents('/mnt/groupup/tmp/'.$hash.'/video.info.json'),1);
			$metadata['title']=isset($json['title'])?$json['title']:'';
			$metadata['description']=isset($json['description'])?$json['description']:'';
			$metadata['duration']=isset($json['duration'])?$json['duration']:'';
			exec('rm -f /mnt/groupup/tmp/'.$hash.'/video.info.json');
			if(!is_file('/mnt/groupup/tmp/'.$hash.'/video.jpg')){
				//exec('cp /var/www/root/sites/groupup/img/default_poster.jpg /mnt/groupup/tmp/'.$hash.'/video.jpg');
				if(is_file('/mnt/groupup/tmp/'.$hash.'/'.$metadata['video'])){
					//disabled until ffmpeg gets installed!
					phi::clog('ffmpeg -i /mnt/groupup/tmp/'.$hash.'/'.$metadata['video'].' -ss 00:00:1.000 -vframes 1 /mnt/groupup/tmp/'.$hash.'/video.jpg',1);
					exec('ffmpeg -i /mnt/groupup/tmp/'.$hash.'/'.$metadata['video'].' -ss 00:00:1.000 -vframes 1 /mnt/groupup/tmp/'.$hash.'/video.jpg');
					$metadata['poster']='video.jpg';
				}else{//default image
					exec('cp /var/www/root/sites/groupup/img/default_poster.jpg /mnt/groupup/tmp/'.$hash.'/video.jpg');	
					$metadata['poster']='video.jpg';
				}
			}	
			//updload to AWS for the moment!
			if(isset($metadata['video'])){//upload
				$file='/mnt/groupup/tmp/'.$hash.'/'.$metadata['video'];
				$client=phi::getS3();
				$ext=phi::mime_content_type($file,1);
				$key='/videos/'.md5_file($file).'.'.$ext;
				$metadata['aws']='https://s3-us-west-2.amazonaws.com/groot'.$key;
				$type=phi::mime_content_type($file);
				$obj=array(
				    'Bucket'     => 'groot',
				    'Key'        => $key,
				   	'Body' => file_get_contents($file),
				    'ContentType'  => $type,
				    'ACL'          => 'public-read'
				);
				phi::clog('Uploading to AWS',$debug);
				$result = $client->putObject($obj);
			}		
			file_put_contents('/mnt/groupup/tmp/'.$hash.'/metadata.json', json_encode($metadata));
			#die(json_encode($metadata));
			//create metadata file!
			phi::clog('Successfully Downloaded!!! Adding to IPFS',$debug);
			//add it to IPFS
			$exec2='ipfs add -r /mnt/groupup/tmp/'.$hash.'| tail -n1';
			//$exec2='ipfs --version';
			$result=self::run($exec2);
			$ipfs=explode(' ', $result[0]);
			$ipfs_hash=$ipfs[1];
			$run3='ipfs pin add '.$ipfs_hash;
			phi::clog('Successfully added to ipfs with hash ['.$ipfs_hash.']',$debug);
			$result2=self::run($run3);
			phi::clog($result2[0],1);
			//clean up!
			if(!$debug) exec('rm -rf /mnt/groupup/tmp/'.$hash);
			return array('fsh'=>$ipfs_hash,'ts'=>time());
		}
		public static function fixParts($parts){
			foreach ($parts as $k => $v) {
				$parts[$k]=preg_replace('#\\x1b[[][^A-Za-z]*[A-Za-z]#','',$v);
			}
			return $parts;
		}
		public static function ensureForever(){
			exec('forever list',$out);
			$scripts=array(phi::$conf['root'].'/node/notifier.js',phi::$conf['root'].'/sites/chatter/chat.io.js',phi::$conf['root'].'/node/api2.js',phi::$conf['root'].'/node/watcher.js',phi::$conf['root'].'/node/cron.js',phi::$conf['root'].'/node/jobs.js',phi::$conf['root'].'/sites/webrtc/server.js');//can have multiple, //'/var/www/root/node/jobs.js'
			//phi::$conf['root'].'/node/jobs.js'
			if(!phi::$conf['prod']){
				$scripts=array(phi::$conf['root'].'/node/notifier.js',phi::$conf['root'].'/sites/chatter/chat.io.js',phi::$conf['root'].'/node/api2.js',phi::$conf['root'].'/node/watcher.js',phi::$conf['root'].'/node/jobs.js',phi::$conf['root'].'/node/cron.js',phi::$conf['root'].'/sites/webrtc/server.js');
			}
			//ensure log files
			if(!is_dir('/var/log/'.phi::$conf['project'])) mkdir('/var/log/'.phi::$conf['project']);
			$c=0;
			$activescripts=array();
			foreach ($out as $k => $row) {//get data
				$parts = preg_split('/\s+/', $row);
				$parts=self::fixParts($parts);
				if(strpos($parts[0], 'data')!==false){
					if($c==0){//first row, set up headers
						$headers=$parts;
					}else{
						foreach ($parts as $tk => $tv) {
							$data[$k][$headers[$tk]]=$tv;
							if($headers[$tk+1]=='script'){
								if(!in_array($tv, $activescripts)){
									$activescripts[]=$tv;
								}else{
									phi::alertAdmin('forever script ['.$tv.'] Running more than once!!! Auto Fixing...hopefully');
									self::runForever($tv,'stop');
									self::runForever($tv,'start');
								}
							}
						}
					}
					$c++;
				}else{
				}
			}
			//$db=phi::getDB(true,'groupup');
			foreach ($scripts as $k => $v) {
				$ft=md5_file($v);
				if(in_array($v, $activescripts)){
					#phi::clog('forever script ['.$v.'] running, file md5 ['.$ft.']',1);
					//compare
					$id=md5($v);
					//$cs=$db->admin_forever->findOne(array('_id'=>$id));
					$cs=db2::findOne(phi::$conf['dbname'],'admin_forever',array('id'=>$id));
					if(!$cs||$cs['hash']!=$ft){
						phi::clog('forever script ['.$v.'] running, but file time updated.  RESTART!',1);
						phi::alertAdmin('forever script ['.$v.'] running, but hash updated, RESTARTing automagically : )');
						self::runForever($v,'restart');
					}else{
						phi::clog('forever script ['.$v.'] running, current hash ['.$ft.']',1);
					}
				}else{
					phi::clog('forever script ['.$v.'] NOT running',1);
					phi::alertAdmin('forever script ['.$v.'] NOT running, auto starting...please check to be sure...');
					self::runForever($v,'start');
				}
			}
		}
		public static function runForever($file,$action){
			//$db=phi::getDB(true,'groupup');
			$hash=md5_file($file);
			$id=md5($file);
			switch ($action) {
				case 'restart':
					phi::clog('forever restart '.$file,1);
					exec('forever restart '.$file);
				break;
				case 'start':
					phi::clog('forever start '.$file,1);
					exec('forever start '.$file);
				break;
				case 'stop':
					phi::clog('forever stop '.$file,1);
					exec('forever stop '.$file);
				break;
			}
			//$db->admin_forever->save(array('_id'=>$id,'hash'=>$hash,'ts'=>time()));
			db2::update(phi::$conf['dbname'],'admin_forever',array('id'=>$id),array('$set'=>array('id'=>$id,'hash'=>$hash,'ts'=>time())),array('upsert'=>true));
		}
		public static function getTimeInfo($tz='America/Denver'){
			date_default_timezone_set($tz);
			return array(
				'time'=>time(),
				'date'=>date('m/d/Y'),
				'militaryhour'=>date('G'),
				'minutes'=>date('i')
			);
		}
	}
?>