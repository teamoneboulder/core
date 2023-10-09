modules.alertdelegate=function(options){
	var self='';
	var tself=this;
	this.init=function(){
		self=new modules[tself.getType()](options);
		return self;
	}
	this.getType=function(){
		if(modules.tools.isWebLayout()){
			if(options.display){
				if(options.display.ele){
					return 'webcontext';
				}else if(options.display.alert){
					return 'webalert';
				}else{
					console.warn('Invalid display config');
				}
			}else{
				console.warn('Invalid display config');
			}
		}else{
			return 'mobilealert';
		}
	}
	return this.init();
}