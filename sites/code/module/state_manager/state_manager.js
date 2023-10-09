modules.state_manager=function(options){
	var self=this;
	self.options=options;
	this.getLoadPage=function(){
		var state=app.history.getViewState(self.getBaseIntent());
		if(options.getPages){//we wont know what the base is...can only really be in two places
			if(state&&options.getPages().indexOf(state[0])>=0) return state[0];
			if(state&&options.getPages().indexOf(state[1])>=0) return state[1];
			if(state&&options.getPages().indexOf(state[2])>=0) return state[2];
		}else{
			console.warn('validPages not set');
		}
		if(options.defaultPage) return options.defaultPage();
		console.warn('No page set!');
		return '';
	}
	this.viewShow=function(){
		self.ele.show();
	}
	this.viewHide=function(){
		self.ele.hide();
	}
	this.getPageState=function(){
		var base=self.getBaseIntent()+'/';
		var pp=History.getState().cleanUrl.split(base);
		if(pp[1]) return pp[1].split('/');
		return [];
	}
	this.setState=function(passive){
		if(self.options.getData()){
			if(self.options.setHistory){
				app.history.set({
					intent:self.getPath().intent,
					title:options.title
				})
			}else{
				if(options.app){
					app.home.manager.setViewPage(options.app,self.getPath());
				}else{
					modules.viewdelegate.setViewPage(options.id,self.getPath());
				}
			}
		}
		if(!passive) self.setPageStatus();
	}
	this.setPageStatus=function(opts){
		if(!self.options.id) return console.warn('No ID for view to modify tabs')
		if(!opts&&self.options.getTabData&&self.options.getTabData()){
			opts=self.options.getTabData();
			self.setState(1);
		}
		if(opts) modules.viewdelegate.setPageStatus(self.options.id,opts);
		else console.warn('no state or getTabData available')
	}
	this.getNavPath=function(){
		var path=options.getNavPath();
		if(path) return path;
		return self.getPageState().join('/');
	}
	this.getPath=function(){
		if(self.options.getData()){
			var intent=self.getBaseIntent();
			return {
				intent:intent+'/'+self.getNavPath(),
				name:self.options.getPageName()
			}
		}else{
			return false;
		}
	}
	this.getBaseIntent=function(){
		if(self.options.getData()){//set asyncly
			if(self.options.app){
				return '/'+self.options.app;
			}else if(options.id){
				return '/'+((self.options.getData().url_name)?self.options.getData().url_name:options.base+'/'+options.id)
			}else{
				return '/';
			}
		}else return '';
	}
}