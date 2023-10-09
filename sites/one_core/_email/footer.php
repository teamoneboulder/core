<?php
	function getFooter($opts){
		if(isset($opts['user']['email_token'])){
			$url='https://api.'.phi::$conf['domain'].'/nectar/user/unsubscribe?token='.$opts['user']['email_token'].'&appid=2344d44c84409765d9a5ab39ae8cabcd';
			$name='';
			if(isset($opts['email_type'])){
				$url.='&type='.$opts['email_type'];
				$name=NECTAR::getEmailNoticeName($opts['email_type']);
			}else{
				$url.='&type=marketing';
			}
			if(isset($opts['module']['systemstats'])){
				include_once(ROOT.'/sites/nectar/_templates/renderer.php');
				$footer=emailTemplateRenderer::render2('footer',array(
					'url'=>$url,
					'name'=>$name,
					'systemstats'=>$opts['module']['systemstats']['data']
				));
			}else{
				if($name){
					$footer='<div style="background:#f6f6f6;border-top:1px solid #ccc"><div style="text-align:center;padding-top:10px;padding-bottom:10px"><div style="padding-bottom:5px"><a href="'.$url.'" style="[a][highlightcolor]">Unsubscribe from '.$name.'</a></div><div>Nectar, LLC 2525 Arapahoe Suite E4-109, Boulder, CO 80302</div></div></div>';
				}else{
					$footer='<div style="background:#f6f6f6;border-top:1px solid #ccc"><div style="text-align:center;padding-top:10px;padding-bottom:10px"><div style="padding-bottom:5px"><a href="'.$url.'" style="[a][highlightcolor]">Unsubscribe</a></div><div>Nectar, LLC 2525 Arapahoe Suite E4-109, Boulder, CO 80302</div></div></div>';
				}
			}
		}else{
			$footer='';
		}
		return array('footer'=>$footer);
	}
?>