<?php
	class CLOUDS{
		public static $id='';
		public static function handleRequest($r){
			if(isset($r['path'][5])) self::$id=$r['path'][5];
			switch ($r['path'][4]) {
				case 'load':
					$out=self::load($r);
				break;
				case 'stream':
					$out=self::stream($r);
				break;
			}
			if(!isset($out)) $out['error']='no_data';
			return $out;
		}
		public static function stream($r){
			include_once(ROOT.'/api/class/formbuilder.php');
			$d=phi::ensure($r,['collection','field','tag','filter']);
			if($d['filter']){
				$q=phi::convertArray($d['filter']);
				//die(json_encode($d['filter']));
				#die(json_encode($q));
				return formbuilder::feed(array(
					'auth'=>$r['auth'],
					'qs'=>array(
						'schema'=>$r['qs']['collection'],
						'last'=>(isset($r['qs']['last']))?$r['qs']['last']:''
					)
				),$q,array(
					'sort'=>array('_id'=>-1)
				),'_id');
			}else if($d['tag']&&$d['field']){
				$q=array();
				$q[$d['field']]=['$in'=>[$d['tag']]];
				return formbuilder::feed(array(
					'auth'=>$r['auth'],
					'qs'=>array(
						'schema'=>$r['qs']['collection'],
						'last'=>(isset($r['qs']['last']))?$r['qs']['last']:''
					)
				),$q,array(
					'sort'=>array('_id'=>-1)
				),'_id');
			}else{
				return array('error'=>'invalid_filter');
			}
		}
		public static function getCloudData($coll,$field,$tag_coll,$q=false){
			if($q){

			}else{

			}
			$pipeline=array(
				array(
					'$match'=>array('id'=>array('$exists'=>true))
				),
				array(
					'$unwind'=>'$'.$field
				),
				array(
					'$group'=>array(
						"_id"=>array( 
					        "tag"=>'$'.$field
					    ),
					    "count"=>array(
					    	'$sum'=>1
					    )
					)
				),
				array(
					'$limit'=>100
				)
			);
			$cloud=db2::aggregate(phi::$conf['dbname'],$coll,$pipeline);
			if($cloud){
				foreach ($cloud as $k => $v){
					if(!isset($data[$v['_id']['tag']])) $data[$v['_id']['tag']]=0;
					$data[$v['_id']['tag']]+=$v['count'];
				}
			}
			if(isset($data)){//map actual tag name here!
				$list=array_keys($data);
				$listdata=db2::toList(db2::find(phi::$conf['dbname'],$tag_coll,array('id'=>array('$in'=>$list)),array('projection'=>array('name'=>1,'id'=>1))));
				foreach ($data as $k => $v) {
					if(isset($listdata[$k])){
						$out[]=array('key'=>$listdata[$k]['name'],'value'=>$v,'id'=>$k);
					}else{
						//add it!
						$update[]=[[
							'id'=>$k
						],[
							'id'=>$k,
							'name'=>phi::tagToName($k)
						]];
						phi::log('cloud:invalid ['.$k.']');
					}
				}
			}
			if(isset($update)){
				db2::bulkUpdate(DB,$tag_coll,$update);
			}
			if(!isset($out)) $out=false;
			else {
				usort($out, function($a, $b){
				    return $a['value']<$b['value'];
				});
			}
			return $out;
		}
		public static function load($r){
			//make clouds!
			switch($r['qs']['cloud']){
				case 'skills':
					$opts=[
						'name'=>'Skills',
						'coll'=>'user',
						'field'=>'skills',
						'template'=>'peoples',
						'tag_coll'=>'tags_skills'
					];
				break;
				case 'gifts':
					$opts=[
						'name'=>'Gifts',
						'coll'=>'exchange',
						'field'=>'tags',
						'template'=>'gifts',
						'tag_coll'=>'tags_exchange'
					];
				break;
				case 'requests':
					$opts=[
						'name'=>'Requets',
						'coll'=>'need',
						'field'=>'tags',
						'template'=>'requests',
						'tag_coll'=>'tags_need'
					];
				break;
				case 'offers':
					$opts=[
						'name'=>'Offers',
						'coll'=>'offer',
						'field'=>'tags',
						'template'=>'offers',
						'tag_coll'=>'tags_offer'
					];
				break;
				case 'news':
					$opts=[
						'name'=>'News',
						'coll'=>'update',
						'field'=>'tags',
						'template'=>'updates',
						'tag_coll'=>'tags_update'
					];
				break;
			}
			$data=array(
				'name'=>$opts['name'],
				'collection'=>$opts['coll'],
				'field'=>$opts['field'],
				'template'=>$opts['template'],
				'data'=>self::getCloudData($opts['coll'],$opts['field'],$opts['tag_coll'])
			);
			return array('success'=>true,'data'=>$data);
		}
	}
?>