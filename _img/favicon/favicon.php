<?php
if(!isset($_REQUEST['src'])) die('invalid src');
$img=$_REQUEST['src'];
$count=(isset($_REQUEST['count']))?(int) $_REQUEST['count']:0;
if($count>99) $count='99<sup>+</sup>';
?>
<!DOCTYPE html> 
<html style="padding:0px;margin:0px;"> 
	<head> 
		<style>
			/* XLarge Corner radius */
			.m-corner-all, .m-corner-top, .m-corner-left, .m-corner-tl { -moz-border-radius-topleft: 7px; -webkit-border-top-left-radius: 7px; -khtml-border-top-left-radius: 7px; border-top-left-radius: 7px; }
			.m-corner-all, .m-corner-top, .m-corner-right, .m-corner-tr { -moz-border-radius-topright: 7px; -webkit-border-top-right-radius: 7px; -khtml-border-top-right-radius: 7px; border-top-right-radius: 7px; }
			.m-corner-all, .m-corner-bottom, .m-corner-left, .m-corner-bl { -moz-border-radius-bottomleft: 7px; -webkit-border-bottom-left-radius: 7px; -khtml-border-bottom-left-radius: 7px; border-bottom-left-radius: 7px; }
			.m-corner-all, .m-corner-bottom, .m-corner-right, .m-corner-br { -moz-border-radius-bottomright: 7px; -webkit-border-bottom-right-radius: 7px; -khtml-border-bottom-right-radius: 7px; border-bottom-right-radius: 7px; }
			.coverimg{
			  background-repeat:no-repeat;
			    -webkit-background-size: cover;
			    -moz-background-size: cover;
			    -o-background-size: cover;
			    background-size: cover;
			  background-position:center;
			}
			.circle{
		      -moz-border-radius-topleft: 50% !important; -webkit-border-top-left-radius: 50% !important; -khtml-border-top-left-radius: 50% !important; border-top-left-radius: 50% !important;
		      -moz-border-radius-topright: 50% !important; -webkit-border-top-right-radius: 50% !important; -khtml-border-top-right-radius: 50% !important; border-top-right-radius: 50% !important;
		      -moz-border-radius-bottomleft: 50% !important; -webkit-border-bottom-left-radius: 50% !important; -khtml-border-bottom-left-radius: 50% !important; border-bottom-left-radius: 50% !important;
		      -moz-border-radius-bottomright: 50% !important; -webkit-border-bottom-right-radius: 50% !important; -khtml-border-bottom-right-radius: 50% !important; border-bottom-right-radius: 50% !important;
		  }
		</style>
	</head>
	<body style="padding:0px;margin:0px;">
		<div style="position:relative;background:white;position:relative;width:100px;height:100px;" class="m-corner-all">
	        <img src="<?php echo $img?>" style="width:100%;height:100%;display:inline-block;vertical-align:middle;" class="m-corner-all">
	        <img src="data:image/png;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" style="margin-left:-4px;width:1px;height:100%;display:inline-block;vertical-align:middle" alt=""/>
	        <?php if($count){ ?>
	        <div style="width:100px;height:100px;position: absolute;top:0px;right:0px;background:#f09;" class="m-corner-all">
	        	<table style="width:100%;height:100%;text-align: center;color:white;font-size:65px;font-size:bold">
	        		<tr>
	        			<td>
	        				<?php echo $count;?>
	        			</td>
	        		</tr>
	        	</table>
	        </div>
	    <?php }?>
		</div>
	</body>
</html>