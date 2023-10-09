<?php
	class call{
		public static function handleRequest($r){
			switch ($r['path'][4]){
				case "register":
	    			$out=call::register($r);
			    break;
			    case "send":
			    	$out=call::send($r);
			    break;
			}
			return $out;
		}
	    public static function register($r){
	    	$device_token=$r['qs']['regid'];
	    	$app_identifier=$r['qs']['app_identifier'];
	    	$user=$r['auth']['uid'];
	    	// phi::log($device_token);
	    	// phi::log($app_identifier);
	    	// phi::log($user);
	    	db2::update(DB,'call_device',array('id'=>$device_token),array('$set'=>array('id'=>$device_token,'app_identifier'=>$app_identifier,'uid'=>$user)),array('upsert'=>true));
	    	return array('success'=>true);
	    }
	    public static function getLocalCert(){
	    	$pemfile=phi::$conf['voip']['ios_cert'];
	    	$namep=explode('/', $pemfile);
	    	$name=$namep[sizeof($namep)-1];
	    	return '/var/www/priv/'.$name;
	    }
	    public static function send($r){
	    	//create payload!
	    	$send_to=$r['path'][5];
	    	$devices=db2::toList(db2::find(DB,'device',array('uid'=>$send_to)));
	    	if(!isset($r['qs']['name'])) $r['qs']['name']='Unknonw';
	    	//if(!$devices) return array('error'=>'no_valid_devices');
	    	//devices can be false, it will still send message to web
	    	phi::sendPush($devices,'From '.$r['qs']['name'],'',0,'','Incomming Call',array(
	    		'action'=>'call',
	    		'video'=>1,
	    		'room'=>$r['qs']['room'],
	    		'user'=>db2::findOne(DB,'user',['id'=>$r['auth']['uid']],['projection'=>['id'=>1,'name'=>1,'pic'=>1]])
	    	),$send_to);
	    	//add job to potentially end call!
	    	//add to chat
	    	include_once(phi::$conf['root'].'/sites/code/app/chat/chat.php');
	    	$message=array(
				'room'=>$r['qs']['room'],
				'by'=>$r['auth']['uid'],
				'media'=>array(
					'type'=>'call'
				)
			);
			#phi::log($message);
			chat::addMessage($message,false,1);
	    	return array('success'=>true);
	    }
	    public static function getCallDevices($uid){
	    }
	    public static function sendLocal($r){
	    	//ensure PEM is local!
	    	$send_to=$r['path'][5];
	    	$localsrc=self::getLocalCert();
	    	if(!is_file($localsrc)){//download it!
	    		$s3=phi::getS3();
	    		$namep=explode('/', $localsrc);
	    		$name=$namep[sizeof($namep)-1];
				$path='/_secrets/'.$name;
				$result = $s3->getObject(array(
				    'Bucket'                     => phi::$conf['aws']['s3_bucket'],
				    'Key'                        => $path,
				    'ResponseContentType'        => 'text/plain',
				    'ResponseContentLanguage'    => 'en-US',
				    'ResponseCacheControl'       => 'No-cache',
				));
				$contents=$result['Body'];
				file_put_contents($localsrc, $contents);
				phi::log('Successfully downloaded call cert to [server]');
	    	}
	    	$payload=array('user'=>db2::findOne(DB,'user',['id'=>$r['auth']['uid']],['projection'=>['id'=>1,'name'=>1,'pic'=>1]]));
			if(isset($r['qs']['video'])&&$r['qs']['video']) $payload['video']=1;
	    	self::callIos($r,$payload,$send_to);
	    	self::callAndroid($r,$payload,$send_to);
	    	return array('success'=>true);
	    }
	    public static function callAndroid($r,$payload,$uid){
	    	$devices=db2::toList(db2::find(DB,'device',array('uid'=>$uid,'a'=>"1")));
	    	if($devices){
	    		foreach ($devices as $k => $device) {
	    			self::sendAndroid($r,$payload,$device);	
	    		}
			}
	    }
	    public static function getSNS(){
	    	include_once(ROOT.'/vendor/autoload.php');
	    	return Aws\Sns\SnsClient(array(
			    'credentials'=>self::getAwsCreds(),
			    'region' => phi::$conf['aws']['s3_region'],
			    'version' => 'latest'
			));
	    }
	    public static function getSnsPlatform($app,$type){
	    	if($type=='ios') return 'APNS/'.$app.'_'.$type;
			if($type=='android') return 'GCM/'.$app.'_'.$type;
	    }
	    public static function getDeviceArn($device){
			$ep=phi::$conf['aws']['platform_endpoint'];
			if($device['app_identifier']){
				if($device['arn']){
					if(isset($device['a'])&&(int) $device['a']){
						$platform=self::getSNSPlatform($device['app_identifier'],'android');
					}else{
						$platform=self::getSNSPlatform($device['app_identifier'],'ios');
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
	    public static function sendAndroid($r,$payload,$device){
	    	$sns=self::getSNS();
	    	$arn=self::getDeviceArn($device);
	    	$result = $sns->publish(array(
			    'TargetArn' => $arn,
			    'Message' => json_encode(array(
			        'GCM' => json_encode(array(
			            'data' => $payload
			        ))
			    )),
			    'MessageStructure' => 'json'
			));
	    }
	    public static function sendIos($r,$payload,$deviceToken){
	    	phi::log('sending call to ios ['.$deviceToken.']');
	    	//phi::log($payload);
	    	// Put your private key's passphrase here:
			$passphrase = phi::$conf['voip']['passphrase'];
			$localsrc=self::getLocalCert();

			$ctx = stream_context_create();
			stream_context_set_option($ctx, 'ssl', 'local_cert', $localsrc);
			stream_context_set_option($ctx, 'ssl', 'passphrase', $passphrase);

			// Open a connection to the APNS server
			$fp = stream_socket_client(
			 'ssl://gateway.push.apple.com:2195', $err,
			//'ssl://gateway.sandbox.push.apple.com:2195', $err,//for testing from APNS_SANDBOX (eg loaded from xcode)
			$errstr, 60, STREAM_CLIENT_CONNECT|STREAM_CLIENT_PERSISTENT, $ctx);

			if (!$fp) return phi::log("Failed to connect: $err $errstr");

			//phi::log('Connected to APNS');
			phi::log($payload);
			// Create the payload body
			$body['aps'] = array(
				'content-available'=> 1,
				'alert' => json_encode($payload),
				'sound' => 'default'
			);

			// Encode the payload as JSON

			$payload = json_encode($body);

			// Build the binary notification
			$msg = chr(0) . pack('n', 32) . pack('H*', $deviceToken) . pack('n', strlen($payload)) . $payload;

			// Send it to the server
			$result = fwrite($fp, $msg, strlen($msg));
			// if (!$result) phi::log('Message not delivered to ['.$deviceToken.']');
			// else phi::log('Message successfully delivered');
			// Close the connection to the server
			fclose($fp);
	    }
	    public static function callIos($r,$payload,$uid){
	    	$devices=db2::toList(db2::find(DB,'call_device',array('uid'=>$uid)));
	    	//die(json_encode($devices));
	    	if($devices){
	    		foreach ($devices as $k => $v) {
	    			self::sendIos($r,$payload,$v['id']);	
	    		}
			}
	    }
	}
?>