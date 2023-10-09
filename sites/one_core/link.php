<?php
$conf=json_decode(file_get_contents('/var/www/priv/config.json'),1);
include_once('/var/www/'.$conf['project'].'/classes/settings.php');  
include_once('/var/www/'.$conf['project'].'/api/api.php');  
include_once('/var/www/'.$conf['project'].'/api/app.php');  
$r=API::parseRequest();
$scheme=APP::getScheme($r['qs']['app']);
if(!$scheme) phi::die404();
$link=$scheme.':/'.$r['qs']['path'];
#die($link);
?>
<html>
	<head>
		<style>
			/* Large Corner radius */
			.l-corner-all, .l-corner-top, .l-corner-left, .l-corner-tl { -moz-border-radius-topleft: 10px; -webkit-border-top-left-radius: 10px; -khtml-border-top-left-radius: 10px; border-top-left-radius: 10px; }
			.l-corner-all, .l-corner-top, .l-corner-right, .l-corner-tr { -moz-border-radius-topright: 10px; -webkit-border-top-right-radius: 10px; -khtml-border-top-right-radius: 10px; border-top-right-radius: 10px; }
			.l-corner-all, .l-corner-bottom, .l-corner-left, .l-corner-bl { -moz-border-radius-bottomleft: 10px; -webkit-border-bottom-left-radius: 10px; -khtml-border-bottom-left-radius: 10px; border-bottom-left-radius: 10px; }
			.l-corner-all, .l-corner-bottom, .l-corner-right, .l-corner-br { -moz-border-radius-bottomright: 10px; -webkit-border-bottom-right-radius: 10px; -khtml-border-bottom-right-radius: 10px; border-bottom-right-radius: 10px; }
			/* Medium Corner radius */
			.m-corner-all, .m-corner-top, .m-corner-left, .m-corner-tl { -moz-border-radius-topleft: 7px; -webkit-border-top-left-radius: 7px; -khtml-border-top-left-radius: 7px; border-top-left-radius: 7px; }
			.m-corner-all, .m-corner-top, .m-corner-right, .m-corner-tr { -moz-border-radius-topright: 7px; -webkit-border-top-right-radius: 7px; -khtml-border-top-right-radius: 7px; border-top-right-radius: 7px; }
			.m-corner-all, .m-corner-bottom, .m-corner-left, .m-corner-bl { -moz-border-radius-bottomleft: 7px; -webkit-border-bottom-left-radius: 7px; -khtml-border-bottom-left-radius: 7px; border-bottom-left-radius: 7px; }
			.m-corner-all, .m-corner-bottom, .m-corner-right, .m-corner-br { -moz-border-radius-bottomright: 7px; -webkit-border-bottom-right-radius: 7px; -khtml-border-bottom-right-radius: 7px; border-bottom-right-radius: 7px; }
			/* Small Corner radius */
			.s-corner-all, .s-corner-top, .s-corner-left, .s-corner-tl { -moz-border-radius-topleft: 4px; -webkit-border-top-left-radius: 4px; -khtml-border-top-left-radius: 4px; border-top-left-radius: 4px; }
			.s-corner-all, .s-corner-top, .s-corner-right, .s-corner-tr { -moz-border-radius-topright: 4px; -webkit-border-top-right-radius: 4px; -khtml-border-top-right-radius: 4px; border-top-right-radius: 4px; }
			.s-corner-all, .s-corner-bottom, .s-corner-left, .s-corner-bl { -moz-border-radius-bottomleft: 4px; -webkit-border-bottom-left-radius: 4px; -khtml-border-bottom-left-radius: 4px; border-bottom-left-radius: 4px; }
			.s-corner-all, .s-corner-bottom, .s-corner-right, .s-corner-br { -moz-border-radius-bottomright: 4px; -webkit-border-bottom-right-radius: 4px; -khtml-border-bottom-right-radius: 4px; border-bottom-right-radius: 4px; }
			.unround{
			  -moz-border-radius-topleft: 0px; -webkit-border-top-left-radius: 0px; -khtml-border-top-left-radius: 0px; border-top-left-radius: 0px;
			  -moz-border-radius-topright: 0px; -webkit-border-top-right-radius: 0px; -khtml-border-top-right-radius: 0px; border-top-right-radius: 0px;
			  -moz-border-radius-bottomleft: 0px; -webkit-border-bottom-left-radius: 0px; -khtml-border-bottom-left-radius: 0px; border-bottom-left-radius: 0px;
			  -moz-border-radius-bottomright: 0px; -webkit-border-bottom-right-radius: 0px; -khtml-border-bottom-right-radius: 0px; border-bottom-right-radius: 0px;
			}
		</style>
		<script>
			function onLoad(){
				window.open('<?php echo $link;?>','_self')
			}
		</script>
	</head>
	<body onload="onLoad()">
		<div>
			<div style="display:inline-block;max-width:100%;width:400px;font-size:50px;padding:10px;border:1px solid #ccc;margin:5px auto;text-align: center;" onClick="window.open('<?php echo $link;?>','_self')" class="s-corner-all">View in the App</div>
		</div>
	</body>
</html>