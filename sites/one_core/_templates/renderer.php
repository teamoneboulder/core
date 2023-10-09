<?php
class emailTemplateRenderer{
	public static function render2($template,$data){
		$latte = new Latte\Engine;
		$latte->setTempDirectory('/tmp');
		if(isset($data['timezone'])){
			date_default_timezone_set($data['timezone']);
		}else{
			date_default_timezone_set('America/Denver');
		}
		$latte->addFilter('parseHtmlContent',function($ret){
			//wrap links!
			$urls=phi::getUrlsFromString($ret);
			if($urls){
				$rev=array_reverse($urls);
				foreach ($rev as $k => $v) {
					$start=strpos($ret, $v);
					if($start!==false){
						$length=strlen($v);
						$ret=substr_replace( $ret, '</a>', $start+$length, 0 );
						$ret=substr_replace( $ret, '<a href="'.$v.'" target="_blank" style="font-weight:bold;text-decoration:none;color:#000">', $start, 0 );
					}
				}
			}
			return $ret;
		});
		$latte->addFilter('parsePostContent',function($chat){
			$ret=(isset($chat['message']))?$chat['message']:'';
			#phi::log('data: '.json_encode($chat));
			//other parsing
			if(isset($chat['at'])&&sizeof($chat['at'])){
				//reverse order by start
				$l=phi::sort($chat['at'],array(
					'key'=>'start',
					'type'=>'int',
					'reverse'=>1
				));
				foreach ($l as $k => $v) {
					$ret=substr_replace( $ret, '</span>', $v['start']+$v['length'], 0 );
					$ret=substr_replace( $ret, '<span style="font-weight:bold">', $v['start'], 0 );
				}
			}
			//wrap links!
			$urls=phi::getUrlsFromString($ret);
			if($urls){
				$rev=array_reverse($urls);
				foreach ($rev as $k => $v) {
					$start=strpos($ret, $v);
					if($start!==false){
						$length=strlen($v);
						$ret=substr_replace( $ret, '</a>', $start+$length, 0 );
						$ret=substr_replace( $ret, '<a href="'.$v.'" target="_blank" style="font-weight:bold;text-decoration:none;color:#000">', $start, 0 );
					}
				}
			}
			return $ret;
		});
		$latte->addFilter('parseChatContent',function($chat){
			$ret=(isset($chat['content']))?$chat['content']:'';
			//other parsing
			if(isset($chat['at'])&&sizeof($chat['at'])){
				//reverse order by start
				$l=phi::sort($chat['at'],array(
					'key'=>'start',
					'type'=>'int',
					'reverse'=>1
				));
				foreach ($l as $k => $v) {
					$ret=substr_replace( $ret, '</span>', $v['start']+$v['length'], 0 );
					$ret=substr_replace( $ret, '<span style="font-weight:bold">', $v['start'], 0 );
				}
			}
			//wrap links!
			$urls=phi::getUrlsFromString($ret);
			if($urls){
				$rev=array_reverse($urls);
				foreach ($rev as $k => $v) {
					$start=strpos($ret, $v);
					$length=strlen($v);
					$ret=substr_replace( $ret, '</a>', $start+$length, 0 );
					$ret=substr_replace( $ret, '<a href="'.$v.'" target="_blank" style="font-weight:bold;text-decoration:none;color:#000">', $start, 0 );
				}
			}
			return $ret;
		});
		$latte->addFilter('sizeof', function ($data) {
			return sizeof($data);
		});
		$latte->addFilter('getTs', function ($id) {
			if(isset($id['$oid'])) $ts= (int) hexdec(substr((string) $id['$oid'], 0, 8));
			else $ts= (int) hexdec(substr((string) $id, 0, 8));
			return date('g:i A n/j/Y',$ts);
		});
		$latte->addFilter('getImg', function ($data,$type) {
			$out='';
			$s3='https://one-light.s3.dualstack.us-east-1.amazonaws.com';
	        if(is_array($data)){
	            if(!isset($data['path'])){
	                $out='https://s3-us-west-2.amazonaws.com/groot/common/earth_user.jpg';
	            }else{
	                if($type=='background'&&!isset($data['v'])) $type='small';//fallback
	                if($type=='profile'&&!isset($data['v'])) $type='small';//fallback
	                if($type=='square'&&!isset($data['v'])) $type='small';//fallback
	                if($type=='header'&&!isset($data['v'])) $type='small';//fallback
	                if($type) $out=$s3.$data['path'].'/'.$type.'.'.$data['ext'];
	                else $out=$s3.$data['path'].'/full.'.$data['ext'];
	            }
	        }else{
	            $out=$data;
	        }
	       // phi::log('out: '.$out);
	        return $out;
		});
		$latte->addFilter('getUrl', function ($data,$type) {
			if(isset($data['url_name'])){
				$out='https://'.phi::$conf['domain'].'/'.$data['url_name'];
			}else{
				$out='https://'.phi::$conf['domain'].'/'.$type.'/'.$data['id'];
			}
	        return $out;
		});
		//$latte->setAutoRefresh(false);
		// render to output
		// or render to string
		#die(json_encode($data));
		$html = $latte->renderToString(__DIR__.'/'.$template.'.latte', array('data'=>$data));
		return $html;
	}
	public static function render($template,$data){
		$file=__DIR__.'/'.$template.'.template';
		if(is_file($file)){
			return phi::renderTemplate(file_get_contents($file),phi::convertArray($data));
		}else{
			phi::log('missing email template ['.$template.']');
			return '';
		}
	}
}
?>