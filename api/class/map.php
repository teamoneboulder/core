<?php
	class MAP{
		public static $ver=1;
		public static $db='';
		public static $wdb='';
		public static $coll='one';
		public static function handleRequest($r){
			switch ($r['path'][4]) {
				case 'markers':
					$out=self::getMarkers($r);
				break;
				case 'marker':
					$out=self::getMarker($r);
				break;
				case 'save':
					$out=self::saveMapItem($r);
				break;
				case 'delete':
					$out=self::deleteMapItem($r);
				break;
				case 'search':
					$out=self::searchMap($r);
				break;
				case 'loc':
					$out=self::loc($r);
				break;
				case 'conf':
					$out=self::conf($r);
				break;
				case 'tags':
					$out=self::searchTags($r);
				break;
				case 'layers':
					$out=self::searchLayers($r);
				break;
				default:
					phi::log('request','Bad map/api.php request');
					$out=false;
				break;
			}
			return $out;
		}
		public static function hasPermission($r){
			$stewards=ONE_CORE::getStewards();
			if(in_array($r['auth']['uid'],$stewards)){
				return true;
			}else{
				return false;
			}
		}
		public static function searchTags(){
			return array('success'=>true);
		}
		public static function searchLayers($r){
			//die(json_encode($q));
			//need to be based on map conf!
			$data=db2::findOne(DB,'maps',array('id'=>$r['path'][5]));//default
			if($data){
				$list=$data['layers'];
				foreach ($list as $k => $v) {
					if($r['qs']['search']){
						if(strpos($k, $r['qs']['search'])!==false){
							$fields[]=$k;
						}
					}else{
						$fields[]=$k;
					}
				}
				if(isset($fields)){
					$q=array('id'=>array('$in'=>$fields));
					$out=db2::toOrderedList(db2::find(DB,'map_layer',$q));
				}
				if(!isset($out)) $out=false;
			}else{
				return array('error'=>'invalid_map');
			}
			return array('success'=>true,'tags'=>$out);
		}
		public static function conf($r){
			$mapid=$r['path'][5];
			$data=db2::findOne(DB,'maps',array('id'=>$r['path'][5]));
			if($data){
				$sconf=json_decode(file_get_contents(ROOT.'/_manage/schema.json'),1);
				//$conf=(isset($sconf[$model]))?$sconf[$model]:false;
				$data['schema']['items']=array(
					'order'=>array('marker'),
					'list'=>array(
						'marker'=>$sconf['map_marker']
					)
				);
			}else{
				return array('error'=>'invalid_map');
			}
			return array('success'=>true,'conf'=>$data);
		}
		public static function loc($r){
			$coords=self::getLandCoord();
			die(json_encode($coords));
		}
		public static function project($pt,$bounds,$size){
			$diffx=$bounds['x']['max']-$bounds['x']['min'];
			$diffy=$bounds['y']['max']-$bounds['y']['min'];
			$px=$pt['x']/$size['width'];
			$py=$pt['y']/$size['height'];
			//http://wiki.openstreetmap.org/wiki/Mercator
			// function lon2x($lon) { return deg2rad($lon) * 6378137.0; }
			// function lat2y($lat) { return log(tan(M_PI_4 + deg2rad($lat) / 2.0)) * 6378137.0; }
			// function x2lon($x) { return rad2deg($x / 6378137.0); }
			// function y2lat($y) { return rad2deg(2.0 * atan(exp($y / 6378137.0)) - M_PI_2); }
			return array('lat'=>$bounds['y']['min']+$diffy*$py,'lng'=>$bounds['x']['min']+$diffx*$px);
		}
		public static function getLandCoord(){
			ini_set('xdebug.max_nesting_level', 500);
			$img=ROOT."/sites/map/img/ocean_mask.png";
			$im = imagecreatefrompng($img);
			//get size bounds
			$s = getimagesize($img);
			$width=$s[0];
			$height=$s[1];
			$x=rand(0,$width);
			$y=rand(0,$height);
			$y=$height/2;//always center
			$z=6367;//aprx earth radius
			$rgb = imagecolorat($im, $x, $y);
			$colors = imagecolorsforindex($im, $rgb);
			if($colors['red']>200||$colors['green']>200||$colors['blue']>200){//land ye matey
				//convert to latlng
				$bounds=array(
					'x'=>array('min'=>-180,'max'=>180),
					'y'=>array('min'=>-90,'max'=>90)
				);
				$loc=array('x'=>$x,'y'=>$y);
				$size=array('width'=>$width,'height'=>$height);
				$latlng=self::project($loc,$bounds,$size);
			    return $latlng;
				
			}else{//retry
				return self::getLandCoord();
			}
		}
		public static function searchMap($r){
			//limit to current map
			//$q=array('name'=>new MongoRegex('/'.$r['qs']['query'].'/i'));
			$regex = new MongoDB\BSON\Regex($r['qs']['query'],'i');
			$q=array('name'=>$regex);
			//die(json_encode($q));
			$data=db2::findOne(DB,'maps',array('id'=>$r['qs']['id']));
			if(!$data) die(json_encode(array('error'=>'invalid_map_id')));
			$layers=array_keys($data['layers']);
			$q['layer']=array('$in'=>$layers);
			//die(json_encode($q));
			//$res=db2::find(DB,'map_marker',$q);
			$out['markers']=db2::toOrderedList(db2::find(DB,'map_marker',$q,array('limit'=>5,'sort'=>array('impact'=>1))));
			// $ms=$db->map_marker->find($q)->sort(array('impact'=>1));//use impact as a metric for sorting

			// $max=5;
			// if($ms->hasNext()){
			// 	$c=0;
			// 	while($ms->hasNext()&&$c<$max){
			// 		$m=$ms->getNext();
			// 		$out['markers']['list'][$m['_id']]=$m;
			// 		$out['markers']['order'][]=$m['_id'];
			// 		$c++;
			// 	}
			// 	$out['markers']['count']=$ms->count();
			// }else{
			// 	$out['markers']=false;
			// }
			$out['success']=true;
			return $out;
		}

		public static function save($table,$data,$bulk=false){
			$result=self::validateData($table,$data,$bulk);
			if(isset($result['error'])) phi::log($result['error']);
			else db2::save(DB,$table,$result);
			return $result;
		}
		public static function update($table,$search,$data,$bulk=false){
			$result=self::validateData($table,$data,$bulk);
			if(isset($result['error'])) phi::log($result['error']);
			else db2::update(DB,$table,$search,array('$set'=>$result),array('upsert'=>true));
			return $result;
		}
		public static function validateData($model,$data,$bulk=false){
			include_once(ROOT.'/classes/validator.php');
			$sconf=json_decode(file_get_contents(ROOT.'/_manage/schema.json'),1);
			$conf=$sconf['map_marker'];
			if(!$conf) API::toHeaders(array('error'=>'invalid_schema_object'));
			$resp=VALIDATOR::validate($data,$conf);
			if(isset($resp['error'])){
				if(!$bulk) API::toHeaders($resp);//dont pass go, write here!
				else return $resp;
			}else{
				return $resp;
			}
		}
		public static function saveMapItem($r){
			include_once(ROOT.'/classes/validator.php');
			$r['qs']['data']['coords']=array($r['qs']['data']['loc']['lng'],$r['qs']['data']['loc']['lat']);
			if(strpos($r['qs']['data']['id'], 'TMP')!==false){
				unset($r['qs']['data']['id']);//autocrete id
				$sdata=self::save('map_marker',$r['qs']['data']);
			}else{//update!
				$sdata=self::update('map_marker',$r['qs']['data']);
			}
			return array('success'=>true,'marker'=>$sdata);
		}
		public static function deleteMapItem($r){
			include_once(ROOT.'/classes/validator.php');
			$type=$r['path'][5];
			$table='map_'.$type;
			$data=$r['qs']['data'];
			$conf=self::$conf['items'][$type];
			if(!$conf) return array('error'=>'invalid_type');
			
			return array('success'=>true);
		}
		public static function fixBounds($bounds){
			foreach ($bounds as $k => $v) {
				foreach ($v as $tk => $tv) {
					$out[$k][$tk]=(float) $tv;
				}
			}
			return $out;
		}
		public static function getMarkers($r){
			$q=array();
			$allmarkers=false;
			if(!isset($r['qs']['id'])) return array('error'=>'invalid_map_id');//id must be set
			if(!isset($r['qs']['type'])||$r['qs']['type']=='viewport'){
				if(isset($r['qs']['bounds'])&&$r['qs']['bounds']){
					$bounds=self::fixBounds($r['qs']['bounds']);
					$q=array('point.coordinates'=>array('$geoWithin'=>array('$box'=>$bounds)));
				}else if(isset($r['qs']['filter'])&&$r['qs']['filter']){
					$q=array('layer'=>$r['qs']['filter']);
				}
				$data=db2::findOne(DB,'maps',array('id'=>$r['qs']['id']));
				if(!$data) die(json_encode(array('error'=>'invalid_map_id')));
				$layers=array_keys($data['layers']);
				//$q['layer']=array('$in'=>$layers);
			}else if(isset($r['qs']['type'])&&$r['qs']['type']!='viewport'){//get all
				$pdb=phi::getDB(false,'prod');
				$data=db2::findOne(DB,'maps',array('id'=>$r['qs']['id']));
				if(!$data) die(json_encode(array('error'=>'invalid_map_id')));
				$layers=array_keys($data['layers']);
				if($layers[0]=='all'){//shortcut
					$q=array();//everything....
					$allmarkers=true;
				}else{
					$q=array('layer'=>array('$in'=>$layers));
				}
			}else{
				die(json_encode(array('error'=>'invalid map type')));
			}
			//unset($q['coords']);
			//unset($q['layer']);
			//die(json_encode($q));
			$out['list']=db2::toList(db2::find(DB,'map_marker',$q),array('id','name','layer','description','point','image'));
			//graph data!
			$out=db2::graph(DB,$out,[
				'layer'=>[
					'coll'=>'map_layer',
					'match'=>'id',
					'to'=>'layer_info'
				]
			]);
			$out['success']=true;
			return $out;
		}
		public static function getMarker($r){
			$c=db2::findOne(phi::$conf['dbname'],'map_marker',array('id'=>$r['path'][5]));
			$schema=ONE_CORE::getSchema('map_marker');
			$c=db2::graphOne(phi::$conf['dbname'],$c,$schema['graph']);
			//add in other data, like comments
			//check permissions, assume public for now
			return array('success'=>true,'data'=>$c);
		}
	}
?>