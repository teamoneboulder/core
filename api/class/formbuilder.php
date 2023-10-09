<?php
	class formbuilder{
		public static $api_module='';
		public static function handleRequest($r){
			switch ($r['path'][4]){
				case 'save':
					$out=self::save($r);
				break;
				// case 'update':
				// 	$out=self::update($r);
				// break;
				case 'delete':
					$out=self::delete($r);
				break;
				case 'feed':
					$out=self::feed($r);
				break;
				case 'load':
					$out=self::load($r);
				break;
				default:
					$out=array('error'=>'invalid_method');
				break;
			}
			return $out;
		}
		public static function delete($r){
			//permissions!
			$d=phi::ensure($r,array('id','schema'));
			$c=db2::findOne(phi::$conf['dbname'],$d['schema'],array('id'=>$d['id']));
			if(!$c) return array('error'=>'invalid_object');
			$schema=ONE_CORE::getSchema($d['schema']);
			$api=self::getApi($schema);
			$c=db2::findOne(phi::$conf['dbname'],$schema['id'],array('id'=>$d['id']));
			if(!$c) return array('error'=>'invalid_item');
			$permcheck=self::hasEditPermission($r,$api,$c,$schema,$c);
			if($permcheck===true){
				self::runHooks('onBeforeDelete',$schema,array('current'=>$c),$r,$api);
				db2::remove(phi::$conf['dbname'],$d['schema'],array('id'=>$d['id']));
				self::runHooks('onDelete',$schema,array('current'=>$c),$r,$api);
				return array('success'=>true);
			}else{
				return $permcheck;
			}
		}
		public static function getModule($schema){
			if(isset($schema['module_path'])){
				$module=$schema['module'];
			}else{
				$module=(isset($schema['module']))?$schema['module']:$schema['id'];
			}
			return $module;
		}
		public static function getApiFile($schema){
			$module=self::getModule($schema);
			if(isset($schema['module_path'])){
				$api=ROOT.$schema['module_path'];
			}else{
				$api=ROOT.'/sites/code/app/'.$module.'/'.$module.'.php';
				if(!is_file($api)){
					$api=ROOT.'/api/class/'.$module.'.php';
					// if(!is_file($api)){
					// 	phi::log('!!! bad api linking! '.json_encode($schema));
					// 	phi::log('request');
					// }
				}
			}
			return $api;
		}
		public static function getApi($schema){
			$api_file=self::getApiFile($schema);
			self::$api_module=$module=self::getModule($schema);
			if(is_file($api_file)){
				include_once($api_file);
				$apim=strtoupper($module);
				$api=new $apim();
				return $api;
			}else{
				return false;
			}
		}
		public static function hasEditPermission($r,$api,$d,$schema,$proposed){
			if(!$api) return array('error'=>'invalid_config');
			if(isset($r['auth']['internal'])) return true;
			$check=(isset($schema['updatePermissionCheck']))?$schema['updatePermissionCheck']:false;
			$scopes=(isset($schema['scopes']))?$schema['scopes']:array();
			$module=self::getModule($schema);
			if($check&&method_exists($module,$check)){
				if(method_exists($module,$check)){
					if(isset($schema['permissionIdField'])){
						if(isset($d[$schema['permissionIdField']])){
							$id=$d[$schema['permissionIdField']];
						}else{
							$id=false;
							phi::log('invalid_permissions_id['.$schema['id'].']: '.json_encode($d));
							return array('error'=>'invalid_permissions_id');
						}
					}else{
						$id=(isset($d['id']))?$d['id']:false;
					}
					if(!$api->$check($r,$scopes,$id,$proposed)) return false;
				}else{
					phi::log('method doesnt exist for schema '.$schema['id']);
					return false;;
				}
			}else{
				//default permission check!
				//$c=db2::findOne(DB,$schema['id'],array('id'=>$id));
				return true;
			}
			return true;
		}
		public static function load($r,$query=false){
			$d=phi::ensure($r,array('schema','id'));
			$schema=ONE_CORE::getSchema($d['schema']);
			if(!$schema) return array('error'=>'invalid_schema');
			$schema['id']=$d['schema'];
			$module=(isset($schema['module']))?$schema['module']:$schema['id'];
			$api=(isset($schema['module_path']))?ROOT.$schema['module_path']:ROOT.'/sites/code/app/'.$module.'/'.$module.'.php';
			if(!is_file($api)){
				$api=ROOT.'/api/class/'.$module.'.php';
				#phi::log($api);
				if(!is_file($api)){
					phi::log('invalid module linking');
					phi::log('request');
					API::toHeaders(['error'=>'invalid module linking']);
				}
			}
			if(!isset($r['auth']['internal'])){
				if(is_file($api)){
					include_once($api);
					$apim=strtoupper($module);
					$api=new $apim();
					$check=(isset($schema['visiblePermissionCheck']))?$schema['visiblePermissionCheck']:'hasPermission';
					if(method_exists($module,$check)){
						if(!$api->$check($r,false,$d['id'])) return array('error'=>'invalid_permissions','_type'=>'check');
					}else{
						return array('error'=>'no_permission_function');
					}
				}else if(!isset($schema['allowEdit'])){
					return array('error'=>'invalid_permissions','_type'=>'noedit');
				}
			}
			if(!$query){
				$query=array('id'=>$d['id']);
			}
			$d=db2::findOne(phi::$conf['dbname'],$d['schema'],$query);
			#die(json_encode($d));
			if(isset($schema['keep'])){
				$schema['keep'][]='_id';
				if(isset($r['qs']['include'])&&$r['qs']['include']){
					$schema['keep']=array_values(array_merge($schema['keep'],$r['qs']['include']));
				}
				$keep=$schema['keep'];
			}else{
				$keep=[];
			}
			foreach ($schema['fields'] as $k => $v) {
				if(isset($v['system'])&&isset($d[$k])&&!in_array($k, $keep)){
					unset($d[$k]);
				}
			}
			#die(json_encode($schema));
			if(isset($schema['graph'])) $d=db2::graphOne(phi::$conf['dbname'],$d,$schema['graph']);
			if(isset($schema['graph2'])) $d=db2::graphOne(phi::$conf['dbname'],$d,$schema['graph2']);
			if(isset($schema['keep'])){

				#die(json_encode($schema['keep']));
				$d=phi::keepFields($d,$schema['keep']);
			}
			if(!$d&&!isset($r['allowBlank'])){
				$d=array(
					'id'=>$r['qs']['id']
				);
			}
			return array('success'=>true,'current'=>$d);
		}
		public static function feed($r,$query=false,$opts=array(),$keyOn=false,$feedOpts=false){
			//schema, user
			$d=phi::ensure($r,array('schema'));
			$schema=ONE_CORE::getSchema($d['schema']);
			$schema['id']=$d['schema'];
			$api=self::getApi($schema);
			$keyOn=(!$keyOn&&isset($schema['keyOn'])&&$schema['keyOn']!='tsu')?$schema['keyOn']:(($keyOn)?$keyOn:'_id');
			//die(json_encode($schema));
			//query opts!
			if($query||is_array($query)){
				$q=$query;
			}else if(isset($schema['filter'])){
				$replace=array(
					'[uid]'=>$r['auth']['uid']
				);
				foreach ($replace as $k => $v) {
					$schema['filter']=str_replace($k, $v, $schema['filter']);
				}
				$schema['filter']=str_replace('%', '"', $schema['filter']);
				// die(json_encode($schema));
				$q=json_decode($schema['filter'],1);
			}else if(isset($schema['query'])){
				$q=$schema['query'];
			}else{
				$q=array();
			}
			if(isset($r['qs']['query'])){
				$q=$r['qs']['query'];
			}
			if(isset($r['qs']['filter'])){
				$q=$r['qs']['filter'];
			}
			if(isset($schema['getFilter'])){
				if(method_exists($api,$schema['getFilter'])){
					$q=$api->{$schema['getFilter']}($r,$q);
				}else{
					phi::log('invalid getFilter for schema ['.$schema['id'].']');
				}
			#die(json_encode($q));
			}
			#die(json_encode($q));
			if(isset($schema['graph'])){
				$graph=json_encode($schema['graph']);
				$replace=array(
					'[uid]'=>(isset($r['auth']['uid']))?$r['auth']['uid']:''
				);
				foreach ($replace as $k => $v) {
					$graph=str_replace($k, $v, $graph);
				}
				$schema['graph']=json_decode($graph,1);
			}
			#die(json_encode($schema));
			#die(json_encode($q));
			//$q=array('uid'=>$r['auth']['uid']);
			if(isset($r['qs']['search'])&&isset($r['qs']['search_field'])){
				//'^'.
				$regex = new MongoDB\BSON\Regex($r['qs']['search'],'i');//could be a major page, or feed within
				$q[$r['qs']['search_field']]=$regex;
			}
			if(isset($r['qs']['mine'])){
				$q['uid']=$r['auth']['uid'];
			}
			if(isset($r['qs']['last'])&&$r['qs']['last']){
				//$l=db2::findOne(phi::$conf['dbname'],$d['schema'],array('_id'=>db2::toId($r['qs']['last'])));
				//if(!$l) return array('error'=>'invalid_last_post');
				//$q['_id']=array('$lt'=>db2::toId($l['_id']));
				if($keyOn=='_id'){
					$q['_id']=array('$lt'=>db2::toId($r['qs']['last']));
				}else if($keyOn=='tsu'){
					$l=db2::findOne(phi::$conf['dbname'],$d['schema'],array('_id'=>db2::toId($r['qs']['last'])));
					if(!$l) return array('error'=>'invalid_last');
					$q['tsu']=array('$lt'=>db2::tsToTime($l['tsu']['$date'],false));
				}else{
					$opts['skip']=(int) $r['qs']['last'];
				}
				//$q['tsu']=array('$lt'=>db2::tsToTime($l['tsu']['$date'],false));
			}
			if(isset($r['qs']['after'])&&$r['qs']['after']){
				// $a=db2::findOne(phi::$conf['dbname'],$d['schema'],array('_id'=>db2::toId($r['qs']['after'])));
				// if(!$a) return array('error'=>'invalid_after_post');
				if($keyOn=='_id'){
					$q['_id']=array('$gt'=>db2::toId($r['qs']['after']));
				}else if($keyOn=='tsu'){
					$a=db2::findOne(phi::$conf['dbname'],$d['schema'],array('_id'=>db2::toId($r['qs']['after'])));
					if(!$a) return array('error'=>'invalid_after');
					$q['tsu']=array('$gt'=>db2::tsToTime($a['tsu']['$date'],false));
				}else{
					return array('success'=>true,'data'=>false);
				}
				//$q['tsu']=array('$gt'=>db2::tsToTime($a['tsu']['$date'],false));
			}
			if($keyOn=='tsu'&&!isset($opts['sort'])) $opts['sort']=array('tsu'=>-1);
			if(!isset($opts['sort'])) $opts['sort']=array('_id'=>-1);
			if(isset($r['qs']['max'])){
				$max=(int) $r['qs']['max'];
			}
			if(!isset($max)||!$max) $max=10;
			$opts['limit']=$max;
			if(isset($feedOpts['keep'])){
				foreach ($feedOpts['keep'] as $key => $value) {
					$opts['projection'][$value]=1;
				}
			}else if(isset($schema['keep'])&&!isset($feedOpts['showAllData'])){
				foreach ($schema['keep'] as $key => $value) {
					$opts['projection'][$value]=1;
				}
			}
			#die(json_encode($opts));
			#die(json_encode($q));
			$data=db2::toOrderedList(db2::find(phi::$conf['dbname'],$d['schema'],$q,$opts),false,true,$keyOn,(($keyOn=='tsu')?'_id':false));
			if($keyOn!='_id'&&$keyOn!='tsu'){
				$c=(isset($opts['skip']))?$opts['skip']:0;
				$last=$c;
				if($data) $last=$last+sizeof($data['order']);
				$data['last']=$last;
			}
			if(isset($schema['graph'])) $data=db2::graph(phi::$conf['dbname'],$data,$schema['graph']);
			if(isset($schema['graph2'])) $data=db2::graph(phi::$conf['dbname'],$data,$schema['graph2']);

			$ret=array('success'=>true,'data'=>$data);
			return $ret;
		}
		public static function save($r,$partial=false){
			//validate
			include_once(ROOT.'/classes/validator.php');
			$d=phi::ensure($r,array('current','schema'));
			if(isset($d['current']['_clone'])){
				$d['_clone']=db2::findOne(DB,$d['schema'],['id'=>$d['current']['_clone']]);
			}
			if(isset($r['qs']['_disable'])){
				foreach ($r['qs']['_disable'] as $k => $v) {
					phi::$disableAction[$k]=$v;
				}
			}
			if($partial) $d['current']['_partial']=1;//flag here
			$schema=ONE_CORE::getSchema($d['schema']);
			if(!$r['auth']&&!isset($schema['allow_anon'])) return array('error'=>'invalid_permissions','_type'=>'no_auth');
			#die(json_encode($r));
			if(!isset($schema['allow_anon'])){
				$perms=ONE_CORE::getUserRoles($r['auth']['uid']);
				//strip any "internal only" or "protected" data!
				foreach ($schema['fields'] as $k => $v) {
					if(isset($v['permission'])&&!sizeof(array_intersect($v['permission'], $perms))&&isset($d['current'][$k])){
						unset($d['current'][$k]);	
						if(!phi::$conf['prod']) phi::log('formbuilder unset: '.$k);
					}
				}
			}
			$schema['id']=$d['schema'];
			$api=self::getApi($schema);
			#die(json_encode($d['current']));
			//an id might be set to '' for cloned things!
			if(isset($d['current']['id'])&&!$d['current']['id']) unset($d['current']['id']);
			if(isset($d['current']['id'])) $lastId=$d['current']['id'];
			else $lastId=false;
			if(isset($r['qs']['last_id'])) $lastId=$r['qs']['last_id'];
			if(!$partial&&isset($d['current']['id'])&&$d['current']['id']) $d['last']=db2::findOne(phi::$conf['dbname'],$d['schema'],array('id'=>$lastId));
			else $d['last']=false;
			#die(json_encode($d));
			if(isset($schema['fields']['uid'])&&!$d['last']) $d['current']['uid']=$r['auth']['uid'];
			if(isset($schema['fields']['tsu'])) $d['current']['tsu']=db2::tsToTime(time());
			//must ensure permissions!!!
			$d['schema_conf']=$schema;
			if(!self::hasEditPermission($r,$api,$d['current'],$schema,$d['current'])) return array('error'=>'invalid_permissions','_type'=>'no_edit_perm');
			$d=self::runHooks('onBeforeValidation',$schema,$d,$r,$api);//we will do any data processing here
			//keep all the data, do validation, and merge in any created data, EG ID
			VALIDATOR::$hashPassword=false;
			if($d['last']){
				$d['current']=array_merge($d['current'],ONE_CORE::validateData($d['schema'],$d['current'],1,true,false,$d['last']));
				if(isset($d['current']['error'])) API::toHeaders(['error'=>$d['current']['error']]);
			}else{
				//if we dont have valid data, we should return immediately and not run any hooks!
				$d['current']=array_merge($d['current'],ONE_CORE::validateData($d['schema'],$d['current']));
				#API::toHeaders(['data'=>$d['current']]);
			}
			VALIDATOR::$hashPassword=true;
			//die(json_encode($d['current']));
			//die(json_encode($d['current']));
			if(!isset($d['diff'])) $d['diff']=self::getDiff($d['current'],$d['last'],$schema);
			$d=self::runHooks('onBeforeSave',$schema,$d,$r,$api);//we will do any data processing here
			// if(isset($schema['permissionCheck'])){//does person have abilty to edit/modify
			// 	if(!$api->$schema['permissionCheck']($r,$d['current'],(isset($d['current']['id']))?$d['current']['id']:'')){
			// 		return array('error'=>'invalid_permissions');
			// 	}
			// }
			//die(json_encode($d['current']));
			if(!$partial&&isset($d['current']['id'])){
				#die('here');
				if($d['last']){
					if(isset($d['last']['_partial'])){//_partial flag used blanket
						$cdata=array_merge($d['last'],$d['current']);
						ONE_CORE::validateData($d['schema'],$cdata);//ensure all fields are satisfied
						if(isset($d['current']['_partial'])) unset($d['current']['_partial']);
						$unset=array('_partial'=>1);
						//phi::log('updated a partial!');
					}else{
						$unset=false;
					}
					#die(json_encode($d['last']));
					$keep=$schema['order'];
					foreach($schema['fields'] as $k=>$v){
						if(isset($v['validate'])){
							$keep[]=$v['validate'];
						}
					}
					foreach ($d['current'] as $k => $v) {
						if($v==='[unset]'){
							$unset[$k]=1;
							unset($d['current'][$k]);
						}
					}
					// die(json_encode([
					// 	'set'=>$d['current'],
					// 	'unset'=>$unset
					// ]));
					if(isset($schema['order'])) $d['current']=phi::keepFields($d['current'],$keep);
					$d=self::runHooks('onBeforeUpdate',$schema,$d,$r,$api);//we will do any data processing here
					#die(json_encode($d));
					$d['current']=ONE_CORE::update($d['schema'],array('id'=>$lastId),$d['current'],false,false,$unset,1,$d['last']);
					$d=self::runHooks('onUpdate',$schema,$d,$r,$api);
					//die(json_encode($d['current']));
				}else{
					//return array('error'=>'invalid_update_id');
					$d=self::runHooks('onBeforeCreate',$schema,$d,$r,$api);
					$keep=(isset($schema['order']))?$schema['order']:[];
					foreach($schema['fields'] as $k=>$v){
						if(isset($v['requiredOnCreate'])) $schema['fields'][$k]['required']=true;
						if(isset($v['validate'])){
							$keep[]=$v['validate'];
						}
					}
					if(isset($schema['order'])) $d['current']=phi::keepFields($d['current'],$keep);
					//die(json_encode($d['current']));
					$d['current']=ONE_CORE::save($d['schema'],$d['current'],false,false,$partial,true);
					$d=self::runHooks('onCreate',$schema,$d,$r,$api);
					if(isset($schema['isAccount'])){
						$r['auth']['uid']=$d['current']['id'];
					}
				}
			}else{
				#die(json_encode($d['current']));
				//auto create an ID otherwise url might have issue
				$d=self::runHooks('onBeforeCreate',$schema,$d,$r,$api);
				//toggle flag for requiredOnCreate
				$keep=(isset($schema['order']))?$schema['order']:[];
				foreach($schema['fields'] as $k=>$v){
					if(isset($v['requiredOnCreate'])) $schema['fields'][$k]['required']=true;
					if(isset($v['validate'])){
						$keep[]=$v['validate'];
					}
				}
				if(isset($schema['order'])) $d['current']=phi::keepFields($d['current'],$keep);
				#die(json_encode($d['current']));
				$d['current']=ONE_CORE::save($d['schema'],$d['current'],false,false,$partial,true);
				$d=self::runHooks('onCreate',$schema,$d,$r,$api);
				if(isset($schema['isAccount'])){
					$r['auth']['uid']=$d['current']['id'];
				}
			}
			//if(!isset($d['last'])) $d['last']=false;
			//trigger update!
			phi::push('',$d['schema'].'_'.$d['current']['id'],array('update'=>true));
			$d=self::runHooks('onAfterSave',$schema,$d,$r,$api);
			if(isset($schema['loadMethod'])&&$api&&method_exists($d['schema'],$schema['loadMethod'])){
				//$resp=$api->$schema['loadMethod']($r);
				$resp=$api->{$schema['loadMethod']}([
					'auth'=>$r['auth'],
					'qs'=>[]
				],$d['current']['id']);
				if(isset($resp['data'][$d['schema']])){//embedded
					$resp['data']=$resp['data'][$d['schema']];
				}
				if(!isset($d['additionalData'])) $d['additionalData']=false;
				$resp['additionalData']=$d['additionalData'];
				#die(json_encode($schema));
				if(isset($schema['route'])){
					$resp['path']=phi::parseString($schema['route'],array(
						'id'=>$resp['data']['id']
					));
				}
				$resp=self::addOptsData($r,$resp);
				return $resp;
			}else{
				#phi::alertAdmin('impliment load!');
				// $data=ONE_CORE::validateData($d['schema'],$d['current']);
				// $saved=db2::save(phi::$conf['dbname'],$d['schema'],$data);
				// $data['_id']=(string) $saved->getInsertedId();
				if(!isset($d['additionalData'])) $d['additionalData']=false;
				//if(isset($schema['graph'])) $d['current']=db2::graphOne(phi::$conf['dbname'],$d['current'],$schema['graph']);
				// die(json_encode(array(
				// 		'schema'=>$schema['id'],
				// 		'id'=>$d['current']['id']
				// 	)));
				#die(json_encode($d));
				$current=self::load(array(//load/return the full object
					'qs'=>array(
						'schema'=>$schema['id'],
						'id'=>$d['current']['id']
					),
					'auth'=>$r['auth']
				));
				if(isset($current['error'])) return $current;
				#die(json_encode($current));
				$ret=array('success'=>true,'data'=>$current['current'],'additionalData'=>$d['additionalData']);
				if(isset($schema['route'])){
					$ret['path']=phi::parseString($schema['route'],array(
						'id'=>$ret['data']['id']
					));
				}
				$ret=self::addOptsData($r,$ret);
				return $ret;
			}
		}
		public static function addOptsData($r,$resp){
			if(isset($r['qs']['_opts']['returnFn'])){
				switch($r['qs']['_opts']['returnFn']){
					case 'onepass';
						//phi::log('request');
						$u=db2::findOne(DB,'user',['id'=>$r['auth']['uid']]);
						if(isset($u['onepass'])&&$u['onepass']>time()){
							$resp['hasOnePass']=true;
						}else{
							//see if they have for individual player
							$id=date('m').'_'.date('Y').'_'.$r['auth']['uid'];
							#phi::log('check: '.json_encode(['id'=>$id,'location'=>$resp['data']['location']['id']]));
							$loc=db2::findOne(DB,'user_onepass_location',['id'=>$id,'location'=>$resp['data']['location']['id']]);
							if($loc){
								$resp['hasOnePass']=true;
							}else{
								$resp['hasOnePass']=false;
							}
						}
					break;
				}
			}
			return $resp;
		}
		public static function sendPush($data){
			if(isset($data['_push'])){
				foreach ($data['_page'] as $k => $v) {
					phi::push($v['to'],$v['channel'],$v['data']);
				}
				unset($data['_push']);
			}
			return $data;
		}
		public static function getDiff($current,$previous,$schema){
			if($current) foreach ($current as $k => $v) {
				if(!isset($schema['fields'][$k]['private'])){
					if(isset($previous[$k])){
						if(is_array($v)){
							$ks=array_keys($v);
							if($ks&&$ks[0]===0){
								if($previous[$k]){
									$rr=array_values(array_diff($v, $previous[$k]));
									if(sizeof($rr)) $diff[$k]['added']=$rr;
								}else{
									$diff[$k]['added']=$v;
								}
							}else{

							}
						}else if(is_string($v)){
							if($previous[$k]!=$v) $diff[$k]=array('set'=>$v);
						}
					}else{
						if(is_array($v)){
							$ks=array_keys($v);
							#die(json_encode($ks));
							if($ks[0]===0){
								if($previous&&isset($previous[$k])){
									$rr=array_values(array_diff($previous[$k],$v));
									//die(json_encode($current[$k]));
									if(sizeof($rr)) $diff[$k]['added']=$rr;
								}else{
									$diff[$k]['added']=$v;
								}
							}else{

							}
						}else if(is_string($v)){
							$diff[$k]=array('set'=>$v);
						}
					}
				}
			}
			if($previous){
				foreach ($previous as $k => $v) {
					if(!isset($schema['fields'][$k]['private'])){
						if(isset($current[$k])){
							if(is_array($v)){
								$ks=array_keys($v);
								if(sizeof($ks)){
									if($ks[0]===0){//array

										if($current[$k]){//could be string to unset
											$rr=array_values(array_diff($v,$current[$k]));
											//die(json_encode($current[$k]));
											if(sizeof($rr)) $diff[$k]['removed']=$rr;
										}else{
											$diff[$k]['removed']=$v;
										}
									}else{//object

									}
								}
							}
						}else{
							$diff[$k]=array('removed'=>true);
						}
					}
				}
			}
			if(!isset($diff)) $diff=false;
			return $diff;
		}
		public static function runHooks($type,$schema,$d,$r=false,$api=false){
			if(is_string($schema)){
				$schema=ONE_CORE::getSchema($schema);
				if(!$api) $api=self::getApi($schema);
			}
			if(!isset($d['last'])) $d['last']=false;
			$d['schemaConf']=$schema;
			//if($previous){ //todo: finish - working with arrays at least
			if($type=='onCreate'&&isset($d['_clone'])){
				if(isset($schema['onClone'])){
					if(isset($schema['onClone']['copy'])){
						foreach($schema['onClone']['copy'] as $k=>$v){
							if(isset($v['multi'])){
								$copy=db2::toOrderedList(db2::find(DB,$k,[$v['collectionKey']=>$d['_clone'][$v['primaryKey']]]));
								if(isset($copy['list'])){
									foreach($copy['list'] as $tk=>$tv){
										if(isset($v['clearId'])&&isset($tv['id'])) unset($tv['id']);
										$tv[$v['collectionKey']]=$d['current'][$v['primaryKey']];
										if(isset($v['merge'])){
											#phi::log('clone from: '.json_encode($tv));
											$tv=array_merge($tv,$v['merge']);
											#phi::log('clone to: '.json_encode($tv));
										}
										#phi::log('save!!! '.json_encode($tv));
										$tresp=self::save([
											'auth'=>$r['auth'],
											'qs'=>[
												'current'=>$tv,
												'schema'=>$k
											]
										]);
									}
								}
							}else{
								$copy=db2::findOne(DB,$k,[$v['collectionKey']=>$d['_clone'][$v['primaryKey']]]);
								if($copy){
									$copy[$v['collectionKey']]=$d['current'][$v['primaryKey']];
									#phi::log('copy '.json_encode($copy));
									$tresp=self::save([
										'auth'=>$r['auth'],
										'qs'=>[
											'current'=>$copy,
											'schema'=>$k
										]
									]);
									#phi::log('resp: '.json_encode($tresp));
								}else{
									#phi::log('no data to copy ['.$k.'] ['.json_encode($v).']');
								}
							}
						}
					}
				}
				//phi::log('clone settings!!!!');
			}
			if($type=='onCreate'||$type=='onUpdate'||$type=='onDelete'){//fire any channel signals!
				if($type=='onUpdate'){//ensuree we have all the latest!
					$c=db2::findOne(DB,$schema['id'],['id'=>$d['current']['id']]);
					if($c) $d['current']=$c;
				}
				if(isset($schema['graph'])){
                	$d['current']=db2::graphOne(phi::$conf['dbname'],$d['current'],$schema['graph']);
                }
                if(isset($schema['graph2'])){
                	$d['current']=db2::graphOne(phi::$conf['dbname'],$d['current'],$schema['graph2']);
                }
				if(isset($schema['channels'])){
					foreach ($schema['channels'] as $k => $channel) {
						$variables = $channel['variables'];
						$send_channel=$channel['template'];
		                foreach($variables as $tk => $tv){
		                	$val=phi::dotGet($tv,$d['current']);
		                    $send_channel = str_replace('['.$tk.']', $val, $send_channel);
		                }
		                #phi::log('send to channel '.$send_channel);
		                phi::push('',$send_channel,array('type'=>$type,'data'=>$d['current']));
					}
				}
				if(isset($schema['onChange'])){
					$fn=$schema['onChange'];
					$api->$fn($d,$type);
				}
			}
				//if(!$diff) phi::log('no changes');
			//}
			//run any hook data from fields!
			foreach ($schema['fields'] as $k => $v) {
				if(!isset($v['hooks'][$type])) continue;
				foreach ($v['hooks'][$type] as $tk => $opts) {
					//allow data mutations to the current data
					switch($tk){
						case 'ensureTags'://custom global saves
							if(isset($d['current'][$opts['dataField']])) ONE_CORE::ensureTags($r,$d['current'][$opts['dataField']],$opts['collection']);//saves any ta
						break;
						case 'ensureLocation':
							if(isset($d['current'][$k])) $d=ONE_CORE::ensureLocation($r,$d,$k,$opts,$type,$v);//saves any ta
						break;
						case 'processMedia':
							if(isset($d['current'][$k])) $d=ONE_CORE::processMediaData($r,$d,$k,$opts,$type,$v);//saves any ta
						break;
						case 'updateCMSChildren':
							if(isset($d['current']['folder'])){
								ONE_CORE::updateCMSChildren($r,$schema['id'],$d['current']['folder']);
							}
						break;
						default:
							if(isset($d['current'][$k])||($k=='id'&&$type=='onBeforeCreate')){//only run hooks on data when we have that data in the currently saved
								if(method_exists($api,$tk)){
									$newd=$api->$tk($r,$d,$k,$opts,$type,$v);
									if($newd) $d=$newd;//dont force to return
								}else if($api){
									phi::log('missing hook method ['.self::$api_module.']['.$tk.']');
								}else{
									phi::log('request');
									phi::log('missing api method linking for ['.self::$api_module.']');
								}
							}
						break;
					}			
				}
			}

			return $d;
		}
	}
?>