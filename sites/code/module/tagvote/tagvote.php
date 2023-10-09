<?php
	class tagvote{
		public static function handleRequest($r){
			switch ($r['path'][4]){
				case "update":
					$out=self::update($r);
				break;
			}
			if(!isset($out)) $out=array('error'=>'invalid_method');
			return $out;
		}
		public static function update($r){
			$id=$r['qs']['id'];
			$cur=db2::findOne('nectar','tagvote_user',array('id'=>$id.'_'.$r['auth']['uid']));
			//see if update should happen!
			$setval=(int) $r['qs']['val'];
			if($cur&&is_array($cur['tags'])&&in_array($r['qs']['tag_id'], $cur['tags'])){//currently on
				if($setval==0) $update=1;
				else $update=0;
			}else{//currenlty off
				if($cur){
					if($setval===0) $update=0;
					else $update=1;
				}else{
					$update=true;//not set yet!
				}
			}
			if($update){
				//get stats!
				if($setval){//set
					//collective, used for sorting based on vote counts
					db2::update('nectar','tagvote',array('id'=>$id.'_'.$r['qs']['tag_id']),array('$inc'=>array('count'=>1),'$addToSet'=>array('users'=>$r['auth']['uid']),'$set'=>array('tag'=>$r['qs']['tag_id'])),array('upsert'=>true));
					//personal
					db2::update('nectar','tagvote_user',array('id'=>$id.'_'.$r['auth']['uid']),array('$addToSet'=>array('tags'=>$r['qs']['tag_id'])),array('upsert'=>true));
				}else{
					
					//collective, used for sorting based on vote counts
					db2::update('nectar','tagvote',array('id'=>$r['qs']['id'].'_'.$r['qs']['tag_id']),array('$set'=>array('tag'=>$r['qs']['tag_id']),'$inc'=>array('count'=>-1),'$pullAll'=>array('users'=>array($r['auth']['uid']))),array('upsert'=>true));
					//personal
					db2::update('nectar','tagvote_user',array('id'=>$id.'_'.$r['auth']['uid']),array('$pull'=>array('tags'=>$r['qs']['tag_id'])),array('upsert'=>true));
				}
			}else{
				phi::log('multiple vote for ['.$r['auth']['uid'].'] on ['.$r['qs']['id'].'] tag ['.$r['qs']['tag_id'].']');
			}
			$votes=self::updateTagStats($id);
			return array('success'=>true,'data'=>$votes,'user_votes'=>self::getUserVotes($r,$id));
		}
		public static function getUserVotes($r,$id){
			$uv=db2::findOne('nectar','tagvote_user',array('id'=>$id.'_'.$r['auth']['uid']));
			if($uv){
				$tc=$uv['tags'];
			}else $tc=false;
			return $tc;
		}
		public static function updateTagStats($id){
			$regex = new MongoDB\BSON\Regex('^'.$id,'i');
			$l=db2::toList(db2::find('nectar','tagvote',array('id'=>$regex),array('projection'=>array('count'=>1,'tag'=>1))),false,'tag');
			if($l){
				foreach ($l as $k => $v) {
					$stats[$k]=$v['count'];
				}
				#phi::log($stats);
				db2::update('nectar','tagvote_results',array('id'=>$id),array('$set'=>array('results'=>$stats)),array('upsert'=>true));
			}else $stats=false;
			return $stats;
		}
	}
?>