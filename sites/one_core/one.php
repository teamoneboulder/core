<?php
    $conf=json_decode(file_get_contents('/var/www/priv/config.json'),1);
    include_once('/var/www/'.$conf['project'].'/classes/settings.php');
    include_once('/var/www/'.$conf['project'].'/api/api.php');
    include_once('/var/www/'.$conf['project'].'/sites/one_core/one_core.api');
    if(strpos($_SERVER['REQUEST_URI'], '/favicon.ico')!==false){
        die('favicon.ico');
        //die(file_get_contents(filename));
    }
    $appid='one_boulder_core';
	$flower_id='one';
    //this code is for updating the redirect because of the data loss, add new mappings to the $mapping array to automatically redirect
    if(isset($_SERVER['REQUEST_URI'])){
        $mapping=[
            'E7JCRL64VIGKP'=>'E1LQCK4MTGRNX',
            'EHY28NKB0D9PQ'=>'EZ69Y3Q2AFHGS',
            'EQ4YPBVCKI6J8'=>'ELOZ0MX8D6BNV',
            'EJTNUEAC12D4B'=>'EJKI5LDMWF8Q0',
            'EPVWK492THYJI'=>'EWBMAUQSXRJ1Z',
            'E35VAGWPS8YIO'=>'EBMT1REQV4AUO'
        ];
        foreach($mapping as $k=>$v){
            if(strpos($_SERVER['REQUEST_URI'], $k)!==false){
                $newurl='https://app.oneboulder.one/event/'.$v;
                phi::redir($newurl);
            }
        }
        $d=parse_url($_SERVER['REQUEST_URI']);
        if(isset($d['query'])){
            $qp=explode('&', $d['query']);
            foreach ($qp as $k => $v) {
                $dp=explode('=', $v);
                $qs[$dp[0]]=$dp[1];
            }
        }
    }
    if(isset($qs['core'])) $appid=$qs['core'];
    if(isset($qs['flower_id'])) $flower_id=$qs['flower_id'];
    $r=API::parseRequest();
    $loginas=false;
      $tpath=explode('/', $_SERVER['REQUEST_URI']);
      if(isset($tpath[1])&&$tpath[1]=='loginas'){
        $auth=db2::findOne(phi::$conf['dbname'],'temp_login',array('login'=>$tpath[2]));
        if($auth){
          //generate a token!
          $token=phi::registerToApp($auth['id'],'2366d44c84409765d9a00619aea4c1234');
          $loginas=$token['id'];
          //db2::remove('nectar','temp_login',array('login'=>$path[2]));
        }
      } 
      if(isset($tpath[2])){
        if(strtoupper($tpath[2])!=$tpath[2]){
            if(strpos($_SERVER['HTTP_USER_AGENT'], 'facebook')!==false){
                //phi::log('redir lower case');
                #phi::log('request');
                phi::redir('https://'.$_SERVER['HTTP_HOST'].str_replace($tpath[2], strtoupper($tpath[2]), $_SERVER['REQUEST_URI']));
            }
        }
      }
      //$splash=ONE_CORE::getRandomSplash('web');
      $splash=false;
      phi::$metadata=phi::getUrlInfo($r,1);
      if(phi::$metadata&&isset(phi::$metadata['metadata']['url'])){//dont do if logged in, takes too long
        $metadata=phi::$metadata['metadata'];
      }else{
        $metadata=array(
          'url'=>'https://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'],
          'title'=>'Join us on ONE|Boulder',
          'description'=>'Building Regenerative Culture and Thriving Together',
          'image'=>'https://s3.amazonaws.com/one-light/static/one_boulder_splash.jpg'
        );
  }
  if(strpos($_SERVER['REQUEST_URI'], 'apptexteditor')!==false){
    $editor=1;
  }else{
    $editor=0;
  }
