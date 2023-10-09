<?php
$conf=json_decode(file_get_contents('/var/www/priv/config.json'),1);
include_once('/var/www/'.$conf['project'].'/classes/settings.php');  
$files=phi::getFiles('/tmp');
foreach($files['files'] as $k=>$v){
	if(strpos($v, 'hd_error')!==false){
		$data[]=[
			'path'=>$v,
			'img'=>'data:image/png;base64,'.base64_encode(file_get_contents($v))
		];
	}
}
foreach($data as $k=>$v){
	echo '<div><img src="'.$v['img'].'" style="height:50px">'.$v['path'].'</div>';
}

?>