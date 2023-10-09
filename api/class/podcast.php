<?php
	class PODCAST{
		public static $id='';
		public static function handleRequest($r){
			if(isset($r['path'][5])) self::$id=$r['path'][5];
			switch ($r['path'][4]) {
				case 'load':
					$out=self::load($r);
				break;
				case 'album':
					$out=self::album($r);
				break;
			}
			if(!isset($out)) $out['error']='no_data';
			return $out;
		}
		public static function checkAlbumArt($r,$d){
			$remotefilename = $d['current']['src'];
			if ($fp_remote = fopen($remotefilename, 'rb')) {
			    $localtempfilename = tempnam('/tmp', 'getID3');
			    if ($fp_local = fopen($localtempfilename, 'wb')) {
			        while ($buffer = fread($fp_remote, 8192)) {
			            fwrite($fp_local, $buffer);
			        }
			        fclose($fp_local);
			        // Initialize getID3 engine
			        $getID3 = new getID3;
			        $ThisFileInfo = $getID3->analyze($localtempfilename);
			        // Delete temporary file
			        unlink($localtempfilename);
			    }
			    fclose($fp_remote);
			}
			return $d;
		}
		public static function album($r){
			include_once(ROOT.'/api/class/formbuilder.php');
			$album=ONE_CORE::load($r,self::$id,'podcast_album');
			if(!$album) return array('error'=>'Album not found');
			$data['album']=$album;
			$data['tracks']=formbuilder::feed(array(
				'auth'=>$r['auth'],
				'qs'=>array('schema'=>'podcast','max'=>100)
			),array('album'=>self::$id));
			return array('success'=>true,'data'=>$data);
		}
		public static function load($r){
			$c=db2::findOne(phi::$conf['dbname'],'podcast',array('id'=>self::$id));
			$schema=ONE_CORE::getSchema('podcast');
			$c=db2::graphOne(phi::$conf['dbname'],$c,$schema['graph']);
			//add in other data, like comments
			//check permissions, assume public for now
			return array('success'=>true,'data'=>$c);
		}
		public static function hasPermission(){
			return true;
		}
	}
?>