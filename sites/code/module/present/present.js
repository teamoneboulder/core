modules.present=function(options){
	var self=this;
	this.show=function(){
		self.hidden=false;
		if(modules.tools.isWebLayout()){
			var opts=options.display.alert;
			if(options.data) opts.tempdata=options.data;
			if(options.template) opts.template=options.template;
			if(options.templates&&options.templates.alert) opts.template=options.templates.alert;
			opts.binding=function(ele){
				if(options.binding) options.binding(ele);
			}
			if(options.onBeforeShow) options.onBeforeShow();
			if(options.preview&&options.hasPreview()) opts.preview=options.preview;
			opts.overlay=true;
			opts.uid=Math.uuid(12);
			$('body').alert(opts)
		}else{
			if(app.statusBar) var returnTheme=app.statusBar.getCurrent();
			$('body').page({
	            template:(options.templates.page)?options.templates.page:options.template,
	            beforeClose:function(ele,cb){//eliminate all animation/timing/etc
	                //self.scroller.destroy();
	                if(app.statusBar) app.statusBar.set(returnTheme);
	                setTimeout(function(){
	                    cb();
	                },50)
	            },
	            overlay:true,
	            onClose:function(){
	            },
	            pageType:'static',
	            data:$.extend(true,{},options.data,{_page:true,hasPreview:(options.hasPreview&&options.hasPreview())?1:0}),
	            asyncShow:true,
	            onPageRendered:function(ele,cb){
	            	if(options.binding) options.binding(ele);
	            	if(options.onBeforeShow) options.onBeforeShow();
	            	if(options.preview&&options.hasPreview()){
	            		options.preview(cb);
	            	}else{
		            	setTimeout(function(){//give render a break for a second for smooth animation
		            		cb();
		            	},20)
		            }
	            },
	            onShow:function(ele){
	                if(app.statusBar) app.statusBar.set(app.user.getTheme().statusbar.theme);
	                
	            }
	        });
		}
	}
	this.hide=function(){
		if(self.hidden) return false;
		self.hidden=true;
		if(modules.tools.isWebLayout()){
			$.fn.alert.closeAlert();
		}else{
			$.fn.page.close();
		}
	}
}