<?php
	class bookmark_add{
		public static function handleRequest($r){
			switch ($r['path'][4]){
				case 'addcollection'://check
					$out=self::addCollection($r);
				break;
				case 'addtocollection'://check
					$out=self::addToCollection($r);
				break;
				case 'renamecollection'://check
					$out=self::renameCollection($r);
				break;
				case 'setfolderimage'://check
					$out=self::setFolderImage($r);
				break;
				case 'deletefolder'://check
					$out=self::deleteFolder($r);
				break;
				case 'bookmark'://check
					$out=self::bookmark($r);
				break;
				case 'unbookmark'://check
					$out=self::unbookmark($r);
				break;
				case 'cache':
					$out=self::cacheChildren($r);
				break;
			}
			return $out;
		}
		public static function deleteFolder($r){
			$d=phi::ensure($r,array('id'),1,array('self::write::bookmarks'));
			$c=db2::findOne('nectar','bookmark_collection',array('id'=>$d['id']));
			if(!$c) return array('error'=>'invalid_folder');
			db2::remove('nectar','bookmark_collection',array('id'=>$d['id']));
			//remove all references in bookmarks
			db2::update('nectar','bookmark',array('uid'=>$r['auth']['uid']),array('$pullAll'=>array('folders'=>array($d['id']))),array(),false);
			return array('success'=>true);
		}
		public static function setFolderImage($r){
			$d=phi::ensure($r,array('pic','id'),1,array('self::write::bookmarks'));
			$c=db2::findOne('nectar','bookmark_collection',array('id'=>$d['id']));
			if(!$c) return array('error'=>'invalid_folder');
			db2::update('nectar','bookmark_collection',array('id'=>$d['id']),array('$set'=>array('pic'=>$d['pic'],'tsu'=>db2::tsToTime(time()))));
			return array('success'=>true);
		}
		public static function renameCollection($r){
			$d=phi::ensure($r,array('name','id'),1,array('self::write::bookmarks'));
			$c=db2::findOne('nectar','bookmark_collection',array('_id'=>db2::toId($d['id'])));
			if(!$c) return array('error'=>'invalid_folder');
			db2::update('nectar','bookmark_collection',array('_id'=>db2::toId($d['id'])),array('$set'=>array('name'=>$d['name'],'tsu'=>db2::tsToTime(time()))));
			return array('success'=>true);
		}
		public static function addCollection($r){
			$d=phi::ensure($r,array('name','perms'),1,array('self::write::bookmarks'));
			//get post!
			if(isset($d['post_id'])&&$d['post_id']){
				$p=db2::findOne('nectar','post',array('id'=>$d['post_id']));
				if(!$p) return array('error'=>'invalid_post');
				$data=db2::graphOne('nectar',$p,array(
					'media.data'=>array(
						'coll'=>'media',
						'to'=>'media.data',
						'match'=>'id',
						'subfield'=>'data',
						'clearOnNull'=>true
					)
				));
				$pic=self::getImg($data);
				if($pic) $d['pic']=$pic;
				$d['count']=1;//save current count!
			}
			$d['tsu']=db2::tsToTime(time());
			if(isset($d['id'])&&$d['id']){
				//die(json_encode(phi::keepFields($d,array('name','pic','tsu','uid','count','parent'))));
				//die($d['id']);
				if(isset($d['parent'])&&$d['parent']){
					if($d['parent']==$d['id']) unset($d['parent']);
				}
				#die(json_encode(phi::keepFields($d,array('id','name','pic','tsu','uid','count','parent','perms'))));
				$coll=NECTAR::update('bookmark_collection',array('id'=>$d['id']),phi::keepFields($d,array('id','name','pic','tsu','uid','count','parent','perms')));
			}else{
				$d['uid']=$r['auth']['uid'];
				$coll=NECTAR::save('bookmark_collection',phi::keepFields($d,array('name','pic','tsu','uid','count','parent','perms')));
			}
			self::cacheChildren($r);//will always ensure things are correct...might be able to do something more memory 	efficient at some point...
			if(isset($d['post_id'])){
				db2::update('nectar','bookmark',array('id'=>$r['auth']['uid'].'_'.$d['post_id']),array('$addToSet'=>array('folders'=>$coll['id'])));//dont upsert on a bookmark!
			}
			return array('success'=>true,'data'=>$coll);
		}
		public static function getAllChildren($folder,$list){
			//includ self...all_children used for feed
			$all_children[]=$folder['id'];
			if(isset($folder['children'])){
				foreach ($folder['children'] as $fk => $fv) {
					if(isset($list[$fv])){
						$cc=self::getAllChildren($list[$fv],$list,1);
						if($cc){
							foreach ($cc as $k => $v) {
								$all_children[]=$v;
							}
						}
					}else{
						phi::log('missing bookmark collection');
					}
				}
			}
			if(!isset($all_children)) $all_children=false;
			return $all_children;
		}
		public static function cacheChildren($r){
			$d=phi::ensure($r,array(),1,array('self::write::bookmarks'));
			$l=db2::toList(db2::find('nectar','bookmark_collection',array('uid'=>$r['auth']['uid'])));
			if($l){
				//clear children, this algo rebuilds
				foreach ($l as $k => $v) {
					if(isset($v['children'])){
						unset($l[$k]['children']);
					}
					if(isset($v['all_children'])){
						unset($l[$k]['all_children']);
					}
				}
				#die(json_encode($l));
				foreach ($l as $k => $v) {
					if(isset($v['parent'])&&$v['parent']){
						if(isset($l[$v['parent']])){
							$l[$v['parent']]['children'][]=$v['id'];
						}
					}
				}
				//build all_children
				foreach ($l as $k => $v) {
					$v['all_children']=self::getAllChildren($v,$l);
				}
				//do a bulk save!
				foreach ($l as $k => $v) {
					if(isset($set)) unset($set);
					if(isset($unset)) unset($unset);
					if(isset($ud)) unset($ud);
					if(isset($v['children'])){
						$set['children']=$v['children'];
					}else{
						$unset['children']=1;
					}
					$set['all_children']=self::getAllChildren($v,$l);
					if(isset($set)){
						$ud['$set']=$set;
					}
					if(isset($unset)){
						$ud['$unset']=$unset;
					}
					$update[]=array(array('id'=>$v['id']),$ud);
				}
				#die(json_encode($update));
				db2::bulkUpdate('nectar','bookmark_collection',$update);
			}
			return array('success'=>true);
		}
		public static function getImg($data){
			if(isset($data['media']['data']['pic'])) return $data['media']['data']['pic'];
			if(isset($data['media']['data']['image'])) return $data['media']['data']['image'];
			if(isset($data['media']['data']['poster'])) return $data['media']['data']['poster'];
			if(isset($data['media']['data'][0]['pic'])) return $data['media']['data'][0]['pic'];
			return false;
		}
		public static function addToCollection($r){
			$d=phi::ensure($r,array('post_id','collection_id'),1,array('self::write::bookmarks'));
			$p=db2::findOne('nectar','post',array('id'=>$d['post_id']));
			if(!$p) return array('error'=>'invalid_post');
			$b=db2::findOne('nectar','bookmark',array('id'=>$r['auth']['uid'].'_'.$d['post_id']));
			if(!$b) return array('error'=>'invalid_bookmark');
			//ensure collection exists
			$c=db2::findOne('nectar','bookmark_collection',array('id'=>$d['collection_id']));
			if(!$c) return array('error'=>'invalid_collection');
			if(isset($b['folders'])){
				if(in_array($d['collection_id'],$b['folders'])){
					return array('error'=>'already_saved');
				}
			}
			db2::update('nectar','bookmark',
				array('id'=>$r['auth']['uid'].'_'.$d['post_id']),
				array('$addToSet'=>array('folders'=>$d['collection_id']))
			);
			$update=array('$set'=>array('tsu'=>db2::tsToTime(time())),'$inc'=>array('count'=>1));
			if(!isset($c['pic'])||!$c['pic']){
				$data=db2::graphOne('nectar',$p,array(
					'media.data'=>array(
						'coll'=>'media',
						'to'=>'media.data',
						'match'=>'id',
						'subfield'=>'data',
						'clearOnNull'=>true
					)
				));
				$pic=self::getImg($data);
				if($pic) $update['$set']['pic']=$pic;
			}
			db2::update('nectar','bookmark_collection',array('id'=>$d['collection_id']),$update);
			return array('success'=>true);
		}
		public static function unbookmark($r){
			$d=phi::ensure($r,array(),1,array('self::write::bookmark'));
			if(!isset($r['qs']['post_id'])) return array('error'=>'post_id must be set');
			$post_id=$r['qs']['post_id'];
			if(isset($r['qs']['context'])&&$r['qs']['context']&&$r['qs']['context']!=''){
				$context=$r['qs']['context'];
			}else{
				$context='post';
			}
			$p=db2::findOne('nectar',$context,array('id'=>$post_id));
			if(!$p) return array('error'=>'invalid_post');
			$id=$r['auth']['uid'].'_'.$post_id;
			$b=db2::findOne('nectar','bookmark',array('id'=>$id));
			if(!$b) return array('error'=>'bookmark_doesnt_exist');
			db2::remove('nectar','bookmark',array('id'=>$id));
			if(isset($b['folders'])){
				foreach ($b['folders'] as $k => $v) {
					db2::update('nectar','bookmark_collection',array('id'=>$v),array('$inc'=>array('count'=>-1)));
				}
			}
			//update stats!
			db2::update('nectar',$context,array('id'=>$post_id),array('$inc'=>array('stats.bookmarks'=>-1)));
			return array('success'=>true);
		}
		public static function bookmark($r){
			$d=phi::ensure($r,array(),1,array('self::write::bookmark'));
			if(!isset($r['qs']['post_id'])) return array('error'=>'post_id must be set');
			$post_id=$r['qs']['post_id'];
			if(isset($r['qs']['context'])&&$r['qs']['context']&&$r['qs']['context']!=''){
				$context=$r['qs']['context'];
			}else{
				$context='post';
			}
			$p=db2::findOne('nectar',$context,array('id'=>$post_id));
			if(!$p) return array('error'=>'invalid_post');
			$id=$r['auth']['uid'].'_'.$post_id;
			$c=db2::findOne('nectar','bookmark',array('id'=>$id));
			if(!$c){
				$save=array(
					'id'=>$id,
					'post_id'=>$post_id,
					'uid'=>$r['auth']['uid']
				);
				//add media attachments type for sorting
				if(isset($p['media']['type'])&&$p['media']['type']){
					$save['type']=$p['media']['type'];
				}else{
					$save['type']='post';
				}
				$save['tsu']=db2::tsToTime(time());
				db2::update('nectar','bookmark',array('id'=>$id),array('$set'=>$save),array('upsert'=>true));
				//update stats!
				db2::update('nectar',$context,array('id'=>$post_id),array('$inc'=>array('stats.bookmarks'=>1)));
				$c=$save;
			}else{
				db2::update('nectar','bookmark',array('id'=>$id),array('$set'=>array('tsu'=>db2::tsToTime(time()))),array('upsert'=>true));
				//update TSU
			}
			//$data=false;//get current collection view
			$data=db2::toOrderedList(db2::find('nectar','bookmark_collection',array('uid'=>$r['auth']['uid']),array('sort'=>array('tsu'=>-1),'limit'=>10)),false,true,'_id');
			return array('success'=>true,'data'=>$data,'current'=>$c);
		}
	}
?>