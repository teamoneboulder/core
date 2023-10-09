#!/usr/bin/php
<?php
if(!is_file('/var/www/priv/config.json')) die('invalid_config');
$conf=json_decode(file_get_contents('/var/www/priv/config.json'),1);
error_reporting(0);
include_once($conf['home'].'/'.$conf['project'].'/classes/settings.php');
include_once($conf['home'].'/'.$conf['project'].'/classes/phi.php');
include_once($conf['home'].'/'.$conf['project'].'/api/uploader.php');
error_reporting(0);
include_once($conf['home'].'/'.$conf['project'].'/classes/mime_parser.php');
include_once($conf['home'].'/'.$conf['project'].'/classes/rfc822_addresses.php');
//https://www.phpclasses.org/package/3169-PHP-Decode-MIME-e-mail-messages.html#view_files/files/14670
$file = fopen("/tmp/postfixtest", "a");
fwrite($file, "Script successfully ran at ".date("Y-m-d H:i:s")."\n");
$savedir='/tmp/email';
 if(!is_dir($savedir)) mkdir($savedir);
// read from stdin
$fd = fopen("php://stdin", "r");
$email = "";
while (!feof($fd)) {
	$line = fread($fd, 1024);
	$email .= $line;
}
fclose($fd);
 $mime=new mime_parser_class;
 $mime->mbox = 0;
 $parameters=array(    
    'Data'=>$email,
    'SaveBody'=>$savedir
);
 $out='';
 if(!$mime->Decode($parameters, $decoded)){
    $out.='MIME message decoding error: '.$mime->error.' at position '.$mime->error_position."\n";
    if($mime->track_lines
    && $mime->GetPositionLine($mime->error_position, $line, $column))
        $out.=' line '.$line.' column '.$column."\n";
    $out.="\n";
}else{
    $out.='MIME message decoding successful.'."\n";
    $out.= (count($decoded)==1 ? '1 message was found.' : count($decoded).' messages were found.')."\n";
    for($message = 0; $message < count($decoded); $message++){
        $out.='Message '.($message+1).':'."\n";
        if($mime->decode_bodies){
            if($mime->Analyze($decoded[$message], $results)){
            	//include_once(ROOT.'/sites/groupup/api.php');
            	//for debugging
    //         	$db=phi::getDB(false,'emails');
    //         	$id=phi::niceGUID(array(
				// 	'len'=>7,
				// 	'pre'=>'E',
				// 	'unique'=>array('collection'=>'emails','table'=>'email','field'=>'_id')
				// ));
				// $fields=phi::getObjectKeys2($results,array('Data'));
    //         	$db->email->save(array('_id'=>$id,'fields'=>$fields,'ts'=>time()));
               	//GROUPUP::processEmail($results);
                //save email!
                //process!
                $html=file_get_contents($results['DataFile']);
                if(isset($results['Related'])){//images
                    foreach ($results['Related'] as $k => $v) {
                        if($v['Type']=='image'){
                            $r=array(
                                'qs'=>array(
                                    'local'=>$v['DataFile'],
                                    'sizes'=>array('full'),
                                    'path'=>'/email/'
                                )

                            );
                            $resp=upload::uploadImage($r);
                            //replace
                            if(isset($resp['url'])){
                                //phi::log($resp);
                                $img='https://XXXX.s3.dualstack.us-east-1.amazonaws.com'.$resp['path'].'/full.'.$resp['ext'];
                                $html=str_replace('cid:'.$v['ContentID'], $img, $html);
                            }else{
                                phi::log('error uploading email image '.$results);
                            }
                        }
                    }
                }
                $to=$results['To'][0]['address'];
                $idp=explode('@', $to);
                $id=$idp[0];
                //stip <html> tag!
                $html=strip_tags($html, '<br><span><div><img><a><ul><li><ol>');//only allow content tags, we will re-write around html
                //save email
                if($id=='root'){
                    phi::log($html,'php_warning');
                }else{
                    $email=array(
                        'id'=>$id,
                        'html'=>$html,
                        'from'=>$results['From'][0],
                        'date'=>$results['Date'],
                        'subject'=>$results['Subject']
                    );
                    db2::save(DB,'email',$email);
                    //phi::log($html);
                    //phi::log($results);
                    phi::log('received support email!');
                }
            }else{
                $out.= 'MIME message analyse error: '.$mime->error."\n";
                phi::log($out);//shows error
            }
        }
    }
}
fwrite($file, $out);
fwrite($file, "Script Complete\n");
header("HTTP/1.1 250 OK");
exit();
?>