modules.localNetworkScan=function(options){
	var self=this;
	self.options=options;
	if(options.store) self.store=options.store;
	else self.store={};
	this.init=function(){
		// self.validIps=[];
		// return self.ping('http://192.168.86.248:3333/ping',()=>{

		// })
		if(isPhoneGap()&&window.networkinterface){
			networkinterface.getWiFiIPAddress(function(ipinformation){
				self.localIp=ipinformation.ip;
				if(options.onLocalIp) options.onLocalIp(ipinformation);
				self.scan(function(){
					if(self.validIps.length){
						if(options.onSuccess) options.onSuccess(self.validIps);
					}else{
						if(options.onError) options.onError('couldnt find any devices on this network');
					}
				});
			}, function(e){
				if(options.onError) options.onError('couldnt get phones IP');
			});
		}else{
			//options.onSuccess([('http://192.168.86.31:'+((options.port)?options.port:4000))]);
			if(options.onSuccess) options.onSuccess([('http://localhost:'+((options.port)?options.port:4000))]);
		}
	}
	this.scan=function(cb){
		self.validIps=[];//clear out!
		var port=(options.port)?options.port:4000;
		var ipp=self.localIp.split('.');
		var c=0;
		var base='http://'+ipp[0]+'.'+ipp[1]+'.'+ipp[2]+'.';
		var nocheck=parseInt(ipp[3],10);
		var check=[];
		if(!isPhoneGap()||(window.device&&window.device.isVirtual)) check.push(async.apply(self.ping,'http://localhost:'+port+'/ping'));//try localhost too!
		while(c<=256){
			if(c!=nocheck) check.push(async.apply(self.ping,base+c+':'+port+'/ping'));
			c++;
		}
		console.time('localNetworkScan:scantime');
        async.parallelLimit(check,10,function(){//check 10 at a time!
        	console.timeEnd('localNetworkScan:scantime');
            cb();
        })
	}
	this.ping=function(url,cb){
		//console.log('Checking ['+url+']')
		if(self.validIps.length) return cb();//we only really want the first one that is found
		modules.api({
			url:url,
			dataType:'json',
			type:'GET',
			timeout:(window.device&&device.platform=='Android')?1500:800,//we should know quickly
			callback:function(resp,opts,xhr){
				if(resp&&resp.success){
					console.log('GOT VALID IP ['+url+']')
					var use_url=url.replace('/ping','');
					if(self.validIps.indexOf(use_url)==-1) self.validIps.push(use_url);
				}
				cb();
			}
		})
	}
}