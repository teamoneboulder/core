<?php
	class browser{
		public static $uid='';
		public static function handleRequest($r){
			include_once(phi::$conf['root'].'/api/oauth2.php');
			switch ($r['path'][4]){
				case "load":
					$out=self::load($r);	
				break;
				case "feed":
					$out=self::feed($r);					
				break;
			}
			return $out;
		}
		public static function feed($r){
			$d=phi::ensure($r,array('type','page'));
			if($d['page']=='qotd') return self::loadQOTD($r,1);
			if($d['page']!='root'){
				$tag=db2::findOne('nectar','tags',array('id'=>$d['page']));
				if(!$tag) return array('error'=>'invalid_tag');
			}
			$data=db2::toOrderedList(db2::find('nectar','tags',array($d['type'].'_parent'=>$d['page']),array('sort'=>array('name'=>1),'projection'=>array('id'=>1,'icon'=>1,'comingsoon'=>1,'name'=>1,'pic'=>1,$d['type'].'_children'=>1,$d['type'].'_parent'=>1))));
			if($data&&isset($tag)&&$r['qs']['showAll']) $data=self::prependAll($data,$tag);
			return array('success'=>true,'data'=>$data);
		}
		public static function prependAll($olist,$tag=false){
			if($tag){
				array_unshift($olist['order'], $tag['id']);
				$tag['dname']='All '.$tag['name'];
				$olist['list'][$tag['id']]=$tag;
			}
			return $olist;
		}
		public static function loadQOTD($r,$list=false){
			$l=db2::toOrderedList(db2::find('nectar','qotd',array(),array('sort'=>array('published'=>-1))));
			if($list){
				return array('success'=>true,'data'=>$l);
			}else{
				$qotd=db2::findOne('nectar','tags',array('id'=>'qotd'));
				return array('success'=>true,'data'=>array('children'=>$l,'tag'=>$qotd,'parents'=>array('order'=>array('qotd'),'list'=>array($qotd['id']=>$qotd))));
			}
		}
		public static function load($r){
			$d=phi::ensure($r,array('type','page'));
			$types=array('content','connection','event','page');
			if(!in_array($d['type'], $types)) return array('error'=>'invalid_type');
			if($d['page']=='qotd'){
				return self::loadQOTD($r);
			}
			if($d['page']!='root'){
				$data['tag']=db2::findOne('nectar','tags',array('id'=>$d['page']));
				if(!$data['tag']) return array('error'=>'invalid_page');
				// if(!isset($data['tag']['children'])||!sizeof($data['tag']['children'])){
				// 	$data['tag']=false;
				// }
				if(isset($data['tag']['content_parents'])&&$data['tag']['content_parents'][0]=='qotd') return self::loadQOTD($r);
			}else{
				$data['tag']=false;
			}
			$sort=array('name'=>1);
			if(isset($r['qs']['sort'])){
				$sort=array('sort'=>(int) $r['qs']['sort']);
			}
			#die(json_encode($sort));
			$tq=array($d['type'].'_parent'=>$d['page']);
			// if(isset($r['qs']['enableBlank'])){
			// 	$tq['id']=array('$nin'=>array($d['page']));
			// }
			$data['children']=db2::toOrderedList(db2::find('nectar','tags',$tq,array('sort'=>$sort,'projection'=>array('id'=>1,'name'=>1,'icon'=>1,'comingsoon'=>1,'pic'=>1,$d['type'].'_children'=>1,$d['type'].'_parent'=>1))));
			if(!$data['children']&&!isset($r['qs']['enableBlank'])){
				//siblings
				if($data['tag'][$d['type'].'_parent']=='root'){
					$data['children']=db2::toOrderedList(db2::find('nectar','tags',array($d['type'].'_parent'=>$data['tag'][$d['type'].'_parent']),array('sort'=>$sort,'projection'=>array('id'=>1,'icon'=>1,'comingsoon'=>1,'name'=>1,'pic'=>1,$d['type'].'_children'=>1,$d['type'].'_parent'=>1))));
					$data['tag']=false;
					//die(json_encode($data));
				}else{
					$data['tag']=db2::findOne('nectar','tags',array('id'=>$data['tag'][$d['type'].'_parent']));
					$data['children']=db2::toOrderedList(db2::find('nectar','tags',array($d['type'].'_parent'=>$data['tag']['id']),array('sort'=>$sort,'projection'=>array('id'=>1,'name'=>1,'icon'=>1,'comingsoon'=>1,'pic'=>1,$d['type'].'_children'=>1,$d['type'].'_parent'=>1))));
				}
			}
			if($data['tag']){
				//get parents on up!
				$parents=$data['tag'][$d['type'].'_parents'];
				$data['parents']=db2::toOrderedList(db2::find('nectar','tags',array('id'=>array('$in'=>$parents)),array('projection'=>array('id'=>1,'name'=>1,'pic'=>1,'comingsoon'=>1,$d['type'].'_children'=>1,$d['type'].'_parent'=>1))));
				$data['parents']['order'][]=$data['tag']['id'];
				$data['parents']['list'][$data['tag']['id']]=$data['tag'];
			}else{
				$data['parents']=false;
			}
			if($data['children']&&$data['tag']&&!isset($r['qs']['enableBlank'])) $data['children']=self::prependAll($data['children'],$data['tag']);
			return array('success'=>true,'data'=>$data);
		}
	}
?>