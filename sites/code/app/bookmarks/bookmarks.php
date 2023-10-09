<?php
	class bookmarks{
		public static function handleRequest($r){
			switch ($r['path'][4]){
				case 'collections':
					$out=self::collections($r);
				break;
				case 'feed':
					$out=self::feed($r);
				break;
			}
			return $out;
		}
		public static function feed($r){
			$limit=10;
			$opts=array('$sort'=>array('_id'=>-1),'$limit'=>$limit);
			$q=array('uid'=>$r['auth']['uid']);
			if(isset($r['qs']['last'])){
				$q['_id']=array('$lt'=>db2::toTime($r['qs']['last']));
			}
			if(isset($r['qs']['after'])){
				$q['_id']=array('$gt'=>db2::toTime($r['qs']['after']));
			}
			$data=db2::toOrderedList(db2::find('nectar','bookmark',$q,$opts),false,true,'_id');
			//graph on
			if($data){
				foreach ($data['list'] as $k => $v) {
					$posts[]=$v['post_id'];
					$map[$v['post_id']]=$v['_id'];
					$data['list'][$k]['user_votes']=$v['id'].'_'.$r['auth']['uid'];
				}
				$pdata=db2::toOrderedList(db2::find('nectar','post',array('id'=>array('$in'=>$posts))));
				$postdata=db2::graph('nectar',$pdata,array(
					'page.id'=>array(
						'coll'=>array(
							'field'=>'page.type',
							'id'=>'page.id'
						),
						'to'=>'page.data',
						'opts'=>array(
							'user'=>array(
								'coll'=>'user',
								'match'=>'id',
								'clearOnNull'=>true,
								'fields'=>array('id'=>1,'name'=>1,'pic'=>1)
							),
							'event'=>array(
								'coll'=>'event',
								'match'=>'id'
							),
							'news_source'=>array(
								'coll'=>'news_source',
								'match'=>'id'
							)
						)
					),
					'by.id'=>array(
						'coll'=>array(
							'field'=>'by.type',
							'id'=>'by.id'
						),
						'to'=>'by.data',
						'filter'=>array('name','pic','id')
					),
					'user_votes'=>array(
						'coll'=>'post_vote_user',
						'to'=>'user_votes',
						'match'=>'id',
						'subfield'=>'tags',
						'clearOnNull'=>true
					),
					'media.data'=>array(
						'coll'=>'media',
						'to'=>'media.data',
						'match'=>'id',
						'subfield'=>'data',
						'clearOnNull'=>true
					)
				));
				foreach ($postdata['list'] as $k => $v) {
					$mk=$map[$v['id']];
					$data['list'][$mk]['post']=$v;
				}
			}
			return array('success'=>true,'data'=>$data);
		}
		public static function collections($r){
			$data=db2::toOrderedList(db2::find('nectar','bookmark_collection',array('uid'=>$r['auth']['uid']),array('$sort'=>array('tsu'=>-1))));
			return array('success'=>true,'data'=>$data);
		}
	}
?>