;window._pixel=function(options){//cross subdomain com methods
	var self=this;
	self.options=options;
	this.cbs={};
	this.init=function(){
		$('body').append('<iframe id="pixel" src="'+self.options.url+'" style="position:absolute;top:100%;left:100%;"></iframe>');
		//bind comms
		window.addEventListener("message", function(e){
			self.onMessage(e);
		}, false);
	}
	this.onMessage=function(e){
		var data=e.data;
		if(data.pixel){
			if(data.pixel.loaded){
				if(self.options.onLoad) self.options.onLoad();
			}
			if(data.pixel.cbid){
				if(self.cbs[data.pixel.cbid]){
					self.cbs[data.pixel.cbid](data.pixel);
				}else{
					console.warn('invalid callback!');
				}
			}
		}
	}
	this.get=function(type,field,cb){
		var cbid=Math.uuid(5);
		if(type=='var'){
			self.cbs[cbid]=cb;
			self.postMessage({cbid:cbid,getVar:field});
		}
	}
	this.set=function(type,field,value){
		if(type=='var') self.postMessage({setVar:field,value:value});
	}
	this.postMessage=function(data){
    	document.getElementById('pixel').contentWindow.postMessage(data,self.options.url);
    }
	this.init();
};