<?php
$settings=json_decode($_REQUEST['opts'],1);
if(!$settings['bg']) $settings['bg']='white';
?>
<!DOCTYPE html> 
<html style="padding:0px;margin:0px;"> 
	<head> 
		<style>
			/* XLarge Corner radius */
			.xl-corner-all, .xl-corner-top, .xl-corner-left, .xl-corner-tl { -moz-border-radius-topleft: 7px; -webkit-border-top-left-radius: 15px; -khtml-border-top-left-radius: 15px; border-top-left-radius: 15px; }
			.xl-corner-all, .xl-corner-top, .xl-corner-right, .xl-corner-tr { -moz-border-radius-topright: 15px; -webkit-border-top-right-radius: 15px; -khtml-border-top-right-radius: 15px; border-top-right-radius: 15px; }
			.xl-corner-all, .xl-corner-bottom, .xl-corner-left, .xl-corner-bl { -moz-border-radius-bottomleft: 15px; -webkit-border-bottom-left-radius: 15px; -khtml-border-bottom-left-radius: 15px; border-bottom-left-radius: 15px; }
			.xl-corner-all, .xl-corner-bottom, .xl-corner-right, .xl-corner-br { -moz-border-radius-bottomright: 15px; -webkit-border-bottom-right-radius: 15px; -khtml-border-bottom-right-radius: 15px; border-bottom-right-radius: 15px; }
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
		</style>
	</head>
	<body style="padding:0px;margin:0px;">
		<div style="background:white;position:relative;width:<?php echo $settings['width'];?>px;height:<?php echo $settings['height'];?>px;background:<?php echo $settings['bg'];?>" <?php if(isset($settings['rounded'])){if($settings['width']>40){?>class="xl-corner-all"<?php }else{?>class="m-corner-all"<?php }}?>>
			<div class="coverimg" style="z-index:1;text-align:center;position:absolute;top:0;left:0;right:0;bottom:0;<?php if($settings['image_background']){?>background-image:url(<?php echo $settings['image_background']?>);<?php }?>">
		        <img src="<?php echo $settings['image'];?>" style="<?php if(isset($settings['fiticon'])&&$settings['fiticon']){?>width:100%;height:100%;<?php }else{?>max-width:90%;max-height:90%;<?php }?>display:inline-block;vertical-align:middle;">
		        <img src="data:image/png;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" style="margin-left:-4px;width:1px;height:100%;display:inline-block;vertical-align:middle" alt=""/>
		    </div>
		</div>
	</body>
</html>