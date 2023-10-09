<?php
	//load templates
	include_once('/var/www/nectar/classes/settings.php');
	// $templates=phi::miniFile(getcwd(),array('/nectar.templates'));
	$isdev=(phi::$conf['prod'])?0:1;
  $path2='https://code.'.$conf['domain'].'/js';
?>

<html>
	<head>
		<meta id="viewport" name="viewport" content="width=device-width, minimal-ui, initial-scale=1.0, maximum-scale=1.0,user-scalable=no">
		<title>Nectar Admin</title>
		<link rel="icon" type="image/png" href="https://groot.s3.amazonaws.com/sites/nectar/favicon.png">
    	<script src="/dist/core.js?ver=3"></script>
	    <script src="<?php echo $path2;?>/loader.js?ver=1"></script>
	   	<script>
			window.app_conf={"id":"one_admin","theme_color":"000000","splashtext":"Nectar","appid":"33ee6d44c844xx9765d9220619ae8c152f","version":"4.0.0","api":"api.<?php echo phi::$conf['domain'];?>","app_identifier":"me.groupup.nectar.dev","isdev":<?php echo (phi::$conf['prod'])?1:0?>,"protocol":"https://"};
			window.isDev=parseInt('<?php echo ($isdev)?1:0;?>',10);
		</script>
		<style id="themecss"></style>
		<style>
		/*--------------------------------------------------------------
	Preloader
--------------------------------------------------------------*/
.page-loader {
  position: fixed;
  background: white;
  bottom: 0;
  right: 0;
  left: 0;
  top: 0;
  z-index: 9998;
}

.loader {
  position: absolute;
  border-left: 2px solid #000;
  border-top: 2px solid rgba(0, 0, 0, 0.2);
  border-right: 2px solid rgba(0, 0, 0, 0.2);
  border-bottom: 2px solid rgba(0, 0, 0, 0.2);
  height: 46px;
  width: 46px;
  left: 50%;
  top: 50%;
  margin: -23px 0 0 -23px;
  text-indent: -9999em;
  font-size: 10px;
  z-index: 9999;
  -webkit-animation: load 0.8s infinite linear;
  -moz-animation: load 0.8s infinite linear;
  ms-animation: load 0.8s infinite linear;
  o-animation: load 0.8s infinite linear;
  animation: load 0.8s infinite linear;
}

.loader,
.loader:after {
  border-radius: 50%;
  width: 46px;
  height: 46px;
}

@-webkit-keyframes load {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

@keyframes load {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

		</style>
    <link href="/dist/core.css?ver=1" rel="stylesheet" type="text/css">
    <link href="/dist/animate.css?ver=1" rel="stylesheet" type="text/css">
	</head>
	<body>
		<div class="page-loader transition">
	       <div class="loader">Loading...</div>
	    </div>
		<div class="sfit" id="wrapper"></div>
    <div id="growlarea" style="position:absolute;bottom:10px;left:10px;z-index:10000"></div>
	</body>
</html>