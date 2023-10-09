<?php
	if(isset($_REQUEST['internal_ip'])){
		$ip=$_SERVER['SERVER_ADDR'];
	}else $ip='';
?>
<html>
	<head></head>
	<body>404!! [<?php echo $ip;?>]</body>
</html>