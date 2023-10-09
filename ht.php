<?php
	$conf=json_decode(file_get_contents('/var/www/priv/config.json'),1);
    include_once('/var/www/'.$conf['project'].'/classes/settings.php');
    $file='/var/www/'.$conf['project'].'/_manage/tempdata/data.csv';
    $r=phi::loadCsvData(file_get_contents($file));
    foreach($r as $k=>$v){
    	//die($v['Unique Pageviews']);
    	if($v['Landing Page']){
    		$valid=1;
    		if(strpos($v['Landing Page'], '/signup')===false&&strpos($v['Landing Page'], 'masterclasses')) $valid=0;
    		if(strpos($v['Landing Page'], '/referral?')!==false) $valid=0;
    		if($valid){
	    		$urlp=explode('?', $v['Landing Page']);
	    		$urlp2=explode('&',$urlp[1]);
	    		$pp=explode('/',$urlp[0]);
	    		if($pp[1]=='masterclasses'){
	    			$page=$pp[2];
	    		}else{
	    			$page=$pp[1];
	    		}
	    		$affiliate=false;
	    		foreach($urlp2 as $tk=>$tv){
	    			$tp=explode('=',$tv);
	    			if($tp[0]=='affiliate'){
	    				$affiliate=$tp[1];
	    			}
	    		}
	    		if($affiliate){
	    			#phi::clog($affiliate.' '.$page. ' '.(int) str_replace(',','',$v['Unique Pageviews']));
	    			$affiliates[$affiliate][$page]+=(int) str_replace(',','',$v['Unique Pageviews']);
	    		}else{
	    			phi::clog('no affiliate found');
	    		}
	    		#die(json_encode($affiliates));
	    	}
    	}
    }
    $totals=0;
    foreach($affiliates as $k => $v){
    	$total=0;
    	foreach($v as $tk=>$tv){
    		$total+=$tv;
    		$data['totals'][$tk]+=$tv;
    		$data['total']+=$tv;
    	}
    	$affiliates[$k]['total']=$total;
    }
    //do percentages based on page
    $types=array_keys($data['totals']);
    foreach($affiliates as $k => $v){
    	foreach($types as $tk=>$tv){
    		if(isset($v[$tv])){
    			$data['percent'][$tv][$k]=ceil((($v[$tv]/$data['totals'][$tv])*100*100))/100;
    		}else{
    			$affiliates[$k][$tv]=0;
    		}
    	}
    	$data['percentTotal'][$k]=ceil(($v['total']/$data['total'])*100*100)/100;
    }
    $data['affilateCount']=sizeof($affiliates);
    $data['affiliates']=$affiliates;
    //structure data for CSV!
    $headers=array_values(array_diff($types, ['total']));
    array_unshift($headers, 'percent');
    array_unshift($headers, 'total');
    array_unshift($headers, 'affiliate');
    $save[]=$headers;
    foreach($affiliates as $k=>$v){
    	$row=[];
    	foreach($headers as $tk => $tv){
    		if($tk==0){
    			$row[]=$k;
    		}else if(isset($v[$tv])){
    			$row[]=$v[$tv];
    		}else if($tv=='percent'){
    			$row[]=(isset($data['percentTotal'][$k]))?$data['percentTotal'][$k]:0;
    		}else{
    			$row[]=0;
    		}
    	}
    	$save[]=$row;
    }
    phi::exportCSV($save,ROOT.'/_manage/tempdata/affiliates.csv',1);
    phi::clog('saved CSV!');
    //make into CSV to import into Sheet!
   # die(json_encode($data,JSON_PRETTY_PRINT));

?>	