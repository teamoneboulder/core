<?php
	class db2{
		//https://docs.mongodb.com/php-library/current/upgrade/#collection-api
		public static $conn=array();
		public static $queryBackup=false;//tunnel must be running on port 27020
		public static $queryEnv=false;//tunnel must be running on port 27020
		public static $forceDB=false;//tunnel must be running on port 27020
		public static function getConnection($db,$env=false){//intelligent caching to come
			if(!$env) $env=phi::$conf['env'];
			if(self::$queryBackup){
				$env='prod';//for backup query
				$cenv.=$env.'_backup';
			}else{
				$cenv=$env;
			}
			if(self::$queryEnv){
				$cenv=$env=self::$queryEnv;//for backup query
			}
			if(!isset(self::$conn[$cenv][$db])){
				if(!self::$queryBackup){
					$string=self::getConnectionString($env);
				}else{
					$string='mongodb://localhost:27020&allowDiskUse=false';//conntecting to backup
				}
				#die($string);
				$opts['connectTimeoutMS']=2000;
				$opts['serverSelectionTimeoutMS']=2000;
				#$string=str_replace('localhost', 'localhost2', $string);//test a failed DB
				//die($string);
				try{
					self::$conn[$cenv][$db] = (new MongoDB\Client($string,$opts))->$db;
				}catch(Exception $e){
					$m=$e->getMessage();
					phi::alertAdmin('DB ERROR!!! ['.$e->getMessage().'] ['.$e->getTraceAsString().']');
					API::toHeaders(array('error'=>$m,'trace'=>$e->getTraceAsString()));
				}
				return self::$conn[$cenv][$db];
			}else{
				return self::$conn[$cenv][$db];
			}
		}
		public static function getDB($db){
			if(self::$forceDB) return self::$forceDB;
			return $db;
		}
		public static function getConnectionString($env=false){
			if(!$env) $env=phi::$conf['env'];
			$creds=self::getCreds($env);
			// if($creds['connection_string_local']&&!DB_FORCE_REMOTE&&($env==phi::$conf['env'])){
			// 	$parts=explode('://',$creds['connection_string_local']);
			// 	$string=$parts[0].'://'.$creds['username'].':'.$creds['password'].'@'.$parts[1];
			// 	$string.='?serverSelectionTryOnce=false&authSource=admin';//
			// 	//$string=$creds['connection_string_local'].'?serverSelectionTryOnce=false';//mitigates No suitable servers found error
			// }else{
			// 	$parts=explode('://',$creds['connection_string']);
			// 	$string=$parts[0].'://'.$creds['username'].':'.$creds['password'].'@'.$parts[1];
			// 	$string.='?serverSelectionTryOnce=false&authSource=admin';//mitigates No suitable servers found error
			// 	#die($string);
			// }
			$parts=explode('://',$creds['connection_string']);
			$string=$parts[0].'://'.$creds['username'].':'.$creds['password'].'@'.$parts[1];
			$string.='?serverSelectionTryOnce=false&authSource=admin';
			$string.='&connectTimeoutMS=2000';//if it cant connect in 2 seconds its probably not workign
			//if($env=='dev_tom') die($string);
			return $string;
		}
		public static function getCreds($env){
			if(!isset(phi::$conf['db'][$env])) die('Mongo Creds not set in config.json');
			return phi::$conf['db'][$env];
		}
		public static function aggregate($db,$coll,$pipeline,$opts=array(),$explain=false){
			$db=self::getConnection(self::getDB($db));
			if($explain) $opts['explain']=true;
			$res=$db->$coll->aggregate($pipeline,$opts);
			if($res){
				foreach ($res as $k => $v) {
					$data[]=$v;
				}
				if(!isset($data)) $data=false;
			}else{
				$data=false;
			}
			return $data;
		}
		public static function aGroupToList($data,$key='_id',$lastOn='_id',$convertId=false){
			if($data){
				foreach($data as $k=>$d){
					$v= json_decode(MongoDB\BSON\toJSON(MongoDB\BSON\fromPHP($d)),1);
					if($convertId) $v['_id']=$convertId($v);
					$tkey=phi::dotGet($key,$v);
					$out['list'][$tkey]=$v;
					$out['order'][]=$tkey;
					$l=$v;
				}
				if(isset($v[$lastOn])){
					$out['last']=$v[$lastOn];
				}
			}else{
				$out=false;
			}
			return $out;
		}
		public static function aToList($data,$key='id',$lastOn='_id',$convertId=true){
			if($data){
				foreach($data as $k=>$d){
					$v= json_decode(MongoDB\BSON\toJSON(MongoDB\BSON\fromPHP($d)),1);
					if($convertId) $v['_id']=$v['_id']['$oid'];
					$tkey=phi::dotGet($key,$v);
					if(!$tkey){
						$tkey='NULLKEY';
					}
					$out['list'][$tkey]=$v;
					$out['order'][]=$tkey;
					$l=$v;
				}
				if(is_string($lastOn)){
					if(isset($v[$lastOn])){
						$out['last']=$v[$lastOn];
					}
				}else{
					if($lastOn&&sizeof($lastOn)==3){
						if(isset($v[$lastOn[0]])&&isset($v[$lastOn[2]])){
							$out['last']=$v[$lastOn[0]].$lastOn[1].$v[$lastOn[2]];
						}else{
							phi::log('bad compound index for request');
							phi::log('request');
						}
					}
				}
			}else{
				$out=false;
			}
			return $out;
		}
		public static function findOne($db,$coll,$query,$opts=array()){
			try{
				$db=self::getConnection(self::getDB($db));
				$data=self::toJSON($db->$coll->findOne($query,$opts));
				if($data&&isset($data['id'])) $data['_id']=$data['_id']['$oid'];
				return $data;
			}catch(Exception $e){
				$m=$e->getMessage();
				API::toHeaders(array('error'=>'Database Connection Error','trace'=>$e->getTraceAsString()));
			}
		}
		public static function getLastError($db){
			$db=self::getConnection(self::getDB($db));
			return $db->command(array('getlasterror' => 1));
		}
		public static function bulkInsert($db,$coll,$data){
			if(self::$queryBackup){
				return false;//cannot write backup
			}
			$bulk=new MongoDB\Driver\BulkWrite;
			foreach ($data as $k => $v) {
				$bulk->insert($v);
			}
			$creds=self::getCreds(phi::$conf['env']);
			$string=self::getConnectionString();
			$string.='&serverSelectionTryOnce=false';//mitigates No suitable servers found error
			$manager = new MongoDB\Driver\Manager($string);
			return $manager->executeBulkWrite($db.'.'.$coll, $bulk);
		}
		public static function batchFix($find,$count,$fixfn,$info=false,$last=false,$accumulatorfn=false,$accumulatordata=false,$extradata=false){
			if(self::$queryBackup){
				return false;//cannot write backup
			}
			$search=$find[2];
			if(!$info){
				$info['start']=microtime(true);
				$info['count']=self::count($find[0],$find[1],$search);
				$info['current']=1;
				$info['records']=0;
				$info['total']=ceil($info['count']/$count);
			}
			if($last){
				$search['_id']=array('$gt'=>self::toId($last));
			}
			$after='';
			if($last) $after=' after ['.$last.']';
			phi::clog('fetching ['.$info['current'].'/'.$info['total'].']'.$after,1);
			$list=db2::toOrderedList(db2::find($find[0],$find[1],$search,array('sort'=>array('_id'=>1),'limit'=>$count)),false,1);
			if($list){
				foreach ($list['list'] as $k => $v) {
					$d=$fixfn($v,$extradata);
					if($d) $data[]=$d;
					if($accumulatorfn){
						$td=$accumulatorfn($v);
						if($td) $accumulatordata[]=$td;
					}
				}
				phi::clog('updating ['.$info['current'].'/'.$info['total'].']',1);
				if(isset($data)) self::bulkUpdate($find[0],$find[1],$data);
				else{
					phi::clog('No Records',1);
				}
				$info['current']++;
				$info['records']+=sizeof($list['list']);
				if($info['current']>$info['total']){
					$et=microtime(true);
					$diff=$et-$info['start'];
					phi::clog('Processd ['.$info['records'].'] records in ['.$diff.'] seconds',1);
				}else{
					$rd=self::batchFix($find,$count,$fixfn,$info,$list['last'],$accumulatorfn,$accumulatordata,$extradata);
					if($accumulatorfn){
						if($rd){
							foreach ($rd as $k => $v) {
								$accumulatordata[]=$v;
							}
						}
					}
				}
			}else{
				$et=microtime(true);
				$diff=$et-$info['start'];
				phi::clog('Processd ['.$info['records'].'] records in ['.$diff.'] seconds',1);
			}
			return $accumulatordata;
		}
		public static function bulkUpdate($db,$coll,$data){
			if(self::$queryBackup){
				return false;//cannot write backup
			}
			$bulk=new MongoDB\Driver\BulkWrite;
			foreach ($data as $k => $v) {
				$opts=(isset($v[2]))?$v[2]:['upsert'=>true];
				$bulk->update($v[0],$v[1],$opts);
			}
			$creds=self::getCreds(phi::$conf['env']);
			$string=self::getConnectionString();
			$manager = new MongoDB\Driver\Manager($string);
			return self::toJson($manager->executeBulkWrite($db.'.'.$coll, $bulk));
		}
		public static function toJson($data){
			if($data) return json_decode(MongoDB\BSON\toJSON(MongoDB\BSON\fromPHP($data)),1);
			else return false;
		}
		public static function toId($id){
			return new MongoDB\BSON\ObjectID($id);
		}
		public static function getId($data,$type=false){
			if($type=='link'){
				return phi::makeLinkUid($data['url']);//ensures that its key is assosciated with unique hash
			}else{
				return 'M'.substr(md5(json_encode($data,JSON_UNESCAPED_SLASHES)),0,13);
			}
		}
		public static function getIdFromTime($ts){
			return new MongoDB\BSON\ObjectID(sprintf("%08x%016x", $ts, 0));
		}
		public static function idToTime($id,$php=false){
			if($php){
				if(isset($id['$oid'])) return (int) hexdec(substr((string) $id['$oid'], 0, 8));
				else return (int) hexdec(substr((string) $id, 0, 8));
			}else{
				if(isset($id['$oid'])) return hexdec(substr((string) $id['$oid'], 0, 8)).'000';
				else return hexdec(substr((string) $id, 0, 8)).'000';
			}
		}
		public static function toTime($id){
			return new MongoDB\BSON\UTCDateTime(self::idToTime($id));
		}
		public static function fixTsu($data){
			foreach ($data as $k => $v) {
				if(isset($v['tsu'])){
					$ti=$v['tsu']->toDateTime()->getTimestamp();
					$data[$k]['tsu']=$ti;
				}
			}
			return $data;
		}
		public static function tsToTime($ts,$php=true){
			if($php){
				$ts=$ts.'000';
			}
			return new MongoDB\BSON\UTCDateTime($ts);
		}
		public static function timeToId($ts){
		    // turn it into hex
		    $hexTs = dechex($ts);
		    // pad it out to 8 chars
		    $hexTs = str_pad($hexTs, 8, "0", STR_PAD_LEFT);
		    // make an _id from it
		    return new MongoDB\BSON\ObjectID($hexTs."0000000000000000");
		}
		public static function find($db,$coll,$query,$opts=array()){
			try{
				$db=self::getConnection(self::getDB($db));
				$res=$db->$coll->find($query,$opts);
				// if(isset($opts['sort'])) $res->sort($opts['sort']);
				// if(isset($opts['limit'])) $res->limit($opts['limit']);
				$arr=$res->toArray();
				return $arr;
			}catch(Exception $e){
				$m=$e->getMessage();
				API::toHeaders(array('error'=>'Database Connection Error','trace'=>$e->getTraceAsString()));
			}
		}
		public static function toCSV($ordereddata,$map,$delimiter=',',$file=false){
			foreach ($map as $tk => $tv) {
				$row[]=$tv;
			}
			$rows[]=$row;
			foreach ($ordereddata['order'] as $k => $v) {
				if(isset($row)) unset($row);
				$d=$ordereddata['list'][$v];
				foreach ($map as $tk => $tv) {
					$val=phi::dotGet($tk,$d);
					if($val){
						if(is_array($val)){
							$row[]=implode(',',$val);
						}else{
							$row[]=addslashes($val);
						}
					}else{
						$row[]='';
					}
				}
				$rows[]=$row;
			}
			return $rows;
		}
		public static function map($cur,$map){
			foreach ($cur as $k => $doc) {
				foreach ($map as $field => $settings) {
					$mfield=(isset($settings['field']))?$settings['field']:$field;
					$mapped=self::findOne($settings['search'][0],$settings['search'][1],array($field=>$doc[$mfield]));
					if($mapped){
						if(is_callable($settings['return'])){
							if(isset($settings['replace'])) $cur[$k]=$settings['return']($mapped);
							else $cur[$k][$settings['mapTo']]=$settings['return']($mapped);
						}else{
							if(isset($settings['replace'])) $cur[$k]=phi::keepFields($mapped,$settings['return']);
							else $cur[$k][$settings['mapTo']]=phi::keepFields($mapped,$settings['return']);
						}
					}else{
						$cur[$k][$settings['mapTo']]=false;
					}
				}
			}
			return $cur;
		}
		public static function buildOrQuery($queries){
			if(sizeof($queries)==1){
				$query=$queries[0];
			}else{
				foreach ($queries as $k => $v) {
					$query['$or'][]=$v;
				}
			}
			return $query;
		}
		public static function buildAndQuery($queries){
			foreach ($queries as $k => $v) {
				$query['$and'][]=array($k=>$v);
			}
			return $query;
		}
		public static function buildTagQuery($dot,$tags){
			if(sizeof($tags)>1){
				foreach ($tags as $k => $v) {
					$set[$dot]=array('$in'=>array($v));
					$query['$and'][]=$set;
				}
				return $query;
			}else{
				return array($dot=>array('$in'=>$tags));
			}
		}
		public static function graphOne($db,$item,$map){
			if(isset($item['_id']['$oid'])) $item['_id']=(string) $item['_id']['$oid'];
			$obj['order'][]='tempid';
			$obj['list']['tempid']=$item;
			$ret=self::graph($db,$obj,$map);
			if(isset($ret['order'][0])){
				return $ret['list']['tempid'];
			}else return false;
		}
		public static function getFilterCoords($location){

		}
		public static function filterLocationPipeline($query,$filter=false,$opts){
			if(!$filter) return $query;
			if(isset($filter['location'])&&$filter['location']){
				//die(json_encode($filter));
				$d=(int) $filter['distance'];
				if($d<.5||$d>1001) return array('error'=>'invalid distance');
				$km=($d*1.60934)*1000;
				if(isset($filter['location']['coords'])){
					$coords=[(float) $filter['location']['coords'][0],(float) $filter['location']['coords'][1]];
				}else{
					$coords=array((float)$filter['location']['geometry']['coordinates'][0],(float) $filter['location']['geometry']['coordinates'][1]);
				}
				$ret=array(
					'$geoNear'=>array(
						//'limit'=>(isset($opts['limit']))?$opts['limit']:100,
						'near'=>array(
							'type'=>'Point',
							'coordinates'=>$coords
						),
						'query'=>$query['$match'],
						'distanceField'=>$opts['distanceField'],
						'key'=>$opts['key'],
						'maxDistance'=>$km,//1000km
						'spherical'=>true
					)
				);
				//die(json_encode($ret));
			}else{
				return $query;
			}
			return $ret;
		}
		public static function graph($db,$ordereddata,$map,$listOnly=false){
			//build queries
			if($listOnly){
				$ordereddata['list']=$ordereddata;
			}
			if(!$ordereddata||!isset($ordereddata['list'])) return false;
			foreach ($ordereddata['list'] as $k => $doc) {
				foreach ($map as $mk => $mv) {
					if(isset($mv['create'])){
						if(isset($mv['create']['join'])){
							if(isset($jp)) unset($jp);
							// die(json_encode($mv['create']['join']['data']));
							foreach ($mv['create']['join']['data'] as $jk => $jv) {
								//die(json_encode($jv));
								if($jv&&$jv[0]=='$'){//use variable from data
									$tkey = ltrim($jv, '$');
									if(isset($doc[$tkey])){
										$jp[]=$doc[$tkey];
									}
								}else{//used passed info
									if($jv=='[uid]'&&isset(phi::$auth['uid'])){
										$jp[]=phi::$auth['uid'];
									}else{
										$jp[]=$jv;
									}
								}
							}
							$ordereddata['list'][$k][$mk]=$doc[$mk]=implode($mv['create']['join']['separator'], $jp);
						}
					}
					if(isset($mv['map'])){
						$val=phi::dotGet($mk,$doc);
						if($val&&is_string($val)){//only accept keys that have a string!  Backward compatible
							$first=$val[0];
							if(isset($mv['map'][$first])){
								$d=$mv['map'][$first];
								$fetch3[$mk][$d['coll']][]=$val;
							}else{
								phi::log('invalid map item for graph');
							}
						}
					}else if(is_string($mv['coll'])){
						$val=phi::dotGet($mk,$doc);
						if($val){//only accept keys that have a string!  Backward compatible
							if(is_string($val)){
								if(!isset($fetch[$mk])) $fetch[$mk]=array();
								if(!in_array($val, $fetch[$mk])) $fetch[$mk][]=$val;
							}
							if(is_array($val)||is_object($val)){//multi-id graph!
								foreach ($val as $vk => $vv) {
									if(isset($mv['keys'])){
										if(!isset($fetch[$mk])) $fetch[$mk]=array();
										if(!in_array($vk, $fetch[$mk])) $fetch[$mk][]=$vk;
									}else{
										if(!isset($fetch[$mk])) $fetch[$mk]=array();
										if(!in_array($vv, $fetch[$mk])) $fetch[$mk][]=$vv;
									}
								}
							}
						}
					}else{
						$coll=phi::dotGet($mv['coll']['field'],$doc);
						#die(json_encode(['field'=>$mv['coll']['field'],'data'=>$coll,'doc'=>$doc]));
						if(!isset($fetch2[$mk][$coll])) $fetch2[$mk][$coll]=array();
						$id=phi::dotGet($mv['coll']['id'],$doc);
						if($coll&&!in_array($id, $fetch2[$mk][$coll])) $fetch2[$mk][$coll][]=$id;
					}
				}
			}
			if(isset($fetch3)){
				foreach($fetch3 as $mk => $mv) {
					$opts=$map[$mk];
					foreach ($opts['filter'] as $k => $v) {
						$proj[$v]=1;
					}
					foreach ($mv as $tk => $tv) {
						$l=db2::toList(db2::find(phi::$conf['dbname'],$tk,array('id'=>array('$in'=>$tv)),array('projection'=>$proj)),false,'id');
						foreach ($ordereddata['list'] as $k => $doc) {
							$val=phi::dotGet($mk,$doc);
							if(isset($l[$val])){
								$ordereddata['list'][$k]=phi::dotSet($opts['to'],$ordereddata['list'][$k],$l[$val]);
							}
						}
					}
				}
			}
			if(isset($fetch2)){
				foreach ($fetch2 as $mk => $v){
					$opts=$map[$mk]['opts'];
					foreach ($v as $tk => $tv) {
						if(!isset($opts[$tk])) continue;
						$topts=$opts[$tk];
						if(!isset($topts['fields'])){
							$topts['fields']=array();
							$dopts=array();
						}else{
							$dopts=array('projection'=>$topts['fields']);
						}
						$coll=$topts['coll'];
						$res=db2::toList(db2::find($db,$coll,array($topts['match']=>array('$in'=>$tv)),$dopts),array_keys($topts['fields']),$topts['match']);
						//add in create data
						if(isset($topts['graph'])){
							foreach ($topts['graph'] as $rk => $rv) {
								if(isset($rv['create'])){
									if($res) foreach ($res as $trk => $trv) {
										if(isset($rv['create']['join'])){
											if(isset($jp)) unset($jp);
											foreach ($rv['create']['join']['data'] as $jk => $jv) {
												if($jv[0]=='$'){//use variable from data
													$tkey = ltrim($jv, '$');
													if(isset($trv[$tkey])){
														$jp[]=$trv[$tkey];
													}
												}else{//used passed info
													$jp[]=$jv;
												}
											}
											$res[$trk][$rk]=implode($rv['create']['join']['separator'], $jp);
										}
									}
								}
							}
						}
						if($res&&isset($topts['graph'])){
							//die(json_encode($res));
							//die(json_encode($topts['graph']));
							$d=self::graph($db,array(
								'list'=>$res,
								'order'=>array_values(array_keys($res))
							),$topts['graph']);
							//die(json_encode($d));
							$res=$d['list'];
						}
						//graph it in!
						foreach ($ordereddata['list'] as $k => $doc) {
							$coll=phi::dotGet($map[$mk]['coll']['field'],$doc);
							if($coll){
								$id=phi::dotGet($map[$mk]['coll']['id'],$doc);
								if(isset($res[$id])){
									$ordereddata['list'][$k]=phi::dotSet($map[$mk]['to'],$ordereddata['list'][$k],$res[$id]);
								}else{
									if(isset($map[$mk]['clearOnNull'])){
										$ordereddata['list'][$k]=phi::dotUnset($mk,$ordereddata['list'][$k]);
									}
								}
							}
						}
					}
				}
			}
			//die(json_encode($fetch));
			if(isset($fetch)){
				foreach ($fetch as $mk => $v) {
					$opts=$map[$mk];
					if(!isset($opts['fields'])){
						$opts['fields']=array();
						$dopts=array();
					}else{
						$dopts=array('projection'=>$opts['fields']);
					}
					if($opts['match']=='_id'){
						foreach ($v as $tk => $tv) {
							$mids[]=self::toId($tv);
						}
						$mq=array($opts['match']=>array('$in'=>$mids));
					}else{
						$mq=array($opts['match']=>array('$in'=>$v));
					}
					//phi::log('QUERY:['.$opts['coll'].'] '.json_encode($mq));
					//die(var_dump($mq));
					if(isset($opts['isList'])){
						$res=db2::toOrderedList(db2::find($db,$opts['coll'],$mq,$dopts),array_keys($opts['fields']),(isset($opts['keyOn']))?$opts['keyOn']:$opts['match']);
						if($res&&isset($opts['graph'])){
							$res=self::graph($db,$res,$opts['graph']);
						}
						if($res){
							$res=phi::keepFields($res,['list','order']);
							$ordereddata['list'][$k]=phi::dotSet($opts['to'],$ordereddata['list'][$k],$res);
						}
						//die(json_encode($res));
					}else{
						$res=db2::toList(db2::find($db,$opts['coll'],$mq,$dopts),array_keys($opts['fields']),(isset($opts['keyOn']))?$opts['keyOn']:$opts['match']);
						if($res&&isset($opts['graph'])){
							$d=self::graph($db,array(
								'list'=>$res,
								'order'=>array_values(array_keys($res))
							),$opts['graph']);
							$res=$d['list'];
						}
						foreach ($ordereddata['list'] as $k => $doc) {
							$val=phi::dotGet($mk,$doc);
							if(isset($opts['keys'])){
								if($val){
									$val=array_keys($val);
								}
							}
							if($val){
								if(isset($tset)) unset($tset);
								if(is_string($val)&&isset($res[$val])&&$res[$val]){
									if(isset($opts['subfield'])){
										if(isset($res[$val][$opts['subfield']])){
											$tset=self::filterData($opts,$res[$val][$opts['subfield']]);
										}else{
											$tset=false;
										}
									}else{
										$tset=self::filterData($opts,$res[$val]);
									}
								}
								if(is_array($val)||is_object($val)){
									foreach ($val as $vk => $vv) {
										$vvs[]=$vv;
										if(!is_string($vv)){
											phi::log($vv);
										}else{
											if(isset($res[$vv])&&$res[$vv]){
												if(isset($opts['collapseList'])){
													if(isset($opts['subfield'])){
														$tset[$vv]=self::filterData($opts,$res[$vv][$opts['subfield']]);
													}else{
														$tset[$vv]=self::filterData($opts,$res[$vv]);
													}
												}else{
													$tset['order'][]=$vv;
													if(isset($opts['subfield'])){
														$tset['list'][$vv]=self::filterData($opts,$res[$vv][$opts['subfield']]);
													}else{
														$tset['list'][$vv]=self::filterData($opts,$res[$vv]);
													}
												}
											}
										}
									}
								}
								if(!isset($tset)){
									if(isset($opts['clearOnNull'])) $ordereddata['list'][$k]=phi::dotUnset($opts['to'],$ordereddata['list'][$k]);
								}else{
									if(isset($tset['_id']['$oid'])) $tset['_id']=(string) $tset['_id']['$oid'];
									if(isset($opts['isSet'])){
										$tset=true;
									}
									if(isset($opts['list'])){
										$ordereddata['list'][$k]=phi::dotPush($opts['to'],$ordereddata['list'][$k],$tset);
									}else{
										$ordereddata['list'][$k]=phi::dotSet($opts['to'],$ordereddata['list'][$k],$tset);
									}
								}
							}else if(isset($opts['clearOnNull'])){
								$ordereddata['list'][$k]=phi::dotUnset($opts['to'],$ordereddata['list'][$k]);
							}
						}
					}
				}
			}
			foreach ($ordereddata['list'] as $k => $v) {
				foreach ($map as $mk => $mv) {
					if(isset($map['defaults'])){
						foreach ($map['defaults'] as $dk => $dv) {
							if(!isset($v[$dk])) $v[$dk]=$dv;
						}
					}
				}
			}
			if($listOnly){
				return $ordereddata['list'];	
			}else{
				return $ordereddata;
			}
		}
		public static function filterData($opts,$data){
			if(isset($opts['filter'])){
				return phi::keepFields($data,$opts['filter']);
			}else{
				return $data;
			}
		}
		public static function toList($cur,$filter=false,$keyon=false){
			$res=false;
			foreach ($cur as $k => $doc) {
				$doc=self::toJSON($doc);
				if(isset($doc['_id']['$oid'])) $doc['_id']=$doc['_id']['$oid'];
				if($keyon&&phi::dotGet($keyon,$doc)){
					$id=phi::dotGet($keyon,$doc);
				}else if(isset($doc['id'])){
					$id=$doc['id'];
					//unset($doc['_id']);//never return mongo _id
				}else{//fallback to mongo id
					$id=(isset($doc['_id']['$oid']))?$doc['_id']['$oid']:$doc['_id'];
				}
				if($filter) $res[$id]=phi::keepFields($doc,$filter);
				else $res[$id]=$doc;
			}
			return $res;
		}
		public static function process($cur,$process){
			foreach ($cur as $k => $doc) {
				$doc=self::toJSON($doc);
				$process($doc);
			}
		}
		public static function toOrderedList($cur,$filter=false,$last=false,$keyon='id',$laston='_id'){
			$res=false;
			if(!$laston) $laston='_id';
			if(!$cur) return false;
			foreach ($cur as $k => $doc) {
				$doc=self::toJSON($doc);
				if($last){
					if($laston=='_id'){
						if(isset($doc['_id']['$oid'])){
							$res['orderid'][]=$doc['_id']['$oid'];
						}else{
							$res['orderid'][]=$doc['_id'];
						}
					}else if($laston=='tsu'||$laston=='published_ts'||$laston=='published_tsu'){
						if(is_int($doc[$laston])){
							$res['orderid'][]=$doc[$laston];
						}else{
							if(isset($doc[$laston])) $res['orderid'][]=$doc[$laston]['$date']/1000;
						}
					}else{
						$res['orderid'][]=$doc[$laston];
					}
				}
				$id='';
				if(isset($doc[$keyon])&&$keyon!='_id'){
					if(is_array($doc[$keyon])){
						if(isset($doc[$keyon]['$date'])){
							$id=$doc[$keyon]['$date'];
						}else{
							$id=$doc[$keyon];
						}
					}else{
						$id=$doc[$keyon];
					}
					$doc['_id']=$doc['_id']['$oid'];
					//unset($doc['_id']);//never return mongo _id
				}else{//fallback to mongo id
					if(isset($doc['_id']['$oid'])){
						$doc['_id']=$doc['_id']['$oid'];
					}
					$id=$doc['_id'];
				}
				if(!$id) continue;
				if($filter) $res['list'][$id]=phi::keepFields($doc,$filter);
				else $res['list'][$id]=$doc;
				$res['order'][]=$id;
			}
			if($last&&isset($res['orderid'])) $res['last']=end($res['orderid']);
			if(isset($res['orderid'])) unset($res['orderid']);
			return $res;
		}
		public static function getKeysFromCollection($db,$coll,$deep=false){
			$db=self::getConnection(self::getDB($db));
			$cursor = $db->$coll->find();
			$array = iterator_to_array($cursor);
			$keys = array();
			foreach ($array as $k => $v) {
				$v=json_decode(json_encode($v),1);
		        foreach ($v as $a => $b) {
		        		if($a=='_id') continue;
		                if(is_array($b)&&!isset($b[0])&&$deep){
		                	$kv=array_keys($b);
		                	foreach($kv as $tk=>$tv){
		                		if(is_array($b[$tv])&&!isset($b[$tv][0])){
		                			$rd=array_keys($b[$tv]);
		                			foreach($rd as $tk2=>$tv2){
		                				$uk=$a.'.'.$tv.'.'.$tv2;
		                				if(!in_array($uk, $keys)) $keys[]=$uk;
		                			}
		                		}else{
		                			$uk=$a.'.'.$tv;
		                			if(!in_array($uk, $keys)) $keys[]=$uk;
		                		}
		                	}
		                }else{
		                	if(!in_array($a, $keys)) $keys[]=$a;
		                }
		        }
			}
			return $keys;
		}
		public static function count($db,$coll,$query=array()){
			try{
				$db=self::getConnection(self::getDB($db));
				return $db->$coll->count($query);
			}catch(Exception $e){
				$m=$e->getMessage();
				API::toHeaders(array('error'=>'Database Connection Error','trace'=>$e->getTraceAsString()));
			}
		}
		public static function save($db,$coll,$obj,$opts=array()){
			try{
				if(self::$queryBackup){
					return false;//cannot write backup
				}
				$wdb=self::getConnection(self::getDB($db));
				return $wdb->$coll->insertOne($obj);
			}catch(Exception $e){
				$m=$e->getMessage();
				if(class_exists('API')){
					API::toHeaders(array('error'=>'Database Connection Error','trace'=>$e->getTraceAsString()));
				}else{
					phi::clog('error: '.json_encode(array('error'=>'Database Connection Error','trace'=>$e->getTraceAsString()),JSON_PRETTY_PRINT));
					phi::log('error: '.json_encode(array('error'=>'Database Connection Error','trace'=>$e->getTraceAsString())));
				}
			}
		}
		public static function getTables($db){
			try{
				$wdb=self::getConnection(self::getDB($db));
				$tables=false;
				foreach ($wdb->listCollections() as $collectionInfo) {
				    $tables[]=$collectionInfo->getName();
				}
				return $tables;
			}catch(Exception $e){
				$m=$e->getMessage();
				API::toHeaders(array('error'=>'Database Connection Error','trace'=>$e->getTraceAsString()));
			}
		}
		public static function createIndex($db,$coll,$index){
			try{
				$wdb=self::getConnection(self::getDB($db));
				return $wdb->$coll->createIndex($index);
			}catch(Exception $e){
				$m=$e->getMessage();
				API::toHeaders(array('error'=>'Database Connection Error','trace'=>$e->getTraceAsString()));
			}
		}
		public static function listIndexes($db,$coll){
			try{
				$wdb=self::getConnection(self::getDB($db));
				$indexes=false;
				foreach ($wdb->$coll->listIndexes() as $index) {
				   $indexes[]=$index;
				}
				return $indexes;
			}catch(Exception $e){
				$m=$e->getMessage();
				API::toHeaders(array('error'=>'Database Connection Error','trace'=>$e->getTraceAsString()));
			}
		}
		public static function createIndexes($db,$coll,$indexes){
			try{
				$wdb=self::getConnection(self::getDB($db));
				return $wdb->$coll->createIndexes($indexes);
			}catch(Exception $e){
				$m=$e->getMessage();
				API::toHeaders(array('error'=>'Database Connection Error','trace'=>$e->getTraceAsString()));
			}
		}
		public static function dropIndexes($db,$coll){
			try{
				$wdb=self::getConnection(self::getDB($db));
				return $wdb->$coll->dropIndexes();
			}catch(Exception $e){
				$m=$e->getMessage();
				API::toHeaders(array('error'=>'Database Connection Error','trace'=>$e->getTraceAsString()));
			}
		}
		public static function sync($db,$coll,$from){
			self::drop($db,$coll);
			$currentdb=self::getConnection(self::getDB($db));
			$fromdb=self::getConnection($db,$from);
			$d=$fromdb->$coll->find();
			foreach ($d as $k => $doc) {
				//$doc=self::toJSON($doc);
				//phi::clog($doc['_id'].'',1);//testing
				$currentdb->$coll->insertOne($doc);
			}
			//apply copy based on schema
			$schema=phi::getModel($coll);
			if($schema){
				if(isset($schema['onSync'])&&isset($schema['onSync'])){
					foreach($schema['onSync'] as $k=>$v){
						#phi::log('Also sync ['.$k.']');
						self::sync($db,$v,$from);
					}
				}
			}
			//$result=$admin->command(array("cloneCollection" => $coll, 'from' => PROD_DB_CONNECTION));
		}
		public static function drop($db,$coll){
			try{
				$wdb=self::getConnection(self::getDB($db));
				return $wdb->$coll->drop();
			}catch(Exception $e){
				$m=$e->getMessage();
				API::toHeaders(array('error'=>'Database Connection Error','trace'=>$e->getTraceAsString()));
			}
		}
		public static function remove($db,$coll,$query,$many=false){
			try{
				$wdb=self::getConnection(self::getDB($db));
				if(!$many){
					return $wdb->$coll->deleteOne($query);
				}else{
					return $wdb->$coll->deleteMany($query);
				}
				return false;
			}catch(Exception $e){
				$m=$e->getMessage();
				API::toHeaders(array('error'=>'Database Connection Error','trace'=>$e->getTraceAsString()));
			}
		}
		public static function niceGUIDBulk($oopts,$count,$retry=false){//$len=7,$pre='R',$div=100,$unique=false,$test=false
			$total=$count*2;//at least double the amount
			$c=0;
			while($c<$total){
				$guids[]=self::niceGUID(array_merge(array(
					'len'=>7,
					'pre'=>'R',
					'div'=>false,
					'unique'=>false,
					'test'=>false,
					'upperonly'=>true
				),$oopts,array('unique'=>false)));
				$c++;
			}
			//now check uniqueness
			if($oopts['unique']){
				$l=db2::toList(db2::find($oopts['unique']['collection'],$oopts['unique']['table'],array($oopts['unique']['field']=>array('$in'=>$guids)),array(),$oopts['unique']['field']));
				if($l){//remove any already used guids;
					$remove=array_values(array_keys($l));
					$guids=array_values(array_diff($guids, $remove));
				}
			}
			//trim
			$c=0;
			while($c<$count){
				$oguids[]=$guids[$c];
				$c++;
			}
			if(!isset($oguids)||sizeof($oguids)!=$count){
				if(!$retry){
					$oguids=self::niceGUIDBulk($oopts,$count,1);
				}else{
					phi::alertAdmin('Error generating bulkguids');
					API::toHeaders(array('error'=>'error buiding unique keys'));
				}
			}
			return $oguids;
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
			if($opts['upperonly']){
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
				if(db2::count($opts['unique']['collection'],$opts['unique']['table'],array($opts['unique']['field']=>$uid))){
					//will ensure unique!
					$uid=self::niceGUID($oopts);
				}
			}
			return $uid;
		}
		public static function update($db,$coll,$query,$obj,$opts=array(),$single=true){
			try{
				if(self::$queryBackup){
					return false;//cannot write backup
				}
				if(isset($opts['multi'])){
					$single=false;
				}
				$wdb=self::getConnection(self::getDB($db));
				if(isset($obj['$set']['_id'])) unset($obj['$set']['_id']);//never update by _id
				if($single){
					return $wdb->$coll->updateOne($query,$obj,$opts);
				}else{
					return $wdb->$coll->updateMany($query,$obj,$opts);
					// $c=self::count($db,$coll,$query);
					// if($c==1){
					// 	return $wdb->$coll->updateOne($query,$obj,$opts);
					// }else if($c>1){
					// 	return $wdb->$coll->updateMany($query,$obj,$opts);
					// }else if($c==0&&isset($opts['upsert'])){
					// 	return $wdb->$coll->updateOne($query,$obj,$opts);
					// }
				}
			}catch(Exception $e){
				$m=$e->getMessage();
				if(!class_exists('API')){
					phi::clog(json_encode(array('error'=>'Database Connection Error','trace'=>$e->getTraceAsString()),JSON_PRETTY_PRINT));
				}else{
					API::toHeaders(array('error'=>'Database Connection Error','trace'=>$e->getTraceAsString()));
				}
			}
		}
	}
?>