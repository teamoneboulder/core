<?php
	/**
 * Create a Css style and sprite from images
 * 
 * @version 1.1
 * @link https://github.com/lutian/picStylizer
 * @author Lutian (Luciano Salvino)
 * @license http://opensource.org/licenses/gpl-license.php GNU Public License
 * @copyright Luciano Salvino
 *
 * Thanks Aldo Conte for improvements on script!
 * Reduces the size of CSS script and sprite in a big way
 */
 
 class picStylizer{
 
	/**
     * @var string The image result source
     */
    private $im;
	
	/**
     * @var int W image
     */
	private $im_w = 0;
	
	/**
     * @var int H image
     */
	private $im_h = 0;
	
	/**
     * @var int X image
     */
	private $im_x = 0;
	
	/**
     * @var int Y image
     */
	private $im_y = 0;
	
	/**
     * @var string The image tmp result source
     */
    private $temp;
    /**
     * @var string json
     */
    private $json=array();
	
	/**
     * @var int W temp
     */
	private $temp_w = 0;
	
	/**
     * @var int H temp
     */
	private $temp_h = 0;
	
	/**
     * @var int temp separation in px
     */
	private $temp_sep = 2;
	
	/**
     * @var string temp_css
     */
	private $temp_css = '';
	
	/**
     * @var string temp_css
     */
	private $temp_min_sep = "\n";

	/**
     * @var string temp_html
     */
	private $temp_html = '';
	
	/**
     * @var string version
     */
	private $version = '1.1';
	
	/**
     * @var array folders_config folder
     */
	private $folders_config = array(
		"origin" => array(
			"images" => "origin/images"
		),
		"destiny" => array(
			"sprites" => "/tmp/sprites.png",
		)
	);
	/*
	* @var string define default css style
	*/
	private $css_init = '';
	
	/**
     * @var array sprites
     */
	private $sprites = array();
	
	/*
	* crate a sprite from images
	* @return: string $imageResult image result path
	*/
	
	public function getSprite()
    {
    
		// first read the origin folder looking for png pictures
		$arrImages = $this->readFolder($this->folders_config["origin"]["images"]);
		
		// save images array
		$this->setSprite($arrImages);
		
		// create the sprite
		return $this->createSprite();

    }
	
	/*
	* read folder looking for images
	* @return: array $result 
	*/
	private function readFolder($dir='',$acceptedformats=array('png')) {
		$result = array(); 
		$cdir = scandir($dir); 
		// read origin dir
		foreach ($cdir as $key => $value) 
		{ 
			// exclude non files
			if (!in_array($value,array(".",".."))) 
			{ 
				// if have sub folders loop on the same function
				if (is_dir($dir . DIRECTORY_SEPARATOR . $value)) 
				{ 
					$result[$value] = $this->readFolder($dir . DIRECTORY_SEPARATOR . $value); 
				} 
				else 
				{ 
					// exclude files with extentions not accepted
					$ext = strtolower(substr($value, strrpos($value, '.') + 1));
					if(in_array($ext, $acceptedformats)) {
						$result[] = $value; 
					}
				} 
			} 
		} 
		   
		return $result; 
	}
	
	/*
	* get the images info from array
	*/
	private function getImageInfoFromDir($dir,$subdir='') {
	
		foreach($dir as $key => $value){
			if(!is_int($key)) {
				$this->getImageInfoFromDir($value,$subdir . $key . DIRECTORY_SEPARATOR);
			} else {
				$this->calculateSpriteWidthHeight($this->folders_config["origin"]["images"] . DIRECTORY_SEPARATOR . $subdir . $value);
			}
		}
	}
	
	/*
	* get the images info from array
	*/
	private function getImagesFromDir($dir,$subdir='') {
		foreach($dir as $key => $value){
			if(!is_int($key)) {
				$this->getImagesFromDir($value,$subdir . $key . DIRECTORY_SEPARATOR);
			} else {
				$this->proccessMedia($this->folders_config["origin"]["images"] . DIRECTORY_SEPARATOR . $subdir . $value);
			}
		}
	}
	
	/*
	* create the sprite
	*/
	private function createSprite() {
	
		$arrImages = $this->getSprites();

		
		if(count($arrImages)>0) {
		
			// calculate sprite width and height
			$this->getImageInfoFromDir($arrImages); 
			// echo $this->im_w.'.';
			// echo $this->im_h;
			// die();
			// create the empty sprite 
			$this->im = imagecreatetruecolor($this->im_w, $this->im_h);
			imagealphablending($this->im, false);
			$transparency = imagecolorallocatealpha($this->im, 0, 0, 0, 127);
			imagefill($this->im, 0, 0, $transparency);
			imagesavealpha($this->im, true);
			
			$x = 0;
			$y = 0;
		
			$this->getImagesFromDir($arrImages);
			
			// save the sprite
			$this->saveSprite();
			//save json!
			$json=$this->json;
		
		}
		return $json;
	}
	
	/*
	* calculate sprite w & h
	* @param: string $image
	* @return: object $this->temp 
	*/
	private function calculateSpriteWidthHeight($image) {
		if(is_file($image)) {
      $arrImage = @getimagesize($image);
			// updated by Aldo Conte			
			$tmps =	$arrImage[0]+$this->temp_sep;
			if ($tmps > $this->im_w) $this->im_w = $arrImage[0]+$this->temp_sep;
			// end
			$this->im_h += $arrImage[1]+$this->temp_sep;
		}
	}
	
	/*
	* proccess media
	* @param: string $image
	* @return: object $this->temp 
	*/
	private function proccessMedia($image) {
		if(is_file($image)) {
            $arrImage = @getimagesize($image);
			$this->temp_w = $arrImage[0];
			$this->temp_h = $arrImage[1];
			
			$tmp = ImageCreateTrueColor($this->im_w, $this->im_h);
			imagealphablending($tmp, false);
			$col=imagecolorallocatealpha($tmp,255,255,255,0);
			imagefilledrectangle($tmp,0,0,$this->im_w, $this->im_h,$col);
			imagealphablending($tmp,true);
			
			$gd_ext = substr($image, -3);
			
			if(strtolower($gd_ext) == "gif") {
              if (!$this->temp = imagecreatefromgif($image)) {
                    exit;
              }
            } else if(strtolower($gd_ext) == "jpg") {
              if (!$this->temp = imagecreatefromjpeg($image)) {
                    exit;
              }
            } else if(strtolower($gd_ext) == "png") {
              if (!$this->temp = imagecreatefrompng($image)) {
                    exit;
              }
            } else {
                die;
            }

			imagecopyresampled($tmp, $this->im, 0, 0, 0, 0, $this->im_w, $this->im_h, $this->im_w, $this->im_h);
			imagealphablending($tmp,true);
			
			// add each image to sprite
			
			// updated by Aldo Conte
			imagecopyresampled($this->im, $this->temp, 0, $this->im_y, 0, 0, $this->temp_w, $this->temp_h, $this->temp_w, $this->temp_h);  
			// end
			
			imagealphablending($this->im,true);
			
			$ext = substr($image, strrpos($image, '.'));
			
			$filename = basename($image,$ext);
			
			// add piece of script to json
			$this->genJsonPieceCode($filename);
			
			
			$this->im_x += $this->temp_w+$this->temp_sep;
			$this->im_y += $this->temp_h+$this->temp_sep;
			
		} else {
            die;
        }
	}
	private function genJsonPieceCode($name) {
		$this->json[$name]=array(
			'width'=>$this->temp_w,
			'height'=>$this->temp_h,
			'x'=>0,
			'y'=>$this->im_y,
			'pixelRatio'=>1
		);
	}
	
	private function genHtmlPieceCode($name) {
	// if filename contain "_hover" add the part of code
		if(strpos($name,"_hover")===false) {
			$temp_html = '<h3>class: '.$name.'</h3>';
			$temp_html .= '<div class="'.$name.'">';
			$temp_html .= '</div>';
			$this->temp_html .= $temp_html;	
		}
	}
	
	private function saveSprite() {
		imagepng($this->im,$this->folders_config['destiny']['sprites'],3); 
		return $this->im;
		imagedestroy($this->im);
	}
 

	/**
     * Set the image temp result
     * @var object $temp
     * @return object
	 */
	private function setTemp($temp)
    {
		return $this->temp = $temp;
	}
 
	/**
     * Get the image temp result
     * 
     * @return object
	 */
	private function getImageTemp()
    {
		return $this->temp;
	}
 
	/**
     * Set the image result
     * @var object $image
     * @return object
	 */
	private function setImage($image)
    {
		return $this->im = $image;
	}
 
	/**
     * Get the image result
     * 
     * @return object
	 */
	private function getImage()
    {
		return $this->im;
	}

	/**
     * Set sprites array
     * 
     * @return array
	 */
	private function setSprite($sprites)
    {
		return $this->sprites = $sprites;
	}
	
	/**
     * Get sprites array
     * 
     * @return array
	 */
	private function getSprites()
    {
		return $this->sprites;
	}
		
	/**
     * Set css obfuscation
     * 
     * @return string
	 */
	public function setMinization($obs = true) {
		if($obs) $this->temp_min_sep = '';
		else $this->temp_min_sep = "\n";
	}
	
	/**
     * Set css init
     * 
     * @return string
	 */
	public function setCssInit($style) {
		$this->css_init = $style.$this->temp_min_sep;
	}
	
	/**
     * Set folder config array
     * 
     * @return array
	 */
	public function setFoldersConfig($config)
    {
		return $this->folders_config = $config;
	}
 
 }
 function array_remove_empty($arr){
    $narr = array();
    while(list($key, $val) = each($arr)){
        if (is_array($val)){
            $val = array_remove_empty($val);
            // does the result array contain anything?
            if (count($val)!=0){
                // yes :-)
                $narr[$key] = $val;
            }
        }
        else {
            if (trim($val) != ""){
                $narr[$key] = $val;
            }
        }
    }
    unset($arr);
    return $narr;
}
	class MAPBOX{
		public static $id='Mapbox Builder';
		public static $conf='';
		public static $debug=1;
		public static $tmpsprite='';
		public static $spriteimg='';
		public static $spriteinfo='';
		public static $s3='';
		public static $s3bucket='groot';
		public static $tempdir='';
		public static $shields=array("us-highway","us-state","at-expressway","at-motorway","at-state-b","bg-motorway","bg-national","ch-main","ch-motorway","cz-motorway","cz-road","de-motorway","e-road","fi-main","gr-motorway","gr-national","hr-motorway","hr-state","hu-main","hu-motorway","nz-state","pl-expressway","pl-motorway","pl-national","ro-county","ro-motorway","ro-national","rs-motorway","rs-state-1b","se-main","si-expressway","si-motorway","sk-highway","sk-road","us-interstate","us-interstate-business","us-interstate-duplex","us-interstate-truck","za-metropolitan","za-national","za-provincial","za-regional");
		public static function handleRequest($r){
			switch ($r['path'][2]) {
				case 'updatestyle':
					$out=self::updateStyle($r);
				break;
			}
			if(!isset($out)) $out=array('error'=>'invalid_method');
			return $out;
		}
		public static function dbgetStyle($id){
			$db=phi::getDB(); 
			$style=$db->mapbox_style->findOne(array('_id'=>$id));
			//add in version if needed
			$gdb=phi::getDB(true,'groupup');
			$c=$gdb->mapbox_style->findOne(array('_id'=>$id));
			if(!$c){
				$style['_ver']=0;
			}else{
				$style['_ver']=$c['version'];
			}
			return $style;
		}
		public static function dbUpdateVersion($conf){
			$gdb=phi::getDB(true,'groupup');
			$conf['ts']=time();
			$gdb->mapbox_style->save($conf);
		}
		private static function updateStyle($r){
			if(!isset($r['path'][3])) die('No ID!');
			$id=$r['path'][3];
	        $conf=self::dbgetStyle($id); 
	       	if(!$conf) die('No Conf Found');
	        $conf['awsroot']="/mapbox/styles";
	        $conf['awslink']='https://s3-us-west-2.amazonaws.com/groot';
	        $conf['glyphs']="https://s3.amazonaws.com/static.rtrt.me/mapbox/glyphs/{fontstack}/{range}.pbf";
	        $conf['tilehost']='https://rtrt.me/mapconf/tilejson.json';
	        $conf['markers']=false;//additional marker support via spritesheet
	        if(!isset($conf['_ver'])) $conf['_ver']=0;
	        $conf['_ver']++;
	        self::build($conf);
	        //update build version!
	        $result['version']=$conf['_ver'];
	        $result['urls']=array(
	            'sprite'=>array(
	                'json'=>$conf['awslink'].$conf['awsroot'].'/'.$id.'/'.$conf['_ver'].'/sprites@2x.json',
	                'img'=>$conf['awslink'].$conf['awsroot'].'/'.$id.'/'.$conf['_ver'].'/sprites@2x.png'
	            ),
	            'conf'=>$conf['awslink'].$conf['awsroot'].'/'.$id.'/'.$conf['_ver'].'/style.json',
	            // 'preview'=>array(
	            //     'retina'=>'https://'.pi::$v['conf']['APP_DOMAIN'].'/webgl_preview.php?theme='.$id.'&version='.$conf['_ver'].'&scale=2',
	            //     'non-retina'=>'https://'.pi::$v['conf']['APP_DOMAIN'].'/webgl_preview.php?theme='.$id.'&version='.$conf['_ver'].'&scale=1'
	            // )
	        );
	        $result['_id']=$id;
	        self::dbUpdateVersion($result);
	        $result['success']=true;
	        return $result;
	    }
		//conf
		// iconfolder=>'/var/www/rtrt.me/pub/images/site/map_icons';
		// access_token=>'at',
		// user=> mapbox
		// theme_id => street_v9
		// awsroot=>'/default/path to aws'
		// _ver=> incriment to ensure unique URL of each upload
		public static function build($conf){
			ini_set('memory_limit', '256M');
			self::$debug=0;
			self::$conf=$conf;
			self::$tempdir='/tmp/'.self::$conf['theme_id'].'_'.self::$conf['_id'];//themes can share same mapbox theme, make unique
			if(is_dir(self::$tempdir)) exec('rm -rf '.self::$tempdir);
			mkdir(self::$tempdir);
			if(!self::$s3){//set up aws!
				self::$s3=phi::getS3();
			}
			self::loadSprites();
    		self::loadIcons();
    		self::loadCustomIcons();
    		self::make();
		}
		public static function getStyleUrl(){
			//can eventually use DB
			return 'https://api.mapbox.com/styles/v1/'.self::$conf['user'].'/'.self::$conf['theme_id'].'?fresh=true&access_token='.self::$conf['access_token'];
		}
		public static function getSpriteUrls(){
			//can eventually use DB
			$style=self::getStyle();
			$spritefile=str_replace('mapbox://styles/', '', $style->sprite);
			$spritefile=str_replace('mapbox://sprites/', '', $spritefile);
			return array(
				'json'=>'https://api.mapbox.com/styles/v1/'.$spritefile.'/sprite@2x.json?fresh=true&access_token='.self::$conf['access_token'],
				'sprite'=>'https://api.mapbox.com/styles/v1/'.$spritefile.'/sprite@2x.png?fresh=true&access_token='.self::$conf['access_token'],
				'sprite1x'=>'https://api.mapbox.com/styles/v1/'.$spritefile.'/sprite.png?fresh=true&access_token='.self::$conf['access_token']
			);
		}
		public static function getStyle($decode=true,$assoc=false){
			 $style=file_get_contents(self::getStyleUrl());
			 if($decode){
			 	$d=json_decode($style,$assoc);
			 	if($assoc){
			 		if($d['message']) die($d['message']);
			 	}else{
			 		if($d->message) die($d->message);
			 	}
			 	return $d;
			 }else{
			 	return $style;
			 }
		}
		public static function getIconPath($icon){
			if(is_array($icon)){
				if(isset($icon['stops'])){
					foreach ($icon['stops'] as $tk => $tv) {
						$icons[]=$tv[1];
					}
				}
			}else{
				$icons[]=$icon;
			}
			//do tests
			foreach ($icons as $k => $v) {
				if(strpos($v, '{shield}')!==false){
					foreach (self::$shields as $k => $v) {
						$out[]=$v;
					}
				}else if(strpos($v, '{maki}')===false){
					$td=explode('{', $v);
					if($td[0]) $out[]=$td[0];
				}
			}
			if(!isset($icons)) $out=false;
			return $out;
		}
		public static function strpos_arr($haystack, $needle) {
		    if(!is_array($needle)) $needle = array($needle);
		    foreach($needle as $what) {
		        if(strpos($haystack, $what)!==false) return true;
		    }
		    return false;
		}
		public static function loadSprites(){
			$urls=self::getSpriteUrls();
			// die(self::getStyleUrl());
			// die($urls['json']);
			//determine icons to download based on style conf...not all will be used!
			$style=self::getStyle(true,true);
			$icons=array();
			foreach ($style['layers'] as $key => $layer) {
				if(isset($layer['layout']['icon-image'])){
					$ticons=self::getIconPath($layer['layout']['icon-image']);
					if($ticons){
						foreach ($ticons as $tk => $tv) {
							if(!in_array($tv, $icons)) $icons[]=$tv;
						}
					}
				}
			}
			//load sprite image!
			if(!self::$spriteimg){
				self::$tmpsprite=self::$tempdir.'/sprite_'.md5($urls['sprite']).'.png';
				file_put_contents(self::$tmpsprite, file_get_contents($urls['sprite']));
				self::$spriteimg=imagecreatefrompng(self::$tmpsprite);
				self::$spriteinfo=getimagesize(self::$tmpsprite);
				//save sprite to test!
				// $savepath=self::$tempdir.'/sprite_downloaded.png';
				// imagepng(self::$spriteimg,$savepath);
				#self::cl('Successfully Saved [sprite] [https://app-sa-backup.rtrt.me/pub/js/mapbox/styles/'.self::$conf['theme_id'].'/sprite_downloaded.png]');
			}
			if(sizeof($icons)){
				$json=json_decode(file_get_contents($urls['json']),1);
				#die(json_encode($json));
				foreach ($json as $k => $v) {
					if(self::strpos_arr($k,$icons)){
						//$save[]=$k;
						//save to icon folder!
						self::saveIcon($k,$v);
					}
				}
				
			}
			self::cl('Successfully Copied All Sprite Icons!');
		}
		public static function loadIcons(){
			$savetodir=self::$tempdir.'/icons/';
			if(!is_dir($savetodir)) mkdir($savetodir);
			$cdir = scandir(self::$conf['iconfolder']); 
			// read origin dir
			foreach ($cdir as $key => $value) 
			{ 
				// exclude non files
				if (!in_array($value,array(".",".."))) 
				{ 
					//$result[] = $value; 
					#self::cl('Copied ['. $value.']');
					#echo 'cp '.self::$conf['iconfolder'].'/'.$value.' '.self::$tempdir.'/icons/'.$value;
					exec('cp '.self::$conf['iconfolder'].'/'.$value.' '.self::$tempdir.'/icons/'.$value);
				} 
			} 
			self::cl('Successfully Loaded RTRT Icons');
			if(isset(self::$conf['custom_folder'])&&self::$conf['custom_folder']){
				$cdir = scandir(self::$conf['custom_folder']); 
				// read origin dir
				foreach ($cdir as $key => $value) 
				{ 
					// exclude non files
					if (!in_array($value,array(".",".."))) 
					{ 
						//$result[] = $value; 
						#self::cl('Copied ['. $value.']');
						#echo 'cp '.self::$conf['iconfolder'].'/'.$value.' '.self::$tempdir.'/icons/'.$value;
						exec('cp '.self::$conf['custom_folder'].'/'.$value.' '.self::$tempdir.'/icons/'.$value);
					} 
				} 
				self::cl('Successfully Loaded Custom Folder Icons');
			}
		}
		public static function saveIcon($name,$conf){
			$savetodir=self::$tempdir.'/icons/';
			if(!is_dir($savetodir)) mkdir($savetodir);
			$savepath=$savetodir.$name.'.png';
			$new = imagecreate($conf['width'], $conf['height']);
			$settings=array(
				'dst_x'=>0,
				'dst_y'=>0,
				'src_x'=>$conf['x'],
				'src_y'=>$conf['y'],
				'dst_w'=>$conf['width'],
				'dst_h'=>$conf['height'],
				'src_w'=>self::$spriteinfo[0],
				'src_h'=>self::$spriteinfo[1]
			);
			#die(json_encode($settings));
			//use both src_w/h for dest as the image is not being resized!
			imagecopyresampled($new,self::$spriteimg,$settings['dst_x'],$settings['dst_y'],$settings['src_x'],$settings['src_y'],$settings['src_w'],$settings['src_h'],$settings['src_w'],$settings['src_h']);
			if ($save !== FALSE) {
			    imagepng($new,$savepath);
			    #self::cl('Successfully Saved ['.$name.'] [https://app-sa-backup.rtrt.me/pub/js/mapbox/styles/'.self::$conf['theme_id'].'/icons/'.$name.'.png]');
			}
		}
		public static function loadCustomIcons(){
			$savetodir=self::$tempdir.'/icons/';
			if(isset(self::$conf['markers'])&&self::$conf['markers']){
				foreach (self::$conf['markers'] as $k => $v) {
					$exts=explode('.', $v['path']);
					$ext=$exts[sizeof($exts)-1];
					$fname=$savetodir.$v['_id'].'.'.$ext;
					file_put_contents($fname,file_get_contents($v['img']));
					//echo $v['img'];
				}
			}
		}
		public static function make(){
			$style=self::getStyle();
			$pS = new picStylizer();
			$config = array(
			    // set the origin folder
			    "origin" => array(
			        "images" => self::$tempdir.'/icons/' // folder from where the script will take the images
			    ),
			    // set destiny folder
			    "destiny" => array(
			    	'sprites'=>self::$tempdir.'/sprites.png'
			    )
			);
			$pS->setFoldersConfig($config);
			$json=$pS->getSprite();//generate at 2x, then resize and fix for 1x
			//fix json
			$maxwidth=0;
			foreach ($json as $k => $v) {
				$v['pixelRatio']=2;
				if($v['width']>$maxwidth) $maxwidth=$v['width'];
				$v['width']=$v['width']*2;
				$v['height']=$v['height']*2;
				$v['y']=$v['y']*2;
				$json2[$k]=$v;
			}
			//resize for 1x!
			include(ROOT.'/_img/resizer.php');
			//move it to the outdir!
			//update sprite reference!!!
			$style->sprite=self::$conf['awslink'].self::$conf['awsroot'].'/'.self::$conf['_id'].'/'.self::$conf['_ver'].'/sprites';
			//change where the data points to!
			$urls=self::getSpriteUrls();
			$sprite=self::$tempdir.'/sprites.png';
			$sprite2=self::$tempdir.'/sprites2x.png';
			file_put_contents($sprite, file_get_contents($urls['sprite1x']));
			file_put_contents($sprite2, file_get_contents($urls['sprite']));
			//$sprite2=ImageResizer::render($sprite,array('scale'=>2,'nocache'=>1),false);
			$sources=array(
				'composite'=>array(
				  "type"=>"vector",
				  "url"=>self::$conf['tilehost']
				 )
			);
			if(self::$conf['sources']){
				foreach (self::$conf['sources'] as $k => $v) {
					$sources[$k]=$v;
				}
			}
			$style->sources=$sources;
			$style->glyphs=self::$conf['glyphs'];
			//https://github.com/mapbox/mapbox-gl-native/issues/3141
			//https://www.mapbox.com/mapbox-gl-js/style-spec/#sources
			//upload style
			self::upload(array(
				'data'=>json_encode($style),
				'mime'=>'application/json',
				'path'=>self::$conf['awsroot'].'/'.self::$conf['_id'].'/'.self::$conf['_ver'].'/style.json'
			));
			//updoad spritejson 1x
			self::upload(array(
				'data'=>json_encode($json),
				'mime'=>'application/json',
				'path'=>self::$conf['awsroot'].'/'.self::$conf['_id'].'/'.self::$conf['_ver'].'/sprites.json'
			));
			//updoad spritejson 2x
			self::upload(array(
				'data'=>json_encode($json2),
				'mime'=>'application/json',
				'path'=>self::$conf['awsroot'].'/'.self::$conf['_id'].'/'.self::$conf['_ver'].'/sprites@2x.json'
			));
			//updoad sprite 1x
			self::upload(array(
				'mime'=>'image/png',
				'file'=>self::$tempdir.'/sprites.png',
				'path'=>self::$conf['awsroot'].'/'.self::$conf['_id'].'/'.self::$conf['_ver'].'/sprites.png'
			));
			//updoad sprite 2x
			self::upload(array(
				'mime'=>'image/png',
				'file'=>$sprite2,
				'path'=>self::$conf['awsroot'].'/'.self::$conf['_id'].'/'.self::$conf['_ver'].'/sprites@2x.png'
			));
			//updoad original Sprite
			self::upload(array(
				'mime'=>'image/png',
				'file'=>self::$tmpsprite,
				'path'=>self::$conf['awsroot'].'/'.self::$conf['_id'].'/'.self::$conf['_ver'].'/original_sprite.png'
			));
		}
		public static function upload($opts){
			if(isset($opts['data'])){
				$data=$opts['data'];
			}
			if(isset($opts['file'])){
				$data=file_get_contents($opts['file']);
			}
			$response = self::$s3->putObject(array(
	            'Bucket'=>self::$s3bucket,
	            'Key'=>$opts['path'], 
	            'Body'=> $data,
	            'StorageClass'=>'REDUCED_REDUNDANCY',
	            'ContentType'=>$opts['mime'],
	            'ACL'=> 'public-read'
	        ));
		}
		public static function cl($txt,$die=false,$plain=false){
			if(self::$debug){
		        if($plain){
		            echo $txt;
		        }else{
		            if(self::$id) $txt="\033[0;32m".'['.self::$id.']'."\033[0m".' '.$txt;
		            echo $txt."\r\n";
		        }
		        if($die) die();
		    }
	    }
	}
?>