<?php
	#if(!isset($_REQUEST['debug'])) die(json_encode(array('error'=>'api_maintainance')));
	error_reporting(E_ALL);
	if(!is_file('/var/www/priv/config.json')) die('invalid config.json');
	$conf=json_decode(file_get_contents('/var/www/priv/config.json'),1);
	date_default_timezone_set('UTC');//ensure its UTC time!
	// if(isset($_SERVER['REQUEST_URI'])&&strpos($_SERVER['REQUEST_URI'], '/.well-known/acme-challenge')!==false){
	// 	//die('here');
	// 	$file=$_SERVER['DOCUMENT_ROOT'].$_SERVER['REQUEST_URI'];
	// 	if(is_file($file)){
	// 		die(file_get_contents($file));
	// 	}else{
	// 		die('invalid_conf');
	// 	}
	// }
	/*Global groupup variables*/
	//SETS GLOBAL ENV VAR
	define('HOME',$conf['home']);
	define('CDN',1);
	define('DB',$conf['dbname']);
	define('DB_FORCE_REMOTE',0);
	//define('FONT_NAME',"Montserrat");
	//define('FONT_URL',"https://fonts.googleapis.com/css?family=Montserrat:400,500,600");
	define('FONT_NAME',"Roboto");
	define('FONT_URL',"https://fonts.googleapis.com/css?family=Roboto:400,500,600&display=swap");
	// define('FONT_NAME',"Comfortaa");
	// define('FONT_URL',"https://fonts.googleapis.com/css?family=Comfortaa:400,500,600&display=swap");
	define('ROOT',$conf['home'].'/'.$conf['project']);
	$conf['root']=ROOT;
	$nointernet=0;
	include(ROOT.'/classes/phi.php');
	$conf['waivers']=array(
		'covid'=>2,
		'liability'=>1,
		'media'=>1
	);
	phi::$conf=$conf;
	define('GAME_ENABLED',1);
	define('TEST_GAME_NOTIFICATIONS',0);
	//local db
	//include(ROOT.'/classes/db.php');
	//Atlas DBa
	include(ROOT.'/classes/db2.php');
	include_once(ROOT.'/vendor/autoload.php');
	/*PHP Stuff*/
	ini_set('display_errors', 'on');
	define('AUTH_SALT',phi::$conf['auth_salt']);
	define('FORCE_COMBINE',0);//used for dev testing
	if(!$conf['prod']) define('FORCE_PRODUCTION_CONF',0);//used for dev testing of loader
	else define('FORCE_PRODUCTION_CONF',0);//used for dev testing of loader
	define('ADMIN_UID','UIAMPLAYER1');
	define('NOINTERNET',0);//used for dev testing
	define('TESTMODE',1);//used for email
	/*Temporary stuff*/
	function myErrorHandler($errno, $errstr, $errfile, $errline,$context){
	    if (!(error_reporting() & $errno)) {
	        // This error code is not included in error_reporting
	        return;
	    }
	    $error=false;
	    $errfile=str_replace(ROOT, '', $errfile);
	    switch ($errno) {
		    case E_USER_ERROR:
		       	$msg="$errstr FATAL ERROR on line $errline in file $errfile";
		        $error=true;
		        $type='php_error';
		    break;
		    case E_USER_WARNING:
		       	$msg="$errstr  warning on line $errline in file $errfile";
		       	$type='php_warning';
		    case E_USER_NOTICE:
		       	$msg="$errstr  warning on line $errline in file $errfile";
		       	$type='php_notice';
		    break;
		    default:
		        $msg="$errstr on line $errline in file $errfile";
		        $type='php_warning';
		    break;
		 }
		 ob_start(); 
        debug_print_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS); 
        $trace = ob_get_contents(); 
        ob_end_clean(); 

        // // Remove first item from backtrace as it's this function which 
        // // is redundant. 
        $trace = preg_replace ('/^#0\s+' . __FUNCTION__ . "[^\n]*\n/", '', $trace, 1); 
        $trace=nl2br($trace);//add right line breaks
		 $msg='<div class="php_error_message">'.$msg.'</div>'.
		 '<div class="backtraceheader">Backtrace</div>'.
		 '<div class="backtrace">'.$trace.'</div>'.
		 '<div class="backtraceheader">Request</div>'.
		 '<div class="request"><a href="'.phi::getReplayUrl().'" target="_blank">'.phi::makeUrl().'</a></div>';
		// '<div class="backtraceheader">Request Data</div>'.
		// '<div>'.json_encode(phi::getQS()).'</div>';//adds in stack trace
		//'<div><a href="'.phi::getReplayUrl().'" target="_blank">Replay Request</a></div>';//adds in stack trace
		 //store in DB
		 phi::log($msg,$type,$error);
	    /* Don't execute PHP internal error handler in prod or in api - supress warnings but allow errors*/
	    return true;//dont ever write, we have proper haneling now...
	    // if(($errfile=='/api/api.php'&&$type!='php_error')) return true;//(null !==PROD)??
	    // else return false;
	}
	set_error_handler("myErrorHandler");
	//add in authorization headers if set!
?>