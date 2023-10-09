<?php
$widget='742ff184-dd5a-4f9d-ab2a-45a1bdbcfe96';
$url='https://apps.elfsight.com/p/boot/?page=https%3A%2F%2Fwww.humanitysteam.org%2Fevent-schedule&w='.$widget;
$data=json_decode(file_get_contents($url),1);
$ct=(time()-(60*60*24));
foreach($data['data']['widgets'][$widget]['data']['settings']['events'] as $k=>$v){
	if($v['start']>($ct*1000)&&$v['repeatPeriod']=='noRepeat'){
		$tosort[]=$v;
	}
	if($v['repeatPeriod']=='weeklyOn'){
		$time  = new DateTime;
		$time->setTimestamp($v['start']/1000);
		$c=0;
		$diff=$v['end']-$v['start'];
		while($c<50){
			$time->modify('+ 1 week');
			$ts=(int) $time->format('U');
			$times[]=$ts;
			if($ts>$ct){
				$v['start']=$ts*1000;
				$v['end']=($ts*1000)+$diff;
				$tosort[]=$v;
			}
			$c++;
		}
	}
}
$sorted=phi::sort($tosort,['key'=>'start','type'=>'number']);
//die(json_encode($sorted));
$data['data']['widgets'][$widget]['data']['settings']['events']=$sorted;
$renderurl='https://code.'.phi::$conf['domain'].'/render/render.js';
$moment='https://code.'.phi::$conf['domain'].'/js/moment.js';
$moment2='https://code.'.phi::$conf['domain'].'/module/moment/moment.js';
$corecss='https://code.'.phi::$conf['domain'].'/css/core.css';
?>
<html style="margin:0;padding:0;">
	<head>
		<link href="<?php echo $corecss; ?>" rel="stylesheet"></link>
		<script src="<?php echo $renderurl; ?>"></script>
		<script src="<?php echo $moment; ?>"></script>
		<script src="<?php echo $moment2; ?>"></script>
		<style>
			.shadow_text{
				text-shadow: 2px 2px 2px #000000;
			}
		</style>
		<script>
			window.onPageReady=function(){
				console.log(window.data.data.widgets[widget].data.settings.events)
				console.log(modules.moment)
				$.fn.render.loadTemplates(window._templates);
				//setTimeout(function(){
					$('body').render({
						template:'page',
						append:false,
						data:{
							events:window.data.data.widgets[widget].data.settings.events
						}
					});
				//},5000)	
			}
			window.widget='<?php echo $widget;?>';
			window._templates='<?php echo phi::miniFile(ROOT,["/sites/render/ht.templates"]);?>';
			window.data=JSON.parse(atob('<?php echo base64_encode(json_encode($data));?>'));
		</script>
	</head>
	<body onload="onPageReady()" style="margin:0;padding:0;">
		Loading...
	</body>
</html>