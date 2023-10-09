<?php
// Ghost Magick Image Resizer 1.0
// By Tom Bassett 

// Originally developed for tPanther by: Jeremy Dill

// Further heavy modification by: Tom Bassett

/////////////////////
// REQUIREMENTS
/////////////////////

// PHP and GraphicsMagick

/////////////////////////////////
// PARAMETERS (From Query String)
/////////////////////////////////

// GENERAL PARAMS
// width		maximum width of final image in pixels (e.g. 700)
// height		maximum height of final image in pixels (e.g. 700)
// cropratio	(optional) ratio of width to height to crop final image (e.g. 1:1 or 3:2)
// square 		(optional) Fit image inside square
// nocache		(optional) does not read image from the cache
// uncache		(optional) just destroy the cached image...don't display (jdill)
// gray 		(optional) convert the final image to grayscale

// PHANTOM RENDERING
// *			ANY vars can be passed to phantom

// ex: /_img/render/cert?ID=12345

////////////////
// BUILT PARAMS
////////////////
// $o 			Object that containing info for image build

/////////////////////
// EXAMPLES
/////////////////////

// Resizing a JPEG:
// <img src="/image.php/image-name.jpg?width=100&amp;height=100&amp;image=/path/to/image.jpg" alt="Don't forget your alt text" />

// Resizing and cropping a JPEG into a square:
// <img src="/image.php/image-name.jpg?width=100&amp;height=100&amp;cropratio=1:1&amp;image=/path/to/image.jpg" alt="Don't forget your alt text" />

