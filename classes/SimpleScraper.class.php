<?php
/*
+---------------------------------------------------------------------------+
| SimpleScraper.class.php                                                   |
| Copyright (c) 2013, Ramon Kayo                                            |
+---------------------------------------------------------------------------+
| Author        : Ramon Kayo                                                |
| Email         : ramaismon@gmail.com                                       |
| License       : Distributed under the MIT License                         |
| Full license  : http://www.workster.com.br/simple-scraper/license.txt     |
+---------------------------------------------------------------------------+
| "Have the courage to follow your heart and intuition."                    |
+---------------------------------------------------------------------------+
| Last modified : 16/April/2013                                             |
+---------------------------------------------------------------------------+
*/

class SimpleScraper {
	
	private
		$contentType,
		$data,
		$content,
		$httpCode,
		$url;
	
/*===========================================================================*/
// CONSTRUCTOR
/*===========================================================================*/
	/**
	 * 
	 * @param string $url
	 * @throws Exception
	 */
	public function __construct($url) {
		// if(strpos($url, 'https://vimeo.com')==0){
		// 	die('ok');
		// 	$this->data = array(
		// 		'ogp' => array(),
		// 		'twitter' => array(),
		// 		'meta' => array(),
		// 		'images'=>array()
		// 	);
		// 	return false;
		// }
		$this->data = array(
			'ogp' => array(),
			'twitter' => array(),
			'meta' => array(),
			'images'=>array(),
			'valid'=>true
		);
		$bannedURLs=array('(doubleclick\.net)','(atlanticmedia)','(scorecardresearch\.com)','(ytimg)','(\.t\.co)','(analytics\.twitter\.com)');
		$bannedregex='/'.implode('|', $bannedURLs).'/';
		$urlPattern = '/\(?\b(?:(http|https|ftp):\/\/)?((?:www.)?[a-zA-Z0-9\-\.]+[\.][a-zA-Z]{2,4}|localhost(?=\/)|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d*))?(?=[\s\/,\.\)])([\/]{1}[^\s\?]*[\/]{1})*(?:\/?([^\s\n\?\[\]\{\}\#]*(?:(?=\.)){1}|[^\s\n\?\[\]\{\}\.\#]*)?([\.]{1}[^\s\?\#]*)?)?(?:\?{1}([^\s\n\#\[\]\(\)]*))?([\#][^\s\n]*)?\)?';
		//$urlPattern='^http:\/\/|(www\.)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$'
		if (!is_string($url))
			throw new Exception("Argument 'url' is invalid. Not a string.");
		// if (!(preg_match($urlPattern, $url)))
		// 	throw new Exception("Argument 'url' is invalid. Not a URL.");
		$this->url = $url;
		$turl=parse_url($url);
		error_reporting(0);
		$headers = get_headers($url);
		if($headers){
			$ret=substr($headers[0], 9, 3);
			if($ret<400) $valid=true;
			else $valid=false;
			//find content type
			if($valid) foreach ($headers as $k => $v) {
				if(strpos($v, 'Content-Type:')!==false){
					if(strpos($v, 'text/html')!==false||strpos($v, 'image/')!==false|strpos($v, 'application/octet-stream')!==false) $valid=true;//only allow text/html pages
					else $valid=false;
				}
			}
		}else{
			$this->data['valid']=false;
			return false;
		}
		$msg='success';
		$this->data['meta']['site_name']=$turl['host'];
		$filetypes=array('.png','.jpg','.jpeg','.gif');
		if($this->strposa($url,$filetypes)){
			$this->data['meta']['image']=$url;
			$this->data['meta']['title']='Image';
			$this->data['meta']['description']='';
		}else if($this->strposa($url,array('.pdf'))){//can update later
			$this->data['meta']['type']='pdf';
			$fn=explode('/', $url);
			$this->data['meta']['title']=$fn[sizeof($fn)-1];
			$this->data['meta']['image']='https://s3-us-west-2.amazonaws.com/groot/common/pdf.png';
			$this->data['meta']['description']='';
		}else{
			$this->fetchResource();
			libxml_use_internal_errors(true);
			$dom = new DOMDocument(null, 'UTF-8');
			$dom->loadHTML($this->content);
			$metaTags = $dom->getElementsByTagName('meta');
			$t=$dom->getElementsByTagName('title');
			//get path
			$tp=explode('/',$turl['path']);
			unset($tp[sizeof($tp)-1]);
			$turl['imgpath']=implode('/', $tp).'/';
			if($t&&$t->item(0)) $this->data['meta']['description']=$this->data['meta']['title']=$t->item(0)->nodeValue;
			else {
				$this->data['meta']['description']=$this->data['meta']['title']='';
			}
			$images = $dom->getElementsByTagName('img');
			if(isset($images)) foreach ($images as $image) 
			{
				$src=$image->getAttribute('src');
				if(!preg_match($bannedregex, $src)){
					//if(strpos($src, '://')===false){
						if(strpos($src, '//')===0){
							$src='http:'.$src;
						}else if(strpos($src, '://')===false){
							if(strpos($src, '/')!=0) $src=$turl['imgpath'].$src;
							$src='http://'.$turl['host'].$src;
						}
					//}
					if(!in_array($src, $this->data['images'])&&strpos($src, '/../')===false&&$this->strposa($src,$filetypes)) $this->data['images'][]=$src;
				}
			}
			if(isset($this->data['images'])&&isset($this->data['images'][0])) $this->data['meta']['image']=$this->data['images'][0];
			for ($i=0; $i<$metaTags->length; $i++) {
				$attributes = $metaTags->item($i)->attributes;
				$attrArray = array();
				foreach ($attributes as $attr) $attrArray[$attr->nodeName] = $attr->nodeValue;
				
				if (
					array_key_exists('property', $attrArray) && 
					preg_match('~og:([a-zA-Z:_]+)~', $attrArray['property'], $matches)
				) {
					if(isset($attrArray['content'])){
						$this->data['ogp'][$matches[1]] = ($matches[1]=='image')?phi::fixImg($attrArray['content'],$turl['host']):$attrArray['content'];
					}

				} else if (
					array_key_exists('name', $attrArray) &&
					preg_match('~twitter:([a-zA-Z:_]+)~', $attrArray['name'], $matches)
				) {
					if(isset($attrArray['content'])) $this->data['twitter'][$matches[1]] = $attrArray['content'];
				} else if (
					array_key_exists('name', $attrArray) &&
					array_key_exists('content', $attrArray)
				) {
					$this->data['meta'][$attrArray['name']] = $attrArray['content'];
				}
			}
		}
	}
	
/*===========================================================================*/
// PUBLIC METHODS
/*===========================================================================*/
	/**
	 * 
	 * @return string
	 */
	public function getContentType() {
		return $this->contentType;
	}
	public function strposa($haystack, $needle, $offset=0) {
	    if(!is_array($needle)) $needle = array($needle);
	    foreach($needle as $query) {
	        if(strpos($haystack, $query, $offset) !== false) return true; // stop on first true result
	    }
	    return false;
	}
	/**
	 * 
	 * @return array
	 */
	public function getAllData() {
		return $this->data;
	}
	
