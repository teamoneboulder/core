modules.scrolldelegate=function(ele,options,bindings){
	var self=this;
	this.init=function(){
		if(app.scroller){
			self.scroller=app.scroller.set(ele,options,bindings);
		}else if(modules.scroller){
			self.scroller=new modules.scroller(ele,options,bindings);
		}
	}
	this.scrollToTop=function(){
		if(app.scroller){
			app.scroller.scrollToTop(self.scroller);
		}else if(modules.scroller){
			self.scroller.scrollToTop();
		}
	}
	this.scrollToBottom=function(delay){
		if(app.scroller){
			app.scroller.scrollToBottom(self.scroller,delay);
		}else if(modules.scroller){
			self.scroller.scrollToBottom(delay);
		}
	}
	self.init();
}