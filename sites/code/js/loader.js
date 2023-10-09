//Loader Version 4.0.4
$(function(){
	var LOADER=function(){
		var module=this;
		this.__loader={
		    queue:{},
		    splash:false,
		    onstep:0,
		    totalSteps:4,
		    debug:function(msg,force){
		        if(true||force) console.log(msg)
		    },
			inc:function(msg,frac){
				if(!frac){
					clearTimeout(module.__loader.fractimeout);
					module.__loader.onstep++;
					var prog=(module.__loader.onstep/module.__loader.totalSteps)*100;
					module.__loader.incfrac=0;
				}else{
					var prog=((module.__loader.onstep/module.__loader.totalSteps)+(1/module.__loader.totalSteps)*frac)*100;
				}
				if(prog>100) prog=100;
				$("#loadprogbar").css('width',prog+'%');
				module.__loader.postMessage({
					load:{
						percent:prog
					}
				})
			},
			loadLocalStore:function(){
		        module.__loader.debug('loadLocalStore',1);
		        window.addEventListener("message", function(e){
		            if(e.data&&e.data.task=='getlocalstore'){//iterate over data and add to local store
		                var data=e.data.data;
		                if(module.__loader.loadstoretimeout){
		                	module.__loader.debug('Loading safari localstore...',1);
		                    clearTimeout(module.__loader.loadstoretimeout);
		                    if(data) $.each(data,function(i,v){
		                    	if(typeof v=='object'){
		                    		module.__loader.debug('set obj: ['+i+']',1)
		                        	localStorage.setObject(i,v,1);//load into child iframe localstore
		                        }else{
		                        	module.__loader.debug('set var: ['+i+']',1)
		                        	localStorage.setVar(i,v,1);//load into child iframe localstore
		                        }
		                    });
		                    module.__loader.init(false,1);
		                }else{//init already loaded...dont load again even tho localstore returned
		                    module.__loader.debug('init already loaded...dont load again even tho localstore returned',1);
		                }
		            }
		        },false)
		        module.__loader.postMessage({getlocalstore:1});
		        module.__loader.loadstoretimeout=setTimeout(function(){//by default, always initalize after 100ms
		        	module.__loader.loadstoretimeout=false
		            module.__loader.init(false,1);
		        },1000);
		    },
			postMessage:function(data){
                if(window.parent&&window.parent.postMessage&&module.__loader.purl){
                	window.parent.postMessage(data, module.__loader.purl);
                }
            },
            getPurl:function(){
            	var qs=module.__loader.getqs(window.location.href);
            	if(qs['purl']){
            		return qs['purl'];
            	}else return false;
            },
            getqs:function(url){
                var d=url.split('#');
                var ds=d[0].split('?');
                var qs={};
                if(ds[1]){
                    var td=ds[1].split('&');
                    $.each(td,function(i,v){
                        var p=v.split('=');
                        qs[p[0]]=decodeURIComponent(p[1])
                    })
                }
                return qs;},
			init:function(force,reloaded){
				module.__loader.debug('Init Loader.js');
				if(!reloaded){
					module.__loader.st=new Date().getTime();
					module.__loader.app=window.app_conf.appid;
					module.__loader.purl=module.__loader.getPurl();
					if(window.location.search&&window.location.search.indexOf('screenshot=')>=0){//if screenshot mode, fix some things
	            		module.__loader.screenshot=1;
	            	}
					if(!module.__loader.binded){
						$("#appfreeze").find('.refresh').on('touchstart',function(e){//should only be available on phonegap/touch screen
							e.stopPropagation();
							e.stopImmediatePropagation();
							if(!module.__loader.loaded&&!module.__loader.loading){
								module.__loader.onstep=0;//clear out steps!
						  		$("#appfreeze").show().find('.refresh').find('i').addClass('animate-spin');
							  	module.__loader.debug('Try to Re-Load');
							  	module.__loader.reload=1;
							  	module.__loader.init(1);
							  }else if(module.__loader.loaded&&!module.__loader.loading){//hang on profile get
							  	if(module.__loader.splash) $('#appsplash').show();//continue loading...
							  	$("#appfreeze").hide();
							  	module.__loader.initApp(0);
							  }else{
							  	module.__loader.debug('Dont Load');
							  }
					  	});
						module.__loader.binded=1;
					}
					if(isPhoneGap()&&window.screen&&window.screen.lockOrientation){
			            if($('body').width()<600) screen.lockOrientation('portrait');
			        }
			    }
		        if(!module.__loader.reload&&!reloaded){
			        if(isPhoneGap()){//set up splash
			        	var splash=window.app_conf.splash;
			        	var cached=localStorage.getObject('splash');
			        	if(Object.keys(cached).length){
			        		splash=$.extend(true,splash,cached);//always ensure everything is there!
			        	}
			        	//check if override
			        	if(splash){
				        	module.__loader.splashid=splash._id;//use ping to know if up to date
				        	module.__loader.splash=splash;
					        $('.splashname').html(splash.name);
					        $('.appicon').attr('src',splash.icon);
				        	if(module.__loader.splash.nosplash&&parseInt(module.__loader.splash.nosplash,10)){
				        		$('#appsplash').hide();
						    }else{
						    	//render splash and show
					        	$('#splashimg').css('backgroundImage','url('+splash.splash+')');
					        	if(splash.fit) $('#splashimg').addClass('containimg')
					        	else $('#splashimg').addClass('coverimg')
					        	if(splash.caption&&splash.caption!='false') $('#splashcaption').html(splash.caption);
					        	else $('#splashbox').hide();
					        	if(splash.spinicon&&parseInt(splash.spinicon,10)) $('#apploadicon').addClass('animate-spin');
					        	if(splash.captionSize) $('#splashcaption').css('fontSize',splash.captionSize);
					        	$('#appsplash').show();
						        setTimeout(function(){//give image a few ms to render
						        	if(window.StatusBar){
					                    window.StatusBar.show();
					                    window.StatusBar.styleLightContent();
					                }
							    	if(window.navigator.splashscreen) window.navigator.splashscreen.hide();
						        },100);
						    }
						}
					    module.__loader.api=window.server;
			        }else{
			        	var hp=window.location.host.split('.');
						module.__loader.api=window.app_conf.api;
			        }
			    }
				var url=window.app_conf.protocol+module.__loader.api+'/conf/'+module.__loader.app+'?';//always https
				if(isMobile) url+='isMobile=1&loader2=1';
				window.uuid=localStorage.getVar('uuid');
				var v=localStorage.getObject('version');
				if(v&&v.api){
					url+='&_ver='+v.api;
				}
				if(!uuid){
		            if(!reloaded){
		                if(window.isSafari){//chrome can have safari in UA string
		                    if(top !== self&&window.localstoreenabled){//check parent
		                        module.__loader.loadLocalStore();
		                        return false;
		                    }
		                }
		            }
		            window.uuid=Math.uuid(20,16);
		            localStorage.setVar('uuid',window.uuid);
		        }
		        // if(!uuid){
		        //     window.uuid=Math.uuid(20,16);
		        //     localStorage.setVar('uuid',window.uuid);
		        // }
		        var infohash=localStorage.getObject('infohashes');
		        module.__loader.loading=1;
				var online=window.navigator.onLine;
				if(!window.app_conf.localapi){//allow loading in local
			        if(!online&&!force&&!module.__loader.screenshot){
			        	module.__loader.noInternet(); //auto load, no need to wait
			        	return false;
			        }
			    }
		        if(module.__loader.screenshot){
		        	if(window.app_conf.isdev) url=url.replace('https://','http://');
		        	url+='&screenshot=1';
		        }
				$.ajax({
				  dataType: "jsonp",
		          cache : false,
				  url: url,
				  data:infohash,
				  success:module.__loader.loadApp,
				  timeout:12000,
				  error:function(e){
				  	if(e.responseText.indexOf('not found')>=0) _alert(e.responseText);
				  	module.__loader.debug('Could not load ['+url+']');
				  	module.__loader.noInternet();
				  }
				});
			},
			noInternet:function(){
				//try to load anyways!
			  	var files={
			  		js:localStorage.getVar('js'),
			  		css:localStorage.getVar('css'),
			  		templates:localStorage.getVar('template')
			  	}
			  	var data=localStorage.getObject('conf');
			  	//module.__loader.debug(files);
			  	if(files.js&&files.css&&files.templates&&false){//for groupup, must have connection to server to load initially
			  		data=$.extend(true,data,{combined:1,localfiles:files});
			  		module.__loader.loadApp(data);
			  	}else module.__loader.freezeApp();
			},
			freezeApp:function(){
				//app requires internet
				module.__loader.loading=0;
			  	if(window.navigator.splashscreen) window.navigator.splashscreen.hide();
			  	$('#appsplash').hide();
			  	$("#appfreeze").show().find('i').removeClass('animate-spin');
			},
			saveFile:function(url,name,cb){
				if(!isPhoneGap()){
					cb(url);
					return false;
				}
				if(url.indexOf('http')==-1){//loading from local
					//module.__loader.debug('Load local file: '+url);
					cb(url);
					return false;
				}
		        function aerror(){

		        }
		        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, 
		            function(fileSystem) {
		            	if(window.device.platform === 'iOS'){
		            		var path='files';
		            		var file=path+'/'+name;
		            	}else{
		            		var path=cordova.file.dataDirectory.replace('file:///data/data/','Android/data/');
		            		var file=path+name;
		            	}
		                fileSystem.root.getDirectory(path, {create: true},function(){
		                	fileSystem.root.getFile(
			                file, {create: true, exclusive: false}, 
			                function(fileEntry) {
			                    var fileTransfer = new FileTransfer();
			                    fileTransfer.download(
			                        encodeURI(url),
			                        fileEntry.toURL(),
			                        function(theFile) {
			                            //module.__loader.debug(theFile)
			                            //module.__loader.debug(JSON.stringify(theFile),1)
			                            //module.__loader.debug("download complete: " + theFile.toURL(),1);
			                            if(cb) cb(theFile.toURL());
			                        },
			                        function(error) {
			                            module.__loader.debug("download error source " + error.source,1);
			                            module.__loader.debug("download error target " + error.target,1);
			                            module.__loader.debug("upload error code: " + error.code,1);
			                            module.__loader.nosave=1;
			                            if(cb) cb(url);//still allow load if for some reason couldnt save file
			                            aerror();
			                        }
			                    );
			                },  function(error) {
			                    aerror();
			                });
		                },function(){
		                	//if fails still allow load
		                	module.__loader.nosave=1;
		                    if(cb) cb(url);//still allow load if for some reason couldnt save file
		                });
		            },  function(error) {
		                aerror();
		            });},
		    loadFonts:function(data){
				//dev/prod...trust it loads...its a small file...
				if(data.font&&data.font.length) for (var i = 0; i <= data.font.length - 1; i++) {
					var font=data.font[i]+'?t='+new Date().getTime();
					$('head').append('<link href="'+font+'" rel="stylesheet" type="text/css">');
					module.__loader.debug('Adding FONT ['+(i+1)+' of '+data.font.length+']');
				};
			},
			loadFiles:function(files,ver){
				//module.__loader.saveFile(files.js,'js.js',function(path){
					//var tp=path+'?ver='+ver;
					var tp=files.js+'?ver='+ver;
					//localStorage.setVar('js',path);
					module.__loader.debug('Adding JS: '+tp);
					var jq = document.createElement('script');
					jq.src = tp;
					jq.id="javascript";
					jq.crossOrigin = 'anonymous';
					jq.onload=function(){
						module.jsloaded=1;
					}
					document.getElementsByTagName('head')[0].appendChild(jq);
				//})
				//module.__loader.saveFile(files.templates,'templates.js',function(path){
					//var tp=path+'?ver='+ver;
					var tp2=files.templates+'?ver='+ver;
					//localStorage.setVar('template',path);
					module.__loader.debug('Adding Template: '+tp2,1);
					var jq2 = document.createElement('script');
					jq2.src = tp2;
					jq2.id="templatescript";
					jq2.onload=function(){
						module.templatesloaded=1;
					}
					document.getElementsByTagName('head')[0].appendChild(jq2);
				//})
				//module.__loader.saveFile(files.css,'css.css',function(path){
					//localStorage.setVar('css',path);
					//var tp=path+'?ver='+ver;
					var tp=files.css+'?ver='+ver;
					module.__loader.debug('Adding CSS: '+tp);
					$('head').append('<link href="'+tp+'" rel="stylesheet" type="text/css">');
				//})
			},
			loadApp:function(data){
				if(data.reload){
					module.__loader.debug('Clearing Local Store and Reloading App :D',1);
					var prefs=localStorage.getObject('prefs');//save prefs!
		            localStorage.clear();
		            localStorage.setVar('welcomed',1);
		            localStorage.setObject('prefs',prefs);
					module.__loader.reload=1;
					module.__loader.init();
					return false;
				}
				if(data.error&&data.error=='api_maintainance'){
					module.__loader.noInternet();
					return false;
				}
				if(isPhoneGap()&&module.__loader.reload){
					if(!module.__loader.splash||module.__loader.splash.nosplash&&parseInt(module.__loader.splash.nosplash,10)) window.navigator.splashscreen.show();//needed from frozen state
					else $('#appsplash').show();
					module.__loader.reload=false;
					setTimeout(function(){$("#appfreeze").hide();},500);
				}
				module.__loader.reload=false;
				if(data.vars&&data.vars.version){
					module.__loader.ver=data.vars.version;
					localStorage.setObject('version',data.vars.version);
				}
				if(!data.error){
					module.__loader.inc('Loading App');
					module.__loader.rt=new Date().getTime();
					if(data.font) module.__loader.loadFonts(data);
					if(data.combined){
						module.__loader.combined=1;
						var localfiles=data.localfiles;
						var fh=(localfiles)?' From Cache':'';
						if(data.uptodate||localfiles){
							module.__loader.debug('Reloading App ['+module.__loader.ver.app+']'+fh,1);
						}else{
							localStorage.setObject('conf',data);
							module.__loader.debug('Loading App',1);
						}
						module.__loader.debug('Loading App ['+module.__loader.ver.app+']'+fh,1);
						module.jsloaded=1;
						if(localfiles) module.__loader.loadFiles(localfiles,module.__loader.ver.app);
						else module.__loader.loadFiles(data,module.__loader.ver.app);
					}else{
						module.templatesloaded=1;//returned in api or localstore??
						localStorage.setObject('conf',data);
						module.__loader.debug('Loading App :D',1);
						var oHead = document.getElementsByTagName('head')[0];
						if(data.css&&data.css.length) for (var i = 0; i <= data.css.length - 1; i++) {
							var css=data.css[i]+'?t='+new Date().getTime();
							//if(isPhoneGap()) css='http://'+module.__loader.app+'.'+module.__loader.host+'.me'+css;
							$('head').append('<link href="'+css+'" rel="stylesheet" type="text/css">');
							module.__loader.debug('Adding CSS ['+(i+1)+' of '+data.css.length+']');
						};
						if(data.lib && data.lib.length) for (var i = 0; i <= data.lib.length - 1; i++) {
							var js=data.lib[i]+'?t='+new Date().getTime();
							//if(isPhoneGap()) js='http://'+module.__loader.app+'.'+module.__loader.host+'.me'+js;
							$('head').append('<script src="'+js+'" ></script>');
							module.__loader.debug('Adding lib ['+(i+1)+' of '+data.lib.length+'] '+js);
						}
						module.__loader.jsfilecount=0;
						//done with queue, 1 at a time
						module.__loader.jscount=0;
				    	module.__loader.jstotal=data.js.length;
				        loader.queue = async.queue(module.__loader.loadSource,50);
				        $.each(data.js,function(i,v){
				        	var js=v+'?t='+new Date().getTime();
				        	module.__loader.debug('Adding JS ['+(i+1)+' of '+data.js.length+'] '+js);
				           	loader.queue.push({type:'js',src:js},function (err) {
				                module.__loader.jscount++;
				                module.__loader.debug('finished adding JS ('+module.__loader.jscount+'/'+module.__loader.jstotal+')- '+v);
				            });
				        });
				        loader.queue.drain=function(){
				        	module.jsloaded=1;
				        }
						module.__loader.loadTemplate(data.templates);
					}
					if(!data.vars) data.vars={};
					if(data.vars.isdev){
						window.isdev=1;
						module.__loader.isdev=1;
					}
					module.__loader.vars=data.vars;
					module.__loader.loadStaticFiles(data);
					module.__loader.initApp(0)
				}else{
					_alert('Im sorry, you are not authorized to use this app.  Error: ['+data.error+']');
				}
			},
			loadStaticFiles:function(data){
				module.__loader.staticReady=(data.static)?data.static.length:0;
				if(data.static && data.static.length) for (var i = 0; i <= data.static.length - 1; i++) {
					var js=data.static[i];
					if(module.__loader.isdev) js+='?t='+new Date().getTime();
					module.__loader.loadSource({
						type:'js',
						src:js
					},function(){
						module.__loader.debug('Added static file '+js);
						module.__loader.staticReady--;
					})
					// $('head').append('<script src="'+js+'" crossorigin="anonymous"></script>');
					// module.__loader.debug('Adding static ['+(i+1)+' of '+data.static.length+'] '+js);

				}
			},
			loadSource:function(obj,cb){
		        if(obj.type=='css'){
		            var oHead = document.getElementsByTagName('head')[0];
		            var oLink = document.createElement('link');
		            oLink.type = 'text/css';
		            oLink.rel='stylesheet';
		            oLink.href = obj.src;
		            oHead.appendChild(oLink);
		        }
		        if(obj.type=='js'){
		            var oHead = document.getElementsByTagName('head')[0];
		            var oScript = document.createElement('script');
		            oScript.type = 'text/javascript';
		            oScript.src = obj.src;
		            oScript.async = false;
		            oScript.crossOrigin = 'anonymous';
		            oScript.onload = cb;
		            // IE 6 & 7
		            oScript.onreadystatechange = function() {
		                if (this.readyState == 'complete') {
		                cb();
		                }
		            }
		            oHead.appendChild(oScript);
		        }
		    },
		    loadTemplate:function(templs){
		    	var templates={};
		    	if(templs){
			    	var tpls=templs.split('@@@');
			        var cn='';
			        for (var i = 1; i <= tpls.length-1; i++) {
			            if(i>0){
			                if(i%2==1){ //name
			                    cn=tpls[i];
			                }else{
			                    templates[cn]=new EJS({text:stripslashes(tpls[i])});
			                }
			            }
			        };
			    }else{
			    	return false;
			    }
			    //module.__loader.debug('loading template version: '+templates['version'],1);
			    module.__loader.templates=templates;
		    },
		    initApp:function(count){
		    	if(window.app&&module.jsloaded&&module.templatesloaded&&module.__loader.staticReady===0){
		    		module.__loader.inc('File Load Complete');
		    		module.__loader.it=new Date().getTime();
		    		window.app.init(module.__loader.templates,module.__loader.vars);
		    		module.__loader.inc('Load Complete');
		    		module.__loader.loaded=1;
		    		module.__loader.ft=new Date().getTime();
		    		module.__loader.loadtime=(module.__loader.ft-module.__loader.st)/1000;
		    		module.__loader.requesttime=(module.__loader.rt-module.__loader.st)/1000;
		    		module.__loader.initTime=(module.__loader.ft-module.__loader.it)/1000;
		    		module.__loader.processtime=(module.__loader.ft-module.__loader.rt)/1000;
		    		module.__loader.debug('Request Time ['+module.__loader.requesttime.toFixed(2)+'] seconds',1);
		    		module.__loader.debug('File Load Time ['+module.__loader.processtime.toFixed(2)+'] seconds',1);
		    		module.__loader.debug('Init Time ['+module.__loader.initTime.toFixed(2)+'] seconds',1);
		    		module.__loader.debug('Complete App Init in ['+module.__loader.loadtime.toFixed(2)+'] seconds',1);
		    	}else{
		    		// if(!window.app) module.__loader.debug('waiting for app');
		    		// if(!module.__loader.templates) module.__loader.debug('waiting for templates');
		    		setTimeout(function(){
		    			if(!count) count=0;
		    			count++;
		    			if(count<300) module.__loader.initApp(count);
		    			else module.__loader.freezeApp();
		    		},50)
		    	}
		    },
		    isDev:function(){
		    	return (module.__loader.isdev)?1:0;
		    },
		    getSplashId:function(){
		    	return (module.__loader.splashid)?module.__loader.splashid:false;
		    },
		    getSplash:function(){
		    	return module.__loader.splash;
		    },
		    setSplashId:function(id){
		    	module.__loader.splashid=id;
		    }
		}
		return {//public methods
			init:module.__loader.init,
			isDev:module.__loader.isDev,
			postMessage:module.__loader.postMessage,
			loadTemplate:module.__loader.loadTemplate,
			getSplashId:module.__loader.getSplashId,
			setSplashId:module.__loader.setSplashId,
			getSplash:module.__loader.getSplash,
			freezeApp:module.__loader.freezeApp
		}
	}
	window.loader=LOADER();
	if(!isPhoneGap()) $(function(){loader.init()});
});