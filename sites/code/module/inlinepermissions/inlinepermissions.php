<?php
	class inlinepermissions{
		public static function handleRequest($r){
			switch ($r['path'][4]){
				case "get":
					$out=self::get($r);
				break;
			}
			if(!isset($out)) $out=array('error'=>'invalid_method');
			return $out;
		}
		public static function get($r){
			$d=phi::ensure($r,array('identity'));
			include_once(phi::$conf['root'].'/api/class/permissions.php');
			if($d['identity'][0]=='G'){//based on group permissions
				$g=db2::findOne('nectar','page',array('id'=>$d['identity']));
				if($g){
					if(!isset($g['privacy'])||$g['privacy']=='public'){
						$data['order'][]='public';
						$data['list']['public']=array(
							'id'=>'public',
							'name'=>'Public'
						);
					}
					//members/followers/patrons
					if(!isset($g['pagetype'])||$g['pagetype']=='page'){
						$data['order'][]='followers';
						$data['list']['followers']=array(
							'id'=>'followers',
							'name'=>'Follower Only'
						);
					}else if($g['pagetype']=='group'){
						$data['order'][]='members';
						$data['list']['members']=array(
							'id'=>'members',
							'name'=>'Members Only'
						);	
					}
					$data['noextra']=1;
					return array('success'=>true,'data'=>array('groups'=>$data));
				}else{
					return array('error'=>'invalid_page');
				}
				return array('success'=>true,'data'=>array(
					'groups'=>array(
						'order'=>array('public'),
						'list'=>array(
							'public'=>array(
								'id'=>'public',
								'name'=>'Public'
							)
						)
					)
				));
			}else if($d['identity'][0]=='U'){
				if($d['identity']==$r['auth']['uid']){
					$c=db2::findOne('nectar','user',array('id'=>$r['auth']['uid']),array('projection'=>array('_perm'=>1)));
					$data['permissions']=(isset($r['qs']['field'])&&$r['qs']['field']&&isset($c['_perm'][$r['qs']['field']]))?$c['_perm'][$r['qs']['field']]:false;
					$groups=permissions::info($r);
					$data['groups']=$groups['data']['friendlist'];
				}else{//person to a another person
					return array('success'=>true,'data'=>array(
						'groups'=>array(
							'noextra'=>true,
							'order'=>array('public'),
							'list'=>array(
								'public'=>array(
									'id'=>'public',
									'name'=>'Public'
								)
							)
						)
					));
				}
				return array('success'=>true,'data'=>$data);
			}else if($d['identity'][0]=='E'||$d['identity'][0]=='F'){//event
				return array('success'=>true,'data'=>array(
					'groups'=>array(
						'noextra'=>true,
						'order'=>array('public'),
						'list'=>array(
							'public'=>array(
								'id'=>'public',
								'name'=>'Public'
							)
						)
					)
				));
			}
		}
	}
?>