#die(json_encode($metadata));
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<!--[if lt IE 7 ]> <html class="badie" xmlns="http://www.w3.org/1999/xhtml"> <![endif]-->
<!--[if IE 7 ]>    <html class="badie" xmlns="http://www.w3.org/1999/xhtml"> <![endif]-->
<!--[if IE 8 ]>    <html class="badie" xmlns="http://www.w3.org/1999/xhtml"> <![endif]-->
<!--[if IE 9 ]>    <html class="ie9" xmlns="http://www.w3.org/1999/xhtml"> <![endif]-->
<!--[if (gt IE 9)|!(IE)]><!--> <html xmlns="http://www.w3.org/1999/xhtml"> <!--<![endif]-->
  <head> 
    <meta name="format-detection" content="telephone=no" />
    <meta id="viewport" name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover,height=device-height">
    <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
    <meta name="referrer" content="no-referrer" />
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Mobile App</title> 
    <meta id="viewport" name="viewport" content="width=device-width, minimal-ui, initial-scale=1.0, maximum-scale=1.0,user-scalable=no">
    <style id="themecss">
    </style>
    <script id="dynamicJS">
    </script>
    <meta property="og:type" content="website"/>
    <meta property="og:url" content="<?php echo $metadata['url']; ?>"/>
    <meta property="og:title" content="<?php echo $metadata['title']; ?>"/>
    <meta property="og:description" content="<?php echo $metadata['description']; ?>"/>
    <meta property="og:image" content="<?php echo $metadata['image']; ?>"/>
    <link href="/dist/font/coreicons.css" rel="stylesheet" type="text/css">
    <style type="text/css">
        html,body{
            width:100%;
            height:100%;
            position: relative;
            margin:0;
            padding:0;
        }
        .sfit{
            position: absolute;top:0;left:0;right:0;bottom:0;
        }
        .fitimg{
          background-repeat:no-repeat;
            -webkit-background-size: contain;
            -moz-background-size: contain;
            -o-background-size: contain;
            background-size: contain;
          background-position:center;
        }
        .containimg{
          background-repeat:no-repeat;
            -webkit-background-size: contain;
            -moz-background-size: contain;
            -o-background-size: contain;
            background-size: contain;
          background-position:center;
        }
        .coverimg{
          background-repeat:no-repeat;
            -webkit-background-size: cover;
            -moz-background-size: cover;
            -o-background-size: cover;
            background-size: cover;
          background-position:center;
        }
       @keyframes kenburns {
            0% {
              transform: scale3d(1, 1, 1) translate3d(0px, 0px, 0px);
            }
            20% {
                transform: scale3d(.95, .95, .95) translate3d(-10px, -10px, 0px);
                animation-timing-function: ease-in;
            }
            30% {
                transform: scale3d(.9, .9, .9) translate3d(0px, -15px, 0px);
                animation-timing-function: ease-in;
            }
            40% {
                transform: scale3d(.95, .95, .95) translate3d(10px, -10px, 0px);
                animation-timing-function: ease-in;
            }
            50% {
                transform: scale3d(.9, .9, .9) translate3d(15px, 0px, 0px);
                animation-timing-function: ease-in;
            }
            60% {
                transform: scale3d(.95, .95, .95) translate3d(10px, 10px, 0px);
                animation-timing-function: ease-in;
            },
            70% {
                transform: scale3d(.9, .9, .9) translate3d(0px,15px, 0px);
                animation-timing-function: ease-in;
            }
            80% {
                transform: scale3d(.95, .95, .95) translate3d(-10px, 10px, 0px);
                animation-timing-function: ease-in;
            }
            100% {
                transform: scale3d(1, 1, 1) translate3d(0px, 0px, 0px);
            }
        }
        .kenburns {
          animation: kenburns 30s infinite;
        }
        .infinity-loader {
  position: fixed; /*We have to use it as we are using absolute positioning on its children and we will align it in the center of the page*/
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  /*yes, we have to define width and height, otherwise transformation won't work*/
  width: 130px; /* 2 x width - border-width */
  height: 70px; /* width */
}

