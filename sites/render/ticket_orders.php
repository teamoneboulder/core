<?php
	$r=API::parseRequest();
	if(!isset($r['path'][2])) die('invalid_ticket');
	if(!isset($r['qs']['token'])||$r['qs']['token']!=phi::$conf['admin_token']) die('invalid_auth');
	$event_id=$r['path'][2];
	db2::findOne(DB,'event',array('id'=>$event_id));
	include_once(ROOT.'/api/class/event.php');
	include_once(ROOT.'/sites/one_core/one_core.api');
	$data=EVENT::orders(array(
		'auth'=>array(
			'scope'=>'*'
		),
		'qs'=>array(
			'max'=>'none',//speical key
			'sort'=>'name'
		)
	),$event_id);
	#die(json_encode($data));
	$url='https://code.'.phi::$conf['domain'].'/render/render.js';
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
		    window.modules={}
		    modules.event_global={
			    getEventTicketList:function(data){
			        var ret={
			            order:[],
			            list:{}
			        }
			        $.each(data.tickets,function(i,v){
			            if(ret.order.indexOf(v)==-1){
			                ret.order.push(v);
			                ret.list[v]={
			                    count:0,
			                    ticket:data.ticket_info[v]
			                }
			            }
			            ret.list[v].count++;
			        });
			        return ret;
			    }
			}
			window._resp=JSON.parse(atob('<?php echo base64_encode(json_encode($data));?>'));
			window._templates='<?php echo phi::miniFile(ROOT,["/sites/render/ticket_orders.templates"]);?>';
			function onload(){
				$.fn.render.loadTemplates(window._templates);
				function createPages(ele,rowclass){
					var h=0;
					var mh=92*7;
					var pages={};
					var cp=0;
					pages[cp]={
						height:0,
						start:0
					}
					var ei=0;
					$.each(ele.find(rowclass),function(i,v){
						var ch=$(v).outerHeight();
						var nh=pages[cp].height+ch;
						if(nh<mh){
							pages[cp].height=nh;
						}else{//start new page and cap last one!
							pages[cp].end=i-1;
							cp++;
							pages[cp]={
								start:i,
								height:ch
							};
						}
						$(v).addClass('page_'+cp);
						ei=i;
					});
					//ensure end capped!
					pages[cp].end=ei;
					for (var index in pages){
						var page=pages[index];
						ele.find('.page_'+index).wrapAll('<div class="page"></div>');
					}
				}
				$('#pages').render({
					template:'ticket_orders',
					data:{
						resp:window._resp,
						nonrefunded:true
					},
					binding:function(ele){
						//add page breaks
						createPages(ele,'.item');
						$('#pages').render({
							template:'ticket_orders',
							data:{
								resp:window._resp,
								nonrefunded:false
							},
							binding:function(ele){
								createPages(ele,'.item');
							}
						});
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