<?php
	use Seld\JsonLint\JsonParser;
	if(!is_file('/var/www/priv/config.json')) die('invalid_config');
	$conf=json_decode(file_get_contents('/var/www/priv/config.json'),1);
	include_once($conf['home'].'/'.$conf['project'].'/classes/settings.php');
	$cd=dirname(__FILE__);
	$dirs=phi::getDirs($cd);
	//generally update, but if forced, remove and re-add
	$replace=[];
	if(isset($argv[1])&&$argv[1]){
		$replace=explode(',',$argv[1]);
	}
	foreach ($dirs as $db => $v) {
		$files=phi::getFiles($v,false);
		phi::clog('Loading DB2 for ['.$db.']',1);
		foreach ($files['files'] as $filename => $path) {
			if(strpos($filename, '.json')===false) continue;
			$cp=explode('.', $filename);
			$coll=$cp[0];
			$data=file_get_contents($path);
			$data = phi::stripJsonComments($data);
			//parse it!
			$parser = new JsonParser();
			try {
			    $json=json_decode(json_encode($parser->parse($data)),1);
			} catch (Exception $e) {
			    $details = $e->getDetails();
			    phi::clog('Error with file: '.$filename);
			    die(json_encode($details,JSON_PRETTY_PRINT));
			}
			if($coll!='zz_indexes'){
				if($json){
					if(!in_array($coll, $replace)){
						phi::clog('Update: ['.sizeof($json).'] records in '.$coll);
					}else{
						phi::clog('Replace: ['.sizeof($json).'] records in '.$coll);
					}
					foreach ($json as $k => $data) {
						foreach ($data as $tk => $tv) {
							if($tv=='[tsu]') $data[$tk]=db2::tsToTime(time());
						}
						if(isset($data['id'])){
							if(!in_array($coll, $replace)){
								db2::update($db,$coll,array('id'=>$data['id']),array('$set'=>$data),array('upsert'=>true));
							}else{
								db2::remove($db,$coll,array('id'=>$data['id']));
								db2::save($db,$coll,$data);//we should remove and re-add to ensure that any fields are removed
							}
						}else{
							phi::clog('Error: id must be set in coll ['.$coll.'] :'.json_encode($data));
						}
					}
				}else{
					phi::clog('no data for ['.$coll.']');
				}
			}else{//add indexes!
				//phi::clog('Adding Indexes',1);
				// foreach ($json as $coll => $v) {
				// 	if($coll=='*'){
				// 		$tables=db2::getTables($db);
				// 		foreach ($tables as $k => $tcoll) {
				// 			db2::createIndexes($db,$tcoll,$v['indexes']);
				// 		}
				// 	}else{
				// 		db2::createIndexes($db,$coll,$v['indexes']);
				// 	}
				// }
			}
		}
	}
?>