.infinity-loader .bg div,
.infinity-loader > .fg > div > div {
  width: 70px; /* width */
  height: 70px; /* width */
  border: 10px solid #aaa; /* border-width solid #aaa */
  box-sizing: border-box; /* so that its border won't increase its width*/
  border-radius: 50%; /* to make the div round*/
  position: absolute;
}

.infinity-loader .right-bg {
  transform: translate(100%, 0);
  left: -10px; /* -border-width */
}

.infinity-loader > .fg > div > div {
  border-color: #f02 #f02 transparent transparent;
  transform: rotate(135deg);
  animation: infinitespin 1s linear infinite; /* spin time linear infinite */
  position: static; /*add this otherwise transformation in its parent won't work as expect*/
}

.infinity-loader > .fg > div {
  clip: rect(0, 70px, 35px, 0); /* 0, width, width/2, 0*/
  position: absolute; /* required for using clip: rect() */
}

.infinity-loader > .fg > .bottom-right-rect {
  left: -10px; /* -border-width */
  transform: translateX(100%) scale(1, -1);
}

.infinity-loader > .fg > .bottom-right-rect > div {
  animation-delay: 0.25s; /* time/4 */
}

.infinity-loader > .fg > .top-right-rect {
  left: -10px; /* -border-width */
  transform: translateX(100%) scale(-1, 1);
}

.infinity-loader > .fg > .top-right-rect > div {
  animation-delay: 0.5s; /* (2 x time)/4 */
}

.infinity-loader > .fg > .bottom-left-rect {
  transform: scale(-1);
}

.infinity-loader > .fg > .bottom-left-rect > div {
  animation-delay: 0.75s; /* (3 x time)/4 */
}

.infinity-loader > .fg {
  filter: drop-shadow(0 0 6px orangered);
}

@keyframes infinitespin {
  50%,
  100% {
    transform: rotate(495deg);
  } /* (360 + 135)deg*/
}
    </style>
    <script>
      <?php
        echo file_get_contents(ROOT.'/sites/code/js/dexie.js');//indexdb access!
        echo file_get_contents(ROOT.'/sites/code/js/boot.js');
      ?>;
      window._pageLoadTime=new Date().getTime();
    window._editor=<?php echo $editor;?>;
    </script>
    <?php if($loginas){?>
    <script> window.temptoken='<?php echo $loginas;?>';</script>
    <?php }?>