	/**
	 * 
	 * @return string
	 */
	public function getContent() {
		return $this->content;
	}
	
	/**
	 *
	 * @return string
	 */
	public function getHttpCode() {
		return $this->httpCode;
	}
	
	/**
	 *
	 * @return array
	 */
	public function getMeta() {
		return $this->data['meta'];
	}
	
	/**
	 *
	 * @return array
	 */
	public function getOgp() {
		return $this->data['ogp'];
	}
	
	/**
	 *
	 * @return array
	 */
	public function getTwitter() {
		return $this->data['twitter'];
	}
	
/*===========================================================================*/
// PRIVATE METHODS
/*===========================================================================*/
	private function fetchResource() {
		$ch = curl_init();
		curl_setopt($ch,CURLOPT_USERAGENT,'Mozilla/5.0 (compatible; SimpleScraper)');
		curl_setopt($ch, CURLOPT_URL, $this->url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
		curl_setopt($ch, CURLOPT_MAXREDIRS, 10);
		curl_setopt($ch, CURLOPT_TIMEOUT, 30); // times out after 30s
		$this->content = curl_exec($ch);
		$info = curl_getinfo($ch);
		curl_close($ch);
		
		$this->httpCode = $info['http_code'];
		$this->contentType = $info['content_type'];
		
		if (((int) $this->httpCode) >= 400) {
			throw new Exception('STATUS CODE: ' . $this->httpCode);
		}
	}	
}