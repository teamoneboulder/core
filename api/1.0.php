<?php
	if(!is_file('/var/www/priv/config.json')) die('invalid_config');
	$conf=json_decode(file_get_contents('/var/www/priv/config.json'),1);
	include_once($conf['home'].'/'.$conf['project'].'/classes/settings.php');
	include_once($conf['home'].'/'.$conf['project'].'/api/api.php');
	try{
		API::$start=microtime(true);
		$comb=0;
		$r=API::parseRequest();
		if (array_key_exists('HTTP_ORIGIN', $_SERVER)) {
		    $origin = $_SERVER['HTTP_ORIGIN'];
		}else if (array_key_exists('HTTP_REFERER', $_SERVER)) {
		    $origin = $_SERVER['HTTP_REFERER'];
		} else {
		    $origin = $_SERVER['REMOTE_ADDR'];
		}
		if(isset($_SERVER['HTTP_SEC_FETCH_SITE'])&&$_SERVER['HTTP_SEC_FETCH_SITE']=='same-site'){
			if(!isset($r['qs']['oneBrowser'])) header('Access-Control-Allow-Origin: '.$origin);
			header('Access-Control-Allow-Credentials: true');
			header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept');
		}else{
			header('Access-Control-Allow-Origin: *');
		}
		#phi::log('qs: '.json_encode($r['qs']));
		//$r['cdb']=phi::getDB();
		$r['prefix']=phi::getPrefix();
		#sleep(10);
		switch ($r['path'][1]) {
			case 'version':
				$out=array('success'=>true,'version'=>1.0);
			break;
			case 'calendarfeed':
				include_once(ROOT.'/api/calfeed.php');
			break;
			case 'testdb':
				$out=array('success'=>true,'user'=>db2::findOne(DB,'user',array('id'=>'UIAMPLAYER1'),array('projection'=>array('id'=>1,'name'=>1))));
			break;
			case 'favicon.ico':
				die(file_get_contents('https://s3.amazonaws.com/one-light/static/one_black.png'));
			break;
			case 'upload':
				include_once(ROOT.'/api/uploader.php');
				$out=upload::handleRequest($r);
			break;
			case 'download':
				phi::download($r);
			break;
			case 'flower':
				include_once(ROOT.'/api/flower.php');
				$out=flower::handleRequest($r);
			break;
			case 'mapbox':
				include_once(ROOT.'/classes/mapbox.php');
				$out=MAPBOX::handleRequest($r);
			break;
			case '3rdparty':
				if(isset($r['path'][2])&&is_file(ROOT.'/api/'.$r['path'][2].'.php')){
					include_once(ROOT.'/api/'.$r['path'][2].'.php');
					$apim=strtoupper($r['path'][2]);
					$api=new $apim();
					$out=$api->handleRequest($r);
				}else{
					$out=array('error'=>'invalid_api');
				}
			break;
			case 'auth':
				include_once(ROOT.'/sites/auth/api.php');
				$out=AUTH::handleRequest($r);
			break;
			case 'voip':
				include_once(ROOT.'/api/voip.php');
				$out=voip::handleRequest($r);
			break;
			case 'oauth2':
				include_once(ROOT.'/api/oauth2.php');
				$out=OAUTH2::handleRequest($r);
			break;
			case 'webhook':
				include_once(ROOT.'/api/webhook.php');
				$out=webhook::handleRequest($r);
			break;
			case 'email':
				include_once(ROOT.'/api/email.php');
				$out=EMAIL::handleRequest($r);
			break;
			case 'stripe':
				include_once(ROOT.'/api/stripe.php');
				$out=stripe::handleRequest($r);
			break;
			case 'conf':
				#sleep(10);
				$out=API::getConf($r);
				//sleep(40);
			break;
			case 'files':
				if(!phi::$conf['prod']){//dev only loading
					$out=API::loadDevFiles($r);
				}
				#sleep(8);
			break;
			case 'splash':
				$out=API::getSplash($r);
			break;
			case 'tools':
				include_once(ROOT.'/api/tools.php');
				$out=TOOLS::handleRequest($r);
			break;
			case 'user':
				switch(isset($r['path'][2])){
					case 'log':
						phi::log($r['qs']['obj']['text']);
						$out=['success'=>true];
					break;
				}
			break;
			case 'mapbox':
				include_once(ROOT.'/classes/mapbox.php');
				$out=MAPBOX::handleRequest($r);
			break;
			case 'app':
				if((isset($r['qs']['token'])&&($r['qs']['token']=='app_builder')||($r['qs']['token']=='testpilot'&&$r['path'][3]=='addPilot')||($r['path'][3]=='screenshot_image'))){
					include_once(ROOT.'/api/app.php');
					// $r['conf']=API::getFileConf($r['path'][2]);
					// if(!$r['conf']){
					// 	$out['error']='invalid_app';
					// }else{
					// 	$out=APP::handleRequest($r);
					// }
					$out=APP::handleRequest($r);
				}else{
					$out['error']='invalid_user';
				}
			break;
			default:
				if(isset($r['path'][2])&&$r['path'][2]=='download'){
					phi::download($r);
				}
				if(isset($r['path'][2])&&$r['path'][2]=='code'){
					#sleep(10);//bad internet
					API::getDNA($r['path'][3],$r['path'][4]);
				}
				if(isset($r['path'][2])&&$r['path'][2]=='externallink'){
					$url=$r['qs']['u'];
					if(strpos($url, 'www.')===0){
						$url='http://'.$url;//force http
					}
					//save to db!
					$id=phi::makeLinkUid($url);
					db2::update(DB,'link_stats',array('id'=>$id),array('$set'=>array('url'=>$url),'$inc'=>array('count'=>1)),array('upsert'=>true));
					phi::redir($url);
					die();
				}
		    	$r['conf']=API::getFileConf($r['path'][1]);
		    	if(isset($r['conf'])&&is_file(phi::$conf['root'].$r['conf']['root'].'/api.php')){
		    		$apifile=phi::$conf['root'].$r['conf']['root'].'/api.php';
		    	}else if(isset($r['conf'])&&is_file(phi::$conf['root'].$r['conf']['root'].'/'.$r['conf']['id'].'.api')){
		    		$apifile=phi::$conf['root'].$r['conf']['root'].'/'.$r['conf']['id'].'.api';
		    	}else if(isset($r['conf']['api_id'])){
		    		$apifile=phi::$conf['root'].$r['conf']['api_root'].'/'.$r['conf']['api_id'].'.api';
		    	}else $apifile='';
				if(isset($r['qs']['appid'])){
			    	$r['app']=phi::getApp($r['qs']['appid']);
					$r=API::authUser($r,$r['qs']['appid']);
				}
				else $r['auth']=false;
				phi::$auth=$r['auth'];
				#die($apifile);
		    	if(isset($r['conf'])&&is_file($apifile)){
		    		if(isset($r['conf']['db'])){
		    			db2::$forceDB=$r['conf']['db'];
		    		}
			    	if(isset($r['path'][2])){
				    	if($r['path'][2]=='jserror'){//catch js errors here, no need to duplicate
				    		$out=API::saveJsError($r);
				    	}else if($r['path'][2]=='icons'){//catch js errors here, no need to duplicate
				    		$out=phi::getIcons();
				    	}else if($r['path'][2]=='module'){
				    		include_once(phi::$conf['root'].'/sites/one_core/one_core.api');
				    		if(is_file(phi::$conf['root'].'/sites/code/app/'.$r['path'][3].'/'.$r['path'][3].'.php')){
								include_once(phi::$conf['root'].'/sites/code/app/'.$r['path'][3].'/'.$r['path'][3].'.php');
								$apim=strtoupper($r['path'][3]);
					    		$api=new $apim();
					    		$out=$api->handleRequest($r);
							}else if(is_file(phi::$conf['root'].'/sites/code/module/'.$r['path'][3].'/'.$r['path'][3].'.php')){
								include_once(phi::$conf['root'].'/sites/code/module/'.$r['path'][3].'/'.$r['path'][3].'.php');
								$apim=strtoupper($r['path'][3]);
					    		$api=new $apim();
					    		$out=$api->handleRequest($r);
							}else if(is_file(phi::$conf['root'].'/api/class/'.$r['path'][3].'.php')){
								include_once(phi::$conf['root'].'/api/class/'.$r['path'][3].'.php');
								$apim=strtoupper($r['path'][3]);
					    		$api=new $apim();
					    		$out=$api->handleRequest($r);
							}else{
								$out=array('error'=>'invalid_module');
							}
				    	}else{
				    		if(is_file($apifile)){
					    		include($apifile);
					    		if(isset($r['conf']['api_id'])){
					    			$apim=strtoupper($r['conf']['api_id']);
					    		}else{
						    		$apim=strtoupper($r['conf']['id']);
						    	}
						    	if(class_exists($apim)){
							    	$api=new $apim();
							    	if($r['path'][2]=='version') $out=array('success'=>true,'version'=>$api->getVer());
							    	else{
							    		try{
							    			$out=$api->handleRequest($r);
							    		}catch(Error $e){
							    			$out=array('error'=>'internal_error');
							    			if(phi::$adminDebug||!phi::$conf['prod']){
							    				$out['message']=$e->getMessage();
							    				$out['trace']=$e->getTraceAsString();
							    			}
							    			phi::alertAdmin('API ERROR!!! ['.$e->getMessage().'] ['.$e->getTraceAsString().']');
							    			phi::log('<div>Internal Error: '.$e->getMessage().'</div>'.'<div>'.$e->getTraceAsString().'</div><div class="request"><a href="'.phi::getReplayUrl().'" target="_blank">'.phi::makeUrl().'</a></div>');
							    		}
							    	}
							    }else{
							    	$out=array('error'=>'invalid_api');
							    }
						    }else{
						    	$out=array('error'=>'invalid_api');
						    }
					    }
					}
			    }else{
			    	$out=array('error'=>'app not valid');
			    }
			  //   if(isset($r['path'])&&isset($r['path'][2])&&($r['path'][2]=='data'||$r['path'][2]=='ping')){ //add in app hash and other global conf vars
			  //   	//replace with memcached
					// $sc=$r['cdb']->versions->findOne(array('_id'=>$r['path'][1]),array('version'=>1));
					// if(isset($sc)&&isset($sc['version'])) $out['version']['app']=$sc['version'];
					// if(isset($api)) $out['version']['api']=$api->getver();
			  //   }
			break;
		}
		if(!isset($out)) $out=array('error'=>'invalid_api_call');
		$out['info']=array(
			'time'=>time(),
			'processTime'=>(microtime(true)-API::$start)
		);
		#sleep(5);
		if(phi::$conf['prod']||true){//slower dev clogs up logs
			if($out['info']['processTime']>.5){//limit .5 seconds
				$exempt=array('/upload/image/submit','/one_admin/stats/get','/upload/video/submit','/one_admin/stats/timeline','/stripe/one_core/updatesubscription','/one_admin/statuscheck','/one_core/processhook','/one_core/module/ticket_checkout/send','/stripe/one_core/addcard','/one_core/module/links/get');
				$path=explode('?',$_SERVER['REQUEST_URI']);
				if(!in_array($path[0], $exempt)){
					phi::log('request','request taking too long ['.$out['info']['processTime'].']!');
				}
				if($path[0]=='/one_core/processhook'&&$out['info']['processTime']>2){
					phi::log('request','request taking too long ['.$out['info']['processTime'].']!');
				}
			}
		}
		if(!phi::$conf['prod']){
			$out['info']['size']=phi::objectToSize($out);
		}
		if(!phi::$conf['prod']||isset($r['qs']['internal_ip'])) $out['info']['internal_server']=$_SERVER['SERVER_ADDR'];
		phi::logRequest($r,$out);
		API::toHeaders($out);
	}catch(Error $e){//Exception to view
		if(!phi::$conf['prod']) throw new Exception($e);
		$m=$e->getMessage();
		try{
			phi::alertAdmin('API ERROR!!! ['.$e->getMessage().'] ['.$e->getTraceAsString().']');
			phi::log('<div>Internal Error: '.$m.'</div>'.'<div>'.$e->getTraceAsString().'</div>');
			API::toHeaders(array('error'=>$m,'trace'=>$e->getTraceAsString()));
		}catch(Error $e){
			API::toHeaders(array('error'=>$m));
		}
	}
?>