</head> 
<body onload="onLoad()">
    <input type="text" style="position:absolute;top:-200px;width:100%;" name="regularinput" id="ghostinput">
    <input type="password" style="position:absolute;top:-200px;" id="ghostinput_password" name="regularinput">
    <div class="infinity-loader" id="splash">
       <div class="bg">
            <!--background circles-->
            <div class="left-bg"></div>
            <div class="right-bg"></div>
          </div>
          <div class="fg">
            <!--foreground circles-->
            <div class="top-left-rect">
              <div></div>
            </div>
            <div class="bottom-right-rect">
              <div></div>
            </div>
            <div class="top-right-rect">
              <div></div>
            </div>
            <div class="bottom-left-rect">
              <div></div>
            </div>
          </div>
    </div>
    <!-- <div id="splash" class="sfit" style="z-index: 2">
        <div id="splashlogo" class="coverimg sfit" style="top:-80px;right:-80px;bottom:-80px;left:-80px;<?php if($splash){?>background-image:url(<?php echo $splash['src']?>);<?php }else{?>background-image:url(dist/default_splash.jpg)<?php }?>"></div>
    </div> -->
    <div id="appalert" style="display:none;z-index: 3;position: absolute;top:0;left:0;right:0;"></div>
    <div id="appfreeze" style="display:none;z-index: 2;position: absolute;top:0;left:0;right:0;bottom:0;">
        <div class="simplemodal m-corner-all" style="margin-top:-150px;">
            <div id="freezemodalcontent">
                <i style="color:white;font-size:45px;display: none;" id="freezeicon"></i>
                <br/>
                <br/>
                    <span id="freezemaincallout">
                        
                    </span>
                <br/>
                <br/>
                    <span style="font-size:10px" id="freezesecondarycallout"></span>
                <br/>
                <br/>
                <br/>
                    <div>
                        <span class="btn" id="freezeretry"><i class="icon2-refresh" id="freeze_refresh_icon"></i> <span id="freezebutton"></span></span>
                    </div>
                    <div id="freezecontact">
                        <div>
                            <span><i class="icon2-mail" id="freeze_refresh_icon"></i> <span id="freezecontactbutton"></span></span>
                        </div>
                        <div id="freezecontacterror" style="padding-top:15px;display: none;"></div>
                    </div>
                    <div style="padding-top:30px;text-align: center;font-size:12px;padding-bottom:5px;" id="freezecontactemail"></div>
            </div>
        </div>
        <div style="position:absolute;bottom:0;left:0;right:0;text-align:center;padding-bottom:10px;height:150px" id="required_icon">
        </div>
    </div>
    <div id="iosheader"></div>
    <div id="wrapper" style="display:none;z-index: 1"></div>
    <script type="application/javascript">
        window.app_conf={"id":"<?php echo $appid;?>","appid":"2366d44c84409765d9a00619aea4c1234","flower_id":"<?php echo $flower_id;?>","theme_color":"983897","splashtext":"App","version":"5.0.4","api":"api.<?php echo $conf['domain'];?>","fb":{"id":"1207289179406547","name":"Nectar Developers (dev_tom)"},"app_scheme":"nectardevtom","app_identifier":"earth.phijs.one.devtom","isdev":1,"protocol":"https:\/\/","splash":null,"locs":{"en":{"need_help":"Need Help? ","freeze_bad_internet_title":"Connection Issue","freeze_bad_internet_main":"Internet Required","freeze_bad_internet_secondary":"Please check your internet connection and try again.","freeze_bad_app_load_main":"App Issue","freeze_bad_app_load_secondary":"Sorry, something went wrong while loading.  Please try again later.","freeze_bad_app_contact":"Send Bug Report","freeze_bad_app_submit":"Thanks!","freeze_bad_app_submit_error":"Error sending.  Please try again.","freeze_bad_app_sending":"Sending...","freeze_retry":"Retry"},"es":{"need_help":"Necesita Ayuda?","freeze_bad_internet_title":"Problema de conexi\u00f3n","freeze_bad_internet_main":"Se requiere Internet","freeze_bad_internet_secondary":"Compruebe la conexi\u00f3n a Internet e int\u00e9ntelo de nuevo.","freeze_bad_app_load_main":"Problema con la aplicaci\u00f3n","freeze_bad_app_load_secondary":"Lo sentimos, pero se ha producido un problema durante la carga.  Int\u00e9ntelo de nuevo m\u00e1s tarde.","freeze_bad_app_contact":"Enviar informe de error","freeze_bad_app_submit":"\u00a1Gracias!","freeze_bad_app_submit_error":"Error al enviar.  Int\u00e9ntelo de nuevo.","freeze_bad_app_sending":"Enviando...","freeze_retry":"Vuelve a intentarlo"},"fr":{"need_help":"Besoin d'aide\u00a0?","freeze_bad_internet_title":"Probl\u00e8me de connexion","freeze_bad_internet_main":"Internet requis","freeze_bad_internet_secondary":"Veuillez v\u00e9rifier votre connexion Internet et r\u00e9essayer.","freeze_bad_app_load_main":"Probl\u00e8me de l'application","freeze_bad_app_load_secondary":"D\u00e9sol\u00e9, un probl\u00e8me est survenu lors du chargement.  Veuillez r\u00e9essayer plus tard.","freeze_bad_app_contact":"Envoyer un rapport de bogue","freeze_bad_app_submit":"Merci !","freeze_bad_app_submit_error":"Erreur d'envoi.  Veuillez r\u00e9essayer.","freeze_bad_app_sending":"Envoi en cours...","freeze_retry":"R\u00e9essayer"},"pt":{"need_help":"Precisa de ajuda?","freeze_bad_internet_title":"Problema na liga\u00e7\u00e3o","freeze_bad_internet_main":"\u00c9 necess\u00e1ria uma liga\u00e7\u00e3o \u00e0 Internet","freeze_bad_internet_secondary":"Por favor, verifique a sua liga\u00e7\u00e3o \u00e0 Internet e tente de novo.","freeze_bad_app_load_main":"Problema na aplica\u00e7\u00e3o","freeze_bad_app_load_secondary":"Lamentamos, mas ocorreu um erro durante o carregamento. Por favor, tente de novo mais tarde.","freeze_bad_app_contact":"Enviar relat\u00f3rio de erros","freeze_bad_app_submit":"Obrigado!","freeze_bad_app_submit_error":"Ocorreu um erro ao enviar. Por favor, tente de novo.","freeze_bad_app_sending":"A enviar...","freeze_retry":"Tentar novamente"},"zh":{"need_help":"\u9700\u8981\u5e2e\u52a9\u5417\uff1f","freeze_bad_internet_title":"\u8fde\u63a5\u95ee\u9898","freeze_bad_internet_main":"\u9700\u8981\u7f51\u7edc","freeze_bad_internet_secondary":"\u8bf7\u67e5\u770b\u60a8\u7684\u7f51\u7edc\u8fde\u63a5\u5e76\u518d\u6b21\u5c1d\u8bd5","freeze_bad_app_load_main":"\u5e94\u7528\u95ee\u9898","freeze_bad_app_load_secondary":"\u62b1\u6b49\uff0c\u52a0\u8f7d\u65f6\u51fa\u73b0\u9519\u8bef\u3002\n\u8bf7\u7a0d\u540e\u518d\u6b21\u5c1d\u8bd5\u3002","freeze_bad_app_contact":"\u53d1\u9001\u6545\u969c\u62a5\u544a","freeze_bad_app_submit":"\u8c22\u8c22\uff01","freeze_bad_app_submit_error":"\u53d1\u9001\u9519\u8bef\u3002\u8bf7\u518d\u6b21\u5c1d\u8bd5\u3002","freeze_bad_app_sending":"\u53d1\u9001\u4e2d\u2026\u2026","freeze_retry":"\u91cd\u8bd5"},"de":{"need_help":"Brauchen Sie Hilfe?","freeze_bad_internet_title":"Verbindungsprobleme","freeze_bad_internet_main":"Internet erforderlich","freeze_bad_internet_secondary":"Bitte \u00fcberpr\u00fcfen Sie Ihre Internetverbindung und versuchen Sie es erneut.","freeze_bad_app_load_main":"Probleme mit der App","freeze_bad_app_load_secondary":"Entschuldigung, aber beim Laden ist etwas schiefgegangen.  Bitte versuchen Sie es sp\u00e4ter erneut.","freeze_bad_app_contact":"Fehlerbericht senden","freeze_bad_app_submit":"Danke!","freeze_bad_app_submit_error":"Fehler wird gesendet. Bitte versuchen Sie es erneut.","freeze_bad_app_sending":"Wird gesendet...","freeze_retry":"Erneut versuchen"}},"contact_email":null};
    </script>
    <script>
        window.onerror = function(message, url, lineNumber) {
            if(window.app_conf && window.app_conf.isdev) alert("Error: "+message+" in "+url+" at line "+lineNumber);
            console.log("Error: "+message+" in "+url+" at line "+lineNumber);
        }
        function onLoad(){
            window._bootloader=new window.bootloader();          
            window._bootloader.init();
        }      
    </script>
</body>
</html>
