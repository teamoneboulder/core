<?php
	class upload{
		public static function handleRequest($r){
			try{
				switch ($r['path'][2]) {
					case 'image':
						switch ($r['path'][3]) {
							case 'submit':
								$out=self::uploadImage($r);
							break;
							case 'progress':
								$out=phi::uploadProgress();
							break;
						}
					break;
					case 'file':
						switch ($r['path'][3]) {
							case 'submit':
								$out=self::uploadFile($r);
							break;
							case 'remove':
								$out=self::removeFile($r);
							break;
							case 'progress':
								$out=phi::uploadProgress();
							break;
						}
					break;
					case 'audio':
						switch ($r['path'][3]) {
							case 'submit':
								$r=API::authUser($r,(isset($r['qs']['appid']))?$r['qs']['appid']:'');
								if(isset($r['auth'])||(isset($_SERVER['REQUEST_METHOD'])&&$_SERVER['REQUEST_METHOD']=='OPTIONS')){
									$out=self::uploadAudio($r);
								}else{
									return array('error'=>'invalid_auth');
								}
							break;
							case 'remove':
								$out=self::removeAudio($r);
							break;
							case 'progress':
								$out=phi::uploadProgress();
							break;
						}
					break;
					case 'video':
						switch ($r['path'][3]) {
							case 'submit':
								$r=API::authUser($r,(isset($r['qs']['appid']))?$r['qs']['appid']:'');
								if(isset($r['auth'])||(isset($_SERVER['REQUEST_METHOD'])&&$_SERVER['REQUEST_METHOD']=='OPTIONS')){
									$out=self::uploadVideo($r);
								}else{
									return array('error'=>'invalid_auth');
								}
							break;
							case 'remove':
								$out=self::removeVideo($r);
							break;
							case 'progress':
								$out=phi::uploadProgress();
							break;
						}
					break;
				}
			}catch(Exception $e){
				$out=array('error'=>$e->getMessage());
			}
			return $out;
		}
		public static function removeVideo($r){
			$id=$r['qs']['id'];
			db2::remove(DB,'file',array('_id'=>db2::toId($id)));
			return array('success'=>true);
		}
		public static function isVideoProcessing($url){
			if(db2::findOne(DB,'video_processing',array('id'=>md5($url)))) return 1;
			return 0;
		}
		public static function setVideoProcessing($url){
			$id=md5($url);
			db2::update(DB,'video_processing',array('id'=>$id),array('$set'=>array('id'=>$id)),array('upsert'=>true));
		}
		public static function clearVideoProcessing($url){
			$id=md5($url);
			db2::remove(DB,'video_processing',array('id'=>$id),array('multi'=>true));
		}
		public static function uploadAudio($r,$internal=false){
			ini_set('max_execution_time',(60*60*30));
			if(isset($r['qs']['post'])){
				$r['qs']['post']=json_decode($r['qs']['post'],1);
			}
			//phi::log($r['qs']);
			include_once(ROOT.'/classes/Uploader.php');
			include_once(ROOT.'/classes/Uploader_cors.php');
			if(!$internal){
				$request_body = file_get_contents('php://input');
				if($request_body){
					parse_str(urldecode($request_body),$out);
					foreach ($out as $k => $v) {
						$r['qs'][$k]=$v;
					}
				}
			}
			//phi::log($r['qs']);
			$video_url='';
			$allowed=array('mp3','m4a','wav','base64_wav');
			if(!isset($r['qs']['format'])||!in_array($r['qs']['format'], $allowed)){
				return array('error'=>'invalid_format','format'=>$r['qs']['format']);
			}
			$r['upload']['st']=microtime(true);
			if(isset($r['qs']['base64'])){
				$name=phi::niceGUID(array(
					'len'=>7,
					'pre'=>'I'
				));
				$tmp='/tmp/'.md5(time().$name);
				$out=phi::saveBase64File($r['qs']['file'],$tmp);
				$r['upload']['src']=$out;
				$r['upload']['filename']=$name;
				$r['upload']['path']=$r['qs']['path'];
				$r['upload']['ext']=$r['qs']['format'];
			}else if($r['qs']['format']=='base64_wav'){
				$r['qs']['format']='wav';
				if(!isset($r['qs']['path'])){
					return array('error'=>'no_path_provided');
				}else $r['upload']['path']=$r['qs']['path'];
				//process upload if file upload
				$uploader = new FileUpload('file');
				$r['upload']['original_filename']=$uploader->getFileName();
				phi::log('file name: '.$r['upload']['original_filename']);
				$fp=explode('.', $r['upload']['original_filename']);
				$r['upload']['prettyname']=$fp[0];
				$dir='/tmp/';
				$uploader->newFileName = phi::niceGUID(array(
					'len'=>7,
					'pre'=>'I'
				));
				$result = $uploader->handleUpload($dir);
				if (!$result) {
				  return array(
			          'success' => false,
			          'msg' => $uploader->getErrorMsg()
			       );   
				}
				$r['upload']['filename']=$uploader->getFileName();
				$r['upload']['src']=$dir.$r['upload']['filename'];
				$b64c=file_get_contents($r['upload']['src']);
				//phi::log('data->'.$b64c);
				$bp=explode(',', $b64c);
				$c=base64_decode($bp[1]);
				file_put_contents($r['upload']['src'],$c);
		    	$r['upload']['ext']=$uploader->getExtension();
				$r['upload']['mime']=phi::mime_content_type($r['upload']['original_filename']);
			}else if(isset($r['qs']['local'])){
				if(!isset($r['qs']['path'])) $r['upload']['path']='/links/';
		    	else $r['upload']['path']=$r['qs']['path'];
				$r['upload']['src']=$r['qs']['local'];
				$r['upload']['ext']=phi::mime_content_type($r['upload']['src'],1);
				$r['upload']['mime']=phi::mime_content_type($r['upload']['src']);
			}else{
				if(!isset($r['qs']['path'])){
					return array('error'=>'no_path_provided');
				}else $r['upload']['path']=$r['qs']['path'];
				//process upload if file upload
				$uploader = new FileUpload('file');
				$r['upload']['original_filename']=$uploader->getFileName();
				$fp=explode('.', $r['upload']['original_filename']);
				$r['upload']['prettyname']=$fp[0];
				$dir='/tmp/';
				$uploader->newFileName = phi::niceGUID(array(
					'len'=>7,
					'pre'=>'I'
				));
				$result = $uploader->handleUpload($dir);
				if (!$result) {
				  return array(
			          'success' => false,
			          'msg' => $uploader->getErrorMsg()
			       );   
				}
				$r['upload']['filename']=$uploader->getFileName();
		    	$r['upload']['src']=$dir.$r['upload']['filename'];
		    	$r['upload']['ext']=$uploader->getExtension();
				$r['upload']['mime']=phi::mime_content_type($r['upload']['original_filename']);
			}
			//only accepting pdf now
			//get extension
			
			#phi::log($r['upload']);
			//$contents=file_get_contents($r['upload']['src']);
			$hash=substr(md5(md5_file($r['upload']['src']).time()),0, 14);//ensure there are never collisions
			// $convert=array('mov');
			// if(in_array($r['upload']['ext'], $convert)){
			// 	$saveto='/tmp/'.$hash.'.mp4';

				//phi::log('lENGHTH: '.$total_seconds);
			// 	$exec='ffmpeg -i '.$r['upload']['src'].' -f mp4 -vcodec libx264 -preset fast -profile:v main -acodec aac '.$saveto.' -hide_banner';
			// 	phi::log('Converting Video! ['.$exec.']');
			// 	exec($exec);
			// 	unlink($r['upload']['src']);
			// 	$r['upload']['src']=$saveto;
			// 	$r['upload']['ext']='mp4';
			// 	$r['upload']['mime']=phi::mime_content_type($r['upload']['src']);
			// }
			//save it
			switch($r['qs']['format']){
				case 'mp3':
					$r['upload']['mime']='audio/mp3';
				break;
				case 'm4a':
					$r['upload']['mime']='audio/m4a';
				break;
				case 'wav':
					$r['upload']['mime']='audio/wav';
				break;
			}
			$client=phi::getS3();
			$r['upload']['bucket']=phi::$conf['aws']['s3_bucket'];
			$name='full';
			if($r['upload']['path'][0]=='/'){//trim, path must start with no slash
				$r['upload']['path']=substr($r['upload']['path'], 1,strlen($r['upload']['path']));
			}
			phi::log('uploading audio -'.json_encode($r['upload']));
			$result = $client->putObject(array(
			    'Bucket'     => $r['upload']['bucket'],
			    'Key'        => $r['upload']['path'].$hash.'/'.$name.'.'.$r['upload']['ext'],
			    //'Body' => $contents,
			    'SourceFile'=>$r['upload']['src'],
			    'ContentType'  => $r['upload']['mime'],
			    'ACL'          => 'public-read',
			));
			$r['upload']['path']='/'.$r['upload']['path'];
			//get length!
			$time = exec("ffmpeg -i " . escapeshellarg($r['upload']['src']) . " 2>&1 | grep 'Duration' | cut -d ' ' -f 4 | sed s/,//");
			list($hms, $milli) = explode('.', $time);
			list($hours, $minutes, $seconds) = explode(':', $hms);
			$total_seconds = ($hours * 3600) + ($minutes * 60) + $seconds;
			$d=array(
				'path'=>$r['upload']['path'].$hash,
				'ext'=>$r['upload']['ext'],
				'duration'=>$total_seconds
			);
			//process audio waveform info!
			#phi::log('successful audio upload: '.json_encode($d));
			if(isset($r['qs']['post'])){
				switch($r['qs']['post']['type']){
					case 'post':
						$data=$r['qs']['post']['data'];
						//add video info!
						$data['media']['type']='audio';
						$data['media']['data']=$d;
						//submit!
						#phi::log('save - '.json_encode($data));
						#include_once(ROOT.'/sites/code/app/feed/feed.php');
						//include_once(ROOT.'/sites/nectar/api.php');
						$resp=feed::updatePost(array(
							'auth'=>$r['auth'],
							'qs'=>array(
								'post'=>$data,
								'context'=>(isset($r['qs']['context']))?$r['qs']['context']:''
							)
						));
						phi::log('video post resp - '.json_encode($resp));
						if(isset($resp['success'])){//notify user who posted!
							// NECTAR::notify(DB,$r['auth']['uid'],'audio_upload',array(
							// 	'post_id'=>$resp['post_id']
							// ));
						}
					break;
					case 'chat':
						$data=$r['qs']['post']['data'];
						//add video info!
						$data['media']['type']='audio';
						$data['media']['data']=$d;
						include_once(ROOT.'/api/class/chat.php');
						include_once(ROOT.'/sites/one_core/one_core.api');
						$resp=chat::addMessage($data);
						phi::log('chat post resp - '.json_encode($resp));
						if(isset($resp['_id'])){//notify user who posted!
							// NECTAR::notify('one',$r['auth']['uid'],'audio_upload_chat',array(
							// 	'room'=>$data['room']
							// ));
						}
					break;
					default:
						phi::log('invalid upload action');
					break;
				}
			}
			$r['upload']['et']=microtime(true);
			#phi::log('Video process time ['.($r['upload']['et']-$r['upload']['st']).'ms '.(($r['upload']['et']-$r['upload']['st'])/1000).'s]');
			phi::log('uploading audio response -'.json_encode(array(
				'success'=>true,
				'url'=>'https://wearenectar.s3.dualstack.us-east-1.amazonaws.com'.$r['upload']['path'].$hash.'/'.$name.'.'.$r['upload']['ext'],
				'ext'=>$r['upload']['ext'],
				//'length'=>$r['upload']['length'],
				'path'=>$r['upload']['path'].$hash
			)));
			return array(
				'success'=>true,
				'url'=>'https://wearenectar.s3.dualstack.us-east-1.amazonaws.com'.$r['upload']['path'].$hash.'/'.$name.'.'.$r['upload']['ext'],
				'ext'=>$r['upload']['ext'],
				//'length'=>$r['upload']['length'],
				'path'=>$r['upload']['path'].$hash
			);
		}
		public static function uploadVideo($r,$internal=false){
			ini_set('max_execution_time',(60*60*30));
			if(isset($r['qs']['post'])){
				$r['qs']['post']=json_decode($r['qs']['post'],1);
			}
			#phi::log($r['qs']);
			include_once(ROOT.'/classes/Uploader.php');
			include_once(ROOT.'/classes/Uploader_cors.php');
			if(!$internal){
				$request_body = file_get_contents('php://input');
				if($request_body){
					parse_str(urldecode($request_body),$out);
					foreach ($out as $k => $v) {
						$r['qs'][$k]=$v;
					}
				}
			}
			$video_url='';
			$r['upload']['st']=microtime(true);
			$folderdir=false;
			if(isset($r['qs']['local'])){
				if(!isset($r['qs']['path'])) $r['upload']['path']='/links/';
		    	else $r['upload']['path']=$r['qs']['path'];
				$r['upload']['src']=$r['qs']['local'];
				$r['upload']['ext']=phi::mime_content_type($r['upload']['src'],1);
				$r['upload']['mime']=phi::mime_content_type($r['upload']['src']);
			}else if(isset($r['qs']['url'])){
				$debug=false;
				$video_url=$r['qs']['url'];
				if(self::isVideoProcessing($video_url)&&!isset($r['qs']['force'])){
					return array('error'=>'already_processing');
				}
				self::setVideoProcessing($r['qs']['url']);
				$filename = md5(date('YmdHis')).'.jpg';
				$hash='video_'.md5($r['qs']['url']).'_'.time();
				$folderdir=$dir='/tmp/'.$hash;
				$file = $dir.$filename;
				if(!is_dir($dir)) mkdir($dir);
				//-f 22 
				$exec='/usr/local/bin/youtube-dl -o '.$dir.'/video.mp4 --write-thumbnail --write-info-json '.escapeshellarg($r['qs']['url']);
				if($debug) passthru($exec);
				else exec($exec,$res);
				$tres=implode('', $res);
				$files=phi::getFiles($dir);
				if(!isset($files['files'])||!sizeof($files['files'])){
					self::clearVideoProcessing($video_url);
					return array('error'=>'unable_to_download');
				}
				$posterformats=array('.jpg','.jpeg','.png');
				$videoformats=array('.mp4','.mp4.webm','.mkv');
				if(!$files['files']) return array('error'=>'Could not download video');
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
				if(!isset($metadata['video'])){
					self::clearVideoProcessing($video_url);
					return array('error'=>'invalid_video_source');
				}
				$r['upload']['prettyname']='Uploaded via URL';
				$r['upload']['src']=$dir.'/'.$metadata['video'];
				$r['upload']['path']=$r['qs']['path'];
				$r['upload']['ext']=phi::mime_content_type($r['upload']['src'],1);
				$r['upload']['mime']=phi::mime_content_type($r['upload']['src']);
				$mid=db2::getId($r['qs']['url'],'images');
			}else{
				if(!isset($r['qs']['path'])){
					return array('error'=>'no_path_provided');
				}else $r['upload']['path']=$r['qs']['path'];
				//process upload if file upload
				$uploader = new FileUpload('file');
				$r['upload']['original_filename']=$uploader->getFileName();
				$fp=explode('.', $r['upload']['original_filename']);
				$r['upload']['prettyname']=$fp[0];
				$dir='/tmp/';
				$uploader->newFileName = phi::niceGUID(array(
					'len'=>7,
					'pre'=>'I'
				));
				$result = $uploader->handleUpload($dir);
				if (!$result) {
				  return array(
			          'success' => false,
			          'msg' => $uploader->getErrorMsg()
			       );   
				}
				$r['upload']['filename']=$uploader->getFileName();
		    	$r['upload']['src']=$dir.$r['upload']['filename'];
		    	$r['upload']['ext']=$uploader->getExtension();
				$r['upload']['mime']=phi::mime_content_type($r['upload']['original_filename']);
			}
			//only accepting pdf now
			//get extension
			
			#phi::log($r['upload']);
			//$contents=file_get_contents($r['upload']['src']);
			$hash=substr(md5(md5_file($r['upload']['src']).time()),0, 14);//ensure there are never collisions
			$convert=array('mov');
			if(false&&in_array($r['upload']['ext'], $convert)){
				$saveto='/tmp/'.$hash.'.mp4';
				//$exec='ffmpeg -i '.$r['upload']['src'].' '.$saveto.' -hide_banner';//simple
				$exec='ffmpeg -i '.$r['upload']['src'].' -f mp4 -vcodec libx264 -preset fast -profile:v main -acodec aac '.$saveto.' -hide_banner';
				phi::log('Converting Video! ['.$exec.']');
				exec($exec);
				unlink($r['upload']['src']);
				$r['upload']['src']=$saveto;
				$r['upload']['ext']='mp4';
				$r['upload']['mime']=phi::mime_content_type($r['upload']['src']);
			}
			//save it
			$client=phi::getS3();
			$r['upload']['bucket']=phi::$conf['aws']['s3_bucket'];
			$name='media_full';
			if($r['upload']['path'][0]=='/'){//trim, path must start with no slash
				$r['upload']['path']=substr($r['upload']['path'], 1,strlen($r['upload']['path']));
			}
			phi::log('uploading video');
			$result = $client->putObject(array(
			    'Bucket'     => $r['upload']['bucket'],
			    'Key'        => $r['upload']['path'].$hash.'/'.$name.'.'.$r['upload']['ext'],
			    'SourceFile'=>$r['upload']['src'],
			    'ContentType'  => $r['upload']['mime'],
			    'ACL'          => 'public-read',
			));
			//$r['upload']['path']=$r['upload']['path'];
			if(isset($r['qs']['hook'])){
				$save=array(
					'page'=>$r['qs']['hook'],
					'name'=>$name.'.'.$r['upload']['ext'],
					'size'=>filesize($r['upload']['src'])/1024,
					'url'=>'https://wearenectar.s3.dualstack.us-east-1.amazonaws.com/'.$r['upload']['path'].$hash.'/'.$r['upload']['prettyname'].'.'.$r['upload']['ext'],
					'ts'=>time()
				);
				$res=db2::save(DB,'file',$save);
				$id=(string) $res->getInsertedId();
			}
			//if video, do processing if video!
			if(true||phi::isVideo($r['upload']['mime'])){
				include_once(phi::$conf['root'].'/_img/resizer.php');
				//get cover image and upload!
				$poster='/tmp/'.$hash.'.jpeg';
				#phi::log('ffmpeg -i '.$r['upload']['src'].' -ss 00:00:2.000 -vframes 1 '.$poster);
				exec('ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 '.$r['upload']['src'],$result);
				$resp=implode('', $result);
				$r['upload']['length']=round((float) $resp);//round to nearest seconds!
				if($r['upload']['length']>10){
					$poster_at=10;
				}else{
					$poster_at=.500;
				}
				exec('ffmpeg -i '.$r['upload']['src'].' -ss 00:00:'.$poster_at.' -vframes 1 '.$poster);
				#phi::log('Time: '.$r['upload']['length']);
				$i	= GetImageSize($poster);
				$r['upload']['ar']=phi::getImageAR($poster);//round(($i[0]/$i[1]),2);
				$r['upload']['ft']=microtime(true);
				phi::log('video process time: '.($r['upload']['ft']-$r['upload']['st']).' ms');
				$result = $client->putObject(array(
				    'Bucket'     => $r['upload']['bucket'],
				    'Key'        => $r['upload']['path'].$hash.'/full.jpeg',
				    'Body' => file_get_contents($poster),
				    'ContentType'  => phi::mime_content_type($poster),
				    'ACL'          => 'public-read',
				));
				$opts=array('width'=>600,'height'=>600);
				$poster_small=ImageResizer::render($poster,$opts,false);
				$result = $client->putObject(array(
				    'Bucket'     => $r['upload']['bucket'],
				    'Key'        => $r['upload']['path'].$hash.'/small.jpeg',
				    'Body' => file_get_contents($poster_small),
				    'ContentType'  => phi::mime_content_type($poster_small),
				    'ACL'          => 'public-read',
				));
				$size=filesize($r['upload']['src']);
				unlink($r['upload']['src']);
				if(is_file($poster)) unlink($poster);
				unset($poster_small);
				unset($poster);
				$poster=array(
					'path'=>'/'.$r['upload']['path'].$hash,
					'ext'=>'jpeg'
				);
				$d=array(
					'path'=>'/'.$r['upload']['path'].$hash,
					'ext'=>$r['upload']['ext'],
					'ar'=>$r['upload']['ar'],
					'size'=>$size,
					'poster'=>$poster
				);
				if(!isset($mid)){
					$mid=db2::getId($d,'video');
				}
				if(isset($f)&&is_file($f)) unlink($f);
				if($folderdir) phi::deleteDirectory($folderdir);
				#phi::log('process: '.json_encode($r['qs']));
				if(isset($r['qs']['data'])){
					if(is_string($r['qs']['data'])&&$r['qs']['data'][0]=='{'){
						$r['qs']['data']=json_decode($r['qs']['data'],1);
					}
					#phi::log('Got Data: '.json_encode($r['qs']));
					if(isset($r['qs']['data']['formbuilder'])){
						$fdata=[
							'current'=>$r['qs']['data']['current'],
							'schema'=>$r['qs']['data']['schema']
						];
						//save media object!
						$save=[
							'id'=>phi::niceGUID([
								"len"=>12,
			                    "pre"=>"M",
			                    "unique"=>[
			                        "collection"=>"one",
			                        "table"=>"media",
			                        "field"=>"id"
			                    ]
							]),
							'type'=>'video',
							'data'=>$d
						];
						db2::save(DB,'media',$save);
						$fdata['current']['video']=$save;
						$fdata['appid']=$r['qs']['appid'];
						$fdata['token']=$r['qs']['token'];
						include_once(ROOT.'/sites/one_core/one_core.api');
						include_once(ROOT.'/api/class/formbuilder.php');
						if(isset($r['qs']['data']['current']['temp_id'])){
							$temp=db2::findOne(DB,$r['qs']['data']['schema'],['temp_id'=>$r['qs']['data']['current']['temp_id']]);
							if($temp){
								#phi::log('temp: '.json_encode($temp));
								$fdata['current']['id']=$temp['id'];
							}else{
								phi::log('Temp ID not found');
							}
						}
						#phi::log('auth: '.json_encode($r['auth']));
						#phi::log('data: '.json_encode($fdata));
						$fr=formbuilder::save(array(
							'auth'=>$r['auth'],
							'qs'=>$fdata
						));
						phi::log('🚀🔥🛸 '.json_encode($fr));
					}
					if(isset($r['qs']['data']['type'])&&$r['qs']['data']['type']=='chat'){
						$data=$r['qs']['data']['data'];
						//add video info!
						$data['media']['type']='video';
						$data['media']['data']=$d;
						include_once(ROOT.'/api/class/chat.php');
						$resp=chat::addMessage($data);
						phi::log('chat post resp - '.json_encode($resp));
						if(isset($resp['_id'])){//notify user who posted!
						}
					}
				}
				if(isset($r['qs']['post'])){
					if(isset($r['qs']['post']['type'])){
						switch($r['qs']['post']['type']){
							case 'post':
								$data=$r['qs']['post']['data'];
								//add video info!
								$data['media']['type']='video';
								$data['media']['data']=$d;
								//submit!
								#phi::log('save - '.json_encode($data));
								#include_once(ROOT.'/sites/code/app/feed/feed.php');
								$resp=feed::updatePost(array(
									'auth'=>$r['auth'],
									'qs'=>array(
										'post'=>$data,
										'context'=>(isset($r['qs']['context']))?$r['qs']['context']:''
									)
								));
								phi::log('video post resp - '.json_encode($resp));
								if(isset($resp['success'])){//notify user who posted!

								}
							break;
							case 'chat':
								$data=$r['qs']['post']['data'];
								//add video info!
								$data['media']['type']='video';
								$data['media']['data']=$d;
								include_once(ROOT.'/api/class/chat.php');
								$resp=chat::addMessage($data);
								phi::log('chat post resp - '.json_encode($resp));
								if(isset($resp['_id'])){//notify user who posted!
								}
							break;
							default:
								phi::log('invalid upload action '.json_encode($r['qs']['post']));
							break;
						}
					}
				}
				$r['upload']['et']=microtime(true);
				#phi::log('Video process time ['.($r['upload']['et']-$r['upload']['st']).'ms '.(($r['upload']['et']-$r['upload']['st'])/1000).'s]');
				if($video_url) self::clearVideoProcessing($video_url);
				return array(
					'success'=>true,
					'url'=>'/'.$r['upload']['path'].$hash.'/file.'.$r['upload']['ext'],
					'ext'=>$r['upload']['ext'],
					'mid'=>$mid,
					'name'=>$r['upload']['prettyname'],
					'length'=>$r['upload']['length'],
					'path'=>'/'.$r['upload']['path'].$hash,
					'ar'=>$r['upload']['ar'],
					'poster'=>$poster
				);
			}else{
				$path=$r['upload']['path'].$hash.'/media_full.'.$r['upload']['ext'];
				return array(
					'success'=>true,
					'path'=>'/'.$r['upload']['path'].$hash,
					'name'=>$r['upload']['prettyname'],
					'type'=>$r['upload']['ext']
				);
			}
		}
		public static function removeFile($r){
			$id=$r['qs']['id'];
			db2::remove(DB,'file',array('_id'=>db2::toId($id)));
			return array('success'=>true);
		}
		public static function uploadFile($r){
			include_once(ROOT.'/classes/Uploader.php');
			include_once(ROOT.'/classes/Uploader_cors.php');
			$request_body = file_get_contents('php://input');
			if($request_body){
				parse_str(urldecode($request_body),$out);
				foreach ($out as $k => $v) {
					$r['qs'][$k]=$v;
				}
			}
			$r['upload']['st']=microtime(true);
			if(isset($r['qs']['local'])){
				if(!isset($r['qs']['path'])) $r['upload']['path']='/links/';
		    	else $r['upload']['path']=$r['qs']['path'];
				$r['upload']['src']=$r['qs']['local'];
				$r['upload']['ext']=phi::mime_content_type($r['upload']['src'],1);
				$r['upload']['mime']=phi::mime_content_type($r['upload']['src']);
			}else if(isset($r['qs']['url'])){
				if(!isset($r['qs']['path'])) $r['upload']['path']='/links/';
		    	else $r['upload']['path']=$r['qs']['path'];
		    	$r['upload']['filename']=$r['qs']['url'];
		    	$r['upload']['src']=$r['qs']['url'];
		    	$r['upload']['ext']=phi::mime_content_type($r['upload']['src'],1);
				$r['upload']['mime']=phi::mime_content_type($r['upload']['src']);
			}else if(isset($r['qs']['redactor'])){
				$dir='/tmp/';
				$filename = md5(date('YmdHis')).'.jpg';
				$file = $dir.$filename;
				move_uploaded_file($_FILES['file']['tmp_name'], $file);
				$r['upload']['src']=$file;
				$r['upload']['filename']=$filename;
				$r['upload']['path']=$r['qs']['path'];
				$r['upload']['ext']=phi::mime_content_type($r['upload']['src'],1);
				$r['upload']['mime']=phi::mime_content_type($r['upload']['src']);
			}else{
				if(!isset($r['qs']['path'])){
					return array('error'=>'no_path_provided');
				}else $r['upload']['path']=$r['qs']['path'];
				//process upload if file upload
				$uploader = new FileUpload('file');
				$r['upload']['original_filename']=$uploader->getFileName();
				$fp=explode('.', $r['upload']['original_filename']);
				$r['upload']['prettyname']=$fp[0];
				$dir='/tmp/';
				$uploader->newFileName = phi::niceGUID(array(
					'len'=>7,
					'pre'=>'I'
				));
				$result = $uploader->handleUpload($dir);
				if (!$result) {
				  return array(
			          'success' => false,
			          'msg' => $uploader->getErrorMsg()
			       );   
				}
				$r['upload']['filename']=$uploader->getFileName();
		    	$r['upload']['src']=$dir.$r['upload']['filename'];
		    	$r['upload']['ext']=$uploader->getExtension();
				$r['upload']['mime']=phi::mime_content_type($r['upload']['original_filename']);
			}
			//only accepting pdf now
			//get extension
			if($r['upload']['path'][0]=='/'){//trim, path must start with no slash
				$r['upload']['path']=substr($r['upload']['path'], 1,strlen($r['upload']['path']));
			}
			#phi::log($r['upload']);
			$contents=file_get_contents($r['upload']['src']);
			$hash=substr(md5($contents.time()),0, 14);//ensure there are never collisions
			//save it
			$client=phi::getS3();
			$r['upload']['bucket']=phi::$conf['aws']['s3_bucket'];
			$result = $client->putObject(array(
			    'Bucket'     => $r['upload']['bucket'],
			    'Key'        => $r['upload']['path'].$hash.'/media_full.'.$r['upload']['ext'],
			    'Body' => $contents,
			    'ContentType'  => $r['upload']['mime'],
			    'ACL'          => 'public-read',
			));
			if(isset($r['qs']['hook'])){
				$save=array(
					'page'=>$r['qs']['hook'],
					'name'=>$r['upload']['prettyname'].'.'.$r['upload']['ext'],
					'size'=>filesize($r['upload']['src'])/1024,
					'url'=>'https://'.phi::$conf['aws']['s3_bucket'].'.s3.dualstack.us-east-1.amazonaws.com'.$r['upload']['path'].$hash.'/'.$r['upload']['prettyname'].'.'.$r['upload']['ext'],
					'ts'=>time()
				);
				$res=db2::save(DB,'file',$save);
				$id=(string) $res->getInsertedId();
			}
			//if video, do processing if video!
			if(phi::isVideo($r['upload']['mime'])&&false){
				include_once(phi::$conf['root'].'/_img/resizer.php');
				//get cover image and upload!
				$poster='/tmp/'.$hash.'.jpeg';
				#phi::log('ffmpeg -i '.$r['upload']['src'].' -ss 00:00:2.000 -vframes 1 '.$poster);
				exec('ffmpeg -i '.$r['upload']['src'].' -ss 00:00:2.000 -vframes 1 '.$poster);
				$r['upload']['ft']=microtime(true);
				phi::log('video process time: '.($r['upload']['ft']-$r['upload']['st']).' ms');
				$result = $client->putObject(array(
				    'Bucket'     => $r['upload']['bucket'],
				    'Key'        => $r['upload']['path'].$hash.'/full.jpeg',
				    'Body' => file_get_contents($poster),
				    'ContentType'  => phi::mime_content_type($poster),
				    'ACL'          => 'public-read',
				));
				$opts=array('width'=>200,'height'=>200,'crop'=>1);
				$poster_small=ImageResizer::render($poster,$opts,false);
				$result = $client->putObject(array(
				    'Bucket'     => $r['upload']['bucket'],
				    'Key'        => $r['upload']['path'].$hash.'/profile.jpeg',
				    'Body' => file_get_contents($poster_small),
				    'ContentType'  => phi::mime_content_type($poster_small),
				    'ACL'          => 'public-read',
				));
				$opts=array('width'=>100,'height'=>100,'crop'=>1);
				$poster_small2=ImageResizer::render($poster,$opts,false);
				$result = $client->putObject(array(
				    'Bucket'     => $r['upload']['bucket'],
				    'Key'        => $r['upload']['path'].$hash.'/thumb.jpeg',
				    'Body' => file_get_contents($poster_small2),
				    'ContentType'  => phi::mime_content_type($poster_small2),
				    'ACL'          => 'public-read',
				));
				unlink($r['upload']['src']);
				unset($poster_small);
				unset($poster_small2);
				unset($poster);
				$poster=array(
					'path'=>$r['upload']['path'].$hash,
					'ext'=>'jpeg'
				);
				if(isset($f)&&is_file($f)&&$f!=$r['upload']['localsrc']) unlink($f);
				return array(
					'success'=>true,
					'url'=>$r['upload']['path'].$hash.'/file.'.$r['upload']['ext'],
					'name'=>$r['upload']['prettyname'],
					'ext'=>$r['upload']['ext'],
					'kind'=>'video',
					'img'=>$poster
				);
			}else{
				$r['upload']['path']='/'.$r['upload']['path'];//add back in the splash
				$path=$r['upload']['path'].$hash.'/media_full.'.$r['upload']['ext'];
				return array(
					'success'=>true,
					'_id'=>(isset($id))?$id:false,
					'url'=>'https://'.phi::$conf['aws']['s3_bucket'].'.s3.dualstack.us-east-1.amazonaws.com'.$path,
					'path'=>$r['upload']['path'].$hash.'/',
					'name'=>$r['upload']['prettyname'],
					'ext'=>$r['upload']['ext']
				);
			}
		}
		public static function uploadImage($r,$internal=false){
			include_once(phi::$conf['home'].'/'.phi::$conf['project'].'/classes/Uploader.php');
			include_once(phi::$conf['home'].'/'.phi::$conf['project'].'/classes/Uploader_cors.php');
			include_once(phi::$conf['home'].'/'.phi::$conf['project'].'/_img/resizer.php');
			if(!$internal){
				$request_body = file_get_contents('php://input');
				if($request_body){
					parse_str(urldecode($request_body),$out);
					foreach ($out as $k => $v) {
						$r['qs'][$k]=$v;
					}
				}
			}
			if(isset($r['qs']['crop'])) $r['qs']['crop']=json_decode($r['qs']['crop'],1);
			$r['upload']['st']=microtime(true);
			$r['upload']['opts']['thumb']=array('width'=>100,'height'=>100,'crop'=>1);
			$r['upload']['opts']['display']=array('width'=>600,'height'=>500,'crop'=>1);
			$r['upload']['opts']['profile']=array('width'=>400,'height'=>600,'crop'=>1);
			$r['upload']['opts']['square']=array('width'=>400,'height'=>400,'crop'=>1);
			$r['upload']['opts']['background']=array('width'=>1200,'height'=>600,'crop'=>1);
			$r['upload']['opts']['header']=array('width'=>1000,'height'=>200,'crop'=>1);
			$r['upload']['opts']['full']=array('quality'=>90,'nocache'=>1,'width'=>1500,'height'=>1500);//ensure it gets sent to resizer
			$r['upload']['opts']['small']=array('quality'=>70,'nocache'=>1,'width'=>1000,'height'=>1000);//ensure it gets sent to resizer
			$r['upload']['opts']['small_resized']=array('quality'=>70,'nocache'=>1,'width'=>400,'height'=>400);//ensure it gets sent to resizer
			if(!isset($r['qs']['sizes'])) $r['upload']['sizes']=array('thumb','full');
			else{
				if(is_array($r['qs']['sizes'])) $r['upload']['sizes']=$r['qs']['sizes'];
				else $r['upload']['sizes']=explode(',', $r['qs']['sizes']);
			}
			if(isset($r['qs']['local'])){
				if(!isset($r['qs']['path'])) $r['upload']['path']='/links/';
		    	else $r['upload']['path']=$r['qs']['path'];
				$r['upload']['src']=$r['qs']['local'];
			}else if(isset($r['qs']['url'])){
				if(!isset($r['qs']['path'])) $r['upload']['path']='/links/';
		    	else $r['upload']['path']=$r['qs']['path'];
		    	//save locally first!
		    	$r['upload']['filename']=$r['qs']['url'];
		    	#die($r['qs']['url']);
		    	$r['upload']['src']=ImageResizer::save($r['qs']['url']);//$r['qs']['url'];
		    	$mid=db2::getId($r['qs']['url'],'image_url');
			}else if(isset($r['qs']['redactor'])){
				$dir='/tmp/';
				$filename = md5(date('YmdHis')).'.jpg';
				$file = $dir.$filename;
				move_uploaded_file($_FILES['file']['tmp_name'], $file);
				$r['upload']['src']=$file;
				$r['upload']['filename']=$filename;
				$r['upload']['path']=$r['qs']['path'];
			}else if(isset($r['qs']['base64'])){
				$name=phi::niceGUID(array(
					'len'=>7,
					'pre'=>'I'
				));
				$tmp='/tmp/'.md5(time().$name);
				$out=phi::saveBase64File($r['qs']['base64'],$tmp);
				$r['upload']['src']=$out;
				$r['upload']['filename']=$name;
				$r['upload']['path']=$r['qs']['path'];
			}else{
				if(!isset($r['qs']['path'])){
					return array('error'=>'no_path_provided');
				}else $r['upload']['path']=$r['qs']['path'];
				//process upload if file upload
				$uploader = new FileUpload('file');
				//phi::log($_FILES);
				$dir='/tmp/';
				$name=phi::niceGUID(array(
					'len'=>7,
					'pre'=>'I'
				));
				//add extension to file name
				$ext = $uploader->getExtension();
				$name=$name.'.'.$ext;
				$uploader->newFileName = $name;
				$result = $uploader->handleUpload($dir);
				if (!$result) {
				  return array(
			          'success' => false,
			          'msg' => $uploader->getErrorMsg()
			       );   
				}
				$r['upload']['filename']=$uploader->getFileName();
		    	$r['upload']['src']=$dir.$r['upload']['filename'];
			}
			if(!isset($r['upload']['src'])||!is_file($r['upload']['src'])){
				phi::log('request');
				return array(
					'error'=>'invalid_upload',
		          	'msg' => 'could not find local source ['.$r['upload']['src'].']'
		       );
			}
			$i	= GetImageSize($r['upload']['src']);
			if(!isset($i)||!$i){
				phi::log($r['upload'],'image');
				return array('error'=>'invalid_image_source','src'=>$r['upload']['src']);
			}
			$r['upload']['mime']= $i['mime'];
			$mt=explode('/',$r['upload']['mime']);
			$r['upload']['ext']=$mt[1];
			$r['upload']['ar']=phi::getImageAR($r['upload']['src']);
			$r['upload']['time']=time();
			//save it
			$r['upload']['localsrc']=ImageResizer::save($r['upload']['src']);//from web
			$dont_delete=false;
			if($r['upload']['ar']=="0"||$r['upload']['ar']==0){
				phi::log('invalid image AR of 0 '.$r['upload']['src'].' '.$r['upload']['localsrc'],'image');
				$dont_delete=true;
			}
			$hash=substr(md5(md5_file($r['upload']['localsrc']).time()),0, 14);//ensure there are never collisions
			$client=phi::getS3();
			$r['upload']['bucket']=phi::$conf['aws']['s3_bucket'];
			$r['upload']['fullsrc']=$hash.'/full.'.$r['upload']['ext'];
			if($r['upload']['path'][0]=='/'){//trim, path must start with no slash
				$r['upload']['path']=substr($r['upload']['path'], 1,strlen($r['upload']['path']));
			}
			#phi::log($r['upload']);
			if(in_array('full', $r['upload']['sizes'])){
				$f=ImageResizer::render($r['upload']['localsrc'],$r['upload']['opts']['full'],false);
				if(!is_file($f)){
					phi::log('file upload fail ['.json_encode($r['upload']).']','image');
					return array('error'=>'error_uploading');
				}
				$result = $client->putObject(array(
				    'Bucket'     => $r['upload']['bucket'],
				    'Key'        => $r['upload']['path'].$r['upload']['fullsrc'],
				    'Body' => file_get_contents($f),
				    'ContentType'  => $r['upload']['mime'],
				    'ACL'          => 'public-read',
				));
				#phi::log('RESULT - '.json_encode($result->toArray()));
				if(isset($f)&&is_file($f)&&$f!=$r['upload']['localsrc']) unlink($f);
			}
			if(in_array('thumb', $r['upload']['sizes'])){
				$f=ImageResizer::render($r['upload']['localsrc'],$r['upload']['opts']['thumb'],false);
				$result = $client->putObject(array(
				    'Bucket'     => $r['upload']['bucket'],
				    'Key'        => $r['upload']['path'].$hash.'/thumb.'.$r['upload']['ext'],
				    'Body' => file_get_contents($f),
				    'ContentType'  => $r['upload']['mime'],
				    'ACL'          => 'public-read',
				));
				if(isset($f)&&is_file($f)&&$f!=$r['upload']['localsrc']) unlink($f);
			}
			if(in_array('profile', $r['upload']['sizes'])){
				$opts=$r['upload']['opts']['profile'];
				if(isset($r['qs']['crop']['profile'])){
					$opts['cropdata']=array(
						'x'=>floor((float) $r['qs']['crop']['profile']['x']),
						'y'=>floor((float) $r['qs']['crop']['profile']['y']),
						'width'=>floor((float) $r['qs']['crop']['profile']['width']),
						'height'=>floor((float) $r['qs']['crop']['profile']['height'])
					);
					if(isset($opts['crop'])) unset($opts['crop']);
				}
				$f=ImageResizer::render($r['upload']['localsrc'],$opts,false);
				$result = $client->putObject(array(
				    'Bucket'     => $r['upload']['bucket'],
				    'Key'        => $r['upload']['path'].$hash.'/profile.'.$r['upload']['ext'],
				    'Body' => file_get_contents($f),
				    'ContentType'  => $r['upload']['mime'],
				    'ACL'          => 'public-read',
				));
				if(isset($f)&&is_file($f)&&$f!=$r['upload']['localsrc']) unlink($f);
			}
			if(in_array('small', $r['upload']['sizes'])){
				$opts=$r['upload']['opts']['small'];//default if no crop
				if(isset($r['qs']['crop']['small'])){
					$opts['cropdata']=array(
						'x'=>floor((float) $r['qs']['crop']['small']['x']),
						'y'=>floor((float) $r['qs']['crop']['small']['y']),
						'width'=>floor((float) $r['qs']['crop']['small']['width']),
						'height'=>floor((float) $r['qs']['crop']['small']['height'])
					);
					if(isset($opts['crop'])) unset($opts['crop']);
				}
				$f=ImageResizer::render($r['upload']['localsrc'],$opts,false);
				$result = $client->putObject(array(
				    'Bucket'     => $r['upload']['bucket'],
				    'Key'        => $r['upload']['path'].$hash.'/small.'.$r['upload']['ext'],
				    'Body' => file_get_contents($f),
				    'ContentType'  => $r['upload']['mime'],
				    'ACL'          => 'public-read',
				));
				if(isset($f)&&is_file($f)&&$f!=$r['upload']['localsrc']) unlink($f);
			}
			if(in_array('header', $r['upload']['sizes'])){
				$opts=$r['upload']['opts']['header'];//default if no crop
				if(isset($r['qs']['crop']['header'])){
					$opts['cropdata']=array(
						'x'=>floor((float) $r['qs']['crop']['header']['x']),
						'y'=>floor((float) $r['qs']['crop']['header']['y']),
						'width'=>floor((float) $r['qs']['crop']['header']['width']),
						'height'=>floor((float) $r['qs']['crop']['header']['height'])
					);
					if(isset($opts['crop'])) unset($opts['crop']);
				}
				$f=ImageResizer::render($r['upload']['localsrc'],$opts,false);
				$result = $client->putObject(array(
				    'Bucket'     => $r['upload']['bucket'],
				    'Key'        => $r['upload']['path'].$hash.'/header.'.$r['upload']['ext'],
				    'Body' => file_get_contents($f),
				    'ContentType'  => $r['upload']['mime'],
				    'ACL'          => 'public-read',
				));
				if(isset($f)&&is_file($f)&&$f!=$r['upload']['localsrc']) unlink($f);
			}
			if(in_array('background', $r['upload']['sizes'])){
				$opts=$r['upload']['opts']['background'];//default if no crop
				if(isset($r['qs']['crop']['background'])){
					$opts['cropdata']=array(
						'x'=>floor((float) $r['qs']['crop']['background']['x']),
						'y'=>floor((float) $r['qs']['crop']['background']['y']),
						'width'=>floor((float) $r['qs']['crop']['background']['width']),
						'height'=>floor((float) $r['qs']['crop']['background']['height'])
					);
					if(isset($opts['crop'])) unset($opts['crop']);
				}
				$f=ImageResizer::render($r['upload']['localsrc'],$opts,false);
				$result = $client->putObject(array(
				    'Bucket'     => $r['upload']['bucket'],
				    'Key'        => $r['upload']['path'].$hash.'/background.'.$r['upload']['ext'],
				    'Body' => file_get_contents($f),
				    'ContentType'  => $r['upload']['mime'],
				    'ACL'          => 'public-read',
				));
				if(isset($f)&&is_file($f)&&$f!=$r['upload']['localsrc']) unlink($f);
			}
			if(in_array('square', $r['upload']['sizes'])){
				$opts=$r['upload']['opts']['square'];//default if no crop
				if(isset($r['qs']['crop']['square'])){
					$opts['cropdata']=array(
						'x'=>floor((float) $r['qs']['crop']['square']['x']),
						'y'=>floor((float) $r['qs']['crop']['square']['y']),
						'width'=>floor((float) $r['qs']['crop']['square']['width']),
						'height'=>floor((float) $r['qs']['crop']['square']['height'])
					);
					if(isset($opts['crop'])) unset($opts['crop']);
				}
				$f=ImageResizer::render($r['upload']['localsrc'],$opts,false);
				$result = $client->putObject(array(
				    'Bucket'     => $r['upload']['bucket'],
				    'Key'        => $r['upload']['path'].$hash.'/square.'.$r['upload']['ext'],
				    'Body' => file_get_contents($f),
				    'ContentType'  => $r['upload']['mime'],
				    'ACL'          => 'public-read',
				));
				if(isset($f)&&is_file($f)&&$f!=$r['upload']['localsrc']) unlink($f);
			}
			if(in_array('display', $r['upload']['sizes'])){
				$f=ImageResizer::render($r['upload']['localsrc'],$r['upload']['opts']['display'],false);
				$result = $client->putObject(array(
				    'Bucket'     => $r['upload']['bucket'],
				    'Key'        => $r['upload']['path'].$hash.'/display.'.$r['upload']['ext'],
				    'Body' => file_get_contents($f),
				    'ContentType'  => $r['upload']['mime'],
				    'ACL'          => 'public-read',
				));
				if(isset($f)&&is_file($f)&&$f!=$r['upload']['localsrc']) unlink($f);
			}
			if(in_array('small_resized', $r['upload']['sizes'])){
				$f=ImageResizer::render($r['upload']['localsrc'],$r['upload']['opts']['small_resized'],false);
				$result = $client->putObject(array(
				    'Bucket'     => $r['upload']['bucket'],
				    'Key'        => $r['upload']['path'].$hash.'/small_resized.'.$r['upload']['ext'],
				    'Body' => file_get_contents($f),
				    'ContentType'  => $r['upload']['mime'],
				    'ACL'          => 'public-read',
				));
				if(isset($f)&&is_file($f)&&$f!=$r['upload']['localsrc']) unlink($f);
			}
			if(isset($r['upload']['localsrc'])&&is_file($r['upload']['localsrc'])&&!$dont_delete) unlink($r['upload']['localsrc']);
			$r['upload']['ft']=microtime(true);
			$r['upload']['path']='/'.$r['upload']['path'];
			$d=array(
				'path'=>$r['upload']['path'].$hash,
				'ext'=>$r['upload']['ext'],
				'ar'=>$r['upload']['ar']
			);
			if(!isset($mid)||!$mid) $mid=db2::getId($d,'images');
			#phi::log('Image process time: '.($r['upload']['ft']-$r['upload']['st']).' ms for ['.$mid.']');
			return array('success'=>true,'url'=>'https://'.phi::$conf['aws']['s3_bucket'].'.s3.dualstack.us-east-1.amazonaws.com'.$r['upload']['path'].$hash.'/small.'.$r['upload']['ext'],'path'=>$r['upload']['path'].$hash,'ext'=>$r['upload']['ext'],'ar'=>$r['upload']['ar'],'mid'=>$mid,'v'=>2);
		}
	}
?>