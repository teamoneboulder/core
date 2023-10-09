if(!window.modules) window.modules={};
modules.oauth_global={
	init:function(){
		//check to see if there is anything waiting
		var returnobj=localStorage.getObject('oauth');
		if(returnobj&&returnobj.case){
			switch(returnobj.case){
				case 'showadd':
					modules.add_global.init();
				break;
			}
		}
		localStorage.setObject('oauth',{});//clear
	}
}
modules.oauth=function(options,callbacks,webcallback){
	var self=this;
	self.options=options;
	if(!isPhoneGap()) options.payload.redirect=window.location.origin+window.location.pathname;
	else{
		options.payload.redirect=app.domain+'/oauth_return.php?scheme='+window.app_conf.app_scheme;
		options.api=true;
	}
	if(webcallback){
		localStorage.setObject('oauth',webcallback)
	}
	if(options.payload.provider=='facebook'&&isPhoneGap()&&window.facebookConnectPlugin){
		if(callbacks.onAuthOpen) callbacks.onAuthOpen();
		//_alert(JSON.stringify(options.payload))
		facebookConnectPlugin.login(options.scope, function(data){
			var extendFacebookToken=function(data,cb){
				options.payload.scope=options.scope.join(',');
 				modules.api({
 					url:app.oauthurl+'/extendfb',
 					data:{
 						access_token:data.authResponse.accessToken,
 						payload:options.payload
 					},
 					callback:function(resp){
 						cb(resp);
 					}
 				})
			}
			var validateLogin=function(data,cb){
 				modules.api({
 					url:app.oauthurl+'/loginfb',
 					data:{
 						access_token:data.authResponse.accessToken,
 						payload:options.payload
 					},
 					callback:function(resp){
 						cb(resp);
 					}
 				})
			}
			$('body').spin({bg:1});
			if(options.payload.login){
				validateLogin(data,function(resp){
					$('body').spin(false);
					if(resp.success){
						if(callbacks.onSuccess) callbacks.onSuccess(resp);
					}else{
						if(callbacks.onError) callbacks.onError(resp);
					}
				})	
			}else{
				extendFacebookToken(data,function(resp){
					$('body').spin(false);
					if(resp.success){
						if(callbacks.onSuccess) callbacks.onSuccess(resp);
					}else{
						if(callbacks.onError) callbacks.onError(resp);
					}
				})	
			}
		}, function(msg){
			if(callbacks.onError) callbacks.onError(JSON.parse(JSON.stringify({error:msg.errorMessage})));
		});
		return false;
	}
	modules.api({
        open:(isPhoneGap())?false:true,
        debug:true,
        url:app.oauthurl+'/url/'+options.payload.provider,
        data:options,
        callback:function(data){
        	if(callbacks.onAuthOpen) callbacks.onAuthOpen();
        	if(data.error){
        		if(callbacks.onError) callbacks.onError(data);
        	}else{
	        	app.openLink({
	        		intent:data.url,
	        		authCallback:function(){
	        			if(callbacks.onSuccess) callbacks.onSuccess();
	        		}
	        	})
        	}
        }
    })
}