/////////////////////
// CODE STARTS HERE
/////////////////////
if(is_file('../classes/settings.php')) include_once('../classes/settings.php');
class ImageResizer {
	public static function save($path,$saveto=false,$nocache=false){ //SAVE REMOVE SORCE TO LOCAL
		$to='/tmp';
		if(!is_dir($to.'/imagecache')) mkdir($to.'/imagecache');
		if(strpos($path, 'http')!==false){
			if(!$saveto) $saveto=$to.'/imagecache/'.md5($path);
			if(!$nocache&&is_file($saveto)) return $saveto;
			$curl = curl_init($path);
			// Moved? Fear not, we'll chase it!
			curl_setopt($curl,CURLOPT_USERAGENT,'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');
			curl_setopt($curl, CURLOPT_FOLLOWLOCATION, true);
			// Because you want the result as a string
			curl_setopt($curl,  CURLOPT_RETURNTRANSFER, true); 
			$c = curl_exec($curl);
			curl_close($curl);
			if($c){
				file_put_contents($saveto, $c);
				return $saveto;
			}else{
				phi::log('Could not find ['.$path.'] to save');
				return false;
			}
		}else{ //already local
			return $path;
		}
	}
	public static function getGifFrame($url){
		$path=self::save($url);
		$out=$path.'_frame.jpeg';
		$exec='gm convert '.$path.'[0] '.$out;
		exec($exec);
		return $out;
	}
	public static function render($path,$qs=null,$toHeaders=true){
		
		/////////////
		// Settings
		/////////////

		// General Params
		$params[]='width';
		$params[]='height';
		$params[]='cropratio';
		$params[]='square';
		$params[]='uncache';
		$params[]='nocache';
		$params[]='gray';
		$params[]='crop';
		$params[]='cropinfo';
		$params[]='cropdata';
		$params[]='quality';
		$params[]='base64';

		/////////////////////////
		//  Initialize the build
		/////////////////////////
		$o=ImageResizer::init($path,$toHeaders,$params,$qs);
		
		///////////////////////////
		// Methods to get Image SRC
		///////////////////////////
		//$o=ImageResizer::validateImageData($o);
		///////////////////////////
		// Determine correct Sizing
		///////////////////////////
		$o=ImageResizer::getSizing($o);
		#die(json_encode($o));

		///////////////////////
		// Resize if Necessary
		///////////////////////
		if((isset($o['toresize'])&&$o['toresize'])||isset($o['nocache'])) $o=ImageResizer::resizeImage($o);

		////////////////////
		// Output to headers or return file name
		////////////////////
		if($toHeaders) ImageResizer::outputToHeaders($o);
		else{
			if(isset($o['qsp']['base64'])){
				return ImageResizer::base64Encode($o);
			}else return $o['src'];
		}
		//debug 
		//die(json_encode($o));
	}
	public static function _ver(){
		return '1.1';//haha
	}
	public static function base64Encode($o){
		$src=$o['src'];
		if(!isset($o['mime'])){
			$i	= GetImageSize($src);
			$o['mime']= $i['mime'];
		}
		switch ($o['mime']) {
			case 'image/jpeg':
			case 'image/jpg':
				$prefix='data:image/jpeg;base64,';
			break;
			case 'image/png':
				$prefix='data:image/png;base64,';
			break;
		}
		$img=$prefix.base64_encode(file_get_contents($src));
		return $img;
	}
	public static function generateQR($qs){
		if(isset($qs['content'])){
			\PHPQRCode\QRcode::png($qs['content']);
			exit;
		}else if(isset($qs['url'])){
			\PHPQRCode\QRcode::png(urldecode($qs['url']));
			exit;
		}else{
			die('invalid qr url');
		}
	}
	public static function upload($qs){
		set_time_limit(30);
		$r['qs']=$qs;
		$r['upload']['st']=microtime(true);
		$r['upload']['opts']['thumb']=array('width'=>100,'height'=>100,'crop'=>1);
		$r['upload']['opts']['display']=array('width'=>600,'height'=>500,'crop'=>1);
		$r['upload']['opts']['cover']=array('width'=>600,'height'=>500,'crop'=>1);
		$r['upload']['opts']['profile']=array('width'=>200,'height'=>200,'crop'=>1);
		$r['upload']['opts']['background']=array('width'=>600,'height'=>320,'crop'=>1);
		$r['upload']['opts']['full']=array('quality'=>90,'nocache'=>1);//ensure it gets sent to resizer
		$r['upload']['opts']['small']=array('quality'=>60,'nocache'=>1);//ensure it gets sent to resizer

		if(!isset($r['qs']['sizes'])) $r['upload']['sizes']=array('thumb','full');
		else{
			if(is_array($r['qs']['sizes'])) $r['upload']['sizes']=$r['qs']['sizes'];
			else $r['upload']['sizes']=explode(',', $r['qs']['sizes']);
		}
		if(isset($r['qs']['url'])){
			if(!isset($r['qs']['path'])) $r['upload']['path']='/links/';
	    	else $r['upload']['path']=$r['qs']['path'];
	    	$r['upload']['filename']=$r['qs']['url'];
	    	$r['upload']['src']=$r['qs']['url'];
		}else{
			return array('error'=>'invalid_image_source');
		}
		$r['upload']['localsrc']=self::save($r['upload']['src']);
		$i	= GetImageSize($r['upload']['localsrc']);
		if(!isset($i)||!$i) return array('error'=>'invalid_image_source');
		$r['upload']['mime']= $i['mime'];
		$mt=explode('/',$r['upload']['mime']);
		$r['upload']['ext']=$mt[1];
		$r['upload']['ar']=round(($i[0]/$i[1]),2);
		$r['upload']['time']=time();
		//save it
		$c=file_get_contents($r['upload']['localsrc']);
		$hash = substr(md5($c), 0, 10);
		$r['conf']['s3']=phi::$conf['s3'];
		$client=phi::getS3();
		$r['upload']['bucket']=phi::$conf['aws']['s3_bucket'];
		$r['upload']['fullsrc']=$hash.'/full.'.$r['upload']['ext'];
		// $exists=$client->doesObjectExist($r['upload']['bucket'],$r['upload']['path'].$hash.'/'.$r['upload']['sizes'][0].'.'.$r['upload']['ext']);
		// if($exists&&!isset($r['qs']['force'])){//no need to render or upload
		// 	$ret=array('path'=>$r['upload']['path'].$hash,'ext'=>$r['upload']['ext'],'ar'=>$r['upload']['ar']);
		// 	if(isset($r['qs']['preview'])){
		// 		$ret['cached']=true;
		// 		$ret['url']=$r['conf']['s3'].$r['upload']['path'].$hash.'/'.$r['upload']['sizes'][0].'.'.$r['upload']['ext'];
		// 	}
		// 	return $ret;
		// }
		phi::log($r['upload']);
		if(in_array('full', $r['upload']['sizes'])){
			$f=self::render($r['upload']['localsrc'],$r['upload']['opts']['full'],false);
			$result = $client->putObject(array(
			    'Bucket'     => $r['upload']['bucket'],
			    'Key'        => $r['upload']['path'].$r['upload']['fullsrc'],
			    'Body' => file_get_contents($f),
			    'ContentType'  => $r['upload']['mime'],
			    'ACL'          => 'public-read',
			));
			if(isset($f)&&is_file($f)) unlink($f);
		}
		if(in_array('thumb', $r['upload']['sizes'])){
			$f=self::render($r['upload']['localsrc'],$r['upload']['opts']['thumb'],false);
			if(isset($f)&&is_file($f)){ 
				$result = $client->putObject(array(
				    'Bucket'     => $r['upload']['bucket'],
				    'Key'        => $r['upload']['path'].$hash.'/thumb.'.$r['upload']['ext'],
				    'Body' => file_get_contents($f),
				    'ContentType'  => $r['upload']['mime'],
				    'ACL'          => 'public-read',
				));
				if(isset($f)&&is_file($f)) unlink($f);
			}else{
				phi::log('error uploading Thumb');
				phi::log(phi::makeUrl());
			}
		}
		if(in_array('profile', $r['upload']['sizes'])){
			$f=self::render($r['upload']['localsrc'],$r['upload']['opts']['profile'],false);
			if(isset($f)&&is_file($f)){ 
				$result = $client->putObject(array(
				    'Bucket'     => $r['upload']['bucket'],
				    'Key'        => $r['upload']['path'].$hash.'/profile.'.$r['upload']['ext'],
				    'Body' => file_get_contents($f),
				    'ContentType'  => $r['upload']['mime'],
				    'ACL'          => 'public-read',
				));
				if(isset($f)&&is_file($f)) unlink($f);
			}else{
				phi::log('error uploading profile');
				phi::log(phi::makeUrl());
			}
		}
		if(in_array('small', $r['upload']['sizes'])){
			$f=self::render($r['upload']['localsrc'],$r['upload']['opts']['small'],false);
			if(isset($f)&&is_file($f)){
				$result = $client->putObject(array(
				    'Bucket'     => $r['upload']['bucket'],
				    'Key'        => $r['upload']['path'].$hash.'/small.'.$r['upload']['ext'],
				    'Body' => file_get_contents($f),
				    'ContentType'  => $r['upload']['mime'],
				    'ACL'          => 'public-read',
				));
				if(isset($f)&&is_file($f)) unlink($f);
			}else{
				phi::log('error uploading small');
				phi::log(phi::makeUrl());
			}
		}
		if(in_array('background', $r['upload']['sizes'])){
			$f=self::render($r['upload']['localsrc'],$r['upload']['opts']['background'],false);
			if(isset($f)&&is_file($f)){
				$result = $client->putObject(array(
			    	'Bucket'     => $r['upload']['bucket'],
			    	'Key'        => $r['upload']['path'].$hash.'/background.'.$r['upload']['ext'],
			    	'Body' => file_get_contents($f),
			    	'ContentType'  => $r['upload']['mime'],
			    	'ACL'          => 'public-read',
				));
				if(isset($f)&&is_file($f)) unlink($f);
			}else{
				phi::log('error uploading background');
				phi::log(phi::makeUrl());
			}
		}
		if(in_array('display', $r['upload']['sizes'])){
			$f=self::render($r['upload']['localsrc'],$r['upload']['opts']['display'],false);
			if(isset($f)&&is_file($f)){
				$result = $client->putObject(array(
			    	'Bucket'     => $r['upload']['bucket'],
			    	'Key'        => $r['upload']['path'].$hash.'/display.'.$r['upload']['ext'],
			    	'Body' => file_get_contents($f),
			    	'ContentType'  => $r['upload']['mime'],
			    	'ACL'          => 'public-read',
				));
				if(isset($f)&&is_file($f)) unlink($f);
			}else{
				phi::log('error uploading display');
				phi::log(phi::makeUrl());
			}
		}
		if(in_array('cover', $r['upload']['sizes'])){
			$f=self::render($r['upload']['localsrc'],$r['upload']['opts']['cover'],false);
			if(isset($f)&&is_file($f)){
				$result = $client->putObject(array(
			    	'Bucket'     => $r['upload']['bucket'],
			    	'Key'        => $r['upload']['path'].$hash.'/cover.'.$r['upload']['ext'],
			    	'Body' => file_get_contents($f),
			    	'ContentType'  => $r['upload']['mime'],
			    	'ACL'          => 'public-read',
				));
				if(isset($f)&&is_file($f)) unlink($f);
			}else{
				phi::log('error uploading cover');
				phi::log(phi::makeUrl());
			}
		}
		//if(isset($r['upload']['localsrc'])&&is_file($r['upload']['localsrc'])) unlink($r['upload']['localsrc']);
		$r['upload']['ft']=microtime(true);
		#phi::log('Image process time: '.($r['upload']['ft']-$r['upload']['st']).' ms');
		$ret=array('path'=>$r['upload']['path'].$hash,'ext'=>$r['upload']['ext'],'ar'=>$r['upload']['ar']);;
		if(isset($r['qs']['preview'])){
			$ret['url']=$r['conf']['s3'].$r['upload']['path'].$hash.'/'.$r['upload']['sizes'][0].'.'.$r['upload']['ext'];
		}
		return $ret;
	}
	private static function init($source,$toHeaders,$params,$qs){

		//ini_set('memory_limit', '500M');
		//if source is remote, save it!
		if(strpos($source, 'http://')!==false||strpos($source, 'https://')!==false){
			$source=ImageResizer::save($source);
		}
		$o['CACHE_DIR']=ROOT.'/imagecache/';
		$o['ipath']=$source;
		$o['toHeaders']=$toHeaders;
		$o['rotate']=-1;
		//ENSURE CACHE DIR
		if (!is_dir(ROOT.'/imagecache')) mkdir(ROOT.'/imagecache');
		/////////////////////////////
		// Validate and Build IMG OBJ
		/////////////////////////////
		$fp=explode('/',$source);
		$qchk=strpos($fp[sizeof($fp)-1],"?");//if parameters passed, separate image name
		$tq=explode('?', $source);
		$o['query']=(isset($tq[1]))?$tq[1]:false;
		if($qchk) $image = substr($fp[sizeof($fp)-1],0,$qchk);
		else $image = $fp[sizeof($fp)-1];
		$o['image']=urldecode($image);
		$o['bucket']=$fp[1];
		//	ADD QS VARIABLES TO OBJECT
		//if(!empty($qs)&&!is_array($qs)) parse_str($qs,$qsa);
		//if(is_array($qs)) $o['qsp']=$qs;
		foreach ($params as $i => $v) {
				if(isset($_GET[$v])){
					$o[$v]= $_GET[$v];
					$o['qsp'][$v]=$_GET[$v];
				}
				if(is_array($qs)){
					if(isset($qs[$v])){
						$o[$v]= $qs[$v];
						$o['qsp'][$v]=$qs[$v];
					}
				}
		}	
		// VALIDATION
		if (empty($o['image'])) {
			if($o['toHeaders']){
				header('HTTP/1.1 400 Bad Request');
				echo 'Error: no image was specified';
				exit();
			} else {
				return "Error: no image was specified";
			}
		}

		// For security, directories cannot contain ':', images cannot contain '..' or '<', and
		// images must start with '/'
		if (strpos(dirname($o['image']), ':') || preg_match('/(\.\.|<|>)/', $o['image']))
		{
			if($o['toHeaders']){
				header('HTTP/1.1 400 Bad Request');
				echo 'Error: malformed image path.';
				exit();
			} else {
				return "Error: malformed image path.";
			}
		}
		return $o;
	}
	private static function getSizing($o){
		// Get the size and MIME type of the requested image
		$size	= GetImageSize($o['ipath']);
		$o['mime']=$mime	= $size['mime'];
		//die(json_encode($o));
		// Make sure that the requested file is actually an image
		if (substr($mime, 0, 6) != 'image/')
		{
			if($o['toHeaders']){
				header('HTTP/1.1 400 Bad Request');
				echo 'Error: requested file is not an accepted type. ';
				exit();
			} else {
				return 'Error: requested file is not an accepted type. '.$o['ipath'];
			}
		}

		$o['outwidth']=$o['originalWidth']=$width= $size[0];
		$o['outheight']=$o['originalHeight']=$height= $size[1];

		$maxheight=(isset($o['height'])) ? intval($o['height'],10) : 9999;
		$maxwidth=(isset($o['width'])) ? intval($o['width'],10) : 9999;

		if(isset($o['height'])&&isset($o['width'])&&isset($o['crop'])){
			$o['outwidth']=$o['width'];
			if(isset($o['force'])&&$o['originalWidth']==$o['outwidth']) $o['outwidth']=$o['width']-1;
			$o['outheight']=$o['height'];
			$sar=$width/$height;
			$far=$o['outwidth']/$o['outheight'];
			if($far>$sar){ //fit by width
				$o['srcwidth']=$o['outwidth'];
				$o['srcheight']=$o['srcwidth']/$sar;
				$o['offsety']=-(($o['srcheight']-$o['outheight'])/2);
				$o['offsetx']=0;
			}else{ //fit by height
				$o['srcheight']=$o['outheight'];
				$o['srcwidth']=$sar*$o['srcheight'];
				$o['offsetx']=-(($o['srcwidth']-$o['outwidth'])/2);
				$o['offsety']=0;
			}
		}else{
			$ar=$width/$height;
			$wr=$maxwidth/$width;
			$hr=$maxheight/$height;
			if($wr<=1 && $hr > 1)
			{//auto fit
				$maxheight=$maxwidth/$ar;
			}
			else if($hr<= 1 && $wr > 1)
			{//auto fit
				$maxwidth=$maxheight*$ar;
			}
			else if($hr>1 && $wr > 1)
			{
				$maxwidth=$width;
				$maxheight=$height;
			}
			else if($hr<=1 && $wr <= 1)
			{
				if($hr<$wr)
				{//use height
					$maxwidth=$maxheight*$ar;
				}
				if($wr<$hr)
				{
					$maxheight=$maxwidth/$ar;	
				}
			}
			$xos=0;
			$yos=0;
			$sw=$maxwidth;
			$sh=$maxheight;
			if(isset($o['square'])){
				if($maxheight > $maxwidth){
					$xos=($maxheight-$maxwidth)/2;
					$maxwidth=$maxheight;
				}else{
					$yos=($maxwidth-$maxheight)/2;
					$maxheight=$maxwidth;
				}
			}
			if(isset($o['cropdata'])){
				$o['outwidth']=$o['cropdata']['width'];
				$o['outheight']=$o['cropdata']['height'];
				$yos=-(float) $o['cropdata']['y'];
				$xos=-(float) $o['cropdata']['x'];
			}
			if(isset($o['cropratio'])){
				//get width and height of output
				$cr=explode(':',$o['cropratio']);
				$r=$cr[0]/$cr[1]; //2:1
				$ar=$o['originalWidth']/$o['originalHeight']; //400:300
				if($r > $ar){//Use Width as max
					if(!isset($o['height'])){
						$oh=$maxheight;
						$maxheight=$maxwidth/$r;
						$yos=-($oh-$maxheight)/2;
					}else{//keep height, change width to accomidate
						$ow=$maxwidth;
						$maxwidth=$maxheight*$r;
						$xos=-($ow-$maxwidth)/2;
					}
				}else if($ar > $r){//use height as max
					if(!isset($o['width'])){
						$ow=$maxwidth;
						$maxwidth=$maxheight*$r;
						$xos=-($ow-$maxwidth)/2;
					}else{
						$oh=$maxheight;
						$maxheight=$maxwidth/$r;
						$yos=-($oh-$maxheight)/2;
					}
				}
			}
			if($o['outwidth']<$maxwidth&&$o['outheight']<$maxheight){
				$o['srcwidth']=$sw;
				$o['srcheight']=$sh;
				$o['offsetx']=$xos;
				$o['offsety']=$yos;
			}else{
				$o['outwidth']=$maxwidth;
				if(isset($o['force'])&&$o['originalWidth']==$o['outwidth']) $o['outwidth']=$o['outwidth']-1;
				$o['outheight']=$maxheight;
				$o['srcwidth']=$sw;
				$o['srcheight']=$sh;
				$o['offsetx']=$xos;
				$o['offsety']=$yos;
			}
		}
		//at this point there should be enough info to build cache name
		if($o['originalWidth'] == $o['outwidth'] && $o['originalHeight'] == $o['outheight']&&!isset($o['qsp']['cropinfo'])){
			$o['toresize']=false;
			if(!isset($o['src'])) $o['src']=$o['ipath'];
		}else{
			$o['resizedCache']=$o['image'].'-'.$o['outwidth'].'x'.$o['outheight'];	
			if(isset($o['qsp']['cropinfo'])) $o['resizedCache'].='-cropinfo-'.$o['qsp']['cropinfo'];
			$o['src']=$o['CACHE_DIR'].md5($o['resizedCache']);
			if(!is_file($o['src']) || isset($o['nocache'])) $o['toresize']=true;
		}
		if(isset($o['quality'])){
			$o['toresize']=true;
			$o['resizedCache']=$o['image'].'-quality-'.$o['quality'].'-'.$o['outwidth'].'x'.$o['outheight'];
			if(isset($o['qsp']['cropinfo'])) $o['resizedCache'].='-cropinfo-'.$o['qsp']['cropinfo'];
			$o['src']=$o['CACHE_DIR'].md5($o['resizedCache']);
		}
		//or if the image is to be altered like gray
		if(isset($o['gray'])) $o['toresize']=true;
		if(isset($o['square'])) $o['toresize']=true;
		if(isset($o['crop'])) $o['toresize']=true;
		if(isset($o['cropdata'])) $o['toresize']=true;
		return $o;
	}
	private static function resizeImage($o){
		if(!is_file($o['src'])||isset($o['nocache'])){
			//get rotation
			//auto orient first
			if($o['mime']=='image/jpeg'){
				try {
					//suppress errors
			        $exif = @exif_read_data($o['ipath']);
			     }
			     catch (Exception $exp) {
			        $exif = false;
			     }
				if(isset($exif['Orientation'])){
					switch ($exif['Orientation']) {
						case 6:
						case 8://rotate 90, so switch width and height
							$ow=$o['outwidth'];
							$oh=$o['outheight'];
							$o['outwidth']=$oh;
							$o['outheight']=$ow;
							// $ow=$o['cropwidth'];
							// $oh=$o['cropheight'];
							// $o['cropwidth']=$oh;
							// $o['cropheight']=$ow;
							$ox=$o['offsetx'];
							$oy=$o['offsety'];
							$o['offsetx']=$oy;
							$o['offsety']=$ox;
						break;
					}
				}
			}
			if($o['mime'] == 'image/jpeg') $bg='white';
			else $bg='transparent';
		  	//add grayscale
		  	$gray='';
		  	if(isset($o['gray'])) $gray=' -colorspace GRAY';
		  	if(!isset($o['qsp']['noround'])){
				//round to nearest!
				$o['cropwidth']=floor($o['outwidth']);
				$o['cropheight']=floor($o['outheight']);
				$xdiff=($o['outwidth']-$o['cropwidth'])/2;
				$ydiff=($o['outheight']-$o['cropheight'])/2;
				$o['offsetx']=$o['offsetx']-$xdiff;
				$o['offsety']=$o['offsety']-$ydiff;
			}
		  	$o['offset']='';
		  	if($o['offsetx']||$o['offsety']){
		  		if($o['offsetx']>=0) $o['offset'].='-'.$o['offsetx'];
		  		else $o['offset'].='+'.abs($o['offsetx']);
		  		if($o['offsety']>=0) $o['offset'].='-'.$o['offsety'];
		  		else $o['offset'].='+'.abs($o['offsety']);
		  	}
		  	// -gravity center removed because resizer should already do the centering!  this sometimes caused some images to have a white bar on top or left
			//just changing quality
			#die(json_encode($o));
			if(isset($o['cropdata'])){
				//convert from percent to px
				//$o['cropdata']['cropstring']=$o['cropdata']['width']."x".$o['cropdata']['height'].$o['cropdata']['offset'];
				//$o['cropdata']['cropstring']='200x200-200-200';
				if(isset($o['quality'])){
					$qual="-quality ".$o['quality']." ";
				}else $qual="";
				$o['cropCommand']="gm convert ".$o['ipath']." ".$qual."-size ".$o['cropdata']['width']."x".$o['cropdata']['height']." -geometry ".$o['originalWidth']."x".$o['originalHeight']."! +dither -density 72x72 -unsharp 0 -auto-orient -strip -background ".$bg." -extent ".$o['cropdata']['width']."x".$o['cropdata']['height'].$o['offset']." -resize ".$o['width']."x".$o['height']." ".$o['src'];
				exec($o['cropCommand']);
				//then resize!
				// $o['src2']=$o['src'].'_resized';
				// $o['resizeCommand2']="gm convert ".$o['src']." -size ".$o['sizeX']."x".$o['sizeY']." +dither -density 72x72".$gray." -unsharp 0 -background ".$bg." ".$o['src2'];
				// exec($o['resizeCommand2']);
				// $o['src']=$o['src2'];
			}else if(isset($o['qsp']['cropinfo'])){//NOT FINISHED!
				$cp=explode('~', $o['qsp']['cropinfo']);
				$sizep=explode('x',$cp[0]);
				$locp=explode('x',$cp[1]);
				$endsize=explode('x',$cp[2]);
				//convert from percent to px
				$o['cropdata']['width']=$o['srcwidth']*((int) $sizep[0]/100);
				$o['cropdata']['height']=$o['srcheight']*((int) $sizep[1]/100);
				$o['cropdata']['offsetx']=$o['srcwidth']*((int) $locp[0]/100);
				$o['cropdata']['offsety']=$o['srcheight']*((int) $locp[1]/100);
		  		if($o['cropdata']['offsetx']>=0) $o['cropdata']['offset'].='-'.$o['cropdata']['offsetx'];
		  		else $o['cropdata']['offset'].='+'.abs($o['cropdata']['offsetx']);
		  		if($o['cropdata']['offsety']>=0) $o['cropdata']['offset'].='-'.$o['cropdata']['offsety'];
		  		else $o['cropdata']['offset'].='+'.abs($o['cropdata']['offsety']);
				$o['cropdata']['sizeX']=(int) $endsize[0];
				$o['cropdata']['sizeY']=(int) $endsize[1];
				$o['cropdata']['cropstring']=$o['cropdata']['width']."x".$o['cropdata']['height'].$o['cropdata']['offset'];
				$o['cropdata']['cropstring']='200x200-200-200';
				if(isset($o['quality'])){
					$qual="-quality ".$o['quality']." ";
				}else $qual="";
				$o['resizeCommand']="gm convert ".$o['ipath']." ".$qual."-size ".$o['cropwidth']."x".$o['cropheight']." -geometry ".$o['srcwidth']."x".$o['srcheight']."! +dither -density 72x72 -unsharp 0 -auto-orient -strip -background ".$bg." -extent ".$o['cropwidth']."x".$o['cropheight'].$o['offset']." -crop ".$o['cropdata']['cropstring']." ".$o['src'];
				exec($o['resizeCommand']);
				//then resize!
				// $o['src2']=$o['src'].'_resized';
				// $o['resizeCommand2']="gm convert ".$o['src']." -size ".$o['sizeX']."x".$o['sizeY']." +dither -density 72x72".$gray." -unsharp 0 -background ".$bg." ".$o['src2'];
				// exec($o['resizeCommand2']);
				// $o['src']=$o['src2'];
			}else{
				if(isset($o['quality'])){
					if(isset($o['width'])||isset($o['height'])) $o['resizeCommand']="gm convert ".$o['ipath']." -quality ".$o['quality']." -size ".$o['cropwidth']."x".$o['cropheight']." -geometry ".$o['srcwidth']."x".$o['srcheight']."! +dither -density 72x72".$gray." -unsharp 0 -auto-orient -strip -background ".$bg." -extent ".$o['cropwidth']."x".$o['cropheight'].$o['offset']." ".$o['src'];
					else $o['resizeCommand']="gm convert ".$o['ipath']." -quality ".$o['quality']." +dither -density 200x200".$gray." -unsharp 0 -auto-orient -strip -background ".$bg." ".$o['src'];
				}else $o['resizeCommand']="gm convert ".$o['ipath']." -size ".$o['cropwidth']."x".$o['cropheight']." -geometry ".$o['srcwidth']."x".$o['srcheight']."! +dither -density 72x72".$gray." -unsharp 0 -auto-orient -strip -background ".$bg." -extent ".$o['cropwidth']."x".$o['cropheight'].$o['offset']." ".$o['src'];
				#die(json_encode($o));
				exec($o['resizeCommand']);

			}
			//^--actually resizing
			#die($o['resizeCommand']);
			//$o['resizeCommand']="gm convert ".$o['ipath']." -quality 100 +dither -density 72x72".$gray." -unsharp 0 -background ".$bg." ".$o['src'];
		  	//phi::log($o['resizeCommand']);
		  	//phi::log($o);
		  	#die(json_encode($o));
		  	
		  	$o['resized']=1;
		}else{
			$o['fromcache']=1;
		}
		#phi::log($o);
	  	return $o;
	}
	private static function validateImageData($o){
		$co='';
		//die(json_encode($o));
		if(isset($o['query'])&&$o['query']){
			$tvars=explode('&',$o['query']);
			foreach ($tvars as $key => $value) {
				$d=explode('=',$value);
				//set rules for removing unwated vars passed
				if($d[0] !='height' && $d[0] !='width' && $d[0] !='nocache' && $d[0] !='hex') $qsd[]=$value;
				if($d[0] !='rgb') $o[$d[0]]=$d[1];
			}
			if(isset($qsd)){
			 	$qs=implode('&',$qsd);
			 	$co.=$qs;
			 	$o['qs']=$qs;
			}
		}
		// update to include only valid qs params
		// if($o['qsp']) foreach ($o['qsp'] as $k => $v) {
		// 	if($k !='height' && $k !='width' && $k !='nocache' && $k !='hex'&&$k!='rgb') $qsd[]=$k.'='.$v;
		// 	//if($k !='rgb') $o[$k]=$v;
		// }
		$o['cache']=($co)?md5($co):false;
		$o['cacheText']=($co)?$co:false;
		if($o['cacheText']){
			$o['cachename']= $o['cache'].'-'.$o['image'];
			$o['src']=$o['CACHE_DIR'] .md5($o['cachename']);
		}
		return $o;
	}
	public static function outputToHeaders($o)	{
		if(isset($o['url'])){
			$f='/tmp/'.md5($o['url']);
			self::save($o['url'],$f,(isset($o['nocache']))?1:0);
			$o['src']=$f;
		}
		if(is_file($o['src'])){
			$data=file_get_contents($o['src']);
			$lastModified	= gmdate('D, d M Y H:i:s', filemtime($o['src'])) . ' GMT';
			//unlink files if necessary
			if(isset($o['nocache'])){
				if(isset($o['src'])) unlink($o['src']);
			}
			$etag=md5($data);
			if ((isset($_SERVER['HTTP_IF_MODIFIED_SINCE'])&&$_SERVER['HTTP_IF_MODIFIED_SINCE'] == $lastModified) || (isset($_SERVER['HTTP_IF_NONE_MATCH'])&&trim($_SERVER['HTTP_IF_NONE_MATCH']) == $etag)) {	
				header("HTTP/1.1 304 Not Modified");
				header('Etag: "'.$etag.'"');
				header("Expires: Sun, 1 Jan 2039 00:00:00 GMT");
				header("Cache-Control: max-age=315360000");
				exit;
			} else {
				header('pragma:');
				header("Content-type: ".$o['mime']);
				header('Content-Length: ' . strlen($data));
				header("Cache-Control: max-age=315360000, public");				
				header('x-powered-by:');
				header('Expires: Sun, 1 Jan 2039 00:00:00 GMT' );
				header("Last-Modified: ".$lastModified);
				header('Etag: "'.$etag.'"');
				header("Accept-Ranges: bytes");
				echo $data;
				exit;
			}
		}else{
			die('Image Source Not Available');
		}
	}

// old pond
// a frog jumps
// the sound of water

// óMatsuo Basho

// sure. whatever.
// Jeremy Dill
}
?>