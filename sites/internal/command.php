<?php 
	   if(!is_file('/var/www/priv/config.json')) die('invalid_config');
  	$conf=json_decode(file_get_contents('/var/www/priv/config.json'),1);
  	$ak=(isset($_REQUEST['ak'])&&$_REQUEST['ak']=='nectaradmin')?1:0;
  	include_once($conf['home'].'/'.$conf['project'].'/classes/settings.php');
  	include_once(ROOT.'/api/api.php');
  	$r=API::parseRequest(1);
  	//ensure admin token!
  	$d=phi::ensure($r,array('admin_token'));
  	if(phi::$conf['admin_token']!=$d['admin_token']){
  		phi::alertAdmin('Somebody tried to hack the internal command system');
  		phi::log('request');
  		die('You have been reported');
  	}
  	switch ($r['path'][2]) {
      case 'api':
          include_once(ROOT.'/api/1.0.php');//this will use a special QS to force running a command on a sepecific server
      break;
      case 'clearfilecaches':
        if(isset($r['qs']['files'])){
          foreach ($r['qs']['files'] as $k => $v){
            phi::clearCache($v,false,false,true);
            phi::log('uncached file ['.$v.'] on server ['.phi::getLocalIp().']');
          }
          API::toHeaders(array('success'=>true));
        }else{
          phi::log('invalid files to uncache');
          API::toHeaders(array('error'=>true));
        }
      break;
  		case 'updateprivate':
  			// $c=db2::findOne('nectar','priv',array('id'=>'nectar'));
  			// if($c){
  			// 	// $decrypted='/tmp/priv.tar.gz';
  			// 	// $uncompressed='/tmp/priv';
  			// 	// mkdir($uncompressed);
  			// 	// file_put_contents($decrypted,phi::aesDecryptFile($c['data']));
  			// 	// exec('tar -xvf '.$decrypted.' -C '.$uncompressed);
  			// 	// exec('rm -rf /var/www/priv');
  			// 	// exec('mv '.$uncompressed.'/var/www/priv /var/www/priv');
  			// 	// exec('chmod -R 0777 /var/www/priv');
  			// 	// exec('rm '.$decrypted);
  			// 	// exec('rm -rf '.$uncompressed);
  			// 	exec('lighttpdconf');
  			// 	API::toHeaders(array('success'=>true));
  			// }else{
  			// 	API::toHeaders(array('error'=>'creds_dont_exist'));
  			// }
  			exec('lighttpdconf');//wont exits as not root
  			API::toHeaders(array('success'=>true));
		break;
  		default:
  			API::toHeaders(array('error'=>'invalid_method'));
  		break;
  	}
?>