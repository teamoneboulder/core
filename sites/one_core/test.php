<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<!--[if lt IE 7 ]> <html class="badie" xmlns="http://www.w3.org/1999/xhtml"> <![endif]-->
<!--[if IE 7 ]>    <html class="badie" xmlns="http://www.w3.org/1999/xhtml"> <![endif]-->
<!--[if IE 8 ]>    <html class="badie" xmlns="http://www.w3.org/1999/xhtml"> <![endif]-->
<!--[if IE 9 ]>    <html class="ie9" xmlns="http://www.w3.org/1999/xhtml"> <![endif]-->
<!--[if (gt IE 9)|!(IE)]><!--> <html xmlns="http://www.w3.org/1999/xhtml"> <!--<![endif]-->
  <head> 
    <meta name="format-detection" content="telephone=no" />
    <meta id="viewport" name="viewport" content="width=device-width, minimal-ui, initial-scale=1.0, maximum-scale=1.0,user-scalable=no">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Mobile App</title> 
    <style id="themecss">
        .scrollY{
            overflow-x: hidden;
            overflow-y:scroll !important;
            -webkit-overflow-scrolling: touch;
        }
        .coverimg{
          background-repeat:no-repeat;
            -webkit-background-size: cover;
            -moz-background-size: cover;
            -o-background-size: cover;
            background-size: cover;
          background-position:center;
        }
        .frostedbg,.navheader{
            color:#555;
            backdrop-filter: blur(5px);
             -webkit-backdrop-filter: blur(5px);
             background:rgb(255, 255, 255,.8)
        }
    </style>
    <script id="dynamicJS">
    </script>
    <link href="dist/font/coreicons.css" rel="stylesheet" type="text/css">
    <link href="dist/css/core.css?v=<?php echo time();?>" rel="stylesheet" type="text/css">
    <script src="https://code.phijs.earth/js/jquery.1.12.4.js"></script>
    <script src="https://code.phijs.earth/js/chakras.js"></script>
    <script>
        var onLoad=function(){
            var c=0;
            while(c<=100){
                $('#content').append('<div class="m-corner-all coverimg" style="margin:5px 10px;width:70px;height:70px;background-image:url(https://one-light.s3.amazonaws.com/static/one_boulder_logo.jpg);position:relative;display: inline-block;"><div id="chakras_'+c+'" style="height:66px;width:10px;position: absolute;top:2px;left:-10px;" class=""></div></div>')
                if(c==42){
                     var chakrabody=new chakras($('#chakras_'+c),{
                        background:'transparent',
                        static:true,
                        equalDistribution:true,
                        chakras:{
                            crown:{
                                intensity:8
                            },
                            thirdeye:{
                                intensity:8
                            },
                            throat:{
                                intensity:8
                            },
                            heart:{
                                intensity:8
                            },
                            solarplexus:{
                                intensity:8
                            },
                            sacral:{
                                intensity:8
                            },
                            root:{
                                intensity:8
                            }
                        }
                    });
                }else{
                     var chakrabody=new chakras($('#chakras_'+c),{
                        background:'transparent',
                        static:true,
                        equalDistribution:true,
                        chakras:{
                            crown:{
                                intensity:Math.random()*5
                            },
                            thirdeye:{
                                intensity:Math.random()*5
                            },
                            throat:{
                                intensity:Math.random()*5
                            },
                            heart:{
                                intensity:Math.random()*5
                            },
                            solarplexus:{
                                intensity:Math.random()*5
                            },
                            sacral:{
                                intensity:Math.random()*5
                            },
                            root:{
                                intensity:Math.random()*5
                            }
                        }
                    });
                }
                chakrabody.start();
                c++;
            }
        }
    </script>
</head> 
<body onload="onLoad()">
    <div id="wrapper" style="z-index: 1;position: absolute;top:0;left:0;right:0;bottom:0" class="scrollY">
        <div id="content"></div>
    </div>
</body>
</html>