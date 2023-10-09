;window._ui.pageloader={
	render:function(opts,ele,replace){
		if(!opts) opts={};
		if(typeof opts.theme=='undefined') opts.theme=false;
		if(window.app&&window.app.loaderType=='infinity') opts.type='infinity';//🦁❤️🌈🌎
		if(typeof opts.type=='undefined'){
			opts.type='image';
			opts.background='https://s3.amazonaws.com/one-light/static/onelogo.png?version=1';//incriment version to ensure new version gets loaded
		}
		if(ele){
			ele.render({
				template:'ui_pageloader',
				data:opts,
				append:(replace)?false:true
			})
		}else{
			return $.fn.render({//return template
				returntemplate:true,
				template:'ui_pageloader',
				data:opts
			})
		}
	},
	hide:function(ele){
		var cover='';
		if(ele.hasClass('.splashcover')){
			cover=ele;
		}else{
			cover=ele.find('.splashcover')
		}
		cover.fadeOut(300,function(){
			$(this).remove();
		})
	}
};