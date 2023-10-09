<?php
	date_default_timezone_set('America/Denver');
	class aws {
		public static $target='xxxxx';
		public static $id='AWS';
		public static function init($args){
			if(!is_file('/var/www/priv/config.json')) die('invalid_config');
			$conf=json_decode(file_get_contents('/var/www/priv/config.json'),1);
			include_once($conf['home'].'/'.$conf['project'].'/classes/settings.php');
			switch ($args[1]) {
				case 'updateprivate':
					self::updatePrivate();
				break;
				default:
					self::cl('Invalid method',1);
				break;
			}
		}
		public static function clearFileCaches($types,$internal=1){
			$d=self::getTargetInfo(self::$target);
			$arn=$d['TargetGroupArn'];
			$iinfo=self::getInstanceInfo($arn);
			foreach ($iinfo as $k => $v) {
				$ips[]=$v['private_ip'];
			}
			$local=phi::getLocalIp();
			#die(json_encode($local));
			foreach ($ips as $k => $v) {
				if($v!=$local){//dont do on current machine...should be up-to-date
					$url='http://'.$v.'/command/clearfilecaches';
					if(!$internal) self::cl('Sending: '.$url);
					else phi::log('Sending: '.$url);
					$opts=array('files'=>$types,'admin_token'=>phi::$conf['admin_token']);
					$d=phi::curl($url,$opts);
					if($internal) phi::log($v.': '.json_encode($d));
					else self::cl($v.': '.json_encode($d));
				}else{
					if($internal) self::cl('Local Machine, dont send!');
				}
			}
			if($internal) phi::log('clearFileCaches!',1);
			else self::cl('Done!',1);
		}
		public static function updatePrivate(){
			$d=self::getTargetInfo(self::$target);
			$arn=$d['TargetGroupArn'];
			$iinfo=self::getInstanceInfo($arn);
			foreach ($iinfo as $k => $v) {
				$ips[]=$v['private_ip'];
			}
			//zip private
			// $tname=md5(time());
			// $name='/tmp/'.$tname.'.tar.gz';
			// self::cl('compressing...');
			// exec('tar -czf '.$name.' /var/www/priv');
			// //encrypt private
			// self::cl('encyrpting...');
			// $data=phi::aesEncryptFile(file_get_contents($name));
			// //upload to S3
			// db2::update(DB,'priv',array('id'=>DB),array('$set'=>array('id'=>DB,'data'=>$data),'$inc'=>array('version'=>1)),array('upsert'=>true));
			// unset($name);
			$local=phi::getLocalIp();
			foreach ($ips as $k => $v) {
				if($v!=$local){//dont do on current machine...should be up-to-date
					$url='http://'.$v.'/command/updateprivate';
					$run='copysecrets '.$v;
					passthru($run);
					$d=phi::curl($url,array('admin_token'=>phi::$conf['admin_token']));
					self::cl($v.': '.json_encode($d));
				}
			}
			self::cl('Done!',1);
		}
		public static function getTargetInfo($name){
			phi::log('getTargetInfo:'.$name.': '.phi::getLocalIp());
			$target='/var/www/.local/bin/aws elbv2 describe-target-groups --region us-east-1';
			$json=phi::execNode($target);
			if(isset($json['TargetGroups'])){
				foreach ($json['TargetGroups'] as $k => $v) {
					if($v['TargetGroupName']==$name){
						$resp=$v;
						//phi::log('resp1 ['.microtime(true).'] -'.json_encode($resp));
					}
				}
				//phi::log('resp2 ['.microtime(true).'] -'.json_encode($resp));
				if(!isset($resp)){
					self::cl('invalid target group ['.$name.']',1);
				}
			}else{
				self::cl('invalid target group, non returned ['.$name.']',1);
			}
			return $resp;
		}
		public static function getInstanceInfo($arn){
			$health='/var/www/.local/bin/aws elbv2 describe-target-health --region us-east-1 --target-group-arn '.$arn;
			$json=phi::execNode($health);
			foreach ($json['TargetHealthDescriptions'] as $k => $v) {
				$instance='/var/www/.local/bin/aws ec2 describe-instances --region us-east-1 --instance-ids '.$v['Target']['Id'];
				$ijson=phi::execNode($instance);
				$d=$ijson['Reservations'][0]['Instances'][0];
				$out[$d['InstanceId']]=array(
					'id'=>$d['InstanceId'],
					'private_ip'=>$d['PrivateIpAddress'],
					'public_ip'=>$d['PublicIpAddress']
				);
			}
			return $out;
		}
		public static function cl($txt,$die=false,$plain=false){
	        if($plain){
	            echo $txt;
	        }else{
	            if(self::$id) $txt="\033[0;32m".'['.self::$id.']'."\033[0m".' '.$txt;
	            echo $txt."\r\n";
	        }
	        if($die) die();
	    }
	}
	if(isset($argv)){//command line
		aws::init($argv);
	}
?>