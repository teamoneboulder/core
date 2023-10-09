<?php 
	use PHPMailer\PHPMailer\PHPMailer;
	class rawEmail{
		public static function send($obj){
			include_once(ROOT.'/classes/html2text.php');
			if(!isset($obj['app'])) $obj['app']='one';//default
			if(!isset($obj['node'])) $obj['node']=true;//default to node! Yay!
			if(!isset($obj['to'])){
				return phi::alertAdmin('Invalid To Address');
			}
			$to=$obj['to'];
			if(!isset($obj['subject'])){
				return phi::alertAdmin('Invalid subject');
			}
			$subject=$obj['subject'];
			if(!isset($obj['message'])){
				return phi::alertAdmin('Invalid message');
			}
			$message=$obj['message'];
			if(isset($obj['from'])){
				$from=$obj['from'];
			}else $from=false;
			if(isset($obj['tags'])){
				$tags=$obj['tags'];
			}else $tags=array();
			if(isset($obj['replyTo'])){
				$ReplyToAddresses=$obj['replyTo'];
			}else $ReplyToAddresses=false;
			$message=$obj['message'];
			if(NOINTERNET) return false;
			if($from) $source=$from;
			else $source='ONE|Boulder <team@oneboulder.one>';
			$onerror=$source;
			$text=Html2Text::convert($message);
			$subject=html_entity_decode(strip_tags($subject));//no html jazz in subject
			if(!phi::$conf['prod']&&!TESTMODE) return true;//dont send email in testmode
			if(!phi::$conf['prod']&&!isset($obj['force'])) $to='team@oneboulder.one';//dont send out actual emails in dev
			if(!is_array($to)) $sendto=array($to);
			else $sendto=$to;
			$tv=strtolower($sendto[0]);
			// if(strpos($tv, '@oneboulder.one')!==false){
			// 	$ep=explode('@', $tv);
			// 	$isuid=$ep[0];
			// 	if($isuid[0]=='u'&&strlen($isuid)==9){
			// 		phi::log('Disable internal email to ['.$tv.']!');
			// 		return false;
			// 	}
			// }
			//$sendto[]='tbassett44@gmail.com';//for testing node multiple emails
			$max=80;
			$subject=substr($subject, 0,$max);
			if(strlen($subject)==$max) $subject.='...';
			$subject=str_replace('\r','',$subject);
			$subject=str_replace('\n',' ',$subject);
			//$subject = trim(preg_replace('/\r\n|\r|\n|/', ' ', $subject));//remove line breaks!
			if(!phi::$conf['prod']) $subject='('.phi::$conf['env'].') '.$subject;
			#die($subject);
			$ts=time();
			//$subject='This is a long test email it should be plenty long to test';
			//create campaign if it doesnt exits!
			if(isset($obj['campaign'])){
				if(!db2::count($obj['app'],'email_campaign',array('id'=>$obj['campaign']))){//no stats yet, auto-generate
					$save=array(
						'id'=>$obj['campaign'],
						'read'=>0,
						'clicked'=>0,
						'sent'=>0
					);
					db2::save($obj['app'],'email_campaign',$save);
				}
			}
			$replyto=($ReplyToAddresses)?$ReplyToAddresses:$source;
			if(is_string($replyto)) $replyto=array($replyto);
			$mail = new PHPMailer();
			if(phi::$conf['prod']){
				foreach ($sendto as $k => $v) {
					$mail->addAddress($v,$v);
				}
			}else{
				$mail->addAddress(phi::$conf['admin_email'],'Admin');
			}
			$fp=explode('<',$obj['from']);
			$from_name=trim($fp[0]);
			$from=str_replace('>', '', $fp[1]);
			if($obj['replyTo']){
				$rt=explode('<',$obj['replyTo']);
				$reply_to_name=trim($rt[0]);
				$reply_to=str_replace('>', '', $rt[1]);
			}else{
				$reply_to='team@oneboulder.one';
				$reply_to_name='ONE|Boulder';
			}
			#phi::log('from ['.$from. '] '.$from_name. ' replyto '.$reply_to. ' '.$reply_to_name);
			$mail->setFrom($from,$from_name);
			$mail->addReplyTo($reply_to,$reply_to_name);
			$mail->Subject = $subject;
			//$mail->Subject = '=?utf-8?B?'.base64_encode($subject);
			$mail->CharSet = 'utf-8';//use encoding from recieved email;
			$mail->AltBody = $text;
			$mail->isHTML(true);
			$mail->Body = $message;
			$c=0;
			if($obj['attachments']&&sizeof($obj['attachments'])){
				foreach ($obj['attachments'] as $k => $v) {
					if($v){
						if(!is_string($v)){
							$file=$v['file'];
							if(isset($v['name'])) $name=$v['name'];
							else if(isset($name)) unset($name);
						}else{
							$file=$v;
						}
						$mime=phi::mime_content_type($file);
						$extp=explode('.', $file);
						$ext=$extp[sizeof($extp)-1];
						if(!isset($name)) $name='attachment_'.$c.'.'.$ext;
						#phi::log('add attachment: '.$file.' '.$name.' '.$mime);
						$mail->addAttachment($file,$name,'base64',$mime);
						$clear[]=$file;
						$c++;
					}
				}
			}
			$mail->preSend();
			$sendopts = [
			    'RawMessage'   => [
			        'Data' => $mail->getSentMIMEMessage()
			    ]
			];
			//phi::log($sendopts);
			$tags[]='email';
			$tosave=array(
				'tags'=>$tags,
				'type'=>'email',
				'raw'=>true,
				'opts'=>$sendopts,
				'ts'=>$ts
			);
			if(isset($obj['id'])) $tosave['id']=$obj['id'];
			if(isset($obj['campaign'])) $tosave['cid']=$obj['campaign'];
			#phi::log($tosave);
			$res=db2::save($obj['app'],'notice',$tosave);
			if(isset($clear)){
				foreach ($clear as $k => $v) {
					unlink($v);
				}
			}
		}
	}
?>