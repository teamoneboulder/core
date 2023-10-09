<?php
	$root=getenv('ROOT');
	include_once($root.'/classes/settings.php');
	include_once($root.'/classes/admin.php');
	ADMIN_API::cliApi();
?>