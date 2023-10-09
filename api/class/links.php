<?php
	class links{
		public static function handleRequest($r){
			switch ($r['path'][4]){
				case "get":
					$out=self::getLinkInfo($r);
				break;
				case "validate":
					$out=self::validate($r);
				break;
			}
			if(!isset($out)) $out=array('error'=>'invalid_method');
			return $out;
		}
		public static function ensureURL($url){
			if(strpos($url, 'http')===false){
				$url='https://'.$url;
			}
			return $url;
		}
		public static function validate($r){
			$d=phi::ensure($r,array('url'));
			//
			$file = self::ensureURL($d['url']);
			$file_headers = @get_headers($file);
			if(!$file_headers || $file_headers[0] == 'HTTP/1.1 404 Not Found'){
			    $exists = false;
			}else{
			    $exists = true;
			}
			return array('success'=>true,'valid'=>$exists);
		}
		public static function fixUrl($url){
			if(strpos($url, 'youtube.com/embed')!==false){
				$urld=parse_url($url);
				$up=explode('/', $urld['path']);
				$id=$up[2];
				$url='https://www.youtube.com/watch?v='.$id;
			}
			return $url;
		}
		public static function getLinkInfo($r){
			$url=$r['qs']['url'];
			$force=(isset($r['qs']['force']))?1:0;
			$turl=urldecode($url);
			if($turl[0]=='/'&&$turl[1]=='/'){
				$url=$turl='https:'.$turl;
			}
			$url=$turl=self::fixUrl($turl);
			$id=phi::makeLinkUid($turl);
			$link=db2::findOne(phi::$conf['dbname'],'media',array('id'=>$id));
			//phi::log('request');
			if(!isset($link)||!$link||$force){
				$turl='https://api.'.phi::$conf['domain'].':3333/links/get?token='.phi::$conf['admin_token'].'&url='.urlencode($url);
				phi::log($turl,'link');
				#die('stop here');
				//only do if website, if its a large movie, it will crash the servr!!!
				//die($url);
				if(phi::isWebsite(urldecode($url))){
					$json=phi::curl($turl,false,false,'GET');//use api2, only creates 1 instance, better for memory management...
				}else{
					$json['error']='invalid_link';
				}
				#die(json_encode($json));
				if(!isset($json['success'])||!isset($json['data']['metadata'])){
					return array('error'=>'invalid_link');
				}
				$out['data']=$json['data']['metadata'];
				if(isset($json['data']['full_text'])&&$json['data']['full_text']){
					$keywords=phi::extract($json['data']['full_text']);
					$ts=array(
						'id'=>$id,
						'text'=>$json['data']['full_text'],
						'tags'=>$keywords,
						'tsu'=>db2::tsToTime(time())
					);
					db2::update(phi::$conf['dbname'],'webpage_text',array(
						'id'=>$ts['id']
					),array('$set'=>$ts),array('upsert'=>true));
				}else{
					$keywords=false;
				}
				$out['tags']=$keywords;
				#die(json_encode($out));
				phi::log($out,'link');
				if(isset($out['data']['image'])&&$out['data']['image']){//load it!
					$iid=phi::makeLinkUid($out['data']['image']);
					$c=db2::findOne(phi::$conf['dbname'],'src_image',array('id'=>$iid));
					if(!$c||!isset($c['image'])||!$c['image']||$force){
						include_once(phi::$conf['root'].'/api/uploader.php');
						$src=$out['data']['image'];
						//process!!!
						//full
						$ur=array(
							'qs'=>array(
								'url'=>$src,
								'sizes'=>array('small','full'),
								'path'=>'/img/'
							)
						);
						$resp=upload::uploadImage($ur,1);
						//die(json_encode($resp));
						if(!isset($resp['error'])){
							$pic=phi::keepFields($resp,array('path','ext','ar'));
							$out['data']['image']=$pic;
							db2::update(phi::$conf['dbname'],'src_image',array('id'=>$iid),array('$set'=>array('id'=>$iid,'image'=>$pic)),array('upsert'=>true));
						}else{
							phi::log('Error uploading image ['.$src.'] '.$resp['error']);
						}
					}else{
						if(isset($c['image'])&&$c['image']){
							$out['data']['image']=$c['image'];
							$out['data']['image']['cached']=true;
						}
					}
				}
				$out['data']['url']=urldecode($url);
				$out['data']=phi::keepFields($out['data'],array('date','description','image','title','url'));
				if(isset($out['data']['description'])) $out['data']['description']=phi::limitLength($out['data']['description'],200);
				if((!isset($link)||!$link||$force)&&!isset($out['error'])){
					//save it
					$tosave['data']=$out['data'];
					$tosave['id']=$id;
					//$tosave['addedby']=$user['uid'];
					db2::update(phi::$conf['dbname'],'media',array('id'=>$id),array('$set'=>$tosave),array('upsert'=>true));
				}
			}else{
				$out['data']=$link['data'];
				$out['from']='db';
				//add in keywords
				// $ct=db2::findOne(phi::$conf['dbname'],'webpage_text',array('id'=>$id),array('projection'=>array('tags'=>1)));
				// $out['tags']=$ct['tags'];
			}
			$out['mid']=$id;
			if(!isset($out['error'])) $out['success']=true;
			else if(isset($out['success'])) unset($out['success']);
			return $out;
		}
	}
?>