<?php
	#phi::log('ticket page Load!');
	$r=API::parseRequest();
	if(!isset($r['path'][2])) die('invalid_ticket');
	if(!isset($r['qs']['token'])||$r['qs']['token']!=phi::$conf['admin_token']) die('invalid_auth');
	$receipt_id=$r['path'][2];
	$data=db2::findOne(DB,'ticket_receipt',array('id'=>$receipt_id));
	$tickets=db2::toOrderedList(db2::find(DB,'event_ticket',array('id'=>array('$in'=>$data['ticket_ids']))));
	//graph on ticket info!
	$tickets=db2::graph(DB,$tickets,array(
		'ticket'=>array(
			'coll'=>'ticket',
			'to'=>'ticket_info',
			'match'=>'id'
		),
		'event'=>array(
			'coll'=>'event',
			'to'=>'event_info',
			'match'=>'id'
		)
	));
	foreach ($tickets['list'] as $k => $v) {
		//die(json_encode($tickets['list'][$k]['event_info']));
		$tickets['list'][$k]['event_info']['prettyDate']=phi::formatTime($v['event_info']['start'],'event',(isset($v['event_info']['end']))?$v['event_info']['end']:false,(isset($v['event_info']['timezone']))?$v['event_info']['timezone']:'America/Denver');
	}
	$url='https://code.'.phi::$conf['domain'].'/render/render.js';
	foreach ($tickets['list'] as $k => $v) {
		$tdata='action~'.base64_encode(json_encode([
			'action'=>'event_ticket_checkin',
			'event'=>$v['event'],
			'ticket'=>$v['id']
		]));
		$tickets['list'][$k]['qr']='https://img.'.phi::$conf['domain'].'/qr?content='.$tdata;
	}
	#die(json_encode($tickets));
?>
<html>
	<head>
		<style>
			html,body{
				margin:0px;
				padding:0px;
			}
			.page{
				-webkit-box-sizing: border-box; /* Safari/Chrome, other WebKit */
				  -moz-box-sizing: border-box;    /* Firefox, other Gecko */
				  box-sizing: border-box;         /* Opera/IE 8+ */
				width:5in;
    			height:7in;
			  	/*min-height: 29.7cm;*/
			  	margin:0px auto;
			  	background: white;
			  	page-break-after:always;
			}
			.coverimg{
			  background-repeat:no-repeat;
			    -webkit-background-size: cover;
			    -moz-background-size: cover;
			    -o-background-size: cover;
			    background-size: cover;
			  background-position:center;
			}
		</style>
		<script src="<?php echo $url; ?>"></script>
		<script>
			function stripslashes(str) {
		      return (str + '')
		        .replace(/\\(.?)/g, function(s, n1) {
		          switch (n1) {
		            case '\\':
		              return '\\';
		            case '0':
		              return '\u0000';
		            case '':
		              return '';
		            default:
		              return n1;
		          }
		        });
		    }
			window.tickets=JSON.parse(atob('<?php echo base64_encode(json_encode($tickets));?>'));
			window._templates='<?php echo phi::miniFile(ROOT,["/sites/render/ticket.templates"]);?>';
			function onload(){
				console.log('⚠️⚠️⚠️')
				$.fn.render.loadTemplates(window._templates);
				$('#pages').render({
					template:'tickets',
					data:{
						tickets:window.tickets
					}
				});
				setTimeout(function(){
					window._loaded=1;
				},100);
			}
		</script>
	</head>
	<body onload="onload()" id="pages">

	</body>
</html>