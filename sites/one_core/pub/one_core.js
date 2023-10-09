window.app={};//prepare app object
window.one_core={
	v:1,
	port:3333,
	init:function(vars){
		Object.assign(one_core,vars);
		one_core.vars=vars;
		// //alert('one_core init!');
		//if 
		if(_bootloader.publicconf.combined){
			//should be handled by bootloader!
			if(window.location.host.indexOf('localhost')>=0){
				console.log('******Start local websocket!*****');
				window.one_core.socket = io(window.location.origin.replace('http:','ws:'));
				one_core.hot_reload=new modules.hotreload({
					channel:'dev_channel',
					socket:window.one_core.socket,
					api:window.location.origin,
					onNewJavascript:function(){
						alert('new javascript!');
					}
				});
				one_core.hot_reload.init()
			}
		}else{
			one_core.loadDeviceInfo(function(){
				one_core.render();
			})
		}
	},
	loadDeviceInfo:function(cb){
		if(window.cordova&&cordova.plugins&&cordova.plugins.DeviceMeta&&cordova.plugins.DeviceMeta.getDeviceMeta){
	        cordova.plugins.DeviceMeta.getDeviceMeta(function(device_info){
	            if(device_info.debug){
	            	_bootloader.isSandbox=true;//is sandbox/testflight mode
	            }else{
	            	_bootloader.isSandbox=false;//test flight or production
	            }
	            cb()
	        })
	    }else{
	        _bootloader.isSandbox=false;
	        cb();
	    }
	},
	render:function(err){
		if(_bootloader.isSandbox||!isPhoneGap()||true){
			phi.render('#wrapper',{
				template:'one_core_home',
				context:one_core,
				data:{
					error:err
				},
				binding:function(ele){
					ele.find('.scanNetwork').stap(function(){
						ele.find('.scanNetwork').html('<i class="icon-refresh animate-spin"></i>')
						one_core.scanNetwork();
					});
					ele.find('.uselocal').stap(function(){
						ele.find('.uselocal').html('<i class="icon-refresh animate-spin"></i>')
						if(window.sessionStorage) sessionStorage.setItem('port', '3333');
						one_core.scanNetwork();
					});
					ele.find('.uselocal2').stap(function(){
						one_core.port=3334;
						if(window.sessionStorage) sessionStorage.setItem('port', '3334');
						ele.find('.uselocal2').html('<i class="icon-refresh animate-spin"></i>')
						one_core.scanNetwork();
					});
					ele.find('.useserver').stap(function(){
						if(window.sessionStorage) sessionStorage.setItem('port', 'server');
						one_core.loadServerCode();
					});
					//mobilealert!
					$('#waitingscreen').show();

					_bootloader.hideSplash();//give retry
					_bootloader.hidePhotoSplash();//give retry
					if(window.sessionStorage&&sessionStorage.getItem('port')){
						switch(sessionStorage.getItem('port')){
							case '3333':
								ele.find('.uselocal').stap()
							break;
							case '3334':
								ele.find('.uselocal2').stap()
							break;
							case 'server':
								ele.find('.useserver').stap()
							break;
						}
					}
					// if(window.location.port=="3333"){
					// 	ele.find('.uselocal').stap()
					// }
					// if(window.location.port=="3334"){
					// 	ele.find('.uselocal2').stap()
					// }
				}
			});
		}else{
			one_core.loadServerCode();//if loading from testflight, we know it is a test
		}
		$('#wrapper').show();
	},
	loadServerCode:function(){
		// _alert(JSON.stringify({
		// 		combined:1,
		// 		bootloader:4,
		// 		dev:1,
		// 		branch:_bootloader.flowerinfo.branch
		// 	}))
		// if(_bootloader.flowerinfo.flower_id=='actualize'){
		// 	_bootloader.flowerinfo.branch='actualize';
		// }
		modules.api({
			url:'https://'+window.app_conf.api+'/conf/'+_bootloader.flowerinfo.flower_id,
			data:{
				combined:1,
				dev:1,
				branch:_bootloader.flowerinfo.branch,
				clientWidth:document.body.clientWidth
			},
			type:'GET',
			dataType:'json',
			callback:function(resp){
				//alert(JSON.stringify(resp))
				if(resp.conf){
					_bootloader.publicconf.vars.flower_id=resp.conf.key;
					app.flower_id=resp.conf.key
				}
				_bootloader.addConf(resp.conf,false,function(success){
					if(success){
						//_bootloader.hidePhotoSplash();//app loaded!!!
					}else{
						_alert('failed adding');
					}
				});
			}
		});
	},
	scanNetwork:function(){
		var scanner=new modules.localNetworkScan({
			port:one_core.port,
			onLocalIp:function(info){
				//_alert(JSON.stringify(info));
			},
			onSuccess:one_core.loadFileConf,
			onError:function(err){
				one_core.render(1);
				$('#waitingscreen').show();
				_bootloader.hidePhotoSplash();//give retry
			}
		});
		scanner.init();
	},
	getApi:function(){

	},
	loadFileConf:function(local_api){
		$('#waitingscreen').hide();
		if(one_core.local_api){
			console.trace();
			return console.warn('local_api already set!?!?')
		}
		one_core.local_api=local_api[0];
		console.log('use api: '+one_core.local_api)
		//alert('use api ; '+local_api)
		modules.api({
			url:one_core.local_api+'/conf',
			data:{},
			type:'GET',
			dataType:'json',
			callback:function(resp){
				if(resp.success) _bootloader.publicconf.vars.flower_id=resp.conf.key;
				_bootloader.addConf(resp.conf,one_core.local_api,function(success){
					if(success){
						//_bootloader.hidePhotoSplash();//app loaded!!!
					}else{
						_alert('failed adding');
					}
				});
			}
		});
		_bootloader.log('IO connecting to ['+one_core.local_api.replace('http:','ws:')+']');
		window.one_core.connect_error=false;
		window.one_core.socket = io(one_core.local_api.replace('http:','ws:'));
		//on connect
		window.one_core.socket.on("connect", () => {
		  	if(window.one_core.connect_error&&!phone.push.testing){
		  		window.location.reload()
		  	}
		});
		window.one_core.socket.on("connect_error", () => {
			window.one_core.connect_error=true;
		});
		window.one_core.socket.on("disconnect", () => {
			window.one_core.connect_error=true;
			//show error loading screen!
			//caused issues with QR, only for dev anyways
			//one_core.render();
		});
		one_core.hot_reload=new modules.hotreload({
			channel:'dev_channel',
			socket:window.one_core.socket,
			api:one_core.local_api,
			onNewJavascript:function(){
				alert('new javascript!');
			}
		});
		one_core.hot_reload.init()
		window.one_core.socket.on('news', function(data){
		    console.log(data);
		});
	}
}