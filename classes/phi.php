<?php
	use Seld\JsonLint\JsonParser;
	class phi{
		public static $conf='';
		public static $db_down=false;
		public static $debugEmail='';
		public static $previewEmail=false;
		public static $debugPush='';
		public static $adminDebug=false;
		public static $metadata=false;
		public static $cache=array();
		public static $unsubscribe=array();
		public static $timers=array();
		public static $auth=array();
		public static $vars=array();
		public static $action_mode=false;
		public static $disableAction=array();
		private static $encryptionkey='';
		private static $encryptioniv='';
		// private static $filecipher=MCRYPT_RIJNDAEL_128;
		// private static $encryptmode=MCRYPT_MODE_CBC;
		public static function breakNetwork(){
			sleep(10);
			exit;
			die('testing bad network conditions');
		}
		public static function logRequest($r,$out){
			$fc=self::getLatestFileCount();
			$file="/var/log/".phi::$conf['project']."/api_".$fc.".csv";
			if(!is_file($file)) exec('touch '.$file);
			//ts,path,time,IP
			$cc=self::getLineCount($file);
			if($cc>400000){//~20 MB?
				$fc++;
				$file="/var/log/".phi::$conf['project']."/api_".$fc.".csv";
			}
			if(!is_file($file)) exec('touch '.$file);
			$path=implode('/', $r['path']);
			$row=time().','.$path.','.round($out['info']['processTime'],5).','.self::getIP().PHP_EOL;
			file_put_contents($file, $row, FILE_APPEND);
		}
		public static function getUrlInfo($r,$return_metadata){
			$defaults=array('streams','connections','people','map','events','calendar','directory','bank','support','settings','qotd','pollinator','facebook','login','view');
			if(in_array($r['path'][1], $defaults)) return array('success'=>true,'valid'=>true);
			//check pages!
			if(isset($r['path'][1])&&$r['path'][1]=='folder'){
				$folder=db2::findOne(phi::$conf['dbname'],'bookmark_collection',array('id'=>$r['path'][2]));
				if($folder&&in_array('public', $folder['perms'])){
					if(!$return_metadata) return array('success'=>true,'valid'=>true);
					$user=db2::findOne(phi::$conf['dbname'],'user',array('id'=>$folder['uid']));
					$metadata=array(
						'url'=>'https://'.phi::$conf['domain'].'/folder/'.$r['path'][2],
					    'title'=>$folder['name'],
					    'description'=>$user['name']."'s folder on ONE|Boulder", 
					    'image'=>phi::getImg($folder['pic'],'small')
					);
					return array('success'=>true,'valid'=>true,'metadata'=>$metadata);
				}else{
					return array('success'=>true,'valid'=>true);//always allow laod
				}
			}else if(isset($r['path'][1])&&$r['path'][1]=='music'){
				$music=db2::findOne(phi::$conf['dbname'],'music',array('id'=>$r['path'][2]));
				$album=db2::findOne(phi::$conf['dbname'],'music_album',array('id'=>$music['album']));
				if($music){
					if(!$return_metadata) return array('success'=>true,'valid'=>true);
					$metadata=array(
						'url'=>'https://'.phi::$conf['domain'].'/folder/'.$r['path'][2],
					    'title'=>$music['title'],
					    'description'=>"Listen to this music on ONE|Boulder", 
					    'image'=>(isset($music['pic']))?phi::getImg($music['pic'],'square'):phi::getImg($album['pic'],'square')
					);
					return array('success'=>true,'valid'=>true,'metadata'=>$metadata);
				}else{
					return array('success'=>true,'valid'=>true);//always allow laod
				}
			}else if(isset($r['path'][1])&&$r['path'][1]=='podcast'){
				$podcast=db2::findOne(phi::$conf['dbname'],'podcast',array('id'=>$r['path'][2]));
				$album=db2::findOne(DB,'podcast_album',['id'=>$podcast['album']]);
				if($podcast){
					if(!$return_metadata) return array('success'=>true,'valid'=>true);
					$user=db2::findOne(phi::$conf['dbname'],'user',array('id'=>$folder['uid']));
					$metadata=array(
						'url'=>'https://'.phi::$conf['domain'].'/folder/'.$r['path'][2],
					    'title'=>$podcast['title'],
					    'description'=>"Listen to this podcast on ONE|Boulder", 
					    'image'=>(isset($podcast['cover']))?phi::getImg($podcast['cover'],'square'):phi::getImg($album['pic'],'square')
					);
					#die(json_encode($metadata));
					return array('success'=>true,'valid'=>true,'metadata'=>$metadata);
				}else{
					return array('success'=>true,'valid'=>true);//always allow laod
				}
			}else if(isset($r['path'][2])&&$r['path'][2]){
				switch($r['path'][2][0]){
					case 'F':
						$data=db2::findOne(phi::$conf['dbname'],'fundraiser',array('id'=>$r['path'][2]));
						if($data){
							if(!$return_metadata) return array('success'=>true,'valid'=>true);
							$metadata=array(
								'url'=>'https://'.phi::$conf['domain'].'/fundraiser/'.$r['path'][2],
							    'title'=>$data['name'],
							    'description'=>strip_tags($data['description']), 
							    'image'=>phi::getImg($data['pic'],'background')
							);
							return array('success'=>true,'valid'=>true,'metadata'=>$metadata);
						}
					break;
					case 'E':
						$data=db2::findOne(phi::$conf['dbname'],'event',array('id'=>$r['path'][2]));
						if($data){
							if(!$return_metadata) return array('success'=>true,'valid'=>true);
							$metadata=array(
								'url'=>'https://'.phi::$conf['domain'].'/event/'.$r['path'][2],
							    'title'=>$data['name'],
							    'description'=>strip_tags($data['description']), 
							    'image'=>phi::getImg($data['pic'],'background')
							);
							#die(json_encode($metadata));
							return array('success'=>true,'valid'=>true,'metadata'=>$metadata);
						}
					break;
					case 'L':
					case 'P':
						$data=db2::findOne(phi::$conf['dbname'],'post',array('id'=>$r['path'][2]));
						if($data){
							if(!$return_metadata) return array('success'=>true,'valid'=>true);
							if($data['by']['type']=='user'){
								$by=db2::findOne(phi::$conf['dbname'],'user',array('id'=>$data['by']['id']),array('projection'=>array('name'=>1,'pic'=>1,'bg'=>1)));
							}else if($data['by']['type']=='page'){
								$by=db2::findOne(phi::$conf['dbname'],'page',array('id'=>$data['by']['id']),array('projection'=>array('name'=>1,'pic'=>1,'background'=>1)));
							}else if($data['by']['type']=='news_source'){
								$by=db2::findOne(phi::$conf['dbname'],'news_source',array('id'=>$data['by']['id']),array('projection'=>array('name'=>1,'pic'=>1,'background'=>1)));
							}
							$img=false;
							if(isset($data['media'])){
								//get media!!!
								switch($data['media']['type']){
									case 'images':
										$d=db2::findOne(phi::$conf['dbname'],'media',array('id'=>$data['media']['data'][0]));
										if($d) $img=$d['data']['pic'];
									break;
									case 'video':
										$d=db2::findOne(phi::$conf['dbname'],'media',array('id'=>$data['media']['data']));
										if($d) $img=$d['data']['poster'];
									break;
									case 'link':
										$d=db2::findOne(phi::$conf['dbname'],'media',array('id'=>$data['media']['data']));
										if($d&&isset($d['data']['image'])){
											$img=$d['data']['image'];
										}
									break;
								}
							}
							if(!$img){//fallaback
								if($data['by']['type']=='user'){
									if(isset($by['bg'])) $img=$by['bg'];
									else $img=$by['pic'];
								}else if($data['by']['type']=='page'){
									if(isset($by['background'])) $img=$by['background'];
									else $img=$by['pic'];
								}
							}
							$metadata=array(
								'url'=>'https://'.phi::$conf['domain'].'/post/'.$r['path'][2],
							    'title'=>'Post By '.$by['name'],
							    'description'=>(isset($data['message'])&&$data['message'])?phi::limitLength($data['message'],200):'',
							    'image'=>phi::getImg($img,'full')
							);
							if(isset($data['media']['type'])&&$data['media']['type']=='link'){
								$md=db2::findOne(phi::$conf['dbname'],'media',array('id'=>$data['media']['data']));
								$metadata['description']=$md['data']['title'];
								$metadata['image']=phi::getImg($md['data']['image'],'full');
							}
							return array('success'=>true,'valid'=>true,'metadata'=>$metadata);
						}
					break;
					case 'G':
						$data=db2::findOne(phi::$conf['dbname'],'page',array('id'=>$r['path'][2]));
						if($data){
							if(!$return_metadata) return array('success'=>true,'valid'=>true);
							if(isset($data['url_name'])&&$data['url_name']){
								$url='https://'.phi::$conf['domain'].'/'.$data['url_name'];
							}else{
								$url='https://'.phi::$conf['domain'].'/page/'.$r['path'][2];
							}
							$metadata=array(
								'url'=>'https://'.phi::$conf['domain'].'/page/'.$r['path'][2],
							    'title'=>$data['name'],
							    'description'=>phi::limitLength($data['callout'],200),
							    'image'=>phi::getImg($data['background'],'full')
							);
							return array('success'=>true,'valid'=>true,'metadata'=>$metadata);
						}
					break;
					case 'U':
						$data=db2::findOne(phi::$conf['dbname'],'user',array('id'=>$r['path'][2]),array('projection'=>array('name'=>1,'id'=>1,'pic'=>1,'bg'=>1)));
						if($data){
							if(!$return_metadata) return array('success'=>true,'valid'=>true);
							if(isset($data['url_name'])&&$data['url_name']){
								$url='https://'.phi::$conf['domain'].'/'.$data['url_name'];
							}else{
								$url='https://'.phi::$conf['domain'].'/page/'.$r['path'][2];
							}
							$co=db2::findOne(phi::$conf['dbname'],'callout',array('id'=>$data['id']));
							if($co){
								$desc=$co['callout'];
							}else{
								$desc='Join me on ONE|Boulder!';
							}
							$metadata=array(
								'url'=>'https://'.phi::$conf['domain'].'/profile/'.$r['path'][2],
							    'title'=>$data['name'],
							    'description'=>phi::limitLength($desc,200),
							    'image'=>phi::getImg((isset($data['bg']))?$data['bg']:$data['pic'],'full')
							);
							return array('success'=>true,'valid'=>true,'metadata'=>$metadata);
						}
					break;
					case 'C':
						$data=db2::findOne(phi::$conf['dbname'],'connection',array('id'=>$r['path'][2]));
						if($data){
							if(!$return_metadata) return array('success'=>true,'valid'=>true);
							$by=db2::findOne(phi::$conf['dbname'],'user',array('id'=>$data['uid']),array('projection'=>array('id'=>1,'name'=>1,'pic'=>1,'bg'=>1)));
							$img=false;
							if(isset($data['media'])){
								//get media!!!
								switch($data['media']['type']){
									case 'images':
										$d=db2::findOne(phi::$conf['dbname'],'media',array('id'=>$data['media']['data'][0]));
										if($d) $img=$d['data']['pic'];
									break;
									case 'video':
										$d=db2::findOne(phi::$conf['dbname'],'media',array('id'=>$data['media']['data']));
										if($d) $img=$d['data']['poster'];
									break;
									case 'link':
										$d=db2::findOne(phi::$conf['dbname'],'media',array('id'=>$data['media']['data']));
										if($d&&isset($d['data']['image'])){
											$img=$d['data']['image'];
										}
									break;
								}
							}
							if(!$img){//fallaback
								if(isset($by['bg'])) $img=$by['bg'];
								else $img=$by['pic'];
							}
							$metadata=array(
					          'url'=>'https://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'],
					          'title'=>'Join us on ONE|Boulder',
					          'description'=>'Building Regenerative Culture and Thriving Together',
					          'image'=>'https://s3.amazonaws.com/one-light/static/one_boulder_splash.jpg'
					        );
							return array('success'=>true,'valid'=>true,'metadata'=>$metadata);
						}
					break;
					default:
						$metadata=array(
							'url'=>'https://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'],
					          'title'=>'Join us on ONE|Boulder',
					          'description'=>'Building Regenerative Culture and Thriving Together',
					          'image'=>'https://s3.amazonaws.com/one-light/static/one_boulder_splash.jpg'
						);
					break;
				}
			}
			if($r['path'][1]) $c=db2::findOne(phi::$conf['dbname'],'url_name',array('url_name'=>strtolower($r['path'][1])));
			else $c=false;
			if(isset($r['qs']['check'])){
				if(!$c) return array('success'=>true,'valid'=>true);
				if(isset($r['qs']['page'])&&$c&&$c['id']==$r['qs']['page']) return array('success'=>true,'valid'=>true);
				//add metadata!
				return array('success'=>true,'valid'=>false);
			}
			if(!$c) return array('error'=>'invalid_page');
			switch ($c['type']){
				case 'page':
					$data=db2::findOne(phi::$conf['dbname'],'page',array('id'=>$c['id']),array('projection'=>array('id'=>1,'name'=>1,'callout'=>1,'background'=>1,'url_name'=>1)));
					if($data){
						if(!$return_metadata) return array('success'=>true,'valid'=>true);
						if(isset($data['url_name'])&&$data['url_name']){
							$url='https://'.phi::$conf['domain'].'/'.$data['url_name'];
						}else{
							$url='https://'.phi::$conf['domain'].'/page/'.$data['id'];
						}
						$metadata=array(
							'url'=>$url,
						    'title'=>$data['name'],
						    'description'=>phi::limitLength($data['callout'],200),
						    'image'=>phi::getImg($data['background'],'full')
						);
						return array('success'=>true,'data'=>$c,'valid'=>true,'metadata'=>$metadata);
					}
				break;
				case 'event':
					$data=db2::findOne(phi::$conf['dbname'],'event',array('id'=>$c['id']),array('projection'=>array('id'=>1,'name'=>1,'pic'=>1,'description'=>1,'url_name'=>1)));
					if($data){
						if(!$return_metadata) return array('success'=>true,'valid'=>true);
						if(isset($data['url_name'])&&$data['url_name']){
							$url='https://'.phi::$conf['domain'].'/'.$data['url_name'];
						}else{
							$url='https://'.phi::$conf['domain'].'/page/'.$data['id'];
						}
						$metadata=array(
							'url'=>$url,
						    'title'=>$data['name'],
						    'description'=>phi::limitLength(self::cleanRedactorContent($data['description']),200),
						    'image'=>phi::getImg($data['pic'],'background')
						);
						return array('success'=>true,'data'=>$c,'valid'=>true,'metadata'=>$metadata);
					}
				break;
				case 'user':
					$data=db2::findOne(phi::$conf['dbname'],'user',array('id'=>$c['id']));
					if($data){
						if(!$return_metadata) return array('success'=>true,'valid'=>true);
						if(isset($data['url_name'])&&$data['url_name']){
							$url='https://'.phi::$conf['domain'].'/'.$data['url_name'];
						}else{
							$url='https://'.phi::$conf['domain'].'/profile/'.$data['id'];
						}
						$metadata=array(
							'url'=>$url,
						    'title'=>$data['name'],
						    'description'=>phi::limitLength($data['callout'],200),
						    'image'=>phi::getImg($data['background'],'full')
						);
						return array('success'=>true,'data'=>$c,'valid'=>true,'metadata'=>$metadata);
					}
				break;
			}
			return array('success'=>true,'valid'=>false);
		}
		public static function getEmailToken($uid){
			return md5(AUTH_SALT.$uid.AUTH_SALT);
		}
		public static function formatMoney($amt){
			return number_format($amt/100,2);
		}
		public static function getModel($model,$site=false){
			$sconf=json_decode(file_get_contents(ROOT.'/_manage/schema.json'),1);
			return (isset($sconf[$model]))?$sconf[$model]:false;
		}
		public static function getLocationInfo($loc,$force=false,$update=true){
			$current=db2::findOne(phi::$conf['dbname'],'places',array('id'=>$loc['id']));
			$key='AIzaSyC4eFhCuaXMgkF1MCopODiwlcOey9mv7_4';
			if(!$current||$force){
				$google=phi::$conf['oauth']['google'];
				$url='https://maps.googleapis.com/maps/api/place/details/json?placeid='.$loc['id'].'&fields=formatted_address,icon,id,name,permanently_closed,photo,place_id,type,url,geometry,formatted_phone_number,international_phone_number,opening_hours,website&key='.$key;
				$resp=phi::curl($url);
				if(isset($resp['result']['photos'])){
					foreach ($resp['result']['photos'] as $k => $v) {
						$photos[]=$v['photo_reference'];
					}
					$resp['result']['photos']=$photos;
				}
				$url2='https://maps.googleapis.com/maps/api/geocode/json?place_id='.$loc['id'].'&key='.$key;
				$resp2=phi::curl($url2);
				if(isset($resp2['results'][0]['address_components'])){
					$resp['result']['address_components']=$resp2['results'][0]['address_components'];
				}
				$resp['result']['id']=$resp['result']['place_id'];
				unset($resp['result']['place_id']);
				$save=$resp['result'];
				$save['loc']=array(
					'type'=>'Point',
					'coordinates'=>array($save['geometry']['location']['lng'],$save['geometry']['location']['lat'])
				);
				foreach ($loc as $k => $v) {
					$save[$k]=$v;
				}
				unset($save['geometry']);
				if($update) db2::update(phi::$conf['dbname'],'places',array('id'=>$save['id']),array('$set'=>$save),array('upsert'=>true));
				return $save;
			}else{
				return $current;
			}

		}
		public static function getCoords($id){
			$key='AIzaSyC4eFhCuaXMgkF1MCopODiwlcOey9mv7_4';
			$google=phi::$conf['oauth']['google'];
			$url='https://maps.googleapis.com/maps/api/place/details/json?placeid='.$id.'&fields=geometry&key='.$key;
			$resp=phi::curl($url);
			if(isset($resp['result']['geometry'])){
				return array((float) $resp['result']['geometry']['location']['lng'],(float)$resp['result']['geometry']['location']['lat']);
			}else{
				return false;
			}
		}
		public static function getLatestFileCount(){
			$files = scandir('/var/log/'.phi::$conf['project'].'/');
			$max=0;
			foreach ($files as $k => $v) {
				if(strpos($v, 'api_')!==false){
					$ps=explode('api_', $v);
					$tp=explode('.', $ps[1]);
					$n=(int) $tp[0];
					if($n>$max) $max=$n;
				}
			}
			return $max;
		}
		public static function getLineCount($file){
			if(!is_file($file)) return 0;
			$linecount = 0;
			$handle = fopen($file, "r");
			while(!feof($handle)){
			  $line = fgets($handle);
			  $linecount++;
			}
			fclose($handle);
			return $linecount;
		}
		public static function buildSearchQuery($q,$search,$lookin){
			$sp=explode(' ', $search);
			foreach ($sp as $k => $v) {
				$regexes[]=new MongoDB\BSON\Regex($v,'i');
			}
			foreach ($lookin as $k => $v) {
				if(isset($sq)) unset($sq);
				if(sizeof($regexes)==1){
					$sq=array($v=>$regexes[0]);
				}else{
					foreach ($regexes as $key => $value) {
						$sq['$and'][]=array($v=>$value);
					}
				}
				$q['$or'][]=$sq;
			}
			// $q['$or'][]=array('data.title'=>$regex);
			// $q['$or'][]=array('data.description'=>$regex);
			// $q['$or'][]=array('data.url'=>$regex);
			return $q;
		}
		public static function ensure($r,$fields,$dieerror=true,$perms=false){
			$missing=array();
			foreach ($fields as $k => $v) {
				if(!isset($r['qs'][$v])) $missing[]=$v;
			}
			//check Perms!
			if($perms){
				#die(json_encode($r['auth']));
				#phi::log('request');
				if(!isset($r['auth']['uid'])||!$r['auth']['uid']){
					if($dieerror){
						API::toHeaders(array('error'=>'Invalid permissions'));
					}
				}
				if(isset($r['auth']['scope'])&&$r['auth']['scope']!='*'){
					if(isset($r['auth']['internal'])){//ok!

					}else if(isset($r['auth']['scope'])&&!in_array('*', $r['auth']['scope'])){
						$t=sizeof($perms);
						//more complicated checking user::read, user::write::...
						$ret=0;
						#die(json_encode($perms));
						foreach ($perms as $k => $v) {
							if($v=='loggedin'){
								$ret++;
							}else{
								if(strpos($v, '::')!==false){
									$pp=explode('::', $v);
									foreach ($r['auth']['scope'] as $ak => $av) {
										if(strpos($av, '::')===false){
											if($pp[0]==$av) $ret++;
										}else{
											$cp=explode('::', $av);
											$c=0;
											//die(json_encode(array('cp'=>$cp,'pp'=>$pp)));
											foreach ($pp as $rk => $rv) {
												//die(json_encode($rv.' '.$cv));
												if($cp[$rk]==$rv||$cp[$rk]=='*'){//has been granted all permission by scope
													$c++;
												}
												
											}
											#die('c:'.$c);
											if($c==3) $ret++;//match on all 3
										}
									}
								}else{
									if(in_array($v, $r['auth']['scope'])) $ret++;
								}
							}
						}
						//$ret=sizeof(array_intersect($r['auth']['scope'], $perms));
						if($t!=$ret){
							if($dieerror){
								API::toHeaders(array('error'=>'Invalid permissions'));
							}
						}
					}else{
						// if($dieerror){
						// 	API::toHeaders(array('error'=>'Invalid permissions'));
						// }
					}
				}else{
					// if($dieerror){
					// 	API::toHeaders(array('error'=>'Invalid permissions'));
					// }
				}
			}
			if(sizeof($missing)&&$dieerror) API::toHeaders(array('error'=>'missing fields ['.implode(',', $missing).']'));
			if(!isset($r['qs'])) $r['qs']=array();
			return $r['qs'];
		}
		public static function getMaxBound($val,$type){
			if($type=='lat'){
				if($val>90) $val=90;
				if($val<-90) $val=-90;
			}
			if($type=='lng'){
				if($val>180) $val=180;
				if($val<-180) $val=-180;
			}
			return $val;
		}
		public static function getMapboxPolygon($bounds){
			$coords[]=array(self::getMaxBound((float) $bounds['_ne']['lng'],'lng'),self::getMaxBound((float) $bounds['_ne']['lat'],'lat'));
			$coords[]=array(self::getMaxBound((float) $bounds['_ne']['lng'],'lng'),self::getMaxBound((float) $bounds['_sw']['lat'],'lat'));
			$coords[]=array(self::getMaxBound((float) $bounds['_sw']['lng'],'lng'),self::getMaxBound((float) $bounds['_sw']['lat'],'lat'));
			$coords[]=array(self::getMaxBound((float) $bounds['_sw']['lng'],'lng'),self::getMaxBound((float) $bounds['_ne']['lat'],'lat'));
			$coords[]=array(self::getMaxBound((float) $bounds['_ne']['lng'],'lng'),self::getMaxBound((float) $bounds['_ne']['lat'],'lat'));
			return $coords;
		}
		public static function getRandomSplash($album,$retry=5){
			$db=phi::getDB(false,'groupup');
			$q=array('$query'=>array('album'=>$album,'_rnd'=>array('$gte'=>self::getRand())),'$orderby'=>array('_rnd'=>1));
    		$obj=$db->user_splashes->findOne($q);
    		$retry--;
    		if(!$obj){
    			if($retry>0) return self::getRandomSplash($album,$retry);//should be recursive till it works, but dont let go forever..
    			else return array('error'=>'bad_album');
    		}
    		return array('splash'=>$obj);
		}
		public static function getRand(){
			return (rand(0,100000)/100000);
		}
		public static function gzip($contents){
	 		return gzencode($contents,9);
		}
		public static function prettyfyTag($val){
			$cur=str_replace('_', ' ', $val);
			return ucwords($cur);
		}
		public static function obfuscateText($text){
			$len=strlen($text);
			$c=0;
			$ret='';
			if($len){
				while($c<$len){
					if($text[$c]!=' ') $ret.='X';
					else $ret.=' ';
					$c++;
				}
			}
			return $ret;
		}
		public static function throttleJob($id,$job,$max_ts,$force=false,$debug=false){
			if(!$force){
				$lastQueue=db2::findOne(phi::$conf['dbname'],'last_queue',array('id'=>$id));
				if($lastQueue) $diff=(time()-($lastQueue['ts']+$max_ts));
				else $diff=1;
				$queued=($diff>0)?0:1;
			}else{
				$queued=0;
			}
			if(!$queued){//queue it!
				if($debug) phi::clog('add to job queue',1);
				db2::update(phi::$conf['dbname'],'last_queue',array('id'=>$id),array('$set'=>array('id'=>$id,'ts'=>time())),array('upsert'=>true));
				db2::save(phi::$conf['dbname'],'jobs',$job);
			}else if(isset($lastQueue)){
				$diff=(time()-($lastQueue['ts']+$max_ts));
				if($diff<0){//mid queue refactory period.  ensure queued job is scheduled
					if($debug) phi::clog('Queue Job',1);
					$ts=($lastQueue['ts']+$max_ts);
					phi::ensureScheduleJob($id.'_'.$ts,$ts,array(
						'url'=>'https://api.'.phi::$conf['domain'].'/one_core/processjob',
						'data'=>array(
							'internal'=>1,
							'id'=>$id,
							'job'=>$job
						),
						'type'=>'url'
					));
				}else{
					if($debug) phi::clog('nothing todo',1);
				}
			}
		}
		public static function ensureScheduleJob($id,$when,$opts,$type='async'){//will also 
			if(is_string($when)) $ts=strtotime($when);
			else if(is_int($when)) $ts=$when;
			if(isset($ts)){
				$save=array(
					'id'=>$id,
					'opts'=>$opts,
					'syncronous'=>($type=='syncronous')?true:false,
					'ts'=>$ts
				);
				db2::update(phi::$conf['dbname'],'scheduled_jobs',array('id'=>$save['id']),array('$set'=>$save),array('upsert'=>true));
			}else{
				phi::log('invalid when ['.$when.'] on ensureScheduleJob');
			}
		}
		public static function rateLimitMessage($id,$max){
			$lm=db2::findOne(phi::$conf['dbname'],'last_message',array('id'=>$id));
			$ct=time()-$max;
			if(!$lm||($lm&&$lm['ts']<$ct)){
				db2::update(phi::$conf['dbname'],'last_message',array('id'=>$id),array('$set'=>array('id'=>$id,'ts'=>time())),array('upsert'=>true));
				return false;
			}else{
				return true;
			}
		}
		public static function emitHook($app,$when,$opts,$return=false){
			if(is_string($when)) $ts=strtotime($when);
			else if(is_int($when)) $ts=$when;
			//validate opts!
			if(!isset(phi::$cache['hook'][$opts['id']])) phi::$cache['hook'][$opts['id']]=array(
				'data'=>db2::findOne(phi::$conf['dbname'],'system_hooks',array('id'=>$opts['id']))
			);
			if(!phi::$cache['hook'][$opts['id']]['data']){
				phi::log('invalid hook for opts '.json_encode($opts));
				return false;
			}
			$hook=phi::$cache['hook'][$opts['id']]['data'];
			$tc=0;
			foreach ($hook['template'] as $k => $v) {
				if(isset($opts['data'][$k])) $tc++;
				else{
					phi::log('missing data ['.$k.'] from hook ['.$hook['id'].']');
				}
			}
			if($tc<sizeof($hook['template'])){
				phi::log('invalid hook for opts, not enough data! '.json_encode($opts));
				return false;
			}
			$opts['type']='hook';
			$opts['app']=$app;
			$save=array(
				'id'=>md5(time().rand()),
				'opts'=>$opts,
				'ts'=>$when
			);
			//phi::log('SAVE '.json_encode($save));
			if($return) return $save;
			else db2::save(phi::$conf['dbname'],'scheduled_jobs',$save);
		}
		public static function saveHooks($hooks){
			//clean
			foreach ($hooks as $k => $v) {
				if($v) $shooks[]=$hooks;
			}
			if(!isset($shooks)) return false;
			db2::bulkInsert(phi::$conf['dbname'],'scheduled_jobs',$hooks);
		}
		public static function fixContent($content){
			if(strpos($content, '<p>')!==false) return $content;//redactor content, already formatted
			return str_replace("\n", '<br/>', $content);
		}
		public static function scheduleJob($id,$when,$opts,$type='async',$timezone='UTC'){//will also 
			if(is_string($when)){
				$date = new DateTime($when, new DateTimeZone($timezone));
				$ts= (int) $date->format('U');
				//$ts2=strtotime($when);
				//phi::log('current ['.time().'] ['.$when.'] ['.$ts.'] ['.$ts2.']');
			}else if(is_int($when)) $ts=$when; 
			$save=array(
				'id'=>$id,
				'opts'=>$opts,
				'syncronous'=>($type=='syncronous')?true:false,
				'ts'=>$ts
			);
			db2::save(phi::$conf['dbname'],'scheduled_jobs',$save);
		}
		public static function clearJob($id){
			db2::remove(phi::$conf['dbname'],'scheduled_jobs',array('id'=>$id));
			return true;
		}
		public static function saveBase64File($base64_string, $output_file){
		    // open the output file for writing
		    $ifp = fopen( $output_file, 'wb' ); 

		    // split the string on commas
		    // $data[ 0 ] == "data:image/png;base64"
		    // $data[ 1 ] == <actual base64 string>
		    $data = explode( ',', $base64_string );

		    // we could add validation here with ensuring count( $data ) > 1
		    fwrite( $ifp, base64_decode( $data[ 1 ] ) );

		    // clean up the file resource
		    fclose( $ifp ); 

		    return $output_file; 
		}
		public static function stripJsonComments($json){
			$chars = str_split($json);
	        $last = count($chars) - 1;
	        $insideString = false;
	        $insideComment = false;
	        $stripped = '';
	        for ($i = 0; $i <= $last; $i++) {
	            $currentChar = $chars[$i];
	            $nextChar = ($i == $last) ? '' : $chars[$i + 1];
	            if (!$insideComment
	                && (($i == 0) ? '' : $chars[$i - 1]) != '\\'
	                && $currentChar == '"') {
	                $insideString = !$insideString;
	            }
	            if ($insideString) {
	                $stripped .= $currentChar;
	                continue;
	            }
	            if (!$insideComment && $currentChar . $nextChar == '//') {
	                $insideComment = 'single';
	                $i++;
	            } elseif ($insideComment == 'single' && $currentChar . $nextChar == "\r\n") {
	                $insideComment = false;
	                $i++;
	            } elseif ($insideComment == 'single' && $currentChar == "\n") {
	                $insideComment = false;
	            } elseif (!$insideComment && $currentChar . $nextChar == '/*') {
	                $insideComment = 'multi';
	                $i++;
	                continue;
	            } elseif ($insideComment == 'multi' && $currentChar . $nextChar == '*/') {
	                $insideComment = false;
	                $i++;
	                continue;
	            }
	            if ($insideComment) {
	                continue;
	            }
	            $stripped .= $currentChar;
	        }
	        return $stripped;
		}
		public static function removeJob($id){
			$db=self::getDB(true,'groupup');
			$db->scheduled_jobs->remove(array('_id'=>$id));
		}
		public static function die404($simple=false){
			http_response_code(404);
			if($simple){
				die('Invalid Resource');
			}else{
				include_once(ROOT.'/sites/internal/404_pretty.php');
				die();
			}
		}
		public static function getAppList(){
			$apps=db2::toList(db2::find(phi::$conf['dbname'],'apps',array()));
			foreach ($apps as $k => $v) {
				if(isset($v['3rdParty'])&&$v['3rdParty']){
					$apps['order'][]=$k;
					$apps['list'][$k]=phi::keepFields($v,array('name','scope'));
				}
			}
			return $apps;
		}
		public static function getColor($index=false){
			$colors=array('#e6194B', '#3cb44b', '#4363d8', '#f58231', '#911eb4','#42d4f4', '#f032e6', '#469990', '#9A6324', '#800000', '#808000', '#000075', '#a9a9a9', '#aaffc3');
			if($index){
				if(isset($colors[$index])){
					return $colors[$index];
				}
			}
			$index=rand(0,sizeof($colors)-1);
			return $colors[$index];
		}
		public static function getCreds($app,$site,$user){
			$id=$user.'_'.$site;
			return db2::findOne($app,'creds',array('id'=>$id));
		}
		public static function getApp($id){//eventually use memcached/db
			return db2::findOne(phi::$conf['dbname'],'apps',array('id'=>$id));
		}
		public static function fixHtmlContent($content){
			// $cur=mb_detect_encoding($content);
			// phi::log($cur);
			$content=mb_convert_encoding(
			    $content,
			    "HTML-ENTITIES",
			    "UTF-8"
			  );
			// $content=utf8_decode($content);
			$dom = new DOMDocument;
			@$dom->loadHTML($content);
			$ps = $dom->getElementsByTagName('p');
			foreach ($ps as $p){
				$style=$p->getAttribute('style');
				$p->setAttribute('style',$style.'padding:1em 0em;margin:0px;');
			}
			$imgs = $dom->getElementsByTagName('img');
			foreach ($imgs as $img){
				$cl=$img->getAttribute('class');
				if($cl&&strpos($cl, 'containerimage')!==false){
					continue;
				}
			    //Extract and show the "href" attribute. 
			    // $img->setAttribute('style','max-width:95%;max-height:150px;-moz-border-radius-topleft: 7px !important; -webkit-border-top-left-radius: 7px !important; -khtml-border-top-left-radius: 7px !important; border-top-left-radius: 7px !important;-moz-border-radius-topright: 7px !important; -webkit-border-top-right-radius: 7px !important; -khtml-border-top-right-radius: 7px !important; border-top-right-radius: 7px !important;-moz-border-radius-bottomleft: 7px !important; -webkit-border-bottom-left-radius: 7px !important; -khtml-border-bottom-left-radius: 7px !important; border-bottom-left-radius: 7px !important;-moz-border-radius-bottomright: 7px !important; -webkit-border-bottom-right-radius: 7px !important; -khtml-border-bottom-right-radius: 7px !important; border-bottom-right-radius: 7px !important;');
			    $img->setAttribute('style','max-width:100%;margin:10px 0px;padding:0px;');
			    $img->setAttribute('height','');//clear out height!
			    $src=$img->getAttribute('src');
			    $img->parentNode->setAttribute('data-src',$src);
			    $c=$img->parentNode->getAttribute('style');
			    //$c.='margin-block-end: 20px;margin-block-start: 20px;';
			    $c.='margin:0px;';
			    $img->parentNode->setAttribute('style',$c);
			}
			$figures = $dom->getElementsByTagName('figure');
			foreach ($figures as $figure){
			    //Extract and show the "href" attribute. 
			    switch($figure->getAttribute('data-redactor-type')){
			    	case 'button':
			    	case 'widget':
			    		// $style=$figure->getAttribute('style');
			    		// $figure->setAttribute('style',$style.'margin-block-end: 50px;margin-block-start: 50px;');
			    	break;
			    	default:
			    		//$figure->setAttribute('style','margin:20px 0px;text-align:center;');
					    $src=$figure->getAttribute('data-src');
					    $src2=$figure->getAttribute('data-file');
					    if($src2) $src=$src2;//use file source
					    if($src){
						    $link = $dom->createElement('a');;
								$link->setAttribute('href',$src);
								$newfigure=$figure->cloneNode(1);
								$link->appendChild($newfigure);
						    //$html='<a href="'.$src.'" target="_blank">' . $dom->saveHTML($figure) . '</a>';
						    //$html='<a href="'.$src.'" target="_blank">'.$dom->saveHTML($figure).'</a>';
						    $figure->parentNode->replaceChild($link, $figure);
						}
			    	break;
			    }
			    $cs=$figure->getAttribute('style');
			    $cs.='background:transparent;margin:0px;';
			    $figure->setAttribute('style',$cs);
			}
			// $marks = $dom->getElementsByTagName('mark');
			// foreach ($marks as $mark){
			//     //Extract and show the "href" attribute. 
			//     $mark->setAttribute('style','background:white;color:black;font-weight:bold');
			// }
			// $iframes = $dom->getElementsByTagName('iframe');
			// foreach ($iframes as $iframe){
			//     //Extract and show the "href" attribute. 
			//     $src=$iframe->getAttribute('src');
			//    	$i=self::getPreview2(array('qs'=>array('url'=>$src)),1);
			//    	if(!isset($i['data']['error'])){
			// 	   	if(!$i['data']['image']){
			// 	   		$i['data']['image']='';//default video image...
			// 	   	}
			// 	   	$urlp=parse_url($i['data']['url']);
			// 	   	$div = $dom->createElement('div'); 
			// 	   	$div->setAttribute('style','display:inline-block;position:relative;');
			// 	   	$div2 = $dom->createElement('div'); 
			// 	   	$div3 = $dom->createElement('div');
			// 	   	$div4 = $dom->createElement('div',htmlentities($i['data']['title']));
			// 	   	$div5 = $dom->createElement('div',$urlp['host']);
			// 	   	$div4->setAttribute('style','font-size:14px;color:#555;max-width:250px;font-weight:bold');
			// 	   	$div5->setAttribute('style','font-size:11px;color:#999');
			// 	   	$div3->setAttribute('style','display:inline;position:relative;');
			// 		$img = $dom->createElement('image'); 
			// 		$img->setAttribute('style','margin:auto;max-width:80%;max-height:200px;-moz-border-radius-topleft: 2px !important; -webkit-border-top-left-radius: 2px !important; -khtml-border-top-left-radius: 2px !important; border-top-left-radius: 2px !important;-moz-border-radius-topright: 2px !important; -webkit-border-top-right-radius: 2px !important; -khtml-border-top-right-radius: 2px !important; border-top-right-radius: 2px !important;-moz-border-radius-bottomleft: 2px !important; -webkit-border-bottom-left-radius: 2px !important; -khtml-border-bottom-left-radius: 2px !important; border-bottom-left-radius: 2px !important;-moz-border-radius-bottomright: 2px !important; -webkit-border-bottom-right-radius: 2px !important; -khtml-border-bottom-right-radius: 2px !important; border-bottom-right-radius: 2px !important;');
			// 		$img->setAttribute('src',$i['data']['image']);
			// 		$img2 = $dom->createElement('image'); 
			// 		$img2->setAttribute('style','height:50px;position:absolute;top:10px;left:10px;');
			// 		$img2->setAttribute('src','https://s3-us-west-2.amazonaws.com/groot/common/play.png');
			// 		$link = $dom->createElement('a');
			// 		$link->setAttribute('href',$i['data']['url']);
			// 		$link->setAttribute('target','_blank');
			// 		$div2->appendChild($img);
			// 		$div2->appendChild($img2);
			// 		$div3->appendChild($div4);
			// 		$div3->appendChild($div5);
			// 		$div->appendChild($div2);
			// 		$div->appendChild($div3);
			// 		$link->appendChild($div);
			// 	    $iframe->parentNode->replaceChild($link, $iframe);
			// 	}else{
			// 		$iframe->parentNode->removeChild($iframe);
			// 	}
			// }
			#phi::log($dom->saveHTML());
			return $dom->saveHTML();
		}
		public static function mongoRand($max){
			$int=rand(0,$max);
			// $maxl=strlen((string) $max)-1;
			// $cl=strlen((string) $int);
			// $diff=$maxl-$cl;
			return str_pad((string) $int, strlen((string) $max), "0", STR_PAD_LEFT);
		}
		public static function getMongoId($ts){
			return base_convert($ts,10,16).''.self::mongoRand(10000000000000000);
		}
		public static function isValidApp($id,$secret){
			$app=self::getApp($id);
			if(isset($app)&&$app['secret']==$secret){
				return true;
			}else{
				return false;
			}
		}
		public static function getMongoTS($t){
			if(gettype($t)=='object'){
				return (int) $t->sec.''.str_pad($t->usec, 6, "0", STR_PAD_LEFT);
			}else{
				return (int) $t;
			}
		}
		public static function getAnonToken($app){
			$id=db2::niceGUID(array(
				'len'=>14,
				'pre'=>'ANON-',
				'unique'=>array('collection'=>$app,'table'=>'anon_token','field'=>'id')
			));
			$save=array(
				'id'=>$id,
				'expires'=>db2::tsToTime(time()+(60*60*1))//1 hour max!
			);
			db2::save($app,'anon_token',$save);
			return $id;
		}
		public static function tagToName($tag){
			$parts=explode('_', $tag);
			foreach ($parts as $k => $v) {
				$parts[$k]=ucfirst($v);
			}
			return implode(' ',$parts);
		}
		public static function getMagicLink($app,$token){
			$conf=db::findOne('prod','apps',array('_id'=>$app));
			if(!phi::$conf['prod']) $conf['app_scheme'].=str_replace(array('\\','[',']','{','}','(',')','.','+','*','"',' ','&','%','*','_','@','#','^','~',"'"), array(""), self::$conf['env']);
			$scheme=$conf['app_scheme'];
			return $scheme.'://login/'.$token;
		}
		public static function getMagicLinkId($app,$user){
			$id=md5(time().AUTH_SALT.rand(0,10000000000));
			$link=array(
				'id'=>$id,
				'uid'=>$user			
			);
			db2::save($app,'magic',$link);
			return $id;
		}
		public static function makeMongoTime($ts){
			$ts=(int) $ts;
			$s=floor($ts/1000000);
			$us=ceil((($ts/1000000)-$s)*1000000);
			return new MongoDate($s,$us);
		}
		public static function getKeyWords($message,$maxLength=600){
			$phrases=DonatelloZa\RakePlus\RakePlus::create($message)->sort('desc')->get();
			if(sizeof($phrases)){
				$l=0;
				foreach ($phrases as $k => $v) {
					$l+=strlen($v);
					if($l<$maxLength){
						$out[]=$v;
					}
				}
				return $out;
			}else{
				return false;
			}		
		}
		public static function strpos_array($haystack, $needles, &$str_return) {
		    if ( is_array($needles) ) {
		        foreach ($needles as $str) {
		        	if($str){
			            if ( is_array($str) ) {
			                $pos = self::strpos_array($haystack, $str);
			            } else {
			                $count = substr_count($haystack, ' '.$str.' ');//ensure it is a whole word
			            }

			            if($count>0) {
			                if(!isset($str_return[$str])) $str_return[$str]=0;
			                $str_return[$str]+=$count;
			            }
			        }
		        }
		    } else {
		        return strpos($haystack, $needles);
		    }
		}
		public static function extract($message,$max=6,$min_count=2){
			//phi::log('phi::extract disabled');
			return false;
			$cache=phi::cache('stopwords.txt',function(){
				$l=db2::toList(db2::find(phi::$conf['dbname'],'tags',array(),array('projection'=>array('id'=>1,'name'=>1))),false,'id');
				foreach ($l as $k => $v) {
					if(isset($v['name'])){
						unset($l[$k]['_id']);
						$n=strtolower($v['name']);//whole word with spaces on each side, no partials
						//$save['tags'][$k]=$n;
						$save['map'][$n]=$k;
					}
				}
				return $save;
			},1,1);//dont force for now
			if(isset($cache['map'])){
				$keywords=array_keys($cache['map']);
				$explicit_only=array('local','touch','to');//ambiguous tags that we only, explicitly want
				self::strpos_array(strtolower($message),$keywords,$matches);
				if(sizeof($matches)){
					arsort($matches);
					$keys=array_keys($matches);
					$values=array_values($matches);
					$c=0;
					while($c<$max){
						if(isset($values[$c])){
							if($values[$c]>=$min_count&&!in_array($cache['map'][$keys[$c]], $explicit_only)){
								$tags[]=$cache['map'][$keys[$c]];
							}
						}
						$c++;
					}
					if(isset($tags)) return $tags;
				}
			}else{
				phi::log('invalid tags cache from phi::extract');
			}
			return false;
		}
		public static function registerToApp($uid,$appid,$token=false,$scopes=false,$temporary=false){
			$app=phi::getApp($appid);
			if($app){
				if(!$token) $token=md5($uid.$appid.AUTH_SALT.time());
				$refresh=md5($token.$token.AUTH_SALT);
				$scopes=API::getScopes($uid,$app);
				if(!$scopes) return false;
				$save=array(
					'id'=>$token,
					'refresh'=>$refresh,
					'uid'=>$uid,
					'appid'=>$appid,
					//'scope'=>$scope,
					'ua_info'=>phi::getUAInfo(),
					'ts'=>time(),
					'tsu'=>db2::tsToTime(time())
				);
				if($temporary===2){
					$save['perm']=true;//handle in housekeeping?
				}else if($temporary){
					$save['temp']=true;//handle in housekeeping?
				}
				db2::save(phi::$conf['dbname'],'token',$save);
				if(isset($app['scopes'])) phi::log('Auto Reg of App ['.$app['name'].'] for user ['.$uid.']','user');
				return $save;
			}else{
				self::alertAdmin('App ['.$appid.'] not found!');
			}
		}
		public static function getImageAR($path){
			$tmp=false;
			if(strpos($path, 'http')===0){//from web, download first
				$opath=$path;
				$id=self::niceGUID(array(
					'len'=>16,
					'pre'=>'F'
				));
				$tmp=$path='/tmp/'.$id;
				file_put_contents($path, file_get_contents($opath));
			}
			if(!is_file($path)){
				phi::log('invalid image path '.$path);
				return false;
			}
			$cmd='/usr/bin/gm identify '.$path;
			exec($cmd,$res);
			$res=implode('', $res);
			if($res){
				$p=explode(' ',$res);
				$sp=$p[2];
				$tsp=explode('::',str_replace(array('x','+','-'),'::',$sp));
				$ar=round(($tsp[0]/$tsp[1]),2);
			}else{
				phi::log('invalid gm getImageAR '.$path);
				return false;	
			}
			if($tmp){
				unlink($tmp);
			}
			return $ar;
		}
		public static function makeUrl($r=false){
			if(isset($_SERVER['HTTP_HOST'])){
				#phi::log($_SERVER);
				$rurip=explode('?',$_SERVER['REQUEST_URI']);
				return 'https://'.$_SERVER['HTTP_HOST'].$rurip[0];
			}else{
				return 'Admin Script';
			}
		}
		public static function getReplayUrl(){
			$base=self::makeUrl();
			$qs=self::getQS(array('admin_token','pw','verify','password'));
			$tqs=http_build_query($qs);
			return $base.'?'.$tqs;
		}
		public static function getQS($dont_include=array()){
			$data=array();
			if(sizeof($_REQUEST)){
				foreach ($_REQUEST as $k => $v) {
					if(!in_array($k, $dont_include)) $data[$k]=$v;
					else $data[$k]='[PRIVATE]';
				}
			}
			//could include other thigns!
			return $data;
		}
		public static function getUAInfo(){
			try{
				include_once(ROOT.'/vendor/donatj/phpuseragentparser/src/UserAgentParser.php');
				return parse_user_agent();
			}catch(Exception $e){
				return false;
			}
		}
		public static function isok(){
			return array('ok'=>true);
		}
		public static function downloadSite($url){
			//get list of files to download
			$wayback='http://archive.org/wayback/available?url='.$url;
			$info=phi::curl($wayback);
			$path='/web/'.$info['archived_snapshots']['closest']['timestamp'];
			//load closest
			$dir='/var/www/root/sites/wayback';
			if(!is_dir($dir.$path)) exec('mkdir -p '.$dir.$path);
			$index=file_get_contents($info['archived_snapshots']['closest']['url']);
			#die($info['archived_snapshots']['closest']['url']);
			die($index);
			file_put_contents($index,$saveto.'/index.html');
			die(json_encode($info));
			//get index from wayback machine
			die($exec);
			exec($exec);
			return true;
		}
		public static function parseObject($object,$data){
			$tdata=json_decode(self::parseString(json_encode($object),$data),1);
			foreach($tdata as $k=>$v){
				if(is_string($v)){
					if(strpos($v, '(int)')!==false){
						if(strpos($tv, '(int)')!==false){
							$tdata[$k]=(int) str_replace('(int)', '', $v);
						}
					}
				}
				if(is_array($v)){
					foreach($v as $tk=>$tv){
						if(is_string($tv)){
							if(strpos($tv, '(int)')!==false){
								$tdata[$k][$tk]=(int) str_replace('(int)', '', $tv);
							}
						}
					}
				}
			}
			return $tdata;
		}
		public static function parseString($string,$data){
			preg_match_all("/\[[^\]]*\]/", $string, $matches);
			if($matches[0]){
				foreach ($matches[0] as $k => $v) {
					$match=str_replace('[', '',str_replace(']', '', $v));
					$d=phi::dotGet($match,$data);
					if(!$d){
						// phi::log('couldnt get data for ['.$match.']');
						// phi::log($data);
					}else{
						if(strpos($match, '.pic')!==false){
							$string=str_replace($v, phi::getImg($d,'square'), $string);
						}else{
							$string=str_replace($v, $d, $string);
						}
					}
				}
			}
			return $string;
		}
		public static function dotGet($key,$doc,$falsey=false){
			$key=str_replace('~', '', $key);
			if(strpos($key, '>')!==false){
				$dp=explode('>', $key);
				$check=1;
			}else{
				$dp=explode('.', $key);
			}
			$val=$falsey;
			$cur=$doc;
			foreach ($dp as $k => $v) {
				if(isset($cur[$v])){
					$cur=$cur[$v];
					if(!isset($dp[$k+1])&&$cur) $val=$cur;
				}else{
					$cur=false;//
				}
			}
			return $val;
		}
		public static function dotPush($key,$doc,$val,$to=false){
			$key=str_replace('~', '', $key);
			if(strpos($key, '>')!==false){
				$dp=explode('>', $key);
			}else{
				$dp=explode('.', $key);
			}
			if(sizeof($dp)==1){
				$doc[$dp[0]][]=$val;
			}else if(sizeof($dp)==2){
				$doc[$dp[0]][$dp[1]][]=$val;
			}else if(sizeof($dp)==3){
				$doc[$dp[0]][$dp[1]][$dp[2]][]=$val;
			}
			return $doc;
		}
		public static function dotSet($key,$doc,$val,$to=false){
			$key=str_replace('~', '', $key);
			if(strpos($key, '>')!==false){
				$dp=explode('>', $key);
			}else{
				$dp=explode('.', $key);
			}
			if(sizeof($dp)==1){
				$doc[$dp[0]]=$val;
			}else if(sizeof($dp)==2){
				$doc[$dp[0]][$dp[1]]=$val;
			}else if(sizeof($dp)==3){
				$doc[$dp[0]][$dp[1]][$dp[2]]=$val;
			}
			return $doc;
		}
		public static function dotUnset($key,$doc){
			$key=str_replace('~', '', $key);
			$dp=explode('.', $key);
			if(sizeof($dp)==1){
				if(isset($doc[$dp[0]])) unset($doc[$dp[0]]);
			}else if(sizeof($dp)==2){
				if(isset($doc[$dp[0]][$dp[1]])) unset($doc[$dp[0]][$dp[1]]);
			}else if(sizeof($dp)==3){
				if(isset($doc[$dp[0]][$dp[1]][$dp[2]])) unset($doc[$dp[0]][$dp[1]][$dp[2]]);
			}
			//die(json_encode($doc));
			return $doc;
		}
		public static function getTimeZones(){
			return array(
				'list'=>array(
					'America/Denver'=>array(
						'description'=>'Mountain Time'
					),
					'America/Los_Angeles'=>array(
						'description'=>'Pacific Time'
					),
					'America/Chicago'=>array(
						'description'=>'Central Time'
					),
					'America/New_York'=>array(
						'description'=>'Eastern Time'
					)
				),
				'order'=>array('America/Denver','America/Los_Angeles','America/Chicago','America/New_York')
			);
		}
		public static function makeLinkUid($url){
			return 'L'.substr(md5($url), 0,10);
		}
		public static function getDB($writeable=false,$db=false,$admin=false){
			$m = new MongoClient(); // connect
			if($admin) return $m;
			if(!$db) $db="prod";
			return $m->selectDB($db);
		}
		public static function flog($msg){
			if(!is_dir('/var/log/'.phi::$conf['project'])) mkdir('/var/log/'.phi::$conf['project']);
			file_put_contents('/var/log/'.phi::$conf['project'].'/php.log', $msg.PHP_EOL , FILE_APPEND | LOCK_EX);
		}
		public static function getSecurityInfo(){
			return array(
				'url'=>'https://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'],
			    'ua'=>(isset($_SERVER['HTTP_USER_AGENT']))?$_SERVER['HTTP_USER_AGENT']:'',
			    'info'=>(isset($_SERVER['HTTP_USER_AGENT']))?API::getBrowser($_SERVER['HTTP_USER_AGENT']):'',
			    'ip'=>(isset($_SERVER['REMOTE_ADDR']))?$_SERVER['REMOTE_ADDR']:''
			  );
		}
		public static function log($msg,$type='default',$error=false){
			if($msg=='request'){
				$msg=array(
					'type'=>$type,
					'url'=>'https://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'],
				    'ua'=>(isset($_SERVER['HTTP_USER_AGENT']))?$_SERVER['HTTP_USER_AGENT']:'',
				    'info'=>(isset($_SERVER['HTTP_USER_AGENT']))?API::getBrowser($_SERVER['HTTP_USER_AGENT']):'',
				    'ip'=>(isset($_SERVER['REMOTE_ADDR']))?$_SERVER['REMOTE_ADDR']:''
				  );
				if(strpos($msg['url'], '/user/login')!==false){
					$msg['url']='[Protected - User Login]';
				}
				if(isset($_SERVER['HTTP_REFERER'])){
					$msg['referer']=$_SERVER['HTTP_REFERER'];
				}
			}
			if(!$msg) return false;
			$mt=microtime(true);
			$ms=explode('.', $mt);
			if(!isset($ms[1])) $ms[1]=0;
			$obj=array(
				'msg'=>$msg,
				'type'=>$type,
				'ts'=>(int) $ms[0],
				'mts'=>(int) $ms[1]
			);
			#$obj['trace']='Stack:<br/>'.json_encode(debug_backtrace());
			if(isset($_SERVER['SERVER_ADDR'])) $obj['server']=$_SERVER['SERVER_ADDR'];
			if($error) $obj['error']=1;
			$resp=db2::save(phi::$conf['dbname'],'log',$obj);
		}
		public static function dieMongo($obj){
			header('Content-Type: application/javascript');
			die(json_encode(iterator_to_array($obj)));
		}
		public static function alertAdmin($message,$maxrate=false,$otheremails=false){//only once every $maxrate min
			$id=md5($message);
			if(!phi::$db_down) db2::findOne(phi::$conf['dbname'],'admin_alert',array('id'=>$id));
			$ct=time();
			if(!$maxrate||($lm&&(($ct-$lm['ts'])/60)>$maxrate||!$lm)){
				phi::sendMail(array(
					'to'=>phi::$conf['admin_email'],
					'subject'=>'ADMIN ALERT ['.phi::$conf['env'].']!!!',
					'message'=>$message,
					'from'=>phi::$conf['no_reply'],
					'node'=>false
				));//send via php
				if($otheremails) foreach ($otheremails as $k => $v) {
					phi::sendMail(array(
						'to'=>$v,
						'subject'=>'ADMIN ALERT ['.phi::$conf['env'].']!!!',
						'message'=>$message,
						'from'=>phi::$conf['no_reply'],
						'node'=>false
					));//send via php
				}
				if(!phi::$db_down){
					db2::save('app_admin','admin_alert',array('id'=>$id,'ts'=>$ct));
					$save=array(
						'id'=>db2::niceGUID(array(
							'len'=>7,
							'pre'=>'A',
							'unique'=>array('collection'=>'app_admin','table'=>'admin_inbox','field'=>'id')
						)),
						'uid'=>'tron',
						'content'=>$message,
						'type'=>'alert',
						'reply'=>false,
						'env'=>phi::$conf['env'],
						'ts'=>time()
					);
					db2::save('app_admin','admin_inbox',$save);
				}
			}
		}
		public static function execNode($exec,$base64=false,$debug=false){
			if($debug){
				ob_start();
			}
			exec($exec,$result);
			if($debug){
				$res = ob_get_contents();
				ob_end_clean();
				die(var_dump($res));
			}
			if($base64) return json_decode(base64_decode(implode('',$result)),1);
			else return json_decode(implode('',$result),1);
		}
		public static function execNode2($scriptstpl,$data,$debug=false){//"nodejs ".ROOT."/node/images.js '[data]'"
			$exec=self::renderTemplate($scriptstpl,array('data'=>base64_encode(json_encode($data))));
			if($debug){
				$exec=$exec.' 1';
				phi::log($exec);
				//die($exec);
			}
			exec($exec,$result);
			return json_decode(base64_decode(implode('',$result)),1);
		}
		public static function clog($m,$f=1){
			if($f){
				if($f==2||$f==3){//replace line
					if($f==2) echo $m."\r";
				}else{
					if(gettype($m)=='array') echo json_encode($m). PHP_EOL;
					else echo $m. PHP_EOL;
				}
			}
		}
		public static function redir($location){
			header('Location: '.$location);
		}
		public static function getIP(){
			$ip=false;
			if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
			    $ip = $_SERVER['HTTP_CLIENT_IP'];
			} elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
			    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
			} else {
			    $ip = $_SERVER['REMOTE_ADDR'];
			}
			return $ip;
		}
		public static function outputFileToHeaders($o){
			$o['mime']=phi::mime_content_type($o['src']);
			if(!isset($o['filename'])) $o['filename']='Download';
			if(is_file($o['src'])){
				$data=file_get_contents($o['src']);
				$lastModified	= gmdate('D, d M Y H:i:s', filemtime($o['src'])) . ' GMT';
				//unlink files if necessary
				if(isset($o['nocache'])){
					if(isset($o['src'])) unlink($o['src']);
				}
				$etag=md5($data);
				if (false&&(isset($_SERVER['HTTP_IF_MODIFIED_SINCE'])&&$_SERVER['HTTP_IF_MODIFIED_SINCE'] == $lastModified) || (isset($_SERVER['HTTP_IF_NONE_MATCH'])&&trim($_SERVER['HTTP_IF_NONE_MATCH']) == $etag)) {	
					header("HTTP/1.1 304 Not Modified");
					header('Etag: "'.$etag.'"');
					header("Expires: Sun, 1 Jan 2039 00:00:00 GMT");
					header("Cache-Control: max-age=315360000");
					exit;
				} else {
					header('pragma: public');
					header('Content-Description: File Transfer');
					header("Content-type: ".$o['mime']);
					header('Content-Disposition: attachment; filename=' . urlencode(basename($o['filename'])));
					header('Content-Length: ' . strlen($data));
					header("Cache-Control: max-age=315360000, public");				
					header('x-powered-by:');
					header('Expires: Sun, 1 Jan 2039 00:00:00 GMT' );
					header("Last-Modified: ".$lastModified);
					header('Etag: "'.$etag.'"');
					header("Accept-Ranges: bytes");
					echo $data;
					exit;
				}
			}else{
				die('Source Not Available');
			}
		}
		public static function isValidUrl($url){
    		$msg='true';
    		error_reporting(0);
    		$headers = get_headers($url);
    		if($headers){
    			$ret=substr($headers[0], 9, 3);
    			if($ret<400) $valid=true;
    			else $valid=false;
    			//find content type
    			if($valid) foreach ($headers as $k => $v) {
    				if(strpos($v, 'Content-Type:')!==false){
    					if(strpos($v, 'text/html')!==false) $valid=true;//only allow text/html pages
    					else $valid=false;
    				}
    			}
    		}else $valid=false;
    		return array( "success"=> array("type"=>"ok", "valid"=>$valid,"url"=>$url));
		}
		public static function XMLtoJSON ($url) {
			$fileContents= file_get_contents($url);
			$fileContents = str_replace(array("\n", "\r", "\t"), '', $fileContents);
			$fileContents = trim(str_replace('"', "'", $fileContents));
			$simpleXml = simplexml_load_string($fileContents,'SimpleXMLElement', LIBXML_NOCDATA);
			$json = json_encode($simpleXml);
			$json=json_decode($json,1);
			return $json;

		}
		public static function niceGUID($oopts){//$len=7,$pre='R',$div=100,$unique=false,$test=false
			$opts=array_merge(array(
				'len'=>7,
				'pre'=>'R',
				'div'=>false,
				'unique'=>false,
				'test'=>false,
				'upperonly'=>true
			),$oopts);
			if(!is_int($opts['len'])) return false;
			if(isset($opts['numberonly'])){
				$characters = array("0","1","2","3","4","5","6","7","8","9");
			}else if(isset($opts['upperonly'])){
				$characters = array(
				"A","B","C","D","E","F","G","H","I","J","K","L","M",
				"N","O","P","Q","R","S","T","U","V","W","X","Y","Z",
				"0","1","2","3","4","5","6","7","8","9");
			}else{
				$characters = array(
				"A","B","C","D","E","F","G","H","I","J","K","L","M",
				"N","O","P","Q","R","S","T","U","V","W","X","Y","Z",
				"a","b","c","d","e","f","g","h","i","j","k","l","m",
				"n","o","p","q","r","s","t","u","v","w","x","y","z",
				"0","1","2","3","4","5","6","7","8","9");
			}
			$keys = array();
			while(count($keys) < $opts['len']) {
				$r = mt_rand(0, count($characters)-1);
				if(!in_array($r, $keys)) {
					$keys[] = $r;
				}
			}
			$i=strlen($opts['pre']);
			$guid='';
			foreach($keys as $key) {
				if(!empty($opts['div']) && ($i % $opts['div'] == 0)) $guid .='-';
				$guid .= $characters[$key];
				$i++;
			}
			$uid=$opts['pre'].$guid;
			if($opts['unique']){
				//$db=phi::getDB(true,$opts['unique']['collection']);
				// if($opts['test']) $uid=$opts['test'];///test to ensure that this query works
				// $oopts['test']=false;
				if(!isset($opts['unique']['db1'])){
					if(db2::count($opts['unique']['collection'],$opts['unique']['table'],array($opts['unique']['field']=>$uid))){
					//if($db->$opts['unique']['table']->count(array($opts['unique']['field']=>$uid))){
						phi::log('uid in use!  try again!');
						//will ensure unique!
						$uid=self::niceGUID($oopts);
					}
				}else{
					if(db::count($opts['unique']['collection'],$opts['unique']['table'],array($opts['unique']['field']=>$uid))){
					//if($db->$opts['unique']['table']->count(array($opts['unique']['field']=>$uid))){
						phi::log('uid in use!  try again!');
						//will ensure unique!
						$uid=self::niceGUID($oopts);
					}
				}
			}
			return $uid;
		}
		public static function sanitize($name){
			return strtolower(preg_replace('/[^a-zA-Z0-9\-_]/', '', str_replace(' ', '_', $name)));
		}
		public static function strToHex($string){
		    $hex='';
		    for ($i=0; $i < strlen($string); $i++){
		        $hex .= dechex(ord($string[$i]));
		    }
		    return $hex;
		}
		public static function hexToStr($hex){
		    $string='';
		    for ($i=0; $i < strlen($hex)-1; $i+=2){
		        $string .= chr(hexdec($hex[$i].$hex[$i+1]));
		    }
		    return $string;
		}
		public static function genCode($len=4){
			$str='';
			$c=0;
			while ($c<$len){
				$d=rand (0, 9);
				$str.=$d;
				$c++;
			}
			return $str;
		}
		public static function outputCSV($data) {
		  $output = fopen("php://output", "wb");
		  foreach ($data as $row)
		    fputcsv($output, $row); // here you can change delimiter/enclosure
		  fclose($output);
		}
		public static function downloadFile($src,$mime,$name,$isText=false){
			if($isText){
				$size=sizeof($src);
			}else{
				$n=md5($src);
				$lsrc='/tmp/'.$n;
				if(!is_file($lsrc)){//cache locally
					file_put_contents($lsrc, file_get_contents($src));
				}
				$size=filesize($lsrc);
			}
			$attachments=array('text/csv');
			if(in_array($mime, $attachments)){
				$wmime='application/octet-stream';
				header('Content-Description: attachment');
				header("Content-Transfer-Encoding: Binary"); 
				header('Content-Description: File Transfer');
			}else{
				$wmime=$mime;
				header('Content-Description: File Transfer');
			}
		    header('Content-Type: '.$wmime);
		    header('Content-Disposition: attachment; filename="'.$name.'"');
		    header('Expires: 0');
		    header('Content-Transfer-Encoding: binary');
		    header('Cache-Control: must-revalidate');
		    header('Pragma: public');
		    header('Content-Length: ' . $size);
		    if($isText){
		    	if($mime=='text/csv'){
		    		#die('ker');
		    		self::outputCSV($src);
		    	}else{
		    		die($src);
		    	}
		    }else{
		    	readfile($lsrc);
		    }
		    exit;
		}
		public static function download($r){
			$src=$r['qs']['src'];
			$n=md5($src);
			$img='/tmp/'.$n;
			if(!is_file($img)||isset($r['qs']['nocache'])){//cache locally
				$c=file_get_contents($src);
				if(!$c) die('no content in file src ['.$src.']');
				file_put_contents($img, $c);
			}
			$i	= GetImageSize($img);//could be image or file...
			//phi::log($i);
			$mt=explode('/',$i['mime']);
			$ext=$mt[1];
			$size   = filesize($img);
			if(isset($r['qs']['name'])&&$r['qs']['name']){
				$name=$r['qs']['name'];
			}else{
				$name='download_'.time();
				if(strpos($name, $ext)===false) $name=$name.'.'.$ext;
			}
			$mime=mime_content_type($img);
			header('Content-Description: File Transfer');
		    header('Content-Type: '.$mime);
		    header('Content-Disposition: attachment; filename="'.$name.'"');
		    header('Expires: 0');
		    header('Cache-Control: must-revalidate');
		    header('Pragma: public');
		    header('Content-Length: ' . filesize($img));
		    readfile($img);
		    exit;
		}
		public static function deferTask($tasks){
			$exec='php /var/www/root/api/tasker.php '.base64_encode(json_encode($tasks)).' > /dev/null &';
			exec($exec);
		}
		public static function getMonthDiff($start,$end){
			// $year1 = date('Y', $ts1);
			// $year2 = date('Y', $ts2);

			// $month1 = date('m', $ts1);
			// $month2 = date('m', $ts2);
			// $day1 = date('j', $ts1);
			// $day2 = date('j', $ts2);
			// // $diff = (($year2 - $year1) * 12) + ($month2 - $month1);
			// if($year1==$year2){
			// 	$diff=$month2-$month1;
			// 	$diff+=(($day2-$day1)/31);
			// }else{

			// }
			// return $diff;
			$start = new DateTime("@$start");
			$end   = new DateTime("@$end");
			$diff  = $start->diff($end);
			return $diff->format('%y') * 12 + $diff->format('%m');
		}
		public static function execTasks($tasks,$debug=false){
			$exec='nodejs '.ROOT.'/node/tasker.js '.base64_encode(json_encode($tasks));
			if(!$debug){
				$exec.=' > /dev/null &';
				exec($exec);
				return true;
			}else{
				$exec.=' 1';//debug mode
				#die($exec);
				exec($exec,$result);
				return json_decode(base64_decode(implode('',$result)),1);
			}
		}
		public static function toMoney($amount){
			$val=round(((int) $amount/100),2);
			$vp=explode('.', $val);
			if(isset($vp[1])&&strlen($vp[1])==1){
				$vp[1]=$vp[1].'0';
				$val=implode('.', $vp);
			}
			return $val;
		}
		public static function saveToMongo($data,$prefix=''){
			if(isset($data['set'])){
                foreach ($data['set'] as $k => $v) {
                    $save['$set'][$prefix.$k]=$v;
                }
            }
            if(isset($data['unset'])){
                foreach ($data['unset'] as $k => $v) {
                	$save['$unset'][$prefix.$k]=$v;
                }
            }
            if(isset($data['add'])){
                foreach ($data['add'] as $k => $v) {
                	$save['$addToSet'][$prefix.$k]['$each']=$v;
                }
            }
            if(isset($data['remove'])){
                foreach ($data['remove'] as $k => $v) {
                	$save['$pullAll'][$prefix.$k]=$v;
                }
            }
            return $save;
		}
		public static function fixImg($src,$host,$imgpath){
			if(strpos($src, '://')===false){
				if(strpos($src, '//')===0){
					$src='http:'.$src;
				}else{
					//if(strpos($src, '/')!=0) $src=$imgpath.$src;
					$src='http://'.$host.$src;
				}
			}
			return $src;
		}
		public static function clean($string) {
		   return preg_replace('/[^A-Za-z0-9\- ]/', '', $string); // Removes special chars.
		}
		public static function minifile($root,$files){
			$out='';
			foreach ($files as $k => $v){
				$file=$root.$v;
				if(is_file($file)||strpos($file, 'https://')!==false) $out.=file_get_contents($file);
				//else phi::log('File ['.$file.'] not found');
			}
			$out = str_replace(array("\r\n", "\r"), "\n", $out);
			$lines = explode("\n", $out);
			$new_lines = array();
			foreach ($lines as $i => $line) {
				if(!empty($line)&&strpos($line,'//')===false){
			        $new_lines[] = trim($line);
			    }else if(!empty($line)){
			    	if(strpos($line,'://')!=false) $new_lines[] = trim($line);
			    	else $new_lines[] = trim(strstr($line,'//',true));
			    }
			}
			//remove comments
			$out=implode($new_lines);
			$expr = '/(?:(?:\/\*(?:[^*]|(?:\*+[^*\/]))*\*+\/)|(?:(?<!\:|\\\)\/\/.*))/';
			$out = preg_replace($expr, '', $out);
			return addslashes($out);}
		public static function getPageData($url){
			
		}
		public static function getSES(){
			//other credss
	    	return new Aws\Ses\SesClient(array(
			    'credentials'=>self::getAwsCreds(),
			    'region' => phi::$conf['aws']['s3_region'],
			    'version' => 'latest'
			));
	    }
	    public static function getAwsCreds(){
	    	return new Aws\Credentials\Credentials(phi::$conf['aws']['access_key'], phi::$conf['aws']['private_key']);
	    }
		public static function getS3(){
			return new Aws\S3\S3Client([
			    'credentials'=>self::getAwsCreds(),
			    'region' => phi::$conf['aws']['s3_region'],
			    'version' => 'latest'
			]);
	    }
	    public static function getGlacier(){
	    	$aws = Aws\Common\Aws::factory(array(
			    'credentials'=>self::getAwsCreds(),
			    'region' => phi::$conf['aws']['s3_region'],
			    'version' => 'latest'
			));
    		return $aws->get('Glacier');
	    }
	    public static function deleteS3dir($bucket,$dir=false){
	    	if(!isset($dir)){
	    		return array('error'=>'no_dir_provided');
	    	}
		    $s3 = self::getS3();
		    // Clear it just in case it may or may not be there and then add it back in.
            $dir = rtrim($dir, "/");
            $dir = ltrim($dir, "/");
            $dir = $dir . "/";
		    //get list of directories
		    $objects = $s3->getIterator('ListObjects', array('Bucket' => $bucket,'Prefix'=>$dir));
		    //delete each 
	        foreach ($objects as $object) {
			    $s3->deleteObject(array(
				    'Bucket' => $bucket,
				    'Key'    => $object['Key']
				)); 
			}
		    return array('success'=>true);
		}
		public static function getPrefix(){
			if($_SERVER['SERVER_PORT']==80) return 'http://';
			else return 'https://';
		}
		public static function toURL($str){
			return strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $str));
		}
		public static function keepFields($arr,$fields=false){
			if(is_array($fields)){
				$out=false;
				foreach ($fields as $k => $field) {
					if((isset($arr[$field])&&$arr[$field]!=='false')) $out[$field]=$arr[$field];
				}
				return $out;
			}else return $arr;	
		}
		public static function formatTime($ts,$type='',$et=false,$tz='America/Denver',$addtz=true){
			if(!$tz) $tz='America/Denver';
			date_default_timezone_set($tz);
			if(strlen($ts)==13){//js time
				$ts=substr($ts, 0,10);
			}
			if($et&&strlen($et)==13){//js time
				$et=substr($et, 0,10);
			}
			$format='';
			switch($type){
				case 'event':
				 $format='l F jS, g:i A';
				break;
				case 'day':
				 $format='F j, Y';
				 $addtz=false;
				break;
				case 'date':
				 $format='m/d/Y';
				 $addtz=false;
				break;
				case 'eventdate':
				 $format='m/d/Y g:i A';
				break;
				case '24time':
				 $format='G:i';
				break;
			}
			if($addtz) $tzabbr=' '.date('T',(int) $ts);
			else $tzabbr='';
			$s=date($format,(int) $ts);
			$check=date('m/d/Y',(int) $ts);
			if(!$et||$et=='false') return $s.$tzabbr;
			switch($type){
				case 'event':
					$check2=date('m/d/Y',(int) $et);
					if($check==$check2){//same day
						$format='g:i A';
					}else{
						$format='l F jS, g:i A';
					}
				break;
				case 'date':
					$check2=date('m/d/Y',(int) $et);
					$format='m/d/Y';
				break;
			}
			$e=date($format,(int) $et);
			return $s.' to '.$e.$tzabbr;
		}
		public static function getFirstName($name){
			$tname=explode(' ', $name);
			return ucfirst($tname[0]);
		}
		public static function objectToSize($object,$number=false){
			if($number) return round((strlen(json_encode($object)))/(1024*1024),3);
			else return round((strlen(json_encode($object)))/(1024*1024),3).' MB';
		}
		public static function getCollectionSize($coll){
			$cp=explode('.', $coll);
			$db=phi::getDB(false,$cp[0]);
			$stats=$db->command(array( 'collStats' => $cp[1] ));
			$mb=round($stats['size']/(1024*1024),2).' MB';
			return $mb;
		}
		public static function formatBytes($bytes, $precision = 2) { 
		    $units = array('B', 'KB', 'MB', 'GB', 'TB'); 

		    $bytes = max($bytes, 0); 
		    $pow = floor(($bytes ? log($bytes) : 0) / log(1024)); 
		    $pow = min($pow, count($units) - 1); 

		    // Uncomment one of the following alternatives
		    // $bytes /= pow(1024, $pow);
		    // $bytes /= (1 << (10 * $pow)); 

		    return round($bytes, $precision) . ' ' . $units[$pow]; 
		} 
		public static function renderRedactorContent($content,$data){
			$data=self::processVars($data);
			$rvars=self::convertArray($data);
			foreach ($rvars as $k => $v) {
				if(!is_object($v)) $content=str_replace('['.$k.']', $v, $content);
			}
			return $content;
		}
		public static function processVars($vars){
			foreach ($vars as $k => $v) {
				if(is_array($v)){
					foreach ($v as $tk => $tv) {
						if($tk=='name'){
							$vars[$k]['firstname']=phi::getFirstName($tv);
						}
						//die(json_encode($vars[$k]));
					}
				}
			}
			return $vars;
		}
		public static function render2($opts){
			if(!isset($opts['sitepath'])) $opts['sitepath']=ROOT.'/sites/one_core';
			include_once($opts['sitepath'].'/one_core.api');
			include_once($opts['sitepath'].'/_email/css.php');
			include_once($opts['sitepath'].'/_email/footer.php');
			$vars=array_merge(getCss(),getFooter($opts['vars']),$opts['vars']);
			$hascampaign=false;
			if(isset($opts['campaign'])){
				$hascampaign=true;
				$vars['read_receipt']='https://api.'.phi::$conf['domain'].'/email/read.png?app='.$opts['app'].'&id='.$opts['id'].'&campaign='.$opts['campaign'];
			}
			if(!isset($vars['header_img'])||!$vars['header_img']) $vars['header_img']=phi::$conf['email_header'];
			$vars['s3']=phi::$conf['s3'];
			$vars=self::processVars($vars);
			if(!isset($vars['display_header'])) $vars['display_header']='display:block;';
			$rvars=self::convertArray($vars);
			$tp=file_get_contents($opts['sitepath'].'/_email/'.$opts['template']);
			if(isset($opts['container'])&&$opts['container']){
				$em=file_get_contents($opts['sitepath'].'/_email/'.$opts['container']);
			}else if(!isset($opts['container'])){//default
				if(phi::$previewEmail){
					$em=file_get_contents($opts['sitepath'].'/_email/_container_preview.txt');
				}else{
					$em=file_get_contents($opts['sitepath'].'/_email/_container.txt');
				}
			}else{
				$em='[content]';//essentially a blank template
			}
			$em=str_replace('[content]', $tp, $em);
			$em=str_replace('’', "'", $em);//replace any bad characters
			foreach ($rvars as $k => $v) {
				if(is_string($v)||is_int($v)) $em=str_replace('['.$k.']', $v, $em);
			}
			//run twice, a template might be used that has a template inside...[mass email]
			//if(isset($rvars['user.name'])) $rvars['user.firstname']=phi::getFirstName($rvars['user.name']);
			foreach ($rvars as $k => $v) {
				if(is_string($v)||is_int($v)) $em=str_replace('['.$k.']', $v, $em);
			}
			if($hascampaign) foreach ($rvars as $k => $v) {//do all links properly
				if(is_string($v)) $em=str_replace('[link-'.$k.']', 'https://api.'.phi::$conf['domain'].'/email/link?app='.$opts['app'].'&id='.$opts['id'].'&campaign='.$opts['campaign'].'&link='.urlencode($v), $em);
			}
			if($hascampaign){
				$dom = new DOMDocument;
				//Parse the HTML. The @ is used to suppress any parsing errors
				//that will be thrown if the $html string isn't valid XHTML.
				@$dom->loadHTML($em);
				// $buttons = $dom->getElementsByTagName('button');
				// //Iterate over the extracted links and display their URLs
				// foreach ($buttons as $button){
				//     //Extract and show the "href" attribute.
				//     $href=$link->getAttribute('href');
				//     if($href){
				//     	die('here');
				//     }
				// }
				//Get all links. You could also use any other tag name here,
				//like 'img' or 'table', to extract other tags.
				$links = $dom->getElementsByTagName('a');

				//Iterate over the extracted links and display their URLs
				foreach ($links as $link){
				    //Extract and show the "href" attribute.
				    $href=$link->getAttribute('href');
				    if(strpos($href, 'https://api.'.phi::$conf['domain'])===false){
					    $newurl='https://api.'.phi::$conf['domain'].'/email/link?app='.$opts['app'].'&id='.$opts['id'].'&campaign='.$opts['campaign'].'&link='.urlencode($href);
					    $link->setAttribute('href',$newurl);
					}
				}
				$em=$dom->saveHTML();
			}
			$em=self::fixHtmlContent($em);
			if(phi::$debugEmail) die($em);
			return $em;
		}
		public static function convertArray($arr, $narr = array(), $nkey = '') {
		    foreach ($arr as $key => $value) {
		        if (is_array($value)) {
		            $narr = array_merge($narr, self::convertArray($value, $narr, $nkey . $key . '.'));
		        } else {
		            $narr[$nkey . $key] = $value;
		        }
		    }

		    return $narr;
		}
		public static function render($opts){
			//$opts['container'] => [STRING] the first item to get rendered
			//$opts['templatefiles'] => [ARRAY] array of ejs file to load for rendering
			//$opts['vars'] => [OBJECT] list of all of the variables used to render
			$opts['vars']['font_url']=FONT_URL;
			$opts['vars']['font_name']=FONT_NAME;
			$opts['s3']=phi::$conf['s3'];
			if(isset($opts['vars']['campaign'])){
				$hascampaign=true;
				$opts['vars']['read_receipt']='https://api.'.phi::$conf['domain'].'/email/read.png?app='.$opts['vars']['app'].'&id='.$opts['vars']['id'].'&campaign='.$opts['vars']['campaign'];
			}
			#die(json_encode($opts));
			//$opts['vars']['nointernet']=NOINTERNET;
			#die(json_encode($opts));
			$exec='nodejs '.ROOT.'/node/render_templates.js '.base64_encode(json_encode($opts));
			#die($exec);
			exec($exec,$result);
			$text=implode('', $result);
			$text=self::fixHtmlContent($text);
			if(!phi::$conf['prod']&&!$text) die($exec);//assume failed
			return $text;
		}
		public static function clearFileCache($types,$internal=1,$force=false){
			include_once(ROOT.'/_manage/aws.php');
			if(phi::$conf['prod']||$force) aws::clearFileCaches($types,$internal);
			else phi::log('Will ensure remotes, but not in DEV');
		}
		public static function clearCache($filename,$force=false,$internal=true,$slave=false){
			$file='/tmp/cache_'.$filename;
			$file.='_lock';
			file_put_contents($file, '1');
			chmod($file, 0777);//ensure others in system can write/clear lock
			//do locally and 
			if(!$slave) self::clearFileCache(array($filename),$internal,$force);
		}
		public static function cache($filename,$loaddata,$force=false,$json=false){
			$file='/tmp/cache_'.$filename;
			$clear='/tmp/cache_'.$filename.'_lock';
			if(is_file($clear)&&file_get_contents($clear)){
				file_put_contents($clear, '');
				phi::log('clearing cache lock for ['.$filename.']');
				$force=true;
			}
			if(!$force&&is_file($file)){
				$c=file_get_contents($file);
				if($json) $c=json_decode($c,1);
			}else {
				$oc=$c=$loaddata($filename);
				if($json) $c=json_encode($c);
				file_put_contents($file, $c);
				exec('chmod 0777 '.$file);//ensure everyone can edit/delete
				$c=$oc;
			}
			return $c;
		}
		public static function uncache($filename){
			$file='/tmp/cache_'.$filename;
			phi::log('clear cache: '.$file);
			if(is_file($file)){
				exec('rm '.$file);
				if(is_file($file)){
					return false;
				}else{
					return true;
				}
			}else{
				return false;
			}
		}
		public static function getWeather($opts,$force=false){
			$wdb=self::getDB(true);
			$tid=$opts['id'];
			$t=time();
			$cw=$wdb->weather->findOne(array('_id'=>$tid));
			$units=(isset($opts['units']))?$opts['units']:'imperial';
			if(!$force&&$cw&&($t-$cw['ts'])<(60*60*30)){
				$out=$cw;
				$out['cached']=1;
			}else{
				$url='http://api.openweathermap.org/data/2.5/forecast/daily?cnt=3&units='.$units.'&id='.$opts['id'].'&appid='.WEATHER_APPID;
				$turl='http://api.openweathermap.org/data/2.5/forecast?units='.$units.'&id='.$opts['id'].'&appid='.WEATHER_APPID;
				$fdata=json_decode(file_get_contents($url),1);
				$hdata=json_decode(file_get_contents($turl),1);
				foreach ($fdata['list'] as $k => $v) {
					//get day of week
					$fdata['list'][$k]['day']=date('l',$v['dt']);
					$fdata['list'][$k]['date']=date('j',$v['dt']);
					$fdata['list'][$k]['datesuffix']=date('S',$v['dt']);
					$fdata['list'][$k]['month']=date('M',$v['dt']);
					$fdata['list'][$k]['icon']=$v['weather'][0]['icon'];
					$fdata['list'][$k]['forecast']=self::getForecast($fdata['list'][$k]);
				}
				$out['weather']['forecast']=$fdata['list'];
				$out['weather']['hourly']=$hdata['list'];
				$out['ts']=$t;
				$out['_id']=$tid;
				$wdb->weather->save($out,array('upsert'=>1));
			}
			return $out;
		}
		public static function getWindDirection($deg){
			if($deg>=348.75||$deg<11.25) $dir='N';
			if($deg>=11.25&&$deg<33.75) $dir='NNE';
			if($deg>=33.75&&$deg<56.25) $dir='NE';
			if($deg>=56.25&&$deg<78.75) $dir='ENE';
			if($deg>=78.75&&$deg<101.25) $dir='E';
			if($deg>=101.25&&$deg<123.75) $dir='ESE';
			if($deg>=123.75&&$deg<146.25) $dir='SE';
			if($deg>=146.25&&$deg<168.75) $dir='SSE';
			if($deg>=168.75&&$deg<191.25) $dir='S';
			if($deg>=191.25&&$deg<213.75) $dir='SSW';
			if($deg>=213.75&&$deg<236.25) $dir='SW';
			if($deg>=236.25&&$deg<258.75) $dir='WSW';
			if($deg>=258.75&&$deg<281.25) $dir='W';
			if($deg>=281.25&&$deg<303.75) $dir='WNW';
			if($deg>=303.75&&$deg<326.25) $dir='NW';
			if($deg>=326.25&&$deg<348.75) $dir='NNW';
			return $dir;
		}
		public static function time($name,$maxlog=false){
			if(isset(self::$timers[$name])){
				$diff=microtime(true)-self::$timers[$name];
				if(!$maxlog||$diff>$maxlog){
					phi::log($name.': '.$diff);
				}
				unset(self::$timers[$name]);
			}else{
				self::$timers[$name]=microtime(true);
			}
		}
		public static function getForecast($data){
			$text=ucfirst($data['weather'][0]['description']);
			$humidity=$data['humidity'].'% humidity';
			$wind=$data['speed'].' MPH wind '.self::getWindDirection($data['deg']);
			$clouds=$data['clouds'].'% cloud cover';
			return $text.', '.$clouds.', '.$wind.', '.$humidity;
		}
		public static function push($uid,$channel,$data){
            $send=array(
				'user'=>$uid,
				'channel'=>$channel,
				'data'=>$data
			);                                                                                                   
			$data_string = json_encode($send);
			$ch = curl_init('https://api.'.self::$conf['domain'].':3334/bridge');                                                                      
			curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");                                                                     
			curl_setopt($ch, CURLOPT_POSTFIELDS, $data_string);                                                                  
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);                                                                      
			curl_setopt($ch, CURLOPT_HTTPHEADER, array(                                                                          
			    'Content-Type: application/json',                                                                                
			    'Content-Length: ' . strlen($data_string))                                                                       
			);    

			curl_exec($ch);
		}
		public static function getBackTrace(){
		ob_start(); 
	        debug_print_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS); 
	        $trace = ob_get_contents(); 
	        ob_end_clean(); 

	        // // Remove first item from backtrace as it's this function which 
	        // // is redundant. 
	        $trace = preg_replace ('/^#0\s+' . __FUNCTION__ . "[^\n]*\n/", '', $trace, 1); 
	        $trace=nl2br($trace);//add right line breaks
			 $msg= '<div class="backtraceheader">Backtrace</div>'.
			 '<div class="backtrace">'.$trace.'</div>'.
			 '<div class="backtraceheader">Request</div>'.
			 '<div class="request"><a href="'.phi::getReplayUrl().'" target="_blank">'.phi::makeUrl().'</a></div>';
			 return $msg;
		}
		public static function sendPush($to,$message,$intent='',$count=1,$sound='',$title='',$data='',$to_uid=false){
			//if(!$to) return false;
			//if(NOINTERNET) return false;
			if(!phi::$conf['prod']&&!TESTMODE) return true;//dont send email in testmode
			include_once(ROOT.'/api/push.php');
			$ts=time();
			//this is ok to do in dev, device table is never copied over.
			// if(!phi::$conf['prod']){
			// 	$message='('.phi::$conf['env'].') '.$message;
			// 	//always send to admin uid
			// 	$to=db2::toList(db2::find(phi::$conf['dbname'],'device',array('uid'=>ADMIN_UID)));
			// }		
			if($to){//push devices...	
				foreach ($to as $k => $device){
					//save to notice table
					if(!$title) $title=phi::$conf['name'];
					$arn=push::getDeviceArn($device);
					// if($join_old_ios&&!isset($device['version'])&&!isset($device['a'])){
					// 	$pieces=array($title,$message);
					// 	$message=implode(': ', $pieces);
					// }
					$sendopts=array(
						'notId'=>db2::niceGUID(array(
							'len'=>10,
							'pre'=>'n'
						)),
						'message'=>$message,
						'title'=>$title,
						'messagedata'=>$data,
						'intent'=>$intent,
						'sound'=>$sound,
						'count'=>$count,
						'device'=>array(
							'arn'=>$arn,
							'sandbox'=>(isset($device['sandbox'])&&(int)$device['sandbox'])?1:0,
							'type'=>(isset($device['a'])&&(int)$device['a'])?'android':'ios',
							'version'=>(isset($device['version']))?$device['version']:1
						)
					);
					if(phi::$action_mode){
						$sendopts['category']=phi::$action_mode;
					}
					$tosave=array(
						'type'=>'push',
						'to'=>$device['uid'],
						'opts'=>$sendopts,
						'ts'=>$ts
					);
					db2::save(phi::$conf['dbname'],'notice',$tosave);
				}
			}
			//phi::log('call sendto: '.$to_uid);
			if($to_uid){
				$sendopts=array(
					'message'=>$message,
					'title'=>$title,
					'messagedata'=>$data,
					'intent'=>$intent
				);
				phi::push($to_uid,'relay_web',$sendopts);//web
			}
		}
		public static function readLogFile($file,$maxPer,$gotLinesFunction,$opts){
			$cachef=explode('.', $file);
			$cache_file=$cachef[0].'_cache.'.$cachef[1];
			$last=false;
			if(is_file($cache_file)){
				$last_line=(int) file_get_contents($cache_file);
			}else{
				$last_line=0;
			}
			$handle = fopen($file, "r");
			if ($handle) {
				$last=0;
			    while (($line = fgets($handle)) !== false) {
			        // process the line read.
			        if(($last+1)>$last_line){
			        	$lines[]=$line;
				        if((sizeof($lines)%$maxPer)==0){
				        	$gotLinesFunction($lines,$opts);
				        	$lines=array();
				        	//cache!
				        	phi::clog('Loaded '.number_format($maxPer).' lines ['.$file.'], last ['.$last.']...',1);
				        	file_put_contents($cache_file, $last);
				        }
				    }
			        $last++;
			    }
			    if(sizeof($lines)){
			    	$gotLinesFunction($lines,$opts);
			    	phi::clog('Loaded '.number_format($maxPer).' lines ['.$file.'], last ['.$last.']...',1);
				    file_put_contents($cache_file, $last);
			    }
			    fclose($handle);
			} else {
			    // error opening the file.
			} 
		}
		public static function formatNumber($n){
			return number_format($n,0,'.',',');
		}
		public static function getLocalIp(){
			$d=phi::curl('http://169.254.169.254/latest/meta-data/local-ipv4');
			return $d['body'];
		}
		public static function getAesKey($type='iv'){
			$d=explode(PHP_EOL,file_get_contents('/var/www/priv/aes_key'));
			foreach ($d as $k => $v) {
				$tp=explode('=', $v);
				if(isset($tp[1])&&$tp[1]) $info[trim($tp[0])]=$tp[1];
			}
			return $info[$type];
		}
		public static function encryptFile($source, $dest){
			self::$encryptionkey=self::getAesKey();
			$FILE_ENCRYPTION_BLOCKS=100000;
		    $key = substr(sha1(self::$encryptionkey, true), 0, 16);
		    $iv = openssl_random_pseudo_bytes(16);

		    $error = false;
		    if ($fpOut = fopen($dest, 'w')) {
		        // Put the initialzation vector to the beginning of the file
		        fwrite($fpOut, $iv);
		        $c=0;
		        $filesize=filesize($source);
		        if ($fpIn = fopen($source, 'rb')) {
		            while (!feof($fpIn)) {
		            	phi::clog('percent completed: '.round((($c*16 * $FILE_ENCRYPTION_BLOCKS)/$filesize)*100,2).'%',2);
		                $plaintext = fread($fpIn, 16 * $FILE_ENCRYPTION_BLOCKS);
		                $ciphertext = openssl_encrypt($plaintext, 'AES-128-CBC', $key, OPENSSL_RAW_DATA, $iv);
		                // Use the first 16 bytes of the ciphertext as the next initialization vector
		                $iv = substr($ciphertext, 0, 16);
		                fwrite($fpOut, $ciphertext);
		                $c++;
		            }
		            phi::clog('percent completed: 100%',1);
		            fclose($fpIn);
		        } else {
		            $error = true;
		        }
		        fclose($fpOut);
		    } else {
		        $error = true;
		    }
		    return $error ? false : $dest;
		}
		public static function decryptFile($source, $dest){
			$FILE_ENCRYPTION_BLOCKS=100000;
			self::$encryptionkey=self::getAesKey();
		    $key = substr(sha1(self::$encryptionkey, true), 0, 16);
		    $error = false;
		    if ($fpOut = fopen($dest, 'w')) {
		        if ($fpIn = fopen($source, 'rb')) {
		            // Get the initialzation vector from the beginning of the file
		            $iv = fread($fpIn, 16);
		            $c=0;
		            $filesize=filesize($source);
		            while (!feof($fpIn)) {
		            	phi::clog('percent completed: '.round((($c*16 * $FILE_ENCRYPTION_BLOCKS)/$filesize)*100,2).'%',2);
		                $ciphertext = fread($fpIn, 16 * ($FILE_ENCRYPTION_BLOCKS + 1)); // we have to read one block more for decrypting than for encrypting
		                $plaintext = openssl_decrypt($ciphertext, 'AES-128-CBC', $key, OPENSSL_RAW_DATA, $iv);
		                // Use the first 16 bytes of the ciphertext as the next initialization vector
		                $iv = substr($ciphertext, 0, 16);
		                fwrite($fpOut, $plaintext);
		                $c++;
		            }
		            phi::clog('percent completed: 100%',1);
		            fclose($fpIn);
		        } else {
		            $error = true;
		        }
		        fclose($fpOut);
		    } else {
		        $error = true;
		    }

		    return $error ? false : $dest;
		}
		public static function aesEncryptFile($content){
			self::$encryptionkey=self::getAesKey();
			$ivSize = mcrypt_get_iv_size(self::$filecipher, self::$encryptmode);
	        $iv = mcrypt_create_iv($ivSize, MCRYPT_DEV_URANDOM);
	        $ciphertext = mcrypt_encrypt(self::$filecipher, self::$encryptionkey, $content, self::$encryptmode, $iv);
	        return base64_encode($iv.$ciphertext);
		}
		public static function aesDecryptFile($content){
			self::$encryptionkey=self::getAesKey();
			$ciphertext = base64_decode($content);
	        $ivSize = mcrypt_get_iv_size(self::$filecipher, self::$encryptmode);
	        if (strlen($ciphertext) < $ivSize) {
	            throw new Exception('Missing initialization vector');
	        }
	        $iv = substr($ciphertext, 0, $ivSize);
	        $ciphertext = substr($ciphertext, $ivSize);
	        $plaintext = mcrypt_decrypt(self::$filecipher, self::$encryptionkey, $ciphertext, self::$encryptmode, $iv);
	        return $plaintext;
	        //return rtrim($plaintext, "\0");
		}
		public static function encrypt($data){//string only
			if(is_array($data)) $data=addslashes(json_encode($data));
			if(!self::$encryptionkey) self::$encryptionkey=self::getAesKey();
			exec('echo "'.$data.'" | openssl enc -aes-256-cbc -a -A -k "'.self::$encryptionkey.'"',$result);
			return implode('',$result);
		}
		public static function decrypt($str){
			if(!self::$encryptionkey) self::$encryptionkey=self::getAesKey();
			exec('echo "'.$str.'" | openssl enc -aes-256-cbc -d -a -A -k "'.self::$encryptionkey.'"',$result);
			$decoded=implode('',$result);
			if($decoded[0]=='{'||$decoded[0]=='['){
				$decoded=json_decode($decoded,1);
			}
			return $decoded;
		}
		public static function safeEncrypt($plainText){//string only
			if(!$plainText) return '';
			if(!self::$encryptionkey) self::$encryptionkey=self::getAesKey();
			if(!self::$encryptioniv) self::$encryptioniv=self::getAesKey('salt');
			$cipher = mcrypt_module_open(self::$filecipher, '', self::$encryptmode, '');
			mcrypt_generic_init($cipher, self::$encryptionkey, self::$encryptioniv);
			$cipherText256 = mcrypt_generic($cipher,$plainText);
			mcrypt_generic_deinit($cipher);
			$cipherHexText256 =bin2hex($cipherText256);
			return $cipherHexText256;
		}
		public static function safeDecrypt($decrypt){
			if(!$decrypt) return '';
			if(!self::$encryptionkey) self::$encryptionkey=self::getAesKey();
			if(!self::$encryptioniv) self::$encryptioniv=self::getAesKey('salt');
			$limbo = hex2bin($decrypt);
			$cipher = mcrypt_module_open(self::$filecipher, '', self::$encryptmode, '');
			mcrypt_generic_init($cipher, self::$encryptionkey, self::$encryptioniv);
			$decrypted = mdecrypt_generic($cipher, $limbo);
			return trim($decrypted);
		}
		public static function getPostData(){
			$data=stripslashes(file_get_contents('php://input'));
			if($data[0]==='"'){//fix for requests that are wrapped in an extra "" for some stupid reason...looking at you cratejoy!
				$data=substr($data,1, sizeof($data)-2);
			}
			return json_decode($data, true);
		}
		public static function cleanData($data){
			if(isset($data['_info'])) unset($data['_info']);
			return $data;
		}
		public static function decodeUnicode($str){
			$str = preg_replace_callback('/\\\\u([0-9a-fA-F]{4})/', function ($match) {
			    return mb_convert_encoding(pack('H*', $match[1]), 'UTF-8', 'UCS-2BE');
			}, $str);
			return $str;
		}
		public static function curl($url,$postdata=false,$headers=false,$type='POST',$debug=false,$settings=false){
			$opts = array(
	            CURLOPT_URL =>$url,
	            CURLOPT_RETURNTRANSFER => TRUE,
	            CURLOPT_TIMEOUT => 50,
	            CURLOPT_SSL_VERIFYPEER => FALSE,
	            CURLOPT_SSL_VERIFYHOST => FALSE
	        );
	        if($headers) $opts[CURLOPT_HTTPHEADER]=$headers;
	       // $opts[CURLOPT_USERAGENT]='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36';

	        //die(var_dump($headers));
	        if($type=='POST'||$type=='PATCH'){
		        if($postdata){
		        	if($settings&&isset($settings['jsonencodepost'])){
			        	if($type!='PATCH') $opts[CURLOPT_POST]=TRUE;
			        	$opts[CURLOPT_POSTFIELDS]=json_encode($postdata);
		        	}else{
			        	if($type!='PATCH') $opts[CURLOPT_POST]=count($postdata);
			        	$fields_string='';
			        	//foreach($postdata as $key=>$value) { $fields_string .= $key.'='.$value.'&'; }	
			        	$fields_string=http_build_query($postdata);
			        	$opts[CURLOPT_POSTFIELDS]=$fields_string;
			        }
		        }else{
		        	$opts[CURLOPT_POST]=TRUE;
		        }
		    }
		    if($settings&&isset($settings['userpwd'])){
		    	$opts[CURLOPT_USERPWD]=$settings['userpwd'];
		    	$opts[CURLOPT_HTTPAUTH]=CURLAUTH_BASIC;
		    }
		    if($type=='DELETE'){
		    	$opts[CURLOPT_CUSTOMREQUEST]="DELETE";
		    }
		    if($type=='PATCH'){
		    	$opts[CURLOPT_CUSTOMREQUEST]="PATCH";
		    }
		    if($type=='PUT'){
		    	$opts[CURLOPT_CUSTOMREQUEST]="PUT";
		    	if($postdata){
		    		$fields_string=http_build_query($postdata);
			        $opts[CURLOPT_POSTFIELDS]=$fields_string;
		    	}
		    }
		    if($type=='GET'){
		    	if($postdata) $opts[CURLOPT_URL]=$url.'?'.http_build_query($postdata);
		    }
	        $ch = curl_init();
	        curl_setopt_array($ch, $opts);
	       	//curl_setopt($ch,CURLOPT_VERBOSE,true);
	        if (! $response = curl_exec($ch)) {
	        	#return curl_error($ch).' at '.$token_url;
	        	phi::log('Error with Curl Request ['.$url.']');
	        }
			$info=curl_getinfo($ch);
			//die(var_dump($info));
			//phi::log("Verbose information:\n<pre>". print_r($info['request_header']). "</pre>");
			curl_close($ch);
			if($response){
				if(self::isJson($response)){
					$params=json_decode($response, true);
				}else{
					$params['body']=$response;
				}
			}else{
				$params['error']='no_response';
			}
	        $params['_info']['http_code']=$info['http_code'];
	        $params['_info']['total_time']=$info['total_time'];
	        if($debug) $params['_info']['opts']=$opts;
			if(isset($params['error'])||isset($params['Error'])){
				$params['_info']['url']=$url;
				$params['_info']['postdata']=$postdata;
			}
			return $params;
		}
		public static function getIndexByKey($list,$search,$key){
			$index=false;
			foreach ($list as $k => $v) {
				if(isset($v[$key])&&$v[$key]==$search) $index=$k;
			}
			return $index;
		}
		public static function isJson($string){
			json_decode($string);
			return (json_last_error() == JSON_ERROR_NONE);
		}
		public static function getUniqueNumber($zero=false){
			$max=10000000;
			if($zero){
				return (int) str_pad('', strlen((string) $max), "0", STR_PAD_LEFT);
			}else{
				return (int) self::mongoRand($max);
			}
		}
		public static function getUniqueTime($t=false,$zero=false){
			if(!$t) $t=time();
			$max=10000000;
			if($zero){
				return $t.'_'.str_pad('', strlen((string) $max), "0", STR_PAD_LEFT);
			}else{
				return $t.'_'.self::mongoRand($max);
			}
		}
		public static function mail($site,$campaign,$ropts,$mopts,$js_opts=false){
			//generate a uniue id for the mail
			$id=db2::niceGUID(array(
				'len'=>16,
				'pre'=>'EM',
				'unique'=>array(
					'collection'=>$site,
					'table'=>'notice',
					'field'=>'id'
				)
			));
			$ropts['campaign']=$campaign;
			$ropts['app']=$site;
			$ropts['id']=$id;
			if($js_opts){
				if(isset($js_opts['vars'])) $js_opts['vars']=array_merge($ropts,$js_opts['vars']);
				else $js_opts['vars']=$ropts;
				$content=self::render($js_opts);
			}else $content=self::render2($ropts);
			#die($content);
			if(phi::$debugEmail) die($content);
			$mopts['message']=$content;
			$mopts['id']=$id;
			$mopts['campaign']=$campaign;
			$mopts['app']=$site;
			if($mopts['to']=='preview') die($content);
			if(isset($mopts['attachments'])){
				phi::sendRawMail($mopts);
			}else{
				if(isset($mopts['returnEmail'])) return phi::sendMail($mopts);
				else phi::sendMail($mopts);
			}
		}
		public static function sendMail($obj){
			if(!isset($obj['app'])) $obj['app']=phi::$conf['dbname'];
			if(!isset($obj['node'])) $obj['node']=true;//default to node! Yay!
			if(!isset($obj['to'])){
				phi::alertAdmin('Invalid To Address');
				return false;
			}
			$to=$obj['to'];
			if(!isset($obj['subject'])){
				phi::alertAdmin('Invalid subject');
				return false;
			}
			$subject=$obj['subject'];
			if(!isset($obj['message'])){
				phi::alertAdmin('Invalid message');
				return false;
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
			include_once(ROOT.'/classes/html2text.php');
			if($from) $source=$from;
			else $source=phi::$conf['no_reply'];
			$onerror=$source;
			$text=Html2Text::convert($message);
			$subject=html_entity_decode(strip_tags($subject));//no html jazz in subject
			if(!phi::$conf['prod']&&!TESTMODE){
				phi::log('Not in test mode, do not send email');
				return true;//dont send email in testmode
			}
			if(!phi::$conf['prod']&&!isset($obj['force'])) $to=phi::$conf['admin_email'];//dont send out actual emails in dev
			if(!is_array($to)) $sendto=array($to);
			else $sendto=$to;
			$tv=strtolower($sendto[0]);
			$max=80;
			$subject=str_replace('\r','',$subject);
			$subject=str_replace('\n',' ',$subject);
			$subject=substr($subject, 0,$max);
			if(strlen($subject)==$max) $subject.='...';
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
			foreach ($sendto as $k => $email) {
				$sendopts=array(
				    // Source is required
				    'Source' => $source,
				    // Destination is required
				    'Destination' => array(
				        'ToAddresses' => array($email)
				    ),
				    // Message is required
				    'Message' => array(
				        // Subject is required
				        'Subject' => array(
				            // Data is required
				            'Data' => $subject,
				            'Charset' => 'UTF-8',
				        ),
				        // Body is required
				        'Body' => array(
				            'Text' => array(
				                // Data is required
				                'Data' => $text,
				                'Charset' => 'UTF-8',
				            ),
				            'Html' => array(
				                // Data is required
				                'Data' => $message,
				                'Charset' => 'UTF-8',
				            ),
				        ),
				    ),
				    'ReplyToAddresses' => $replyto,
				    'ReturnPath' => $source,
				);
				if(isset($obj['node'])&&$obj['node']){
					//save to notice table
					$tags[]='email';
					$tosave=array(
						'tags'=>$tags,
						'type'=>'email',
						'opts'=>$sendopts,
						'ts'=>$ts
					);
					if(isset($obj['id'])) $tosave['id']=$obj['id'];
					if(isset($obj['campaign'])) $tosave['cid']=$obj['campaign'];
					#phi::log($tosave);
					if(isset($obj['returnEmail'])) return $tosave;
					$res=db2::save($obj['app'],'notice',$tosave);
				}else{//directly send
					$mailer=self::getSES();
					if(!phi::$conf['prod']){
						$sendopts['Destination']['ToAddresses']=['tom@oneboulder.one'];
					}
					$result = $mailer->sendEmail($sendopts);
					$mid=$result->get('MessageId');
					$tags[]='email';
					$tosave=array(
						'tags'=>$tags,
						'type'=>'email',
						'opts'=>$sendopts,
						'ts'=>$ts,
						'status'=>1,//success!
						'resp'=>array(
							'MessageId'=>$mid
						)
					);
					if(isset($obj['id'])) $tosave['eid']=$obj['id'];
					if(!phi::$db_down) db2::save($obj['app'],'notice_direct',$tosave);
					//force mailgun for now
					// $mg = Mailgun\Mailgun::create('key-90e4167a022923476410e166762c4cd9');
					// $mailgun=array(
					// 	'to'=>$email,
					// 	'from'=>$source,
					// 	'subject'=>$subject,
					// 	'text'=>$text,
					// 	'html'=>$message
					// );
					// $resp=$mg->messages()->send('mail.xxxx.earth', $mailgun);
					// $log=array(
					// 	'id'=>$resp->getId(),
					// 	'message'=>$resp->getMessage()
					// );
					// phi::log($log);
				}
			}
		}
		public static function sendRawMail($obj){
			include_once(ROOT.'/api/rawemail.php');
			rawEmail::send($obj);
		}
		public static function getObjectKeys($obj,$strip=false){
			if(is_array($obj)){
				foreach ($obj as $k => $v) {
					if($strip&&in_array($k,$strip)&&!is_int($k)) $ret[$k]='';//keep key but clear it out
					else $ret[$k]=self::getObjectKeys($v,$strip);
				}
				return $ret;
			}else{
				return $obj;
			}
		}
		public static function getObjectKeys2($obj){
			$c=self::getObjectKeys($obj);
			if(isset($c['Attachments'])) foreach ($c['Attachments'] as $k => $v) {
				if(isset($v['Type'])&&$v['Type']=='text'){

				}else{
					$c['Attachments'][$k]['Data']='';
				}
			}
			return $c;
		}
		public static function db($site){
			$db=phi::getDB();
			$s=$db->conf->findOne(array('_id'=>$site));
			return $s['db'];
		}
		public static function getImg($obj,$type=false,$s3=false){
			if(is_string($obj)) return $obj;
			if(!isset($obj['path'])) return false;
			if($type=='background'&&!isset($obj['v'])) $type='small';//fallback
			if($type=='header'&&!isset($obj['v'])) $type='small';//fallback
            if($type=='profile'&&!isset($obj['v'])) $type='small';//fallback
            if($type=='square'&&!isset($obj['v'])) $type='square';//fallback
			if(!$s3) $s3=phi::$conf['s3'];
	        if($type) $out=$s3.$obj['path'].'/'.$type.'.'.$obj['ext'];
	        else $out=$s3.$obj['path'].'/full.'.$obj['ext'];
            return $out;
		}
		public static function isadmin($site){
			$db=phi::getDB();
			$s=$db->conf->findOne(array('_id'=>$site));
			return (isset($s['admin']))?1:0;
		}
		public static function getDay(){
			date_default_timezone_set('UTC');
			return date("Ymd");
		}
		public static function uploadProgress(){
			if (isset($_SERVER['HTTP_ORIGIN'])) {
			  header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
			  header('Access-Control-Allow-Credentials: true');
			  header('Access-Control-Max-Age: 86400');    // cache for 1 day
			}

			if (isset($_REQUEST['progresskey'])) $status = apc_fetch('upload_'.$_REQUEST['progresskey']);
			else return array('success' => false);

			$pct = 0;
			$size = 0;

			if (is_array($status)) {
			  if (array_key_exists('total', $status) && array_key_exists('current', $status)) {
			    if ($status['total'] > 0) {
			      $pct = round( ( $status['current'] / $status['total']) * 100 );
			      $size = round($status['total'] / 1024);
			    }
			  }
			}

			return array('success' => true, 'pct' => $pct, 'size' => $size);
		}
		public static function relTime($seconds){
			$ret='';
			if($seconds<60){//seconds
				$ret='Less than 1 min ago';
			}else if($seconds<(60*60)){//minutes
				$t=floor($seconds/(60));
				if($t>1) $ret=$t.' minutes ago';
				else $ret=$t.' minute ago';
			}else if($seconds<(60*60*24)){//hours
				$t=floor($seconds/(60*60));
				if($t>1) $ret=$t.' hours ago';
				else $ret=$t.' hour ago';
			}else{//days
				$t=floor($seconds/(60*60*24));
				if($t>1) $ret=$t.' days ago';
				else $ret=$t.' day ago';
			}
			return $ret;
		}
		public static function getFiles($dir,$decend=true){
			if(is_dir($dir)){
			   $cdir = scandir($dir); 
			   foreach ($cdir as $key => $value) 
			   { 
			      if (!in_array($value,array(".",".."))) 
			      { 
			         if (is_dir($dir .'/'. $value)&&$decend) 
			         { 
			            $tfiles = self::getFiles($dir .'/'. $value); 
			            foreach ($tfiles['files'] as $k => $v) {
			            	$files[] =$v;
			            	$hashes[]=md5_file($v);
			            }		            	

			         } 
			         else 
			         { 
			         	if($decend){
				            $files[] =$dir.'/'.$value;
				            $hashes[]=md5_file($dir.'/'.$value);
				        }else{
				        	$files[$value] =$dir.'/'.$value;
				            $hashes[]=md5_file($dir.'/'.$value);
				        }
			         } 
			      } 
			   } 
			   $hash=(isset($hashes))?md5(implode(',',$hashes)):false;
			}else{
				$files=false;
				$hash=false;
				phi::log('Error scanning dir ['.$dir.']');
			}
			if(!isset($files)) $files=false;
		   return array('files'=>$files,'hash'=>$hash); 
		}
		public static function getDirs($dir){
		   $cdir = scandir($dir); 
		   $dirs=false;
		   foreach ($cdir as $key => $value) 
		   { 
		      if (!in_array($value,array(".",".."))) 
		      { 
		         if (is_dir($dir .'/'. $value)) 
		         { 
		               $dirs[$value]=$dir .'/'. $value;

		         }
		      } 
		   } 
		   return $dirs;
		}
		public static function loadProxyImage($r){
			//die($r['qs']['img']);
			//$path=urldecode($r['qs']['img']);
			$path=$r['qs']['img'];
			if(strpos($path,'http')!==0){
				die('Invalid URL');
			}
			//save to tmp
			$savepath='/tmp/'.md5($path);
			if(!is_file($savepath)||isset($r['qs']['force'])){
				file_put_contents($savepath, file_get_contents($path));
			}
			$info=self::getFileInfo($path);
			$mime=$info['mime'];
			if($mime){
				header('Content-type: '.$mime);
	            header('Content-length: '.filesize($savepath));
	            $contents = file_get_contents($savepath);
	            die($contents);
			}else{
				die('Image not available');
			}
			die();
		}
		public static function get_headers_from_curl_response($response){
		    $headers = array();

		    $header_text = substr($response, 0, strpos($response, "\r\n\r\n"));

		    foreach (explode("\r\n", $header_text) as $i => $line)
		        if ($i === 0)
		            $headers['http_code'] = $line;
		        else
		        {
		            list ($key, $value) = explode(': ', $line);

		            $headers[$key] = $value;
		        }

		    return $headers;
		}
		public static function getUrlsFromString($string){
			preg_match_all('#\bhttps?://[^,\s()<>]+(?:\([\w\d]+\)|([^,[:punct:]\s]|/))#', $string, $match);
			if(isset($match[0])&&sizeof($match[0])) return $match[0];
			return false;
		}
		public static function getUrlHeaders($url){
			return get_headers($url);
		}
		public static function limitLength($text,$length){
			if(strlen($text)>$length){
				return mb_substr($text,0,$length, "utf-8").'...';//utf8 safe!
				return substr($text, 0,$length).'...';//could cause bad characters!
			}
			return substr($text, 0,$length);
		}
		public static function getPageTags($url,$type){
		  $str = file_get_contents($url);
		  if(strlen($str)>0){
		    $str = trim(preg_replace('/\s+/', ' ', $str)); // supports line breaks inside <title>
		    preg_match("/\<".$type."(.*)\<\/".$type."\>/i",$str,$title); // ignore case
		    return $title;
		  }else{
		  	return '';
		  }
		}
		public static function getBase64data($url){
			$info=phi::getFileInfo($url);
			$type='unknown';
			switch ($info['mime']) {
				case 'image/jpeg':
					$type='data:image/jpeg;base64,';
				break;
				case 'image/png':
					$type='data:image/png;base64,';
				break;
			}
			return $type;
		}
		public static function getFileInfo($url ,$pretty=false) {
			$st=microtime(true);
		    $head = array_change_key_case(get_headers($url, 1));
		    // content-length of download (in bytes), read from Content-Length: field
		    $clen = isset($head['content-length']) ? $head['content-length'] : 0;
		    $mime=isset($head['content-type']) ? $head['content-type'] : '';
		    // cannot retrieve file size, return "-1"
		    if (!$clen) {
		        return -1;
		    }
		    $ft=microtime(true);
		    if (!$pretty) {
		        return array(
		        	'time'=>$ft-$st,
		        	'mime'=>$mime,
		        	'path'=>$url,
		        	'size'=>(int) $clen // return size in bytes
		        );
		    }

		    $size = $clen;
		    switch ($clen) {
		        case $clen < 1024:
		            $size = $clen .' B'; break;
		        case $clen < 1048576:
		            $size = round($clen / 1024, 2) .' KiB'; break;
		        case $clen < 1073741824:
		            $size = round($clen / 1048576, 2) . ' MiB'; break;
		        case $clen < 1099511627776:
		            $size = round($clen / 1073741824, 2) . ' GiB'; break;
		    }
		    return array(
		    	'time'=>$ft-$st,
	        	'mime'=>$mime,
	        	'size'=>(int) $size // return size in bytes
	        );
		}
		public static function getPath($site){
			if((FORCE_COMBINE||phi::$conf['prod'])&&!FORCE_PRODUCTION_CONF){//combined mode
		        $vconf=db2::findOne(phi::$conf['dbname'],'versions',array('_id'=>$site));
		        if(isset($vconf)&&isset($vconf['distver'])) $path=phi::$conf['s3'].'/source/'.phi::$conf['env'].'/'.$site.'/dist/'.$vconf['distver'];
			    else die('Dist folder not updloaded yet for ['.$site.']!');
		    }else $path='/dist';//development
		    return $path;
		}
		public static function getDomain($url){
			$urlp=parse_url($url);
			return str_replace('www.', '', $urlp['host']);
		}
		public static function sort($list,$opts){
			usort($list, function($a,$b) use ($opts){
				if(isset($opts['reverse'])){
					if($opts['type']=='string') return strcmp($b[$opts['key']],$a[$opts['key']]);
					if($opts['type']=='number') return $b[$opts['key']]-$a[$opts['key']];
					if($opts['type']=='float') return (($a[$opts['key']]-$b[$opts['key']])>0)?-1:1;
				}else{
					if($opts['type']=='string') return strcmp($a[$opts['key']], $b[$opts['key']]);
					if($opts['type']=='number') return $a[$opts['key']]-$b[$opts['key']];
					if($opts['type']=='float') return (($a[$opts['key']]-$b[$opts['key']])>0)?1:-1;
				}
			});
			if(isset($opts['keyOn'])){
				foreach ($list as $k => $v) {
					$data[]=$v[$opts['keyOn']];
				}
				return $data;
			}else return $list;
		}
		public static function getIcons(){
			$path=ROOT.'/sites/code/font/oneicon/config.json';
			if(!is_file($path)) return array('error'=>'conf_not_found');
			$data=json_decode(file_get_contents($path),1);
			$prefix=$data['css_prefix_text'];
			foreach ($data['glyphs'] as $k => $v) {
				$tk=$prefix.$v['css'];
				$out['icons']['order'][]=$tk;
				$out['icons']['list'][$tk]=array(
					'id'=>$tk
				);
			}
			$out['success']=true;
			return $out;
		}
		public static function fixFontCss($r){//only needs to happen on dev
			$db=phi::getDB('prod');
			$confs=$db->conf->find(array())->sort(array('name'=>1));
			while($confs->hasNext()){
				$conf=$confs->getNext();
				if(isset($conf['fontcss'])){
					foreach ($conf['fontcss'] as $k => $v) {
						$css=str_replace("'fontello'","'fontello2'",str_replace('"fontello"','"fontello2"',str_replace('icon-','icon2-',str_replace('../font/',PROTOCOL.$conf['db'].'.'.DOMAIN.'/pub/font/',file_get_contents($conf['root'].$v).'
'))));
						$fixed=$conf['root'].str_replace('fontello.css', 'fontello-fixed.css', $v);
						phi::clog('Saving: '.$fixed,1);
						file_put_contents($fixed, $css);
					}
				}
			}
			phi::clog('Fonts Fixed',1);
		}
		public static function getFont64($ext,$url){
			$content=base64_encode(file_get_contents($url));
			$prefix='';
			switch($ext){
				case 'ttf':
					$prefix='data:font/ttf;base64,';
				break;
				case 'woff':
					$prefix='data:application/x-font-woff;charset=utf-8;base64,';
				break;
				default:
					die('invalid font type');
				break;
			}
			return $prefix.$content;
		}
		public static function get_timezone_offset($remote_tz, $origin_tz = null) {
		    if($origin_tz === null) {
		        if(!is_string($origin_tz = date_default_timezone_get())) {
		            return false; // A UTC timestamp was returned -- bail out!
		        }
		    }
		    $origin_dtz = new DateTimeZone($origin_tz);
		    $remote_dtz = new DateTimeZone($remote_tz);
		    $origin_dt = new DateTime("now", $origin_dtz);
		    $remote_dt = new DateTime("now", $remote_dtz);
		    $offset = $origin_dtz->getOffset($origin_dt) - $remote_dtz->getOffset($remote_dt);
		    return $offset;
		}
		public static function getFileConfs(){
			$data=file_get_contents(phi::$conf['root'].'/_manage/file_conf.json');
			$parser = new JsonParser();
			try {
			    $json=json_decode(json_encode($parser->parse($data)),1);
			} catch (Exception $e) {
			    $details = $e->getDetails();
			    phi::clog('Error with file: '.$filename);
			    die(json_encode($details,JSON_PRETTY_PRINT));
			}
			return $json;
		}
		public static function publish($page=false,$suppress=false,$return=false,$force=false){
			include_once(phi::$conf['root'].'/api/api.php');
			if($force) phi::clog('Forcing Rebuild!!!');
			$confs=phi::getFileConfs();
			if($page){
				//phi::clog('Processing ['.$page.']',1);
				if(isset($confs[$page])) $confs=array($page=>$confs[$page]);
				else die('Invalid page ['.$page.']');
			}
			$s3=phi::getS3();
			foreach ($confs as $id => $conf) {
				//add in
				$conf["font"]=array(
					"main"=>array(
						"name"=>FONT_NAME,
						"url"=>FONT_URL
					)
				);
				$fconf=API::getFilePaths($conf,1);
				#die(json_encode($fconf));
				if(!$suppress) phi::clog('Processing ['.$conf['display'].']',1);
				//get version conf too
				$vconf=db2::findOne(phi::$conf['dbname'],'versions',array('_id'=>$id));
				$out['templates']='';
				$out['cachedFont']='';
				$out['css']='';
				$out['js']='';
				$out['templates']='_bootloader.processTemplates("'.phi::minifile('',$fconf['templates']).'");';
				$out['templates_plain']=phi::minifile('',$fconf['templates']);
				//$out['css']=phi::minifile($conf['root'],$conf['css']);
				// die(json_encode($fconf));
				if(!$suppress) phi::clog('processing CSS',1);
				if(isset($fconf['css'])){
					foreach ($fconf['css'] as $k => $v) {
						//$files[]='"'.$conf['root'].$v.'"';
						$fc=file_get_contents($v);
						$out['sizeMap']['css'][$v]=self::objectToSize($fc,1);
						$out['css'].=$fc.'
';
					}
					//replace "fontello" paths
				}else{
					$out['css']=false;
				}
				if(isset($fconf['font'])){
					if(!$suppress) phi::clog('processing Font',1);
					foreach ($fconf['font'] as $k => $v) {
						//$files[]='"'.$conf['root'].$v.'"';
						$tc=file_get_contents($v);
						$out['sizeMap']['font'][$v]=self::objectToSize($tc,1);
						if(strpos($v, '/font/oneicon/css/oneicon.css')!==false){
							//$ttf=ROOT.'/sites/code/font/oneicon/font/oneicon.ttf';
							$ec=file_get_contents(ROOT.'/sites/code/font/oneicon/css/oneicon-embedded.css');
							$tec=explode(PHP_EOL, $ec);
							$ff=0;
							$start=0;
							$end=0;
							foreach ($tec as $tk => $tv) {
								if(strpos($tv, '@font-face')!==false){
									$ff++;
									if($ff==2){
										$start=$tk;
									}
								}
								if($start&&!$end){
									if(strpos($tv, '}')!==false){
										$end=$tk;
									}
								}
							}

							//$wc=self::getFont64('ttf',$ttf);
							$tl=explode(PHP_EOL, $tc);
							//$url=$tl[5];
							//$tl[2]='  src: url('.$wc.')';
							$overwrite=$start;
							$cc=0;
							while($overwrite<$end){
								$tl[$cc]=$tec[$overwrite];
								$overwrite++;
								$cc++;
							}
							while($cc<=7){//remove first lines!
								unset($tl[$cc]);
								$cc++;
							}
							//die(json_encode($tl));
							$tc=implode(PHP_EOL, $tl);
						}
						$out['cachedFont'].=$tc.'
';
					}
					#die($out['cachedFont']);
					$cfc=explode(PHP_EOL, $out['cachedFont']);
					foreach ($cfc as $k => $v) {
						$urls=self::getUrlsFromString($v);
						if($urls){
							$url=$urls[0];
							$urlp=explode('?', $url);
							$extp=explode('.', $urlp[0]);
							$ext=$extp[sizeof($extp)-1];
							$tp=explode($url, $v);
							$ec=self::getFont64($ext,$url);
							$nc[]=$tp[0];
							$nc[]=$ec;
							$nc[]=$tp[1];
							$cfc[$k]=implode('', $nc);
						}
					}
					$out['cachedFont']=implode(PHP_EOL, $cfc);
				}else{
					$out['css']=false;
				}
				if(isset($fconf['js'])){
					if(!$suppress) phi::clog('processing JS',1);
					$out['js']='';//clear out!
					foreach ($fconf['js'] as $k => $v) {
						$fc=file_get_contents($v);
						$out['sizeMap']['js'][$v]=self::objectToSize($fc,1);
						$out['js'].=$fc.';
';
					}
					// $exec="nodejs ".phi::$conf['root']."/node/comb.js '[".'"'.implode('","', $fconf['js']).'"'."]' 1";
					// #die($exec);
					// //if(!$suppress) phi::clog($exec,1);
					// exec($exec,$result);
					// $jsd=implode('', $result);
					// $jdp=explode('*****', $jsd);
					// $out['js']=$jdp[0];
					// $out['js_map']=$jdp[1];
					//die(json_encode($out));
					$tjs=self::objectToSize($out['js'],1);
					if($tjs<.01){
						phi::clog('Error combining JS',1);
						phi::clog($out['js'],1);
						phi::clog('exec: '.$exec,1);
						die();
					}
				}else{
					$out['js']=false;
				}
				$statichash='';
				if(isset($conf['cdn'])){
					if(!$suppress) phi::clog('processing CDN',1);
					foreach ($conf['cdn'] as $k => $v) {
						$fp=explode('/', $v);
						$name=$fp[sizeof($fp)-1];
						#die('name: '.$name. ' ' .$v);
						$conf['cdn_file'][$name]=file_get_contents($v);
						$statichash.=md5($conf['cdn_file'][$name]);
					}
				}
				$thash=$out['css'].$out['js'].$out['templates'].$statichash;
				if($out['cachedFont']) $thash.=$out['cachedFont'];
				$hash=md5($thash);
				$length=strlen($thash);
				$tbhash=$out['css'].$out['js'].$out['templates_plain'];
				if($out['cachedFont']) $tbhash.=$out['cachedFont'];
				$bhash=md5($tbhash);
				$blength=strlen($tbhash);
				if(!$return){
					if(!isset($vconf)||$vconf['hash']!=$hash||$force){
						$cmaj=$conf['majorversion'];
						if(isset($vconf['version'])){
							$cv=explode('.', $vconf['version']);
							if($cv[0]==$cmaj){
								$nv=((int) $cv[1])+1;
								$ver=$cmaj.'.'.$nv;
							}else{
								$ver=$cmaj.'.0';
							}
						}else{
							$ver=$cmaj.'.0';
						}
						$out['css']=str_replace('[app_version]', $ver, $out['css']);
						if($out['cachedFont']){
							if(!$suppress) phi::clog('Uploading Font',1);
							$s3->putObject(array(
							    'Bucket'     => phi::$conf['aws']['s3_bucket'],
							    'Key'        => 'source/'.phi::$conf['env'].'/'.$conf['id'].'/pub/'.$ver.'/font.css',
							    'Body' => $out['cachedFont'],
							    'ContentType'  => 'text/css',
							    'ACL'          => 'public-read',
							));
						}
						if($out['js']){
							if(!$suppress) phi::clog('Uploading JS',1);
							$s3->putObject(array(
							    'Bucket'     => phi::$conf['aws']['s3_bucket'],
							    'Key'        => 'source/'.phi::$conf['env'].'/'.$conf['id'].'/pub/'.$ver.'/js.js',
							    'Body' => $out['js'],
							    'ContentType'  => 'application/javascript',
							    'ACL'          => 'public-read',
							));
						}
						if(isset($out['js_map'])) $s3->putObject(array(
						    'Bucket'     => phi::$conf['aws']['s3_bucket'],
						    'Key'        => 'source/'.phi::$conf['env'].'/'.$conf['id'].'/pub/'.$ver.'/js.js.map',
						    'Body' => $out['js_map'],
						    'ContentType'  => 'application/javascript',
						    'ACL'          => 'public-read',
						));
						if(!$suppress) phi::clog('Uploading CSS',1);
						$s3->putObject(array(
						    'Bucket'     => phi::$conf['aws']['s3_bucket'],
						    'Key'        => 'source/'.phi::$conf['env'].'/'.$conf['id'].'/pub/'.$ver.'/css.css',
						    'Body' => $out['css'],
						    'ContentType'  => 'text/css',
						    'ACL'          => 'public-read',
						));
						if(!$suppress) phi::clog('Uploading Templates',1);
						$s3->putObject(array(
						    'Bucket'     => phi::$conf['aws']['s3_bucket'],
						    'Key'        => 'source/'.phi::$conf['env'].'/'.$conf['id'].'/pub/'.$ver.'/templates.js',
						    'Body' => $out['templates'],
						    'ContentType'  => 'application/javascript',
						    'ACL'          => 'public-read',
						));
						if(isset($conf['bootloader'])){
							if(!$suppress) phi::clog('Uploading App',1);
							$get=array('js'=>'js','css'=>'css','cachedFont'=>'font','templates_plain'=>'templates');
							$app='';
							foreach ($get as $k => $v) {
								if(isset($out[$k])){
									$app.='~~~~~'.$v.'~~~~~'.$out[$k];
								}
							}
							$s3->putObject(array(
							    'Bucket'     => phi::$conf['aws']['s3_bucket'],
							    'Key'        => 'source/'.phi::$conf['env'].'/'.$conf['id'].'/'.$ver.'/app.dna',
							    'Body' => $app,
							    'ContentType'  => 'application/javascript',
							    'ACL'          => 'public-read',
							));
						}
						// //also do gz
						// $cjs=phi::gzip($out['js']);
						// $s3->putObject(array(
						//     'Bucket'     => phi::$conf['aws']['s3_bucket'],
						//     'Key'        => '/source/'.phi::$conf['env'].'/'.$conf['id'].'/pub/'.$ver.'/js.js.gz',
						//     'Body' => $cjs,
						//     'ContentType'  => 'application/javascript',
						//     'ContentEncoding'=>'gzip',
						//     'ACL'          => 'public-read',
						// ));
						// $ccss=phi::gzip($out['css']);
						// $s3->putObject(array(
						//     'Bucket'     => phi::$conf['aws']['s3_bucket'],
						//     'Key'        => '/source/'.phi::$conf['env'].'/'.$conf['id'].'/pub/'.$ver.'/css.css.gz',
						//     'Body' => $ccss,
						//     'ContentType'  => 'text/css',
						//     'ContentEncoding'=>'gzip',
						//     'ACL'          => 'public-read',
						// ));
						// $ctemp=phi::gzip($out['templates']);
						// $s3->putObject(array(
						//     'Bucket'     => phi::$conf['aws']['s3_bucket'],
						//     'Key'        => '/source/'.phi::$conf['env'].'/'.$conf['id'].'/pub/'.$ver.'/templates.js.gz',
						//     'Body' => $ctemp,
						//     'ContentType'  => 'application/javascript',
						//     'ContentEncoding'=>'gzip',
						//     'ACL'          => 'public-read',
						// ));
						//also do CDN stuff!
						if(!$suppress){
							if($out['js']) $tjs=self::objectToSize($out['js'],1);
							else $tjs=0;
							$tejs=self::objectToSize($out['templates'],1);
							$tcss=self::objectToSize($out['css'],1);
							if($out['cachedFont']) $tfont=self::objectToSize($out['cachedFont'],1);
							else $tfont=0;
							// $ctjs=self::objectToSize($cjs,1);
							// $ctejs=self::objectToSize($ctemp,1);
							// $ctcss=self::objectToSize($css,1);
							$total=$tjs+$tejs+$tcss+$tfont;
							// phi::clog('~~JS ['.$tjs.' MB] gz ['.$ctjs.' MB]',1);
							// phi::clog('~~EJS ['.$tejs.' MB] gz ['.$ctejs.' MB]',1);
							// phi::clog('~~CSS ['.$tcss.' MB] gz ['.$ctcss.' MB]',1);
						}
						if(isset($conf['cdn_file'])){
							foreach ($conf['cdn_file'] as $k => $v) {
								if(!$suppress) phi::clog('~~CDN ['.$k.'] at ['.phi::objectToSize($v).']',1);
								$s3->putObject(array(
								    'Bucket'     => phi::$conf['aws']['s3_bucket'],
								    'Key'        => 'source/'.phi::$conf['env'].'/'.$conf['id'].'/pub/'.$ver.'/'.$k,
								    'Body' => $v,
								    'ContentType'  => 'application/javascript',
								    'ACL'          => 'public-read',
								));
							}
						}
						$set=array('version'=>$ver,'hash'=>$hash,'boot'=>$boot);
						if(isset($conf['bootloader'])){
							$set['boot']=array(
								'length'=>$blength,
								'hash'=>$bhash,
								'url'=>$conf['s3'].'/source/'.phi::$conf['env'].'/'.$conf['id'].'/'.$ver.'/app.dna'
							);
						}
						if(isset($out['sizeMap'])){
							$set['sizeMap']=$out['sizeMap'];
						}
						if(!$suppress){
							phi::clog('Size Map');
							$table=new LucidFrame\Console\ConsoleTable();
	        				$table->addHeader('Type')->addHeader('File')->addHeader('Percent')->addHeader('Size')->addHeader('Path');
	        				$jst=0;
	        				$totals=[
	        					'font'=>$tfont,
	        					'js'=>$tjs,
	        					'css'=>$tcss,
	        					'ejs'=>$tejs
	        				];
	        				foreach ($out['sizeMap'] as $k => $v) {
	        					foreach ($v as $tk => $tv) {
	        						$filep=explode('/',$tk);
	        						$tfp=explode('?',$filep[sizeof($filep)-1]);
	        						unset($filep[sizeof($filep)-1]);
	        						$table->addRow(array($k,$tfp[0],number_format(($tv/$totals[$k])*100,2).'%',$tv,str_replace(ROOT, '', implode('/',$filep))));
	        						// if($k=='js'){
	        						// 	$jst+=$tv;
	        						// }
	        					}
	        				}
	        				$table->display();
	        				phi::clog($conf['display']. ' [version: '.$ver.'] [size: '.$total.' MB]',1);
							if($tjs) phi::clog('~~JS ['.$tjs.' MB]',1);
							phi::clog('~~EJS ['.$tejs.' MB]',1);
							phi::clog('~~CSS ['.$tcss.' MB]',1);
							if($tfont) phi::clog('~~FONT ['.$tfont.' MB]',1);
						}
        				//phi::clog('JS '.$jst);
						//phi::clog(json_encode($out['sizeMap'],JSON_PRETTY_PRINT));
						//phi::clog('setting conf ['.json_encode($set).']',1);
						//set to version and hash to separate db, ensures it doesnt get overwritten
						$res=db2::update(phi::$conf['dbname'],'versions',array('_id'=>$conf['id']),array('$set'=>$set),array('upsert'=>true));
					}else{
						if(!$suppress) phi::clog($conf['display']. ' - APP up to Date',1);
					}
				}
				$ret['pub']=$out;
				//calculate dist folder
				$distver=(isset($vconf['distver']))?$vconf['distver']:0;
				$disthash=(isset($vconf['disthash']))?$vconf['disthash']:0;
				$rdir=phi::$conf['root'].$conf['root'].'/dist';
				if(is_dir($rdir)){
					$dir=phi::getFiles($rdir);
					if($disthash!=$dir['hash']||!$disthash||$return){//upload and incriment!
						
						$distver++;
						if(!$suppress) phi::clog($conf['id']. ' - CORE => ['.$distver.']',1);
						if($dir['files']) foreach ($dir['files'] as $k => $v){
							$uppath='source/'.phi::$conf['env'].'/'.$conf['id'].'/dist/'.$distver.str_replace($rdir, '', $v);
							$content='';
							if(isset($result)) unset($result);
							if(strpos($v, 'loader.js')!==false){//only minify the loader
								exec("nodejs ".phi::$conf['root']."/node/comb.js '[".'"'.$v.'"'."]'",$result);
								$content=implode('', $result);
							}else{
								$content=file_get_contents($v);
							}
							if(!$return){
								$s3->putObject(array(
								    'Bucket'     => phi::$conf['aws']['s3_bucket'],
								    'Key'        => $uppath,
								    'Body' => $content,
								    'ContentType'  => self::mime_content_type($v),
								    'ACL'          => 'public-read',
								));
							}else{
								//create package
								if(!isset($ret['pub'][self::mime_content_type($v,1)])) $ret['pub'][self::mime_content_type($v,1)]='';
								$ret['pub'][self::mime_content_type($v,1)].=$content;
							}
						}
						//update hash
						if(!$return){
							db2::update(phi::$conf['dbname'],'versions',array('_id'=>$conf['id']),array('$set'=>array('distver'=>$distver,'disthash'=>$dir['hash'])),array('upsert'=>true));
						}
					}else{
						if(!$suppress) phi::clog($conf['display']. ' - CORE up to date',1);					
					}
				}
				if($return) return $ret['pub'];
			}
			//ensure fonts!
			//upload fonts!
			$dir=phi::getFiles(phi::$conf['root'].'/sites/code/font');
			$vconf=db2::findOne(phi::$conf['dbname'],'versions',array('_id'=>'font'));
			if(!$vconf){
				$vconf['distver']=0;
				$vconf['disthash']='';
			}
			if($vconf['disthash']!=$dir['hash']){
				if(!$suppress) phi::clog('Fonts updated!  Uploading ['.sizeof($dir['files']).'] files to S3',1);
				$version=$vconf['distver']+1;
				foreach ($dir['files'] as $k => $v){
					$path=$v;
					$spath=str_replace(phi::$conf['root'].'/sites/code/font/', '', $path);
					$uppath='source/'.phi::$conf['env'].'/font/'.$version.'/'.$spath;
					if(!$suppress) phi::clog('uploading ['.$uppath.']',1);
					$content=file_get_contents($path);
					$s3->putObject(array(
					    'Bucket'     => phi::$conf['aws']['s3_bucket'],
					    'Key'        => $uppath,
					    'Body' => $content,
					    'ContentType'  => self::mime_content_type($v),
					    'ACL'          => 'public-read',
					));
				}
				db2::update(phi::$conf['dbname'],'versions',array('_id'=>'font'),array('$set'=>array('distver'=>$version,'disthash'=>$dir['hash'])),array('upsert'=>true));
			}else{
				if(!$suppress) phi::clog('Fonts up to date!',1);
			}
			// die(json_encode($dir));
		}
		public static function renderFileTemplate($src,$data,$put){
			if(!is_file($src)) die('invalid path: '.$src);
			$template=file_get_contents($src);
			$template=self::renderTemplate($template,$data);
            file_put_contents($put, $template);
		}
		public static function renderTemplate($template,$data){
			foreach($data as $key => $value){
                $template = str_replace('['.$key.']', $value, $template);
            }
            return $template;
		}
		public static function deleteDirectory($dir) { 
		   $files = array_diff(scandir($dir), array('.','..')); 
		    foreach ($files as $file) { 
		      (is_dir("$dir/$file")) ? self::deleteDirectory("$dir/$file") : unlink("$dir/$file"); 
		    } 
		    return rmdir($dir); 
		  } 
		public static function loadCsvData($data,$delimiter=',',$rowfn=false,$json=true){
			$rows = preg_split("/\\r\\n|\\r|\\n/", $data);
			$c=0;
			foreach ($rows as $k => $v) {
				if (preg_match_all('~(?|"([^"]*)"|\'([^\']*)\')~', $v, $matches)) { 
				    foreach($matches as $tk=>$tv){
				    	//die($tv[0]);
				    	$v=str_replace($tv[0], 'B64-'.base64_encode($tv[0]), $v);
				    }
				}
				$rd=explode($delimiter, $v);
				//unwrap row data
				foreach ($rd as $tk => $tv) {
					if(strpos($tv, 'B64-')!==false){
						$tvd=explode('-',$tv);
						$rd[$tk]=$tv=str_replace('"', '', base64_decode($tvd[1]));
						//die('tv: '.$tv);
					}
					if($k==0){
						$headers[]=$tv;
					}else{
						$rdata[$k-1][]=$tv;
					}
				}
				if($k>0&&$rowfn){
					if($rowfn($headers,$rdata[$k-1])){
						$c++;
					}else{
						//invalid row
					}
				}
			}
			if(!$rowfn){
				if($json){
					foreach ($rdata as $k => $v) {
						foreach ($v as $tk => $tv) {
							$tdata[$k][$headers[$tk]]=$tv;
						}
					}
					return $tdata;
				}else{
					$csv['headers']=$headers;
					$csv['data']=$rdata;
					return $csv;
				}
			}else{
				return $c;
			}
		}
		public static function copyDirectory($src,$dst) { 
			if(is_dir($dst)) self::deleteDirectory($dst);
			if(!is_dir($src)) die('invalid path to copy: '.$src);
		    $dir = opendir($src); 
		    @mkdir($dst); 
		    while(false !== ( $file = readdir($dir)) ) { 
		        if (( $file != '.' ) && ( $file != '..' )) {
		            if ( is_dir($src . '/' . $file) ) { 
		                self::copyDirectory($src . '/' . $file,$dst . '/' . $file); 
		            } 
		            else { 
		                copy($src . '/' . $file,$dst . '/' . $file); 
		            } 
		        } 
		    } 
		    closedir($dir); 
		} 
		public static function getByKey($arr,$key,$value){
			foreach ($arr as $k => $v) {
				if(isset($v[$key])&&$v[$key]==$value) return $v;
			}
			return false;
		}
		public static function ensureRedactorContent($content){
			// include_once(ROOT.'/classes/fixmsword.php');
			// return fixMSWord(utf8_decode($content));
			function clear_tags($str)
			{
			    return strip_tags($str, '<code><span><div><label><a><br><p><b><i>
			    <del><strike><u><img><video><audio><iframe><object><embed><param>
			    <blockquote><mark><cite><small><ul><ol><li><hr><dl><dt><dd><sup>
			    <sub><big><pre><code><figure><figcaption><strong><em>
			    <table><tr><td><th><tbody><thead><tfoot>
			    <h1><h2><h3><h4><h5><h6>');
			}
			return clear_tags($content);
		}
		public static function cleanRedactorContent($content){
			// include_once(ROOT.'/classes/fixmsword.php');
			// return fixMSWord(utf8_decode($content));
			function clear_tags($str)
			{
			    return strip_tags($str);
			}
			return clear_tags($content);
		}
		public static function isVideo($contenttype){
			$types=array('video/mp4','video/quicktime');
			if(in_array($contenttype, $types)){
				return true;
			}else{
				return false;
			}
		}
		public static function mime_content_type($filename,$returnext=false,$isValid=false) {
	        $mime_types = array(
	        	//archive
	        	'gz' => 'application/gzip',
	        	//calendar
	        	'ics'=>'text/calendar',
	        	//standard files
	            'txt' => 'text/plain',
	            'htm' => 'text/html',
	            'html' => 'text/html',
	            'php' => 'text/html',
	            'css' => 'text/css',
	            'js' => 'application/javascript',
	            'json' => 'application/json',
	            'xml' => 'application/xml',
	            'swf' => 'application/x-shockwave-flash',
	            'flv' => 'video/x-flv',
	            'ejs' => 'application/octet-stream',

	            // images
	            'png' => 'image/png',
	            'jpe' => 'image/jpeg',
	            'jpeg' => 'image/jpeg',
	            'jpg' => 'image/jpeg',
	            'gif' => 'image/gif',
	            'bmp' => 'image/bmp',
	            'ico' => 'image/vnd.microsoft.icon',
	            'tiff' => 'image/tiff',
	            'tif' => 'image/tiff',
	            'svg' => 'image/svg+xml',
	            'svgz' => 'image/svg+xml',
	             // Videos
	            'flv' => 'video/x-flv',
	            'mp4' => 'video/mp4',
	            'm3u8' => 'application/x-mpegURL',
	            'ts' => 'video/MP2T',
	            '3gp' => 'video/3gpp',
	            'mov' => 'video/quicktime',
	            'avi' => 'video/x-msvideo',
	            'wmv' => 'video/x-ms-wmv',
	            'm4v' => 'video/mp4',

	            // archives
	            'zip' => 'application/zip',
	            'rar' => 'application/x-rar-compressed',
	            'exe' => 'application/x-msdownload',
	            'msi' => 'application/x-msdownload',
	            'cab' => 'application/vnd.ms-cab-compressed',

	            // audio/video
	            'mp3' => 'audio/mpeg',
	            'qt' => 'video/quicktime',
	            'mov' => 'video/quicktime',
	            'm4a' => 'audio/m4a',

	            // adobe
	            'pdf' => 'application/pdf',
	            'psd' => 'image/vnd.adobe.photoshop',
	            'ai' => 'application/postscript',
	            'eps' => 'application/postscript',
	            'ps' => 'application/postscript',

	            // ms office
	            'doc' => 'application/msword',
	            'rtf' => 'application/rtf',
	            'xls' => 'application/vnd.ms-excel',
	            'ppt' => 'application/vnd.ms-powerpoint',

	            // open office
	            'odt' => 'application/vnd.oasis.opendocument.text',
	            'ods' => 'application/vnd.oasis.opendocument.spreadsheet',
	        );
 			//better way for getting extension
			$c=explode('.',$filename);
	        $ext = strtolower($c[sizeof($c)-1]);
	        if($isValid){
	        	if(array_key_exists($ext, $mime_types)) return true;
	        	else return false;
	        }
	        if($returnext) return $ext;
	        if (array_key_exists($ext, $mime_types)) {
	            return $mime_types[$ext];
	        }
	        else {
	            return 'application/octet-stream';
	        }
	    }
	    public static function isWebsite($url){
	    	if(strpos($url, 'mailto')!==false) return false;//mailto: link, not a website
	    	$ct=self::getContentType($url);
	    	//die('content: '.$ct);
	    	if(in_array($ct, ['text/html','nosniff'])){
	    		return true;
	    	}else{
	    		return false;
	    	}
	    }
	    public static function getContentType($url){
	    	$headers = get_headers($url);
	    	$ct='';
	    	foreach ($headers as $k => $v) {
	    		if(strpos($v, 'Content-Type')!==false){
	    			$tp=explode(':',$v);
	    			if(isset($tp[1])){
	    				$lp=explode(';',$tp[1]);
	    				$ct=trim($lp[0]);
	    			}
	    		}
	    	}
	    	return $ct;
	    }
	    public static function upload($r){
			include_once(ROOT.'/classes/Uploader.php');
			include_once(ROOT.'/classes/Uploader_cors.php');
			include_once(ROOT.'/_img/resizer.php');
			$request_body = file_get_contents('php://input');
			if($request_body){
				parse_str(urldecode($request_body),$out);
				foreach ($out as $k => $v) {
					$r['qs'][$k]=$v;
				}
			}
			$r['upload']['st']=microtime(true);
			$r['upload']['opts']['thumb']=array('width'=>100,'height'=>100,'crop'=>1);
			$r['upload']['opts']['display']=array('width'=>600,'height'=>500,'crop'=>1);
			$r['upload']['opts']['profile']=array('width'=>200,'height'=>200,'crop'=>1);
			$r['upload']['opts']['background']=array('width'=>600,'height'=>320,'crop'=>1);
			$r['upload']['opts']['full']=array('quality'=>90,'nocache'=>1,'width'=>1500,'height'=>1500);//ensure it gets sent to resizer
			$r['upload']['opts']['small']=array('quality'=>60,'nocache'=>1,'width'=>1500,'height'=>1500);//ensure it gets sent to resizer
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
		    	$r['upload']['filename']=$r['qs']['url'];
		    	$r['upload']['src']=$r['qs']['url'];
			}else if(isset($r['qs']['redactor'])){
				$dir='/tmp/';
				$filename = md5(date('YmdHis')).'.jpg';
				$file = $dir.$filename;
				move_uploaded_file($_FILES['file']['tmp_name'], $file);
				$r['upload']['src']=$file;
				$r['upload']['filename']=$filename;
				$r['upload']['path']=$r['qs']['path'];
			}else{
				if(!isset($r['qs']['path'])){
					return array('error'=>'no_path_provided');
				}else $r['upload']['path']=$r['qs']['path'];
				//process upload if file upload
				$uploader = new FileUpload('file');
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
			}
			$i	= GetImageSize($r['upload']['src']);
			if(!isset($i)||!$i) return array('error'=>'invalid_image_source');
			$r['upload']['mime']= $i['mime'];
			$mt=explode('/',$r['upload']['mime']);
			$r['upload']['ext']=$mt[1];
			$r['upload']['time']=time();
			//save it
			$r['upload']['localsrc']=ImageResizer::save($r['upload']['src']);
			$c=file_get_contents($r['upload']['localsrc']);
			$hash = substr(md5($c), 0, 10);
			$client=phi::getS3();
			$r['upload']['bucket']=phi::$conf['aws']['s3_bucket'];
			$r['upload']['fullsrc']=$hash.'/full.'.$r['upload']['ext'];
			$r['upload']['path']=(strpos($_SERVER['HTTP_HOST'], 'groupupdev')!==false)?'/d'.$r['upload']['path']:'/p'.$r['upload']['path'];
			if(in_array('full', $r['upload']['sizes'])){
				$f=ImageResizer::render($r['upload']['localsrc'],$r['upload']['opts']['full'],false);
				$result = $client->putObject(array(
				    'Bucket'     => $r['upload']['bucket'],
				    'Key'        => $r['upload']['path'].$r['upload']['fullsrc'],
				    'Body' => file_get_contents($f),
				    'ContentType'  => $r['upload']['mime'],
				    'ACL'          => 'public-read',
				));
				if(isset($f)&&is_file($f)) unlink($f);
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
				if(isset($f)&&is_file($f)) unlink($f);
			}
			if(in_array('profile', $r['upload']['sizes'])){
				$f=ImageResizer::render($r['upload']['localsrc'],$r['upload']['opts']['profile'],false);
				$result = $client->putObject(array(
				    'Bucket'     => $r['upload']['bucket'],
				    'Key'        => $r['upload']['path'].$hash.'/profile.'.$r['upload']['ext'],
				    'Body' => file_get_contents($f),
				    'ContentType'  => $r['upload']['mime'],
				    'ACL'          => 'public-read',
				));
				if(isset($f)&&is_file($f)) unlink($f);
			}
			if(in_array('small', $r['upload']['sizes'])){
				$f=ImageResizer::render($r['upload']['localsrc'],$r['upload']['opts']['small'],false);
				$result = $client->putObject(array(
				    'Bucket'     => $r['upload']['bucket'],
				    'Key'        => $r['upload']['path'].$hash.'/small.'.$r['upload']['ext'],
				    'Body' => file_get_contents($f),
				    'ContentType'  => $r['upload']['mime'],
				    'ACL'          => 'public-read',
				));
				if(isset($f)&&is_file($f)) unlink($f);
			}
			if(in_array('background', $r['upload']['sizes'])){
				$f=ImageResizer::render($r['upload']['localsrc'],$r['upload']['opts']['background'],false);
				$result = $client->putObject(array(
				    'Bucket'     => $r['upload']['bucket'],
				    'Key'        => $r['upload']['path'].$hash.'/background.'.$r['upload']['ext'],
				    'Body' => file_get_contents($f),
				    'ContentType'  => $r['upload']['mime'],
				    'ACL'          => 'public-read',
				));
				if(isset($f)&&is_file($f)) unlink($f);
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
				if(isset($f)&&is_file($f)) unlink($f);
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
				if(isset($f)&&is_file($f)) unlink($f);
			}
			if(isset($r['upload']['localsrc'])&&is_file($r['upload']['localsrc'])) unlink($r['upload']['localsrc']);
			$r['upload']['ft']=microtime(true);
			phi::log('Image process time: '.($r['upload']['ft']-$r['upload']['st']).' ms');
			return array('url'=>$r['conf']['s3'].$r['upload']['path'].$hash.'/small.'.$r['upload']['ext'],'path'=>$r['upload']['path'].$hash,'ext'=>$r['upload']['ext']);
		}
		public static function exportCSV($values,$filename='file.csv',$save=false){
			if($save){
				$out='';
				foreach ($values as $row) {
				    $row = array_map(function($cell) {
				        // Cells containing a quote, a comma or a new line will need to be 
				        // contained in double quotes.
				        if (preg_match('/["\n,]/', $cell)) {
				            // double quotes within cells need to be escaped.
				            return '"' . preg_replace('/"/', '""', $cell) . '"';
				        }
				        //wrap all items in double quotes
				        $cell='"'.$cell.'"';
				        return $cell;
				    }, $row);

				    $out.=implode(',', $row) . "\n";
				}
				#die($out);
				file_put_contents($filename, $out);
			}else{
				header("Content-type: text/csv");
				header("Content-Disposition: attachment; filename=".$filename);
				header("Pragma: no-cache");
				header("Expires: 0");
				foreach ($values as $row) {
				    $row = array_map(function($cell) {
				        // Cells containing a quote, a comma or a new line will need to be 
				        // contained in double quotes.
				        if (preg_match('/["\n,]/', $cell)) {
				            // double quotes within cells need to be escaped.
				            return '"' . preg_replace('/"/', '""', $cell) . '"';
				        }
				        //wrap all items in double quotes
				        $cell='"'.$cell.'"';
				        return $cell;
				    }, $row);

				    echo implode(',', $row) . "\n";
				}
				// $str='';
				// foreach ($values as $k => $v) {
				// 	$str.=implode(',', $v).PHP_EOL;
				// }
				// echo $str;
				die;
			}
		}
	    public static function flatten($arr){
	    	foreach ($arr as $k => $v) {
	    		$out[$k]=md5(json_encode($v));
	    	}
	    	return $out;
	    }
	    public static function getDiff($arr1,$arr2){
    		$arr1_flat=phi::flatten($arr1);
			$arr2_flat=phi::flatten($arr2);
			$added=array_diff($arr1_flat,$arr2_flat);
			$removed=array_diff($arr2_flat,$arr1_flat);
			$changed=array_merge($removed,$added);
			return $changed;
	    }
	    public static function exportjson($obj,$filename){
	    	header("Content-type: application/json");
			header("Content-Disposition: attachment; filename=".$filename);
			header("Pragma: no-cache");
			header("Expires: 0");
			phi::diejson($obj);
	    }
	    public static function diejson($obj){
	    	header('Content-Type: application/json');
	    	die(json_encode($obj));
	    }
	}
?>