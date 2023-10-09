<?php
	//get params
	include_once(ROOT.'/classes/ics.php');
	$r=API::parseRequest();
	//lock with specific token!
	if(!isset($r['qs']['token'])||$r['qs']['token']!='2s64d44c8440976529a00619aea451234') API::toHeaders(array('error'=>'invalid_token'));
	//$ctoken=$r['path'][1];
	//$calendar=(isset($r['path'][2]))?$r['path'][2]:'';
	// $r['qs']['appid']='67c7e53522180c9870fb5cf934330513';//calendar appid
	// $r['qs']['token']=$ctoken;

	#die(json_encode($calendars));
	$events=db2::find(DB,'event',array('start'=>array('$gte'=>time(),'$lte'=>(time()+(60*60*24*30*2)))));//show 2 months in future
	//get upcoming events!
	$name='ONE|Boulder';
	$description='ONE|Boulder Calendar';
	header('Content-type: text/calendar; charset=utf-8');
	header('Content-Disposition: attachment; filename=ONEBoulder.ics');
	$lines[]='BEGIN:VCALENDAR';
	$lines[]='VERSION:2.0';
	$lines[]='PRODID:-//oneboulder//NONSGML oneboulder//EN';
	$lines[]='X-WR-CALNAME:'.$name;
	$lines[]='X-WR-CALDESC:'.$description;
	$lines[]='CALSCALE:GREGORIAN';
	$lines[]='METHOD:PUBLISH';
	$c=0;
	foreach ($events as $k => $e) {
		#if($c<4){
			$e['description']=str_replace('&nbsp;', ' ', strip_tags($e['description']));
			$e['title']=$e['name'];
			$e['location']='The Riverside';
			if(isset($e['canceled'])){
				$e['description']='[CANCELED] '.$e['description'];
				$e['title']='[CANCELED] '.$e['title'];
			}
			$e['link']='https://app.'.phi::$conf['domain'].'?path=/event/'.$e['id'];
			$e['filename']=strtolower(preg_replace('/[^A-Za-z0-9_\-]/', '_', $e['title'])).'.ics';
			$lines[]=ics::returnEvent($e);
			$c++;
		#}
	}
	$lines[]='END:VCALENDAR';
	echo implode("\r\n", $lines);
	die();
?>