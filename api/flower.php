<?php
	class flower{
		public static function handleRequest($r){
			switch ($r['path'][2]) {
				case 'publish':
				//phi::log('done: '.json_encode($r['qs']));
				$d=phi::ensure($r,['developer','token','project']);
				$token=db2::findOne(DB,'app_publish_token',['id'=>$d['token']]);
				if(!$token) return ['error'=>'invalid_developer_token'];
				if($token&&$token['page']['id']!=$d['developer']) return ['error'=>'token_developer_mismatch'];
				$branch=db2::findOne(DB,'branch',['name'=>$r['qs']['conf']['branch'],'project'=>$d['project']]);
				//die(json_encode(['name'=>$r['qs']['conf']['branch'],'project'=>$d['project']]));
				//phi::log(['name'=>$r['qs']['conf']['branch'],'project_id'=>$d['project']]);
				if(!$branch) return ['error'=>'branch_not_registered'];
				if(!in_array($branch['id'],$token['branches'])) return ['error'=>'invalid_permissions_not_in_branch'];
				//ensure publishing identity has ability to publish to branch
				//take conf.code and publish, save new conf to db
				$ver=0;
				$appid=$r['path'][3];
				$branch='master';
				if(isset($r['qs']['conf']['branch'])&&$r['qs']['conf']['branch']){
					$branch=$r['qs']['conf']['branch'];
				}
				$fileconf=API::getFileConf($appid);
				$current=db2::findOne(phi::$conf['dbname'],'versions',array('_id'=>$appid.'_'.$branch));
				if(!isset($r['qs']['conf'])) return array('error'=>'no config info');
				if($current) $ver=$current['version'];
				$ver++;
				$get=array('js'=>'js','css'=>'css','templates'=>'templates');//'cachedFont'=>'font',
				$app='';
				foreach ($get as $k => $v) {
					if(isset($r['qs']['conf']['code'][$k])){
						$app.='~~~~~'.$v.'~~~~~'.$r['qs']['conf']['code'][$k];
					}
				}
				$s3=phi::getS3();
				$path='source/'.phi::$conf['env'].'/'.$appid.'/'.$branch.'/'.$ver.'/app.dna';
				$s3->putObject(array(
				    'Bucket'     => phi::$conf['aws']['s3_bucket'],
				    'Key'        => $path,
				    'Body' => $app,
				    'ContentType'  => 'application/javascript',
				    'ACL'          => 'public-read',
				));
				//incriment version
				$conf=$r['qs']['conf'];
				unset($conf['code']);
				$conf['type']='dna';
				$conf['combined']=true;
				$conf['version']=$ver;
				$conf['hash']=md5($app);
				$conf['length']=strlen($app);
				$conf['size']=phi::objectToSize($app);
				$conf['url']=$fileconf['s3'].'/'.$path;
				$set=array('version'=>$ver,'conf'=>$conf,'tsu'=>time());
				db2::update(phi::$conf['dbname'],'versions',array('_id'=>$appid.'_'.$branch),array('$set'=>$set),array('upsert'=>true));
					$out=array('success'=>true,'version'=>$ver,'conf'=>$conf);
				break;
			}
			if(!isset($out)) $out=array('error'=>'invalid_method');
			return $out;
		}
	}
?>