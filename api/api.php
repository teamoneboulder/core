<?php
	class API{
		public static $start=0;
		public static function authCheck(){
			return true;
		}
		public static function authUser($r,$appid='',$db='one'){
			//allow option request
			if(isset($_SERVER['REQUEST_METHOD'])&&$_SERVER['REQUEST_METHOD']=='OPTIONS') return $r;//allow option requests to go thru
			if(isset($r['qs']['token'])&&$r['qs']['token']==phi::$conf['admin_token']){//internal call
				$r['auth']['internal']=true;
				if(isset($r['qs']['force_uid'])){
					$r['auth']['uid']=$r['qs']['force_uid'];
					$r['auth']['scope']='*';
					return $r;//could be anon
				}else{
					$r['auth']['uid']='ADMIN_TOKEN';
					$r['auth']['scope']='*';
					return $r;
				}
			}else if(isset($r['qs']['force_uid'])&&isset($r['qs']['appid'])){//dev request!
				//get the app
				#phi::log('Dev Request!');
				$app=db2::findOne($db,'apps',array('id'=>$r['qs']['appid']));
				if(!$app||!isset($app['dev_app'])) API::toHeaders(array('error'=>'invalid_app'));
				$u=db2::findOne($db,'user',array('id'=>$r['qs']['force_uid']));
				if(!$u) API::toHeaders(array('error'=>'invalid_force_user'));
				$r['auth']=array(
					'uid'=>$r['qs']['force_uid'],
					'scope'=>array('self::read::*'),//ensure this is read only
					'auth'=>$app
				);
				return $r;
			}else if(isset($r['qs']['token'])&&isset($r['qs']['appid'])){
				$r['auth']=db2::findOne($db,'token',array('id'=>$r['qs']['token']));
				$r['auth']['app']=db2::findOne($db,'apps',array('id'=>$r['qs']['appid']));
				if(isset($r['auth']['uid'])){
					$u=db2::findOne(DB,'user',array('id'=>$r['auth']['uid']),array('projection'=>array('roles'=>1,'blocked'=>1)));
					if(isset($u['blocked'])&&$u['blocked']){
						API::toHeaders(['error'=>'account_blocked']);
					}
					$r['auth']['scope']=self::getScopes($r['auth']['uid'],$r['auth']['app'],$u);
				}
				#die(json_encode($r['auth']));
				// if(isset($r['auth']['appid'])&&$r['auth']['appid']!=$appid){
				// 	$r['auth']=false;
				// 	//die for admi
				// 	return $r;
				// }
				return $r;//could be anon
			}else{//onon
				$r['auth']=false;
				return $r;
			}
		}
		public static function getScopes($uid,$app,$u=false){
			$scope=[];
			if(isset($app['scope'])) $scope=$app['scope'];//default scopes!??
			if(isset($app['roles'])){
				if(!$u) $u=db2::findOne(DB,'user',array('id'=>$uid),array('projection'=>array('roles'=>1)));
				$roles=(isset($u['roles']))?$u['roles']:[];
				$access=[];
				foreach ($app['roles'] as $k => $v) {
					if(in_array($k, $roles)){
						foreach ($v as $tr => $role) {
							if(!in_array($role, $access)) $access[]=$role;
						}
					}
				}
				#die(json_encode($access));
				$scope=$access;
			}
			// if(isset($app['scopes'])){//special perms!
			// 	if(isset($app['scopes'][$uid])){
			// 		$scope=$app['scopes'][$uid];
			// 		if(isset($app['scope'])){
			// 			$scope=array_values(array_merge($app['scope'],$scope));
			// 		}
			// 	}else{
			// 		if(isset($app['byList'])) return false;
			// 		$scope=($scopes)?$scopes:$app['scope'];
			// 	}
			// }else{
			// 	if(isset($app['byList'])) return false;
			// 	$scope=($scopes)?$scopes:$app['scope'];
			// }
			if(isset($app['availableScopes'])){
				$setscopes=false;
				foreach ($scope as $k => $v) {
					if(in_array($v, $app['availableScopes'])){
						$setscopes[]=$v;
					}else{
						phi::log('invalid Scope! ['.$app['id'].'] ['.$app['name'].'] ['.$v.']');
					}
				}
				if(!$setscopes){
					// phi::log('no valid scopes set!');
					// phi::log('request');
					return [];
				}
				$scope=$setscopes;
			}else{
				phi::log('availableScopes not set for app ['.$app['id'].'] ['.$app['name'].']');
			}
			if(!$scope) $scope=[];
			return $scope;
		}
		public static function isInternal($r){
			if($r['qs']['token']==phi::$conf['admin_token']) return true;
			return false;
		} 
		public static function getBrowser($u_agent) { 
			if(!$u_agent) return 'Not Set';
			    $data = array(
			        'p' => null, // platform
			        'n'  => null, // browser name
			        'v'  => null, // version
			        'd' => 0 // 0 = desktop, 1 = mobile, 2 = tablet
			    );
			    
			    // special for TCS agents
			  	if(strpos(" ".$u_agent,'Dalvik')) $u_agent='Mozilla/5.0 (Linux; U; Android 4.0.3; de-ch; HTC Sensation Build/IML74K) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30';// make android
			  	if(strpos(" ".$u_agent,'Darwin')) $u_agent='Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_3_2 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8H7 Safari/6533.18.5';// make iphone
			  	#pi::log('XYZ-got here for agent:'.$u_agent);

			    $mobilePlatforms=array('BlackBerry','iPhone','Windows Phone OS','Android','PlayStation Vita','Nintendo 3DS');
			    $tabletPlatforms=array('iPad','Kindle','Kindle Fire','Playbook');
			    if(!$u_agent) return $data;
			    
			    /*---------START LIBRARY FROM https://github.com/donatj/PhpUserAgent/blob/master/Source/UserAgentParser.php -------*/
		     	$platform = null;
		        $browser  = null;
		        $version  = null;

		        $empty = array( 'p' => $platform, 'b' => $browser, 'v' => $version );

		        if( !$u_agent ) return $empty;

		        if( preg_match('/\((.*?)\)/im', $u_agent, $parent_matches) ) {

		                preg_match_all('/(?P<platform>Android|CrOS|iPhone|iPad|Linux|Macintosh|Windows(\ Phone\ OS)?|Silk|linux-gnu|BlackBerry|PlayBook|Nintendo\ (WiiU?|3DS)|Xbox)
		                        (?:\ [^;]*)?
		                        (?:;|$)/imx', $parent_matches[1], $result, PREG_PATTERN_ORDER);

		                $priority           = array( 'Android', 'Xbox' );
		                $result['platform'] = array_unique($result['platform']);
		                if( count($result['platform']) > 1 ) {
		                        if( $keys = array_intersect($priority, $result['platform']) ) {
		                                $platform = reset($keys);
		                        } else {
		                                $platform = $result['platform'][0];
		                        }
		                } elseif( isset($result['platform'][0]) ) {
		                        $platform = $result['platform'][0];
		                }
		        }

		        if( $platform == 'linux-gnu' ) {
		                $platform = 'Linux';
		        } elseif( $platform == 'CrOS' ) {
		                $platform = 'Chrome OS';
		        }

		        preg_match_all('%(?P<browser>Camino|Kindle(\ Fire\ Build)?|Firefox|Iceweasel|Safari|MSIE|Trident/.*rv|AppleWebKit|Chrome|IEMobile|Opera|OPR|Silk|Lynx|Midori|Version|Wget|curl|NintendoBrowser|PLAYSTATION\ (\d|Vita)+)
		                        (?:\)?;?)
		                        (?:(?:[:/ ])(?P<version>[0-9A-Z.]+)|/(?:[A-Z]*))%ix',
		                $u_agent, $result, PREG_PATTERN_ORDER);


		        // If nothing matched, return null (to avoid undefined index errors)
		        if( !isset($result['browser'][0]) || !isset($result['version'][0]) ) {
		                return $empty;
		        }

		        $browser = $result['browser'][0];
		        $version = $result['version'][0];

		        $find = function ( $search, &$key ) use ( $result ) {
		                $xkey = array_search(strtolower($search),array_map('strtolower',$result['browser']));
		                if( $xkey !== false ) {
		                        $key = $xkey;

		                        return true;
		                }

		                return false;
		        };

		        $key = 0;
		        if( $browser == 'Iceweasel' ) {
		                $browser = 'Firefox';
		        }elseif( $find('Playstation Vita', $key) ) {
		                $platform = 'PlayStation Vita';
		                $browser  = 'Browser';
		        } elseif( $find('Kindle Fire Build', $key) || $find('Silk', $key) ) {
		                $browser  = $result['browser'][$key] == 'Silk' ? 'Silk' : 'Kindle';
		                $platform = 'Kindle Fire';
		                if( !($version = $result['version'][$key]) || !is_numeric($version[0]) ) {
		                        $version = $result['version'][array_search('Version', $result['browser'])];
		                }
		        } elseif( $find('NintendoBrowser', $key) || $platform == 'Nintendo 3DS' ) {
		                $browser = 'NintendoBrowser';
		                $version = $result['version'][$key];
		        } elseif( $find('Kindle', $key) ) {
		                $browser  = $result['browser'][$key];
		                $platform = 'Kindle';
		                $version  = $result['version'][$key];
		        } elseif( $find('OPR', $key) ) {
		                $browser = 'Opera Next';
		                $version = $result['version'][$key];
		        } elseif( $find('Opera', $key) ) {
		                $browser = 'Opera';
		                $find('Version', $key);
		                $version = $result['version'][$key];
		        }elseif ( $find('Chrome', $key) ) {
		                $browser = 'Chrome';
		                $version = $result['version'][$key];
		        } elseif( $find('Midori', $key) ) {
		                $browser = 'Midori';
		                $version = $result['version'][$key]; 
		        } elseif( $browser == 'AppleWebKit' ) {
		                if( ($platform == 'Android' && !($key = 0)) ) {
		                        $browser = 'Android Browser';
		                } elseif( $platform == 'BlackBerry' || $platform == 'PlayBook' ) {
		                        $browser = 'BlackBerry Browser';
		                } elseif( $find('Safari', $key) ) {
		                        $browser = 'Safari';
		                }

		                $find('Version', $key);

		                $version = $result['version'][$key];
		        } elseif( $browser == 'MSIE' || strpos($browser, 'Trident') !== false ) {
		                if( $find('IEMobile', $key) ) {
		                        $browser = 'IEMobile';
		                } else {
		                        $browser = 'MSIE';
		                        $key     = 0;
		                }
		                $version = $result['version'][$key];
		        } elseif( $key = preg_grep("/playstation \d/i", array_map('strtolower', $result['browser']))) {
		                $key = reset($key);

		                $platform = 'PlayStation ' . preg_replace('/[^\d]/i', '', $key);
		                $browser  = 'NetFront';
		        }
	        	/*------------END LIB------------ */

			  $data['n']=$browser;
			  $data['p']=$platform;
			  $data['v']=$version;

			if(in_array($data['p'], $mobilePlatforms)) $data['d']=1;
			if(in_array($data['p'], $tabletPlatforms)) $data['d']=2;
		    return $data;
		}
		public static function parseRequest($force=false){
			$server=$_SERVER;
			if(API::authCheck()){
				if(isset($_SERVER))
				//$r is the request object
				//in dev env, allow path to be passes in url
				$r['qsa']=$server['QUERY_STRING'];
				$path=explode('?', $server['REQUEST_URI']);
				$r['request_path']=$path[0];
				if(isset($path[1])){
					if($r['qsa']&&strlen($r['qsa'])>0) $r['qsa'].='&'.$path[1];
					else $r['qsa']=$path[1];
				}
				parse_str($r['qsa'],$r['qs']);
				if(phi::$conf['env']=='local') $server['REQUEST_URI']=str_replace('/localapi', '', $server['REQUEST_URI']);
				if(!phi::$conf['prod']&&!isset($_POST['path'])) $r['path']=explode('/',$path[0]);
				else $r['path']=explode('/',$path[0]);
				if($r['path'][1]=='api'){//fix
					unset($r['path'][1]);
					$r['path']=array_values($r['path']);
				}
				$r['data']=(isset($_POST['postdata']))?$_POST['postdata']:false;
				if($_REQUEST){
					foreach ($_REQUEST as $k => $v) {
						$r['qs'][$k]=$v;
					}
				}
				if($_POST){
					foreach ($_POST as $k => $v) {
						$r['qs'][$k]=$v;
					}
				}
				$request_body = file_get_contents('php://input');
				if($request_body){
					$req = json_decode($request_body,1);
					if($req&&(is_array($req)||is_object($req))) foreach ($req as $k => $v) {
						#phi::log('add: '.$k);
						$r['qs'][$k]=$v;
					}
				}
				$_REQUEST=$r['qs'];//fix
				if(!isset($r['qs'])||!is_array($r['qs'])) $r['qs']=array();
				if(isset($r['qs']['_use_request'])&&!$force){
					$r=$r['qs']['_use_request'];;
					if(isset($r['qs']['_admindebug'])) phi::$adminDebug=true;
					return $r;
				}
				if(isset($r['qs']['_admindebug'])) phi::$adminDebug=true;
				if(isset($_SERVER['HTTP_AUTHORIZATION'])){//add in authorization header
					$token=str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']);
					$u=db2::findOne(DB,'token',array('id'=>$token));
					if(!$u) return array('error'=>'invalid_authorization');
					$r['qs']['token']=$token;
					$r['qs']['appid']=$u['appid'];
				}

				//post detect
				if(isset($r['qs']['callback'])) $r['type']='jsonp';
				if(isset($r['qs']['_force_internal_ip'])&&!$force){
					if($_SERVER['SERVER_ADDR']!=$r['qs']['_force_internal_ip']){
						$type=$_SERVER['REQUEST_METHOD'];
						$url='http://'.$r['qs']['_force_internal_ip'].'/command/api';
						$_REQUEST['callback']='';//clear this out
						$r['qs']['callback']='';//enture it returns as json
						$send=array(
							'_use_request'=>$r,
							'admin_token'=>phi::$conf['admin_token']
						);
						$resp=phi::curl($url,$send,false,$type);
						if(isset($resp['body'])) die($resp['body']);
						API::toHeaders($resp);
					}
				}
				if(isset($r['qs']['_base64'])){
					$r['qs']=json_decode(base64_decode($r['qs']['_base64']),1);
					#phi::log('Decode! '.json_encode($r['qs']));
				}
	 			return $r;
 			}else{
				API::toHeaders(array('error'=>'not_authorized'));
			}
		}
		public static function saveJsError($r){
			$mt=microtime(true);
			$ms=explode('.', $mt);
			if(!isset($ms[1])) $ms[1]=0;
			$msg=(isset($r['qs']['message']))?$r['qs']['message']:'';
			$stack=(isset($r['qs']['stack']))?$r['qs']['stack']:'';
			$version=(isset($r['qs']['app_version']))?$r['qs']['app_version']:'';
			$build=(isset($r['qs']['build_version']))?$r['qs']['build_version']:'';
			$obj=array(
				'msg'=>$msg,
				'stack'=>$stack,
				'type'=>'jserror',
				'ts'=>time(),
				'mts'=>(int) $ms[1]
			);
			if($version){
				$obj['app_version']=$version;
			}
			if($build){
				$obj['build_version']=$build;
			}
			if(isset($r['qs']['device'])&&$r['qs']['device']){
				$obj['device']=$r['qs']['device'];
			}
			if(isset($r['auth']['uid'])&&$r['auth']['uid']) $obj['uid']=$r['auth']['uid'];//based on token
			if(isset($r['qs']['uid'])&&$r['qs']['uid']) $obj['uid']=$r['qs']['uid'];
			if(isset($r['qs']['did'])&&$r['qs']['did']) $obj['did']=$r['qs']['did'];
			if(isset($r['qs']['location'])&&$r['qs']['location']) $obj['url']=$r['qs']['location'];
			$obj['ua']=$_SERVER['HTTP_USER_AGENT'];
			if(isset($obj['uid'])&&$obj['uid']=='UAJDVLF4O8EN') return ['error'=>'blocked'];
			$obj['ua_info']=self::getBrowser($obj['ua']);
			if(!phi::$conf['prod']) $obj['dev']=1;
			$resp=db2::save(DB,'log',$obj);
			#die(var_dump($resp));
			return array('success'=>true);
		}
		public static function checkLocation($loc){
			//ensure location is valid
			if($loc!='boulder-co') API::toHeaders(array('error'=>'location_unknown'));}
		public static function toHeaders($out,$callback=false){
			if((isset($_REQUEST['callback'])&&$_REQUEST['callback'])||$callback){
				header('Content-Type:application/javascript');
				if(is_string($out)){
					if($callback) die($callback.'('.$out.');');
				    else die($_REQUEST['callback'].'('.$out.');');
				}else{
					if($callback) die($callback.'('.json_encode($out).');');
				    else die($_REQUEST['callback'].'('.json_encode($out).');');
				}
			}else{
				header('Content-Type:application/json');
				if(is_string($out)){
					die($out);
				}else{
					die(json_encode($out));
				}
			}}
		public static function getFileConf($path,$internal=false){
			$confs=json_decode(file_get_contents(phi::$conf['root'].'/_manage/file_conf.json'),1);
			if(!isset($confs[$path])){
				if($internal) return false;
				else API::toHeaders(array('error'=>'invalid app','app'=>$path));
			}
			$conf=$confs[$path];
			//add in Font info, global across app
			$conf["font"]=array(
				"main"=>array(
					"name"=>FONT_NAME,
					"url"=>FONT_URL
				)
			);
	    	return $conf;
		}
		public static function getDNA($type,$name,$minify=false){
			switch($type){
				case 'js':
					$base_path=ROOT.'/sites/code/'.$type.'/'.$name;
					if(is_file($base_path)) $js_code=file_get_contents($base_path);
					if($js_code){
						$out.='~~~~~js~~~~~'.$js_code;
					}
					if($minify){
						return $out;
					}else{
						header('Content-Type: text/html');
						die($out);
					}
				break;
				case 'module':
					$base_path=ROOT.'/sites/code/'.$type.'/'.$name;
					$js=$base_path.'/'.$name.'.js';
					$css=$base_path.'/'.$name.'.css';
					$template=$base_path.'/'.$name.'.templates';
					//make DNA!!!
					$js_code='';
					$css_code='';
					$template_code='';
					if(is_file($js)) $js_code=file_get_contents($js);
					if(is_file($css)) $css_code=file_get_contents($css);
					if(is_file($template)) $template_code=file_get_contents($template);
					$out='';
					//die($js);
					if($js_code){
						$out.='~~~~~js~~~~~'.$js_code;
					}
					if($css_code){
						$out.='~~~~~css~~~~~'.$css_code;
					}
					if($template_code){
						$out.='~~~~~templates~~~~~'.addslashes($template_code);
					}
					//header('Access-Control-Allow-Origin: *');
					if($minify){
						return $out;
					}else{
						header('Content-Type: text/html');
						die($out);
					}
				break;
			}
		}
		public static function getFilePaths($conf,$relative=false){
			$codedir=phi::$conf['root'].'/sites/code';
			if($relative){
				$cpath=phi::$conf['root'].'/sites/code';
				if(isset($conf['rootdir'])){
					$ppath=$conf['rootdir'].$conf['root'];
				}else{
					$ppath=phi::$conf['root'].$conf['root'];
				}
			}else{
				$cpath='https://code.'.phi::$conf['domain'];
				if(isset($conf['subdomain'])&&$conf['subdomain']){
					$ppath='https://'.$conf['subdomain'].'.'.phi::$conf['domain'];
				}else{
					$ppath='https://'.phi::$conf['domain'];
				}
			}
			if(isset($conf['web'])){
				if(isset($conf['web']['js'])){
					foreach ($conf['web']['js'] as $k => $v) {
						$out['web_js'][]=$cpath.'/js/'.$v;
					}
				}
			}
			if(isset($conf['font'])){
				foreach ($conf['font'] as $k => $v) {
					$conf['shared']['font'][]=$v['url'];
				}
			}
			if(isset($conf['shared'])){
				if(isset($conf['shared']['js'])){
					foreach ($conf['shared']['js'] as $k => $v) {
						$out['js'][]=$cpath.'/js/'.$v;
					}
				}
				if(isset($conf['shared']['css'])){
					foreach ($conf['shared']['css'] as $k => $v) {
						$out['css'][]=$cpath.'/css/'.$v;
					}
				}
				if(isset($conf['shared']['font'])){
					foreach ($conf['shared']['font'] as $k => $v) {
						if(strpos($v, 'https://')===false){//internal
							$out['font'][]=$cpath.'/font/'.$v;
						}else{//external
							$out['font'][]=$v;
						}
					}
				}
				if(isset($conf['shared']['modules'])){
					foreach ($conf['shared']['modules'] as $k => $v) {
						if(is_dir($codedir.'/module/'.$v)){
							if(is_file($codedir.'/module/'.$v.'/'.$v.'.js')){
								$out['js'][]=$cpath.'/module/'.$v.'/'.$v.'.js';
							}
							if(is_file($codedir.'/module/'.$v.'/'.$v.'.css')){
								$out['css'][]=$cpath.'/module/'.$v.'/'.$v.'.css';
							}
							if(is_file($codedir.'/module/'.$v.'/'.$v.'.templates')){
								$out['templates'][]=ROOT.'/sites/code/module/'.$v.'/'.$v.'.templates';
							}
						}else{
							self::toHeaders(array('error'=>'invalid shared module ['.$v.']'));
						}
					}
				}
				if(isset($conf['shared']['apps'])){
					foreach ($conf['shared']['apps'] as $k => $v) {
						if(is_dir($codedir.'/app/'.$v)){
							if(is_file($codedir.'/app/'.$v.'/'.$v.'.js')){
								$out['js'][]=$cpath.'/app/'.$v.'/'.$v.'.js';
							}
							if(is_file($codedir.'/app/'.$v.'/'.$v.'.css')){
								$out['css'][]=$cpath.'/app/'.$v.'/'.$v.'.css';
							}
							if(is_file($codedir.'/app/'.$v.'/'.$v.'.templates')){
								$out['templates'][]=ROOT.'/sites/code/app/'.$v.'/'.$v.'.templates';
							}
						}else{
							self::toHeaders(array('error'=>'invalid shared app ['.$v.']'));
						}
					}
				}
				if(isset($conf['shared']['web'])){
					foreach ($conf['shared']['web'] as $k => $v) {
						if(is_dir($codedir.'/web/'.$v)){
							if(is_file($codedir.'/web/'.$v.'/'.$v.'.js')){
								$out['js'][]=$cpath.'/web/'.$v.'/'.$v.'.js';
							}
							if(is_file($codedir.'/web/'.$v.'/'.$v.'.css')){
								$out['css'][]=$cpath.'/web/'.$v.'/'.$v.'.css';
							}
							if(is_file($codedir.'/web/'.$v.'/'.$v.'.templates')){
								$out['templates'][]=ROOT.'/sites/code/web/'.$v.'/'.$v.'.templates';
							}
						}else{
							self::toHeaders(array('error'=>'invalid shared web ['.$v.']'));
						}
					}
				}
				if(isset($conf['shared']['ui'])){
					$out['js'][]=$cpath.'/ui/uimanager.js';
					foreach ($conf['shared']['ui'] as $k => $v) {
						if(is_dir($codedir.'/ui/'.$v)){
							if(is_file($codedir.'/ui/'.$v.'/'.$v.'.js')){
								$out['js'][]=$cpath.'/ui/'.$v.'/'.$v.'.js';
							}
							if(is_file($codedir.'/ui/'.$v.'/'.$v.'.css')){
								$out['css'][]=$cpath.'/ui/'.$v.'/'.$v.'.css';
							}
							if(is_file($codedir.'/ui/'.$v.'/'.$v.'.templates')){
								$out['templates'][]=ROOT.'/sites/code/ui/'.$v.'/'.$v.'.templates';
							}
						}else{
							self::toHeaders(array('error'=>'invalid shared ui ['.$v.']'));
						}
					}
				}
				if(isset($conf['templates'])){
					foreach ($conf['templates'] as $k => $v) {
						$out['templates'][]=$ppath.$v;
					}
				}
				if(isset($conf['js'])){
					foreach ($conf['js'] as $k => $v) {
						$out['js'][]=$ppath.$v;
					}
				}
				if(isset($conf['css'])){
					foreach ($conf['css'] as $k => $v) {
						$out['css'][]=$ppath.$v;
					}
				}
			}
			//die(json_encode($out));
			//testing
			//die(json_encode($out));
			return $out;
		}
		public static function loadDevFiles($r){//needs bundling...
			$conf=self::getFileConf($r['path'][2]);
			if($conf){
				$fconf=self::getFilePaths($conf);
				$code='';
				switch ($r['path'][3]) {
					case 'templates':
						header('Content-Type: application/javascript');
						$code=phi::minifile(phi::$conf['root'],$fconf['templates']);
					break;
					case 'js':
						header('Content-Type: application/javascript');
						foreach ($fconf['js'] as $k => $v) {
							$code.=file_get_contents($v);
						}
					break;
					default:
						die('invalid type');
					break;
				}
				die($code);
			}
		}
		public static function getConf($r){
			$page=$r['path'][2];
			if(isset($r['path'][3])&&$r['path'][3]=='branches'){
				return [
					'success'=>true,
					'data'=>db2::toOrderedList(db2::find(DB,'versions',['conf.key'=>$page,'conf.branch'=>['$exists'=>true]])) 
				];
			}
			//for testing combine to production
			$nocomb=false;
			if(isset($r['qs']['nocomb'])) $nocomb=true;
			$pg=(isset($r['qs']['phonegap']))?(int) $r['qs']['phonegap']:false;
			if($page){
				$conf=self::getFileConf($page);
				if(isset($r['qs']['flower_id'])&&$r['qs']['flower_id']=='actualize'){
					$conf['mediaquery']=['phone'=>'actualize','web'=>'actualize'];
				}
				if(isset($r['qs']['flower_id'])&&$r['qs']['flower_id']=='editor'){
					$conf['mediaquery']=['phone'=>'editor','web'=>'editor'];
				}
				if(isset($r['qs']['bootloader'])&&$r['qs']['bootloader']==2&&isset($conf['simple_core'])){
					$conf=self::getFileConf($conf['simple_core']);
					$page=$conf['simple_core'];
				}
				if(isset($conf['mediaquery'])&&isset($r['qs']['clientWidth'])){
					$w=(int) $r['qs']['clientWidth'];
					$type='';
					switch(true){
						case $w<700:
							$type='phone';
						break;
						case $w>=700:
							$type='web';
						break;
					}
					if($pg){
						$type='phone';
					}
					if(isset($conf['mediaquery'][$type])) $r['qs']['flower_id']=$conf['flower_id']=$conf['mediaquery'][$type];
					if(!isset($r['qs']['flower_id'])) $r['qs']['flower_id']=$conf['flower_id'];
				}
				if(isset($r['qs']['branch'])){
					$vconf=db2::findOne(DB,'versions',array("_id"=>$page.'_'.$r['qs']['branch']));
					//still fall back if not found
					if(!$vconf) $vconf=db2::findOne(DB,'versions',array("_id"=>$page));
				}else if(isset($r['qs']['flower_branch'])){
					$vconf=db2::findOne(DB,'versions',array("_id"=>$page.'_'.$r['qs']['flower_branch']));
					//still fall back if not found
					if(!$vconf) $vconf=db2::findOne(DB,'versions',array("_id"=>$page));
				}else{
					//try new
					$vconf=db2::findOne(DB,'versions',array("_id"=>$page.'_master'));
					//legacy
					if(!$vconf) $vconf=db2::findOne(DB,'versions',array("_id"=>$page));
				}
				$fconf=db2::findOne(DB,'versions',array("_id"=>'font'));
				if($conf){
					if((!phi::$conf['prod']&&!FORCE_COMBINE||$nocomb)&&!isset($r['qs']['combined'])){ //always rebuild
						$out=self::getFilePaths($conf);
						$out['templates']=phi::minifile('',$out['templates']);
						if(isset($r['qs']['bootloader'])){
							if($r['qs']['bootloader']<4){
								$loadkey=(isset($conf['core_conf']))?'app':'loader';
								$out[$loadkey]=array(
									'key'=>$loadkey
								);
								if(!isset($conf['entry'])&&$loadkey=='loader') die(json_encode(array('error'=>'entry not set')));
								$out[$loadkey]['entry']=$conf['entry'];
								if(isset($out['js'])){
									$out[$loadkey]['urls']['js']=$out['js'];
									unset($out['js']);
								}
								if(isset($out['css'])){
									$out[$loadkey]['urls']['css']=$out['css'];
									unset($out['css']);
								}
								if(isset($out['font'])){
									foreach ($out['font'] as $k => $v) {
										$out[$loadkey]['urls']['css'][]=$v;
									}
									unset($out['font']);
								}
								if(isset($out['templates'])){
									$out[$loadkey]['templates']=$out['templates'];
									unset($out['templates']);
								}
								if(($r['qs']['bootloader']==2&&isset($conf['cache_libraries_id']))||($r['qs']['bootloader']==4&&isset($conf['cache_libraries_id'])&&!$pg)){
									$loadkey='libraries';
									$out2=self::getFilePaths(self::getFileConf($conf['cache_libraries_id']));
									$out[$loadkey]=array(
										'key'=>$loadkey
									);
									if(isset($out2['js'])){
										$out[$loadkey]['urls']['js']=$out2['js'];
									}
									if(isset($out2['css'])){
										$out[$loadkey]['urls']['css']=$out2['css'];
									}
									if(isset($out2['font'])){
										foreach ($out2['font'] as $k => $v) {
											$out[$loadkey]['urls']['css'][]=$v;
										}
									}
									if(isset($out2['templates'])){
										$out2['templates']=phi::minifile('',$out2['templates']);
										$out[$loadkey]['templates']=$out2['templates'];
									}
								}
							}
							if($r['qs']['bootloader']==4){
								$loadkey=(isset($conf['core_conf']))?'app':'loader';
								$out[$loadkey]=array(
									'key'=>$loadkey
								);
								if(!isset($conf['entry'])&&$loadkey=='loader') die(json_encode(array('error'=>'entry not set')));
								$out[$loadkey]['entry']=$conf['entry'];
								if(isset($out['js'])){
									$out[$loadkey]['urls']['js']=$out['js'];
									unset($out['js']);
								}
								if(isset($out['css'])){
									$out[$loadkey]['urls']['css']=$out['css'];
									unset($out['css']);
								}
								if(isset($out['font'])){
									foreach ($out['font'] as $k => $v) {
										$out[$loadkey]['urls']['css'][]=$v;
									}
									unset($out['font']);
								}
								if(isset($out['templates'])){
									$out[$loadkey]['templates']=$out['templates'];
									unset($out['templates']);
								}
								if(isset($conf['cache_core_id'])){
									$loadkey='core';
									$out2=self::getFilePaths(self::getFileConf($conf['cache_core_id']));
									$out[$loadkey]=array(
										'key'=>$loadkey
									);
									if(isset($out2['js'])){
										$out[$loadkey]['urls']['js']=$out2['js'];
									}
									if(isset($out2['css'])){
										$out[$loadkey]['urls']['css']=$out2['css'];
									}
									if(isset($out2['font'])){
										foreach ($out2['font'] as $k => $v) {
											$out[$loadkey]['urls']['css'][]=$v;
										}
									}
									if(isset($out2['templates'])){
										$out2['templates']=phi::minifile('',$out2['templates']);
										$out[$loadkey]['templates']=$out2['templates'];
									}
								}
								if(isset($conf['cache_libraries_id'])&&!$pg){
									$loadkey='libraries';
									$out2=self::getFilePaths(self::getFileConf($conf['cache_libraries_id']));
									$out[$loadkey]=array(
										'key'=>$loadkey
									);
									if(isset($out2['js'])){
										$out[$loadkey]['urls']['js']=$out2['js'];
									}
									if(isset($out2['css'])){
										$out[$loadkey]['urls']['css']=$out2['css'];
									}
									if(isset($out2['font'])){
										foreach ($out2['font'] as $k => $v) {
											$out[$loadkey]['urls']['css'][]=$v;
										}
									}
									if(isset($out2['templates'])){
										$out2['templates']=phi::minifile('',$out2['templates']);
										$out[$loadkey]['templates']=$out2['templates'];
									}
									//die(json_encode($out['libraries']));
								}
							}
						}
						//die(json_encode($out));
						// if(isset($out['templates'])) $out['templates']='https://api.'.phi::$conf['domain'].'/files/'.$page.'/templates';
						// if(isset($out['css'])) $out['css']='https://api.'.phi::$conf['domain'].'/files/'.$page.'/css';
						// if(isset($out['js'])) $out['js']='https://api.'.phi::$conf['domain'].'/files/'.$page.'/js';
						// if(isset($out['font'])) $out['font']='https://api.'.phi::$conf['domain'].'/files/'.$page.'/font';
						if(isset($conf['cdn'])){
							$out['static']=$conf['cdn'];
						}
					}else{
						if(!isset($vconf['version'])){
							//publish
							//die('publish');
							phi::publish($page,1);
							$vconf=db2::findOne(DB,'versions',array("_id"=>$page));
							//die(json_encode($conf));
						}
						if(isset($r['qs']['ver'])) $vconf['version']=$r['qs']['ver'];
						if(isset($r['qs']['bootloader'])){
							$out['loader']=array(
								'key'=>$conf['id'],
								'combined'=>1,
								'url'=>$conf['s3'].'/source/'.phi::$conf['env'].'/'.$conf['id'].'/'.$vconf['version'].'/app.dna',
								'type'=>'dna',
								'length'=>$vconf['boot']['length'],
								'hash'=>$vconf['hash']
							);
							$hash=$vconf['boot']['hash'];
							if(isset($conf['entry'])){
								$out['loader']['entry']=$conf['entry'];
							}
							if(isset($r['qs']['flower_id'])){
								if(isset($r['qs']['flower_branch'])&&$r['qs']['flower_branch']){
									//if($r['qs']['flower_id']=='actualize'&&$r['qs']['flower_branch']=='master') $r['qs']['flower_branch']='actualize';
									$app_ver=db2::findOne(DB,'versions',array('_id'=>$r['qs']['flower_id'].'_'.$r['qs']['flower_branch']));
									//die(json_encode(array('_id'=>$r['qs']['flower_id'].'_'.$r['qs']['flower_branch'])));
									#die($r['qs']['flower_id'].'_'.$r['qs']['flower_branch']);
									if(!$app_ver) $app_ver=db2::findOne(DB,'versions',array('_id'=>$r['qs']['flower_id']));
								}else{
									$app_ver=db2::findOne(DB,'versions',array('_id'=>$r['qs']['flower_id']));
								}
								//die(json_encode($app_ver));
								if(!$app_ver) return array('error'=>'No published code found for ['.$r['qs']['flower_id'].'] ['.$r['qs']['flower_branch'].']');
								$out['app']=$app_ver['conf'];
								$hash.='_'.$app_ver['conf']['hash'];
							}
							if((int) $r['qs']['bootloader']==2){//bootloader 3 and on have libraries in app
								if(isset($conf['libraries_id'])){
									$app_ver=db2::findOne(DB,'versions',array('_id'=>$conf['libraries_id']));
									if(!$app_ver) return array('error'=>'invalid_libraries_id ['.$r['qs']['libraries_id'].']');
									$out['libraries']=array(
										'key'=>$conf['libraries_id'],
										'combined'=>1,
										'url'=>$conf['s3'].'/source/'.phi::$conf['env'].'/'.$conf['libraries_id'].'/'.$app_ver['version'].'/app.dna',
										'type'=>'dna',
										'length'=>$app_ver['boot']['length'],
										'hash'=>$app_ver['hash']
									);
									$hash.='_'.$app_ver['boot']['hash'];
								}
							}
							if((int) $r['qs']['bootloader']==4&&!$pg){//bootloader 3 and on have libraries in app
								if(isset($conf['libraries_id'])){
									$app_ver=db2::findOne(DB,'versions',array('_id'=>$conf['libraries_id']));
									if(!$app_ver) return array('error'=>'invalid_libraries_id ['.$r['qs']['libraries_id'].']');
									$out['libraries']=array(
										'key'=>$conf['libraries_id'],
										'combined'=>1,
										'url'=>$conf['s3'].'/source/'.phi::$conf['env'].'/'.$conf['libraries_id'].'/'.$app_ver['version'].'/app.dna',
										'type'=>'dna',
										'length'=>$app_ver['boot']['length'],
										'hash'=>$app_ver['hash']
									);
									$hash.='_'.$app_ver['boot']['hash'];
								}
							}
						}else if(isset($r['qs']['dev'])){
							//die(json_encode($vconf));
							$out['conf']=$vconf['conf'];
							//die('here');
						}else{
							if(isset($r['qs']['returntemplates'])){
								$tout=self::getFilePaths($conf);
								$out['templates']=phi::minifile('',$tout['templates']);
							}else{
								$out['templates']=$conf['s3'].'/source/'.phi::$conf['env'].'/'.$conf['id'].'/pub/'.$vconf['version'].'/templates.js';
							}
							$out['js']=$conf['s3'].'/source/'.phi::$conf['env'].'/'.$conf['id'].'/pub/'.$vconf['version'].'/js.js';
							$out['css']=$conf['s3'].'/source/'.phi::$conf['env'].'/'.$conf['id'].'/pub/'.$vconf['version'].'/css.css';
							$out['cachedFont']=$conf['s3'].'/source/'.phi::$conf['env'].'/'.$conf['id'].'/pub/'.$vconf['version'].'/font.css';
							if(isset($conf['font'])){
								$out['font'][]=$conf['font']['main']['url'];
							}
							if(isset($conf['shared']['font'])){
								foreach ($conf['shared']['font'] as $k => $v) {
									if(strpos($v, 'https://')===false){//internal
										$out['font'][]=$conf['s3'].'/source/'.phi::$conf['env'].'/font/'.$fconf['distver'].'/'.$v;
									}else{
										$out['font'][]=$v;
									}
								}
							}
						}
						if(isset($conf['web_js'])) $out['web_js']=$conf['web_js'];
						if(isset($conf['cdn'])){
							foreach ($conf['cdn'] as $k => $v) {
								$np=explode('/', $v);
								$name=$np[sizeof($np)-1];
								$out['static'][]=$conf['s3'].'/source/'.phi::$conf['env'].'/'.$conf['id'].'/pub/'.$vconf['version'].'/'.$name;
							}
						}
						$out['combined']=1;
					}
				}else{
					return array('error'=>'no_page');
				}
			}else{
				return array('error'=>'no_page');
			}
			//die($r['qs']['flower_id']);
			$pingrate=(!phi::$conf['prod'])?30000:10000;
			if(!isset($out['error'])) $out['vars']=array(
				'name'=>(isset($conf['name']))?$conf['name']:'<Default App Name>',
				'env'=>phi::$conf['env'],
				'flower_id'=>(isset($r['qs']['flower_id']))?$r['qs']['flower_id']:'',
				'gcmid'=>phi::$conf['gcm']['sender_id'],
				'appid'=>(isset($r['qs']['appid']))?$r['qs']['appid']:'',
				'sapiurl'=>'https://api.'.phi::$conf['domain'].'/'.((isset($conf['api_id']))?$conf['api_id']:$conf['id']),
				'baseapi'=>'https://api.'.phi::$conf['domain'],
				'chatterapi'=>'https://api.'.phi::$conf['domain'].':3334',
				'apiurl2'=>'https://api.'.phi::$conf['domain'].':3333',
				'imgurl'=>'https://img.'.phi::$conf['domain'],
				'oauthurl'=>'https://api.'.phi::$conf['domain'].'/oauth2',
				'uploadurl'=>'https://api.'.phi::$conf['domain'],
				'codeurl'=>'https://code.'.phi::$conf['domain'],
				'siteurl'=>'https://app.'.phi::$conf['domain'],
				'mapurl'=>'https://api.'.phi::$conf['domain'].'/'.((isset($conf['api_id']))?$conf['api_id']:$conf['id']).'/module/map',
				'domain'=>'https://'.phi::$conf['domain'],
				'playerurl'=>'https://'.'player.'.phi::$conf['domain'],
				'pingrate'=>$pingrate,
				'font'=>(isset($conf['font']))?$conf['font']:false,
				'creds'=>self::getCreds(),
				'nointernet'=>(NOINTERNET)?1:0,
				's3'=>$conf['s3'],
				'gaid'=>(isset($conf['gaid']))?$conf['gaid']:'',
				'isdev'=>(phi::$conf['prod'])?0:1,
				'site'=>$page,
				'time'=>time()
			);
			//add module hashes
			if(is_file(ROOT.'/modules.json')){
				$out['vars']['modules']=json_decode(file_get_contents(ROOT.'/modules.json'),1);
			}else{
				phi::log('missing modules.json');
			}
			if(isset($conf['localize'])){
				$out['vars']['localizations']=db2::toList(db2::find(DB,'app_text',['scopes'=>['$in'=>$conf['localize']]],['projection'=>['content'=>1,'id'=>1]]),['id','content']);
				#die(json_encode($out['vars']['loc']));
			}
			if(isset($conf['app_appid'])){
				include_once(ROOT.'/api/app.php');
				$out['vars']['scheme']=APP::getScheme($conf['app_appid']).'://';
			}
			if(isset(phi::$conf['stripe']['publishable_key'])){
				$out['vars']['stripe_token']=phi::$conf['stripe']['publishable_key'];
			}
			if(isset($conf['waivers'])){
				$cw=db2::toOrderedList(db2::find(DB,'waiver',[]));
				// die(json_encode($cw));
				foreach($cw['order'] as $k=>$v){
					$item=$cw['list'][$v];
					#phi::log($item);
					if(isset($item['version'])&&$item['version']&&(isset($item['agree'])&&$item['agree'])){
						//$cache_text.='@'.$item['_id'].'_'.$item['version'];
						$waivers[$item['_id']]=$item['version'];
					}
				}
				//die(json_encode($waivers));
				if(isset($waivers)) $out['vars']['waivers']=$waivers;
				//$out['vars']['waivers']=phi::$conf['waivers'];
			}
			//if(isset(phi::$conf['opentok'])) $out['vars']['opentok_api_key']=phi::$conf['opentok']['key'];
			$f=phi::$conf['root'].$conf['root'].'/'.$conf['id'].'.api';
			if(is_file($f)){
				include_once($f);
				$method=isset($conf['api_id'])?$conf['api_id']:$conf['id'];
				$apim=strtoupper($method);
				if(class_exists($apim)){
				    $api=new $apim();
				    if(method_exists($api,'loadData')){
				    	//die(json_encode($r));
				    	$out['vars']['loadData']=$api->loadData($r);
				    }
				}
			}
			if(NOINTERNET){
				$out['vars']['sapiurl']='https://'.phi::$conf['api'].'/'.$conf['name'];
				$out['vars']['apiurl']='https://'.phi::$conf['api'].'/'.$conf['name'];
			}
			if(isset($r['qs']['screenshot'])&&!phi::$conf['prod']){
				$out['vars']['s3']=str_replace('https://', 'http://', $out['vars']['s3']);
			}
			if(isset($vconf['version'])){
				$out['vars']['version']['app']=$vconf['version'];
			}
			if(isset($hash)) $out['vars']['version']['hash']=$hash;
			// if(isset($vconf['boot'])&&isset($out['combined'])&&isset($conf['bootloader'])){
			// 	$k=(isset($vconf['boot']))?'app':'loader';
			// 	$out[$k]=array(
			// 		'hash'=>$vconf['boot']['hash'],
			// 		'key'=>'loader',
			// 		'url'=>$vconf['boot']['url'],
			// 		'combined'=>1,
			// 		'type'=>'dna',
			// 		'length'=>$vconf['boot']['length'],
			// 		'entry'=>$conf['entry']
			// 	);
			// }
			if(isset($conf['bootloader'])){
				if(isset($out['combined'])){
					if(isset($r['qs']['flower_id'])){
						if(isset($r['qs']['flower_branch'])){
							$vconf2=db2::findOne(DB,'versions',array("_id"=>$r['qs']['flower_id'].'_'.$r['qs']['flower_branch']));
							if(!$vconf2) $vconf2=db2::findOne(DB,'versions',array("_id"=>$conf['flower_id']));
							$conf2=self::getFileConf($conf['flower_id']);
							$out['app']=$vconf2['conf'];
						}else{
							$vconf2=db2::findOne(DB,'versions',array("_id"=>$conf['flower_id']));
							$conf2=self::getFileConf($conf['flower_id']);
							$out['app']=$vconf2['conf'];
						}
					}else{
						#phi::log('flower_id not set for ['.$page.']');
					}
				}else{
					//add in loader
					if(isset($conf['entry'])&&isset($out['app'])){
						$out['app']['entry']=$conf['entry'];
					}
					if(isset($conf['core_conf'])){
						$cfconf=self::getFileConf($conf['core_conf']);
						$paths=self::getFilePaths($cfconf);
						$tpls=(isset($paths['templates']))?$paths['templates']:false;
						if(isset($paths['templates'])) unset($paths['templates']);
						$templates='';
						if($tpls) $templates=phi::minifile('',$tpls);
						$out['loader']=array(
							'key'=>'loader',
							'urls'=>$paths,
							'templates'=>$templates,
							'entry'=>(isset($cfconf['entry']))?$cfconf['entry']:false
						);
					}
				}

			}

			if(FORCE_PRODUCTION_CONF||(!phi::$conf['prod']&&isset($r['qs']['ver']))){
				$url='https://api.oneboulder.one/conf/'.$page;
				if(isset($r['qs']['ver'])){
					$url.='?ver='.$r['qs']['ver'];
				}
				phi::log('load_from_prod: '.$url);
				$newout=json_decode(file_get_contents($url),1);
				$oldvars=$newout['vars'];
				$newout['vars']=$out['vars'];
				$newout['vars']['version']=$oldvars['version'];//force
				$out=$newout;
				//return $newout;
			}
			#die(json_encode($out['app']));
			//die('out: '.$out['vars']['combined']);
			return $out;
		}
		public static function getCreds(){
			return false;
		}
		public static function getSearchQuery($field,$search){
			// $qp=explode(" ",$search);
			// foreach($qp AS $q){
			// 	if(is_numeric($q)) $srch[]=$q;
			// 	else $srch[]='/^'.strtolower($q).'/';//new MongoDB\BSON\Regex("/^".strtolower($q)."/","i");
			// }
			return array($field=>new MongoDB\BSON\Regex("/^".strtolower($search)."/","i"));
		}
		public static function buildKeywords($user){
			$ret=$keywords=array();
			if(isset($user['name'])) $names=explode(' ',$user['name']);
			// put first firstname as item 0
			$tname=array_shift($names);
			if(!empty($tname)) $keywords[0]=$tname;
			else $keywords[0]='÷'; //unmatchable placeholder
			if(isset($user['email'])) $keywords[1]=$user['email']; //item 2 position always email.
			if(isset($user['alias'])) $keywords[]=$user['alias'];
			if(isset($user['aka'])) $keywords[]=$user['aka'];
			if(isset($user['uid'])) $keywords[]=$user['uid'];
			if(isset($user['_id'])) $keywords[]=$user['_id'];
			// add rest of names
			$keywords=array_merge($keywords,$names);			
			foreach($keywords AS $keyword){
				if(!empty($keyword)) $ret[]=strtolower(trim($keyword));
			}
			$ret=array_values(array_unique($ret));
			return $ret;
		}
	}
?>