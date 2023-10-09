<?php
	class push{
		public static function handleRequest($r){
			switch ($r['path'][4]){
				case "registerpush":
	    			$out=push::register($r);
			    break;
			    case "subscribepush":
			    	$out=push::subscribe($r['qs']['did'],$r['qs']['app_identifier'],phi::$conf['dbname']);
			    break;
			    case "unsubscribepush":
			    	$out=push::unsubscribe($r['qs']['did'],$r['qs']['app_identifier'],phi::$conf['dbname']);
			    break;
			}
			return $out;
		}
	    public static function register($r){
	    	if(isset($r['qs']['regid'])){
				//phi::log('Register Push');
	    		$did=$r['qs']['regid'];
				$sns=push::getSNS();
				$device=db2::findOne(phi::$conf['dbname'],'device',array('id'=>$did));
				if(!isset($r['qs']['app_identifier'])) return array('error'=>'no_identifier_passed');
				if(!isset($r['qs']['version'])){
					if(!$device||!isset($device['arn'])||true){ //alaways make sure it exists/is updated
						try{
							if(isset($r['qs']['android'])&&$r['qs']['android']){ //android
								$platform=self::getSnsPlatform($r['qs']['app_identifier'],'android');
								$result = $sns->createPlatformEndpoint(array(
								    // PlatformApplicationArn is required
								    'PlatformApplicationArn' => phi::$conf['aws']['platform'].'app/'.$platform,
								    // Token is required
								    'Token' => $did
								));
							}else{ //ios
								if(isset($r['qs']['sandbox'])&&(int) $r['qs']['sandbox']){
									$platform=self::getSnsPlatform($r['qs']['app_identifier'],'ios_sandbox');
								}else{
									$platform=self::getSnsPlatform($r['qs']['app_identifier'],'ios');
								}
								//phi::log($r['qs']['app_identifier'].' ' .phi::$conf['aws']['platform'].'app/'.$platform);
								$result = $sns->createPlatformEndpoint(array(
								    // PlatformApplicationArn is required
								    'PlatformApplicationArn' => phi::$conf['aws']['platform'].'app/'.$platform,
								    // Token is required
								    'Token' => $did
								));
							}
						}catch (Exception $e) {
							$devicetype=(isset($r['qs']['android'])&&$r['qs']['android'])?'Android':'iOS';
							phi::log('Error Registering ['.$devicetype.'] Device Token ['.$did.'] for app ['.$r['qs']['app_identifier'].'] message: '.$e->getMessage(),'push');
							return array('error'=>'Could Not Register','message'=>$e->getMessage());
						}
						$TargetArn=$result->get('EndpointArn');
						$d=explode('/',$TargetArn);
						//remove if registered to another 
						//$set=array('$set'=>array('arn'=>$d[sizeof($d)-1],'la'=>time(),'a'=>$r['qs']['android']));
						if(phi::$conf['env']!='prod') $set['$set']['dev']="1";
						//first time creating, register for app's topic
						$device=array(
							'id'=>$did,
							'uid'=>$r['auth']['uid'],
							'arn'=>$d[sizeof($d)-1],
							'created'=>time(),
							'app_identifier'=>$r['qs']['app_identifier'],
							'la'=>time()
						);
						if(isset($r['qs']['sandbox'])&&(int) $r['qs']['sandbox']){
							$device['sandbox']=1;
						}else{
							$device['sandbox']=0;
						}
						if(phi::$conf['env']!='prod') $device['dev']="1";
						if(isset($r['qs']['device'])) $device['device']=$r['qs']['device'];
						if(isset($r['qs']['android'])&&$r['qs']['android']) $device['a']="1";
						db2::update(phi::$conf['dbname'],'device',array('id'=>$device['id']),array('$set'=>$device),array('upsert'=>true));
						$sub=self::subscribe($did,$r['qs']['app_identifier'],phi::$conf['dbname']);
						if(isset($sub['success'])){
							$device['topicarn']=1;
						}
					}else{
						$set=array('$set'=>array('la'=>time(),'a'=>$r['qs']['android']));
						db2::update(phi::$conf['dbname'],'device',array('id'=>$did),$set,array('upsert'=>true));
					}
				}else if($r['qs']['version']==2){
					try{
						if(isset($r['qs']['android'])&&$r['qs']['android']){ //android
							$platform=self::getSnsPlatform($r['qs']['app_identifier'],'android');
							$result = $sns->createPlatformEndpoint(array(
							    // PlatformApplicationArn is required
							    'PlatformApplicationArn' => phi::$conf['aws']['platform'].'app/'.$platform,
							    // Token is required
							    'Token' => $did
							));
						}else{ //ios
							$platform=self::getSnsPlatform($r['qs']['app_identifier'],'ios_voip');
							$result = $sns->createPlatformEndpoint(array(
							    // PlatformApplicationArn is required
							    'PlatformApplicationArn' => phi::$conf['aws']['platform'].'app/'.$platform,
							    // Token is required
							    'Token' => $did
							));
						}
					}catch (Exception $e) {
						$devicetype=(isset($r['qs']['android'])&&$r['qs']['android'])?'Android':'iOS';
						phi::log('Error Registering ['.$devicetype.'] Device Token ['.$did.'] for app ['.$r['qs']['app_identifier'].'] '.$e->getMessage(),'push');
						return array('error'=>'Could Not Register','message'=>$e->getMessage());
					}
					$TargetArn=$result->get('EndpointArn');
					$d=explode('/',$TargetArn);
					//remove if registered to another 
					//$set=array('$set'=>array('arn'=>$d[sizeof($d)-1],'la'=>time(),'a'=>$r['qs']['android']));
					if(phi::$conf['env']!='prod') $set['$set']['dev']="1";
					//first time creating, register for app's topic
					$device=array(
						'id'=>$did,
						'uid'=>$r['auth']['uid'],
						'arn'=>$d[sizeof($d)-1],
						'version'=>2,
						'created'=>time(),
						'app_identifier'=>$r['qs']['app_identifier'],
						'la'=>time()
					);
					if(phi::$conf['env']!='prod') $device['dev']="1";
					if(isset($r['qs']['device'])) $device['device']=$r['qs']['device'];
					if(isset($r['qs']['android'])&&$r['qs']['android']) $device['a']="1";
					db2::update(phi::$conf['dbname'],'device',array('id'=>$device['id']),array('$set'=>$device),array('upsert'=>true));
					//$sub=self::subscribe($did,$r['qs']['app_identifier'],phi::$conf['dbname']);
					if(isset($sub['success'])){
						$device['topicarn']=1;
					}
				}
				$out=array('success'=>true,'deviceid'=>$did,'subscribed'=>(isset($device['topicarn']))?1:0);
			}else{
				$out=array('error'=>'no device id');
			}
			return $out;
	    }
	    public static function subscribe($device_id=false,$app_identifier=false,$app=false){
	    	if(!isset($app)) return array('error'=>'no_app');
	    	if(!isset($device_id)) return array('error'=>'no_device');
	    	if(!isset($app_identifier)) return array('error'=>'no_app_identifier');
	    	$sns=push::getSNS();
	    	$ttopic=str_replace('.', '-',$app_identifier);
	    	$device=db2::findOne($app,'device',array('id'=>$device_id));
	    	if(!$device||!isset($device['arn'])) return array('error'=>'device_not_found');
			$t=db2::findOne($app,'topics',array('id'=>$ttopic));
			if(!$t||!$t['arn']){//create topic if needed
				$topic = $sns->createTopic(array(
    			    // Name is required
    			    'Name' => $ttopic
    			));
				$topicArn=$topic->get('TopicArn');
				$t=array('id'=>$ttopic,'arn'=>$topicArn);
				db2::update($app,'topic',array('id'=>$ttopic),array('$set'=>$t),array('upsert'=>true));

    		}
    		// phi::log($t);
    		// phi::log(self::getDeviceArn($device));
    		$result = $sns->subscribe(array(
			    // TopicArn is required
			    'TopicArn' => $t['arn'],
			    // Protocol is required
			    'Protocol' => 'application',
			    'Endpoint' =>self::getDeviceArn($device),
			));
			$sub=$result->get('SubscriptionArn');
			$subid=explode(':', $sub);
			$set['$set']['topicarn']=$subid[sizeof($subid)-1];
			//phi::log('set '.json_encode($set));
			db2::update($app,'device',array('id'=>$device_id),$set,array('upsert'=>true));
			return array('success'=>true);
	    }
	    public static function unsubscribe($device_id=false,$app_identifier=false,$app=false){
	    	if(!isset($app)) return array('error'=>'no_app');
	    	if(!isset($device_id)) return array('error'=>'no_device');
	    	if(!isset($app_identifier)) return array('error'=>'no_app_identifier');
	    	$sns=push::getSNS();
	    	$device=db2::findOne($app,'device',array('id'=>$device_id));
	    	if(!$device||!isset($device['arn'])) return array('error'=>'device_not_found');
	    	if(!isset($device['topicarn'])) return array('error'=>'topic_arn_not_set');
	    	$ttopic=str_replace('.', '-',$app_identifier);
	    	phi::log('unsubscribe ['.phi::$conf['aws']['platform'].$ttopic.':'.$device['topicarn'].']');
			$res=$sns->unsubscribe(array(
                // SubscriptionArn is required
                'SubscriptionArn' => phi::$conf['aws']['platform'].$ttopic.':'.$device['topicarn']
            ));
			$set['$unset']['topicarn']=1;
			db2::update($app,'device',array('id'=>$device_id),$set,array('upsert'=>true));
			return array('success'=>true);
	    }
	    public static function getSnsPlatform($app,$type){
	    	if($type=='ios') return 'APNS/'.$app.'_'.$type;
	    	if($type=='ios_sandbox') return 'APNS_SANDBOX/'.$app.'_'.$type;
	    	if($type=='ios_voip') return 'APNS_VOIP/'.$app.'_'.$type;
			if($type=='android') return 'GCM/'.$app.'_'.$type;
	    }
	    public static function getDeviceArn($device){
			$ep=phi::$conf['aws']['platform_endpoint'];
			if($device['app_identifier']){
				if($device['arn']){
					if(isset($device['a'])&&(int) $device['a']){
						$platform=self::getSNSPlatform($device['app_identifier'],'android');
					}else{
						if(isset($device['version'])&&$device['version']==2){
							$platform=self::getSNSPlatform($device['app_identifier'],'ios_voip');
						}else if(isset($device['sandbox'])&&$device['sandbox']){
							$platform=self::getSNSPlatform($device['app_identifier'],'ios_sandbox');
						}else{
							$platform=self::getSNSPlatform($device['app_identifier'],'ios');
						}
					}
					$arn=$ep.$platform.'/'.$device['arn'];
				}else{
					$arn=false;
					phi::log('no Arn');
				}
			}else{
				phi::log('no Identifier');
			}
			return $arn;
		}
	    public static function getSNS(){
	    	include_once(ROOT.'/vendor/autoload.php');
	    	return new Aws\Sns\SnsClient(array(
			    'credentials'=>phi::getAwsCreds(),
			    'region' => phi::$conf['aws']['s3_region'],
			    'version' => 'latest'
			));
	    }
	    public static function send($obj,$retry=false){
	    	if(!isset($obj['message'])) return array('error'=>'no message');
	    	if(!isset($obj['arn'])) return array('error'=>'no device arn');
	    	if(!isset($obj['messagedata'])) $obj['messagedata']=false;
	    	if(!isset($obj['intent'])) $obj['intent']=='';
    		$sns=push::getSNS();
    		try{
	    		if($obj['device']=='ios'){
		    		$result = $sns->publish(array(
					    'TargetArn' => $obj['arn'],
					    // Message is required
					    'Message' => json_encode(array(
					        'default' => $obj['message'],
					        'APNS' => json_encode(array(
					            'aps' => array(
					                'alert' => $obj['message'],
					                'badge'=>$obj['count'],
					                'sound' =>'default'
					            ),
					            'intent'=>$obj['intent'],
					            // Custom payload parameters can go here
					            'messagedata'=>$obj['messagedata']
					        ))
					    )),
					    'MessageStructure' => 'json'
					));
		    	}else{
		    		$result = $sns->publish(array(
					    'TargetArn' => $obj['arn'],
					    // Message is required
					    'Message' => json_encode(array(
					        'default' => $obj['message'],
					        'GCM' => json_encode(array(
					            'data' => array(
					                'message' => $obj['message'],
					                'title'=>'Test',
					                'intent' =>'default',
					                'notId'=>round(rand(0,1)*500000)
					            )
					        ))
					    )),
					    'MessageStructure' => 'json'
					));
		    	}
		    }catch(Exception $e){
		    	$msg=$e->getMessage();
		    	if($msg=='Endpoint is disabled'){
		    		$result = $sns->setEndpointAttributes(array(
					    // EndpointArn is required
					    'EndpointArn' => $obj['arn'],
					    // Attributes is required
					    'Attributes' => array(
					        // Associative array of custom 'String' key names
					        'Enabled' => 'true',
					        // ... repeated
					    )
					));
					if(!$retry) return self::send($obj,1);
					else return array('error'=>$msg);
		    	}else{
		    		return array('error'=>$msg);
		    	}
		    	die(var_dump($e));
		    }
	    	#die(var_dump($result));
			return array('success'=>true);
	    }
	    public static function sendToTopic($obj){
	    	if(!isset($obj['message'])) return array('error'=>'no message');
	    	if(!isset($obj['topic'])) return array('error'=>'no topic');
	    	if(!isset($obj['messagedata'])) $obj['messagedata']=array();
	    	if(!$obj['messagedata']['intent']) $obj['messagedata']['intent']='';
    		$sns=push::getSNS();
    		$aid=floor(rand(0,10000));
    		$result = $sns->publish(array(
			    'TopicArn' => $obj['topic'],
			    // Message is required
			    'Message' => json_encode(array(
			        'default' => $obj['message'],
			        'APNS' => json_encode(array(
			            'aps' => array(
			                'alert' => $obj['message'],
			                'badge'=>1,
			                'sound' =>'default'
			            ),
			            // Custom payload parameters can go here
			            'messagedata'=>$obj['messagedata']
			        )),
			        'GCM'=>json_encode(array(
			        	'data'=>array(
			        		'title'=>(isset($obj['title']))?$obj['title']:'',
			        		'message'=>$obj['message'],
			        		'intent'=>$obj['messagedata']['intent'],
			        		'type'=>$obj['messagedata']['type'],
			        		'notId'=>$aid,
			        		//'image'=>'https://dl.dropboxusercontent.com/u/887989/antshot.png',//this is the image that shows up in tray
			        		'soundname'=>'push_1'
			        	)
			        ))
			    )),
			    'MessageStructure' => 'json',
			));
			return array('success'=>true);
	    }
	}
?>