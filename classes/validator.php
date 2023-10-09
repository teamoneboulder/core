<?php
	class VALIDATOR{
		public static $hashPassword=true;
		public static $types=array(
			'string'=>array(
				'primary'=>true,
				'type'=>'string'
			),
			'int'=>array(
				'primary'=>true,
				'type'=>'int'
			),
			'bool'=>array(
				'primary'=>true,
				'type'=>'bool'
			),
			'array'=>array(
				'primary'=>true,
				'type'=>'array'
			),
			'html'=>array(
				'primary'=>true,
				'type'=>'html'
			),
			'email'=>array(
				'primary'=>true,
				'type'=>'email'
			),
			'password'=>array(
				'primary'=>true,
				'type'=>'password'
			),
			'float'=>array(
				'primary'=>true,
				'type'=>'float'
			),
			'url'=>array(
				'primary'=>true,
				'type'=>'url'
			),
			'imageextension'=>array(
				'primary'=>true,
				'type'=>'imageextension'
			),
			'_id'=>array(
				'type'=>'string'
			),
			'id'=>array(
				'type'=>'string'
			),
			'timestamp'=>array(
				'type'=>'int'
			),
			'text'=>array(
				'type'=>'string',
				'stripHTML'=>true
			),
			'hexcolor'=>array(
				'primary'=>true,
				'type'=>'hexcolor'
			),
			'textarea'=>array(
				'type'=>'string',
				'stripHTML'=>true
			),
			'multiimage'=>array(
				'type'=>'array',
				'itemType'=>'image'
			),
			'point'=>array(
				'type'=>'object',
				'fields'=>array(
					'type'=>array('type'=>'string'),
					'coordinates'=>array('type'=>'coords')
				)
			),
			'links'=>array(
				'type'=>'array',
				'itemType'=>'link'
			),
			'tag'=>array(
				'type'=>'array',
				'itemType'=>'text'
			),
			'link'=>array(
				'type'=>'object',
				'fields'=>array(
					'url'=>array('type'=>'url'),
					'type'=>array('type'=>'text')
				)
			),
			'attachments'=>array(
				'type'=>'object',
				'fields'=>array(
					'type'=>array('type'=>'string'),
					'order'=>array('type'=>'array')
				)
			),
			'image'=>array(
				'type'=>'object',
				'fields'=>array(
					'ext'=>array('type'=>'imageextension'),
					'path'=>array('type'=>'text'),
					'ar'=>array('type'=>'float','notrequired'=>true),
					'v'=>array('type'=>'int','notrequired'=>true)
				)
			),
			'redactor'=>array(
				'type'=>'html'
			),
			'latlng'=>array(
				'type'=>'float'
			),
			'object'=>array(
				'type'=>'object'
			),
			'coords'=>array(
				'type'=>'object',
				'fields'=>array(
					array('type'=>'float'),
					array('type'=>'float')
				)
			),
			'geotext'=>array(
				'type'=>'object',
				'fields'=>array(
					'main'=>array('type'=>'text'),
					'secondary'=>array('type'=>'text')
				)
			),
			'index'=>array(

			),
			'geocode'=>array(
				'type'=>'object',
				'fields'=>array(
					'lat'=>array('type'=>'latlng'),
					'lng'=>array('type'=>'latlng'),
					'place_id'=>array('type'=>'string','notrequired'=>true),
					'text'=>array('type'=>'geotext','notrequired'=>true)
				)
			)
		);
		public static $imageextensions=array('png','jpg','jpeg');
		public static function validate($data,$conf,$update,$dont_allow_system_updates=false,$last=false){
			//phi::log($data);
			#die(json_encode($last));
			#die(json_encode($conf));
			#die(json_encode($data));
			$data_keys=array_keys($data);
			foreach ($conf['fields'] as $k => $v) {
				//check required fields
				if(isset($v['private'])){//private data field!
					if(isset($data[$k])) unset($data[$k]);
					continue;//dont process this field!
				}
				if($dont_allow_system_updates&&isset($v['system'])){
					if(isset($data[$k])) unset($data[$k]);
					continue;//dont process this field!
				}
				if($v['type']=='url'&&isset($data['_validateOpts'][$k]['dontCheckURL'])){
					//phi::log('skip checking url');
					$v['dontCheckURL']=1;
				}
				$v['field']=$k;
				if(!isset($v['type'])){
					phi::log('invalid conf for '.$k);
					continue;
				}
				$tconf=(isset(self::$types[$v['type']]))?self::$types[$v['type']]:false;
				if(!$tconf) return array('error'=>'invalid type ['.$v['type'].']');
				if($v['type']=='password'){//ensure verify
					if(!isset($v['validate'])) die('invalid configuration for [password]');
					if(isset($v['required'])||(isset($v['requiredIfNot'])&&!isset($data[$v['requiredIfNot']]))){
						if(isset($v['enableBlank'])&&!isset($data[$v['validate']])&&!isset($data[$k])){

						}else{
							if(isset($data[$v['validate']])){
								if($data[$v['validate']]!=$data[$k]){
									API::toHeaders(array('error'=>'passwords must match'));
								}
							}else{
								$err['invalid'][]=$v;
							}
						}
					}
				}
				if(isset($v['create'])&&!isset($data[$k])&&!$update){
					if($v['type']=='id'||$v['type']=='_id'){
						$data[$k]=$cv=db2::niceGUID($v['create']);
					}
					if($v['type']=='timestamp'){
						$data[$k]=$cv=time();
					}
				}else{
					if(isset($data[$k])){
						if($data[$k]==='[unset]'){//for some reason =='[unset]' would be true if $data[$k]=0
							#phi::clog('here'.$data[$k]);
							#die(json_encode($v));
							//dont allow unsetting a required field!
							if(isset($v['required'])){
								$err['missing'][]=$v;
							}
							$cv='[unset]';
						}else{
							$data[$k]=$cv=self::formatData($data[$k],$tconf,$v);
							if($cv===0&&isset($v['dontAllowZero'])){
								unset($data[$k]);
								$cv=false;
							}
						}
					}else{
						$cv=false;
					}
				}
				//if required field, dont allow unsetting!
				$v['data']=$cv;
				if(isset($v['unique'])){//test uniqueness!
					if(isset($data[$k])){
						$cur=db2::findOne(phi::$conf['dbname'],$conf['id'],array($k=>$data[$k]));
						//for updating purposes
						if($cur){
							if(isset($v['unique']['updateOn'])&&phi::dotGet($v['unique']['updateOn'],$data)&&phi::dotGet($v['unique']['updateOn'],$data)==phi::dotGet($v['unique']['updateOn'],$cur)){
								//values match!  allow update to happen!
								$data['_update']=true;//use later maybe
							}else{
								$err['nonunique'][]=$v;
							}
						}
					}
				}
				#die(debug_print_backtrace());
				#die('here: '.$update);
				if(!$update){//dont do this on an update!
					if(isset($v['required'])&&$v['required']&&(!$cv&&$cv!==0)){
						$err['missing'][]=$v;
					}
				}else{
					if(isset($v['required'])&&!$cv&&$cv!==0){//allow 0!
						#die(json_encode($v));
						//phi::log('dont allow blank! '.json_encode($v));
						unset($v['data']);
						unset($data[$k]);
						#die(json_encode($data));
						$cv=false;
					}
				}
				#die(json_encode($data));
				if($cv!==false&&$cv!='[unset]'){//only run malform check if data exists
					//check malformed-ness
					if(!$tconf){
						$err['invalid'][]=$v;
					}else{
						if(isset($data['_validateOpts'][$v['field']])){
							$v=array_merge($v,$data['_validateOpts'][$v['field']]);
						}
						//die(json_encode($v));
						if($cv!='[unset]'&&!self::checkData($cv,$tconf,$v)){
							$err['malformed'][]=$v;
						}
					}
				}
			}
			#API::toHeaders($conf['order']);
			if(isset($err)) return self::buildErrorResponse($err);
			else return self::keepFields($data,$conf['order']);//ensure only validated data gets through
		}
		public static function keepFields($arr,$fields=false){
			if(is_array($fields)){
				$out=false;
				#die(json_encode($arr));
				$keys=false;
				if(isset($arr)&&is_array($arr)) $keys=array_keys($arr);
				foreach ($fields as $k => $field) {
					if((isset($arr[$field])&&$arr[$field]!=='false')) $out[$field]=$arr[$field];
					if($keys){
						foreach($keys as $tk=>$tv){//allows for dot notation
							if(strpos($tv, $field)===0){
								$out[$tv]=$arr[$tv];
							}
						}
					}
				}
				return $out;
			}else return $arr;	
		}
		public static function checkData($data,$conf,$fconf=false){
			$valid=false;
			if(isset($conf['primary'])){//primary building block!
				$conf['data']=$data;
				if(isset($conf['primary'])){
					if(self::isValidDataType($data,$conf['type'],$fconf)) $valid=true;
				}else{
					die('invalid conf ['.$conf['type'].']');
				}
			}else{
				switch ($conf['type']) {
					case 'object'://nested
						//iterate over fields
						if(isset($conf['fields'])){
							$vc=0;
							$cc=0;
							foreach ($conf['fields'] as $k => $v) {
								if(isset($data[$k])&&isset(self::$types[$v['type']])){
									if(self::checkData($data[$k],self::$types[$v['type']],$fconf)){
										$vc++;
									}else{
										if(isset($v['notrequired'])) $vc++;//valid if not required
									}
								}else{
									if(!isset(self::$types[$v['type']])) die('invalid conf ['.$v['type'].']');
									if(isset($v['notrequired'])) $vc++;//valid if not required
								}
							}
							if($vc==sizeof($conf['fields'])) $valid=true;
						}else{
							$valid=true;
						}
					break;
					case 'array'://nested
						if(isset(self::$types[$conf['itemType']])){
							//iterate over entire object
							$vc=0;
							$rc=0;
							$type=self::$types[$conf['itemType']];
							for ($i=0; $i <sizeof($data) ; $i++) { 
								$cdata=$data[$i];
								if(self::checkData($cdata,$type,$fconf)) $vc++;
							}
							if(isset($fconf['form']['max'])&&$vc>$fconf['form']['max']){
								$valid=false;
							}else{
								if($vc==sizeof($data)) $valid=true;
							}
						}else{
							die('invalid conf ['.$conf['itemType'].']');
						}
					break;
					default://composite 
						$tconf=(isset(self::$types[$conf['type']]))?self::$types[$conf['type']]:false;
						if($tconf){
							if(self::checkData($data,$tconf,$fconf)) $valid=true;
						}else{
							die('invalid conf ['.$conf['type'].']');
						}
					break;
				}
			}
			if($valid) return true;
		}
		public static function isValidDataType($data,$type,$fconf=false){
			$isvalid=false;
			#phi::log('conf '.json_encode($fconf));
			switch ($type) {
				case 'float':
					if(is_float($data)) $isvalid=true;
					if($fconf){
						if(isset($fconf['bounds'])){
							if($data<$fconf['bounds'][0]||$data>$fconf['bounds'][1]){
								$isvalid=false;
							}
						}
					}
				break;
				case 'int':
					if(is_int($data)) $isvalid=true;
					if($fconf){
						if(isset($fconf['bounds'])){
							if($data<$fconf['bounds'][0]||$data>$fconf['bounds'][1]){
								$isvalid=false;
							}
						}
						if(isset($fconf['form']['min'])){
							$min=$fconf['form']['min'];
							if($fconf['form']['type']=='money') $min=$min*100;
							if($data<$min){
								die('vad');
								$isvalid=false;
							}
						}
						#die('here'.$data . ' '.$fconf['form']['max']);
						if(isset($fconf['form']['max'])){
							$max=$fconf['form']['max'];
							if($fconf['form']['type']=='money') $max=$max*100;
							if($data>$max){
								$isvalid=false;
							}	
						}
					}
				break;
				case 'array':
					if(is_array($data)) $isvalid=true;
					//ensure if max is set that it doesnt go past max
					#die(json_encode($fconf));
				break;
				case 'hexcolor':
					preg_match_all('/#([a-fA-F0-9]{3}){1,2}\b/', $data, $matches);
					//die(json_encode($matches));
					if(isset($matches[0])&&isset($matches[0][0])&&$matches[0][0]==$data){
						$isvalid=true;
					}
				break;
				case 'bool':
					if(is_bool($data)) $isvalid=true;
				break;
				case 'password':
				case 'string':
					if(is_string($data)) $isvalid=true;
					if(isset($fconf['form']['type'])&&$fconf['form']['type']=='select'){
						if(!in_array($data, $fconf['form']['options']['order'])) $isvalid=false;
					}
				break;
				case 'email':
					if(strpos($data, '@')!==false) $isvalid=true;
				break;
				case 'imageextension':
					if(in_array($data, self::$imageextensions)) $isvalid=true;
				break;
				case 'html':
					if(self::validateHTML($data)) $isvalid=true;
				break;
				case 'url':
					// Validate url
					if(isset($fconf['dontCheckURL'])) return true;
					$data=self::ensureURL($data);
					$isvalid=self::isValidUrl($data);
				break;
			}
			return $isvalid;
		}
		public static function ensureURL($url){
			if(strpos($url, 'http')===false){
				$url='https://'.$url;
			}
			return $url;
		}
		public static function isValidUrl($url){
    		if (filter_var($url, FILTER_VALIDATE_URL)) {
			   	$valid=1;
			} else {//try to load for falback..eg filter_validate doesnt catch everything..
			    error_reporting(0);
	    		$headers = get_headers($url);
	    		if($headers){
	    			$ret=substr($headers[0], 9, 3);
	    			if($ret<400) $valid=true;
	    			else $valid=false;
	    			die(json_encode($headers));
	    			//find content type
	    			if($valid) foreach ($headers as $k => $v) {
	    				if(strpos($v, 'Content-Type:')!==false){
	    					if(strpos($v, 'text/html')!==false) $valid=true;//only allow text/html pages
	    					else $valid=false;
	    				}
	    			}
	    		}else $valid=false;
			}
    		return $valid;
		}
		public static function parseFormatData($data,$type,$debug,$fconf){
			$isvalid=false;
			// phi::log('data: '.json_encode($data));
			// phi::log('type: '.$type);
			// phi::log('fconf: '.json_encode($fconf));
			//if(!$data&&$data!="0") return $data;
			switch ($type) {
				case 'float':
					$data=(float) $data;
				break;
				case 'int':
					if($data==="") $data=0;
					$data=(int) $data;
				break;
				case 'string':
					$data=(string) $data;
				break;
				case 'bool':
					$data=(bool) $data;
				break;
				case 'email':
					$data=strtolower($data);
				break;
				case 'password':
					if(self::$hashPassword){
						$data=md5($data.AUTH_SALT);
					}
				break;
				case 'imageextension':
					$data=(string) $data;
				break;
				case 'html':
					$data=phi::ensureRedactorContent($data);//only allow specific tags, eg remove <script>
				break;
				case 'url':
					$data=self::ensureURL($data);
				break;
				case 'array':
					//die('here'.json_encode($data));
					//if($data[0]==='')
					#die('here');
				break;
			}
			return $data;
		}
		public static function formatData($data,$conf,$fconf,$debug=false){
			if(isset($conf['primary'])){//primary building block!
				$conf['data']=$data;
				if(isset($conf['primary'])){
					$data=self::parseFormatData($data,$conf['type'],$debug,$fconf);
				}else{
					die('invalid conf ['.$conf['type'].']');
				}
			}else{
				switch ($conf['type']) {
					case 'object'://nested
						//iterate over fields
						if(isset($conf['fields'])){
							foreach ($conf['fields'] as $k => $v) {
								if(isset($data[$k])){
									$data[$k]=self::formatData($data[$k],self::$types[$v['type']],$debug);
								}
							}
						}
						if(isset($fconf['fields'])){
							foreach ($fconf['fields'] as $k => $v) {
								if(isset($data[$k])){
									$data[$k]=self::formatData($data[$k],self::$types[$v['type']],$debug);
								}
							}
							$limit=array_keys($fconf['fields']);
							$data=self::keepFields($data,$limit);
						}
					break;
					case 'array'://nested
						if(isset(self::$types[$conf['itemType']])){
							//iterate over entire object
							$vc=0;
							$type=self::$types[$conf['itemType']];
							if(sizeof($data)==1&&$data[0]=='false'){//unset!
								$data=[];
							}else{
								for ($i=0; $i <sizeof($data) ; $i++) { 
									$cdata=$data[$i];
									$data[$i]=self::formatData($cdata,$type,$debug);
								}
							}
						}else{
							die('invalid conf ['.$conf['itemType'].']');
						}
					break;
					default://composite 
						$tconf=(isset(self::$types[$conf['type']]))?self::$types[$conf['type']]:false;
						$data=self::formatData($data,$tconf,$debug);
					break;
				}
			}
			return $data;
		}
		public static function validateHTML($html){
			return true;//for now
			$tidy = new Tidy;
			$tidy->parseString("<!DOCTYPE html><title>HTML fragment</title><body>" . $html);
    		$status = $tidy->getStatus();
    		if($status==0) return true;
    		else return false;
		}
		public static function buildErrorResponse($err){
			if(isset($err['missing'])){
				foreach ($err['missing'] as $k => $v) {
					$resp['error']['Missing Data'][]=array('type'=>$v['type'],'name'=>$v['name'],'data'=>$v['data'],'field'=>$v['field']);
				}
			}
			if(isset($err['malformed'])){
				foreach ($err['malformed'] as $k => $v) {
					$resp['error']['Malformed Data'][]=array('type'=>$v['type'],'name'=>$v['name'],'data'=>$v['data'],'field'=>$v['field']);
				}
			}
			if(isset($err['nonunique'])){
				foreach ($err['nonunique'] as $k => $v) {
					$resp['error']['Already Being Used'][]=array('type'=>$v['type'],'name'=>$v['name'],'data'=>$v['data'],'field'=>$v['field']);
				}
			}
			if(isset($err['invalid'])){
				foreach ($err['invalid'] as $k => $v) {
					$resp['error']['Invalid'][]=array('type'=>$v['type'],'name'=>$v['name'],'field'=>$v['field']);
				}
			}
			return $resp;
		}
	